"use server"

import { SignJWT, jwtVerify, JWTPayload } from "jose"
import { cookies } from "next/headers"

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is not set. Please check your .env.local file.")
}
const key = new TextEncoder().encode(sessionSecret)

export interface SessionPayload extends JWTPayload {
  userId: string
  email: string
  expiresAt: string
}

export async function encrypt(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    })
    return payload as SessionPayload
  } catch (error) {
    return null
  }
}

export async function createSession(data: { userId: string; email: string }) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  
  const sessionData = {
    userId: data.userId,
    email: data.email,
    expiresAt,
  }
  
  const sessionToken = await encrypt(sessionData)
  
  const cookieStore = await cookies()
  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from "strict" to "lax" for better compatibility
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    // Add domain if needed for subdomains
    ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN })
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")
  
  if (!sessionCookie?.value) {
    return null
  }
  
  return await decrypt(sessionCookie.value)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
} 