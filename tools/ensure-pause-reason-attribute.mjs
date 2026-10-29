// Inspect the optional reason field; --apply adds it without editing matches.
import nextEnv from '@next/env'
import { Client, Databases } from 'node-appwrite'
nextEnv.loadEnvConfig(process.cwd())
const keys = ['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID', 'APPWRITE_MATCHES_COLLECTION_ID']
const missing = keys.filter(key => !process.env[key])
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`)
const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT).setKey(process.env.APPWRITE_API_KEY)
const db = new Databases(client), database = process.env.APPWRITE_DATABASE_ID, collection = process.env.APPWRITE_MATCHES_COLLECTION_ID
let attribute
try { attribute = await db.getAttribute(database, collection, 'pauseReason') } catch (error) { if (error.code !== 404) throw error }
if (!attribute) {
  if (!process.argv.includes('--apply')) { console.log('Optional pauseReason attribute is absent; no changes made.'); process.exit(0) }
  attribute = await db.createStringAttribute(database, collection, 'pauseReason', 32, false, '', false)
  console.log('Created optional pauseReason attribute; waiting for Appwrite.')
}
for (let attempt = 0; attempt < 30; attempt++) {
  if (attribute.type !== 'string' || attribute.required || attribute.array || attribute.size < 32) throw new Error('Existing pauseReason attribute is incompatible.')
  if (attribute.status === 'available') { console.log('Optional pauseReason attribute is available.'); process.exit(0) }
  if (attribute.status === 'failed' || attribute.status === 'stuck') throw new Error(`Attribute status: ${attribute.status}`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  attribute = await db.getAttribute(database, collection, 'pauseReason')
}
throw new Error(`Attribute is not ready yet (status: ${attribute.status}).`)
