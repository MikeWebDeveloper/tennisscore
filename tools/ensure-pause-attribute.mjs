// Inspect the optional pause flag; pass --apply to add it if absent.
// This changes collection schema only, never match documents.
import nextEnv from '@next/env'
import { Client, Databases } from 'node-appwrite'

nextEnv.loadEnvConfig(process.cwd())
const names = ['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID', 'APPWRITE_MATCHES_COLLECTION_ID']
const missing = names.filter(name => !process.env[name])
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`)
const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT).setKey(process.env.APPWRITE_API_KEY)
const db = new Databases(client)
const database = process.env.APPWRITE_DATABASE_ID
const collection = process.env.APPWRITE_MATCHES_COLLECTION_ID
let attribute
try {
  attribute = await db.getAttribute(database, collection, 'isPaused')
} catch (error) {
  if (error.code !== 404) throw error
}
if (!attribute) {
  if (!process.argv.includes('--apply')) {
    console.log('Optional isPaused attribute is absent; no changes made.')
    process.exit(0)
  }
  attribute = await db.createBooleanAttribute(database, collection, 'isPaused', false, false, false)
  console.log('Created optional isPaused attribute; waiting for Appwrite to make it available.')
}
for (let attempt = 0; attempt < 30; attempt++) {
  if (attribute.type !== 'boolean' || attribute.required || attribute.array) throw new Error('Existing isPaused attribute is incompatible; no changes made.')
  if (attribute.status === 'available') {
    console.log('Optional isPaused attribute is available.')
    process.exit(0)
  }
  if (attribute.status === 'failed' || attribute.status === 'stuck') throw new Error(`Attribute status: ${attribute.status}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  attribute = await db.getAttribute(database, collection, 'isPaused')
}
throw new Error(`Attribute is not ready yet (status: ${attribute.status}).`)
