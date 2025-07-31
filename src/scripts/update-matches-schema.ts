#!/usr/bin/env tsx

import { Client, Databases } from "node-appwrite"

// This script adds soft delete fields to the matches collection

async function updateMatchesSchema() {
  console.log("🔧 Updating matches collection schema for soft delete...")

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)

  const databases = new Databases(client)

  const databaseId = process.env.APPWRITE_DATABASE_ID!
  const collectionId = process.env.APPWRITE_MATCHES_COLLECTION_ID!

  try {
    // Add isDeleted boolean attribute
    console.log("Adding isDeleted field...")
    await databases.createBooleanAttribute(
      databaseId,
      collectionId,
      "isDeleted",
      false, // not required
      false  // default value
    )
    console.log("✅ isDeleted field added")

    // Add deletedAt datetime attribute
    console.log("Adding deletedAt field...")
    await databases.createDatetimeAttribute(
      databaseId,
      collectionId,
      "deletedAt",
      false // not required
    )
    console.log("✅ deletedAt field added")

    // Add deletedBy string attribute
    console.log("Adding deletedBy field...")
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      "deletedBy",
      255,   // size
      false  // not required
    )
    console.log("✅ deletedBy field added")

    console.log("\n✨ Schema update complete! Soft delete fields have been added to the matches collection.")
    console.log("\n⚠️  Note: It may take a few moments for Appwrite to index these new fields.")
    
  } catch (error: any) {
    if (error?.message?.includes("Attribute already exists")) {
      console.log("ℹ️  Some or all soft delete fields already exist. Schema is up to date.")
    } else {
      console.error("❌ Error updating schema:", error)
      process.exit(1)
    }
  }
}

// Run the script
updateMatchesSchema()
  .then(() => {
    console.log("\n✅ Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error)
    process.exit(1)
  })