"use server"

import { redirect } from "next/navigation"
import { ID, AppwriteException } from "node-appwrite"
import { createAdminClient } from "../appwrite-server"
import { createSession, deleteSession } from "../session"

// Type for form state
type FormState = {
  success: boolean;
  error?: string;
} | {
  success?: boolean;
  error: string;
} | undefined;

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  
  try {
    // Step 1: Create user with admin client (server SDK)
    const { account: adminAccount } = await createAdminClient()
    const user = await adminAccount.create(ID.unique(), email, password, name)
    
    // Step 2: We don't need to create a session here anymore since we're using JWT
    
    // Step 3: Store encrypted session
    await createSession({
      userId: user.$id,
      email: user.email,
    })
    
    return { success: true }
  } catch (error) {
    if (error instanceof AppwriteException) {
      return { error: error.message }
    }
    
    return { error: "An unexpected error occurred" }
  }
  
  redirect("/dashboard")
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  
  try {
    // Use admin client to create a session which validates credentials
    const { account } = await createAdminClient()
    
    // Create session to verify credentials - this will throw if invalid
    const session = await account.createEmailPasswordSession(email, password)
    
    // If successful, create our JWT session
    await createSession({
      userId: session.userId,
      email: email,
    })
    
    // Clean up the Appwrite session since we use JWT
    try {
      await account.deleteSession(session.$id)
    } catch {
      // Ignore cleanup errors
    }
    
    return { success: true }
  } catch (error) {
    if (error instanceof AppwriteException) {
      return { error: error.message }
    }
    
    return { error: "Invalid credentials. Please check the email and password." }
  }
  
  redirect("/dashboard")
}

// Wrapper functions for useFormState compatibility
export async function signUpAction(state: FormState, formData: FormData): Promise<FormState> {
  try {
    const result = await signUp(formData)
    return result
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return { success: true }
    }
    return { error: "An unexpected error occurred" }
  }
}

export async function signInAction(state: FormState, formData: FormData): Promise<FormState> {
  try {
    const result = await signIn(formData)
    return result
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return { success: true }
    }
    return { error: "An unexpected error occurred" }
  }
}

export async function signOut() {
  await deleteSession()
  redirect("/login")
} 