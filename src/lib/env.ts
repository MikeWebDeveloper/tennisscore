import { z } from 'zod'

// Client-side variables (available in browser)
const clientSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().min(1, "NEXT_PUBLIC_APPWRITE_ENDPOINT is required"),
  NEXT_PUBLIC_APPWRITE_PROJECT: z.string().min(1, "NEXT_PUBLIC_APPWRITE_PROJECT is required"),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_DATABASE_ID is required"),
  NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID is required"),
  NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID is required"),
})

// Server-side variables (only available in Node.js)
const serverSchema = z.object({
  APPWRITE_API_KEY: z.string().min(1, "APPWRITE_API_KEY is required"),
  APPWRITE_DATABASE_ID: z.string().min(1, "APPWRITE_DATABASE_ID is required"),
  APPWRITE_MATCHES_COLLECTION_ID: z.string().min(1, "APPWRITE_MATCHES_COLLECTION_ID is required"),
  APPWRITE_PLAYERS_COLLECTION_ID: z.string().min(1, "APPWRITE_PLAYERS_COLLECTION_ID is required"),
  APPWRITE_PROFILE_PICTURES_BUCKET_ID: z.string().min(1, "APPWRITE_PROFILE_PICTURES_BUCKET_ID is required"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
})

// Combined schema for type inference
const envSchema = clientSchema.merge(serverSchema)

let env: z.infer<typeof envSchema>

try {
  // In the browser, strictly validate only client variables
  if (typeof window !== 'undefined') {
    // Next.js inlines these values at build time, so we must access them explicitly
    // passing process.env directly often results in an empty object in the browser
    const clientEnv = {
      NEXT_PUBLIC_APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      NEXT_PUBLIC_APPWRITE_PROJECT: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
      NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      NEXT_PUBLIC_APPWRITE_DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID,
      NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID,
    }

    const parsed = clientSchema.parse(clientEnv)
    // Cast to full type to satisfy TS, knowing server vars won't be accessed on client
    env = parsed as z.infer<typeof envSchema>
  } else {
    // On server, validate everything
    env = envSchema.parse(process.env)
  }
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues.map((issue) => issue.path.join(".")).join(", ")
    console.error("❌ Environment variable validation failed:")
    console.error("Missing or invalid environment variables:", missingVars)

    // Only exit process on server
    if (typeof window === 'undefined') {
      process.exit(1)
    } else {
      // On client, log error but don't crash hard (allow ErrorBoundary to catch if needed)
      throw new Error(`Environment validation failed: ${missingVars}`)
    }
  }
  throw error
}

export { env }