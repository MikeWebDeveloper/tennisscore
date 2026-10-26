import { getTranslations } from "next-intl/server"

type Translator = (key: string, values?: Record<string, string | number>) => string

/**
 * Server-side translator with loose key types.
 * next-intl's strict key inference is truncated for this project's very large message files
 * (see src/types/messages.ts), so newer keys in big namespaces are rejected at compile time
 * even though they exist at runtime. Key presence is guarded by src/i18n/message-keys.test.ts.
 */
export async function getServerTranslator(namespace: string): Promise<Translator> {
  return (await getTranslations(namespace as never)) as unknown as Translator
}
