import { z } from 'zod'

const envSchema = z.object({
  // Public Appwrite Configuration (Client-side)
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().min(1, "NEXT_PUBLIC_APPWRITE_ENDPOINT is required"),
  NEXT_PUBLIC_APPWRITE_PROJECT: z.string().min(1, "NEXT_PUBLIC_APPWRITE_PROJECT is required"),
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_DATABASE_ID is required"),
  NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID is required"),
  NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID: z.string().min(1, "NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID is required"),

  // Server-only Appwrite Configuration
  APPWRITE_API_KEY: z.string().min(1, "APPWRITE_API_KEY is required"),
  APPWRITE_DATABASE_ID: z.string().min(1, "APPWRITE_DATABASE_ID is required"),
  APPWRITE_MATCHES_COLLECTION_ID: z.string().min(1, "APPWRITE_MATCHES_COLLECTION_ID is required"),
  APPWRITE_PLAYERS_COLLECTION_ID: z.string().min(1, "APPWRITE_PLAYERS_COLLECTION_ID is required"),
  APPWRITE_PROFILE_PICTURES_BUCKET_ID: z.string().min(1, "APPWRITE_PROFILE_PICTURES_BUCKET_ID is required"),

  // Session Management
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),

  // Optional Environment Variables
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
})

let env: z.infer<typeof envSchema>

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues.map((issue) => issue.path.join(".")).join(", ")
    console.error("❌ Environment variable validation failed:")
    console.error("Missing or invalid environment variables:", missingVars)
    console.error("\nPlease check your .env.local file and ensure all required variables are set.")
    process.exit(1)
  }
  throw error
}

export { env }