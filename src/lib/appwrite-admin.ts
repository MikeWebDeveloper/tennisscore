import { Client, Account, Databases, Users, Storage } from 'node-appwrite'

let client: Client | undefined

function createAdminClient() {
  if (!client) {
    client = new Client()
    
    if (process.env.APPWRITE_ENDPOINT) {
      client.setEndpoint(process.env.APPWRITE_ENDPOINT)
    }
    
    if (process.env.APPWRITE_PROJECT_ID) {
      client.setProject(process.env.APPWRITE_PROJECT_ID)
    }
    
    if (process.env.APPWRITE_API_KEY) {
      client.setKey(process.env.APPWRITE_API_KEY)
    }
  }

  return {
    client,
    account: new Account(client),
    database: new Databases(client),
    users: new Users(client),
    storage: new Storage(client)
  }
}

export { createAdminClient }

// Export individual clients for convenience
const adminClient = createAdminClient()
export const { account, database: databases, users, storage } = adminClient