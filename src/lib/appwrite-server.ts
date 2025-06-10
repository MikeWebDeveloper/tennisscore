"use server";

import { Client, Account, Databases, Storage } from "node-appwrite"
import { cookies } from "next/headers"

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)

  const session = (await cookies()).get("session")

  if (session) {
    client.setSession(session.value)
  }

  return new Account(client)
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_API_KEY!) // Secret server key

  return {
    get account() {
      return new Account(client)
    },
    get database() {
      return new Databases(client)
    },
    get storage() {
      return new Storage(client)
    }
  }
} 