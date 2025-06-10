"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Client, Account, ID, AppwriteException } from "node-appwrite"
import { createSessionClient } from "../appwrite-server"

function createUnauthenticatedClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
  
  return new Account(client)
}

export async function signUp(formData: FormData) {
  const account = createUnauthenticatedClient();
  
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  
  try {
    await account.create(ID.unique(), email, password, name)
    const session = await account.createEmailPasswordSession(email, password)
    
    const cookieStore = await cookies();
    cookieStore.set("session", session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/"
    })
    
    redirect("/dashboard")
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 409) {
      return { error: "User with this email already exists." }
    }
    console.error(error)
    return { error: "An unexpected error occurred." }
  }
}

export async function signIn(formData: FormData) {
  const account = createUnauthenticatedClient();
  
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  
  try {
    const session = await account.createEmailPasswordSession(email, password)
    
    const cookieStore = await cookies();
    cookieStore.set("session", session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/"
    })

    redirect("/dashboard")
  } catch (error: unknown) {
    if (error instanceof AppwriteException) {
      if (error.code === 401) {
        return { error: "Invalid email or password." }
      }
      if (error.code === 429) {
        return { error: "Too many requests. Please wait a few minutes and try again." }
      }
    }
    console.error(error)
    return { error: "An unexpected error occurred." }
  }
}

export async function signOut() {
  try {
    const account = await createSessionClient()
    await account.deleteSession("current")
  } catch {
    // Even if Appwrite fails, we clear the local cookie
  } finally {
    const cookieStore = await cookies()
    cookieStore.delete("session")
    redirect("/login")
  }
} 