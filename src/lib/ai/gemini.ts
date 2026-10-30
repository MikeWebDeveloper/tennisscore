/**
 * Gemini models to try, best first. Free tier quotas run out per model and per day, so when the
 * best model is out of requests (429), busy (503) or gone (404), the next one answers. The newest
 * models have the smallest daily allowance; the lite ones at the end have the largest.
 * GEMINI_MODELS (comma-separated) replaces the list without a code change. Current models and
 * free tier limits: https://ai.google.dev/gemini-api/docs/pricing and Google AI Studio.
 */
export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
]

/** Thinking effort per model: as little as each allows, since an analysis has to come back within a minute */
const THINKING_LEVEL: Record<string, string> = {
  "gemini-3.8-flash": "low",
}

export function geminiModels(): string[] {
  const configured = process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean)
  return configured?.length ? configured : DEFAULT_GEMINI_MODELS
}

export class GeminiError extends Error {
  constructor(public readonly reason: "not-configured" | "quota" | "failed", message: string) {
    super(message)
  }
}

interface GenerateOptions {
  system: string
  prompt: string
  /** JSON schema the answer must follow (Gemini structured output) */
  schema: Record<string, unknown>
  /** Give up on one model after this long and try the next */
  timeoutMs?: number
  /** Stop trying further models once this much time has passed */
  budgetMs?: number
  fetchImpl?: typeof fetch
}

/** Asks the first model that can answer; returns its text (JSON) and which model wrote it. Server only: it reads the API key. */
export async function generateJson({ system, prompt, schema, timeoutMs = 35_000, budgetMs = 55_000, fetchImpl = fetch }: GenerateOptions): Promise<{ text: string; model: string }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new GeminiError("not-configured", "GEMINI_API_KEY is not set")

  const started = Date.now()
  let quotaOnly = true
  let lastError = ""

  for (const model of geminiModels()) {
    const left = budgetMs - (Date.now() - started)
    if (left < 5_000) break
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, left))
    try {
      const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: schema,
            thinkingConfig: { thinkingLevel: THINKING_LEVEL[model] ?? "minimal" },
          },
        }),
      })
      if (!response.ok) {
        const body = await response.text().catch(() => "")
        lastError = `${model}: HTTP ${response.status} ${body.slice(0, 200)}`
        if (response.status !== 429) quotaOnly = false
        // A model that rejects the thinking setting gets one more try without it
        if (response.status === 400 && /thinking/i.test(body)) {
          const retry = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, responseMimeType: "application/json", responseSchema: schema },
            }),
          })
          if (retry.ok) {
            const text = answerText(await retry.json())
            if (text) return { text, model }
          }
          continue
        }
        // Out of quota, busy, gone or refused: the next model may still answer
        continue
      }
      const text = answerText(await response.json())
      if (text) return { text, model }
      quotaOnly = false
      lastError = `${model}: empty answer`
    } catch (error) {
      quotaOnly = false
      lastError = `${model}: ${error instanceof Error ? error.message : String(error)}`
    } finally {
      clearTimeout(timer)
    }
  }
  throw new GeminiError(quotaOnly && lastError ? "quota" : "failed", lastError || "No Gemini model answered")
}

function answerText(json: unknown): string {
  const parts = (json as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] })?.candidates?.[0]?.content?.parts ?? []
  return parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim()
}
