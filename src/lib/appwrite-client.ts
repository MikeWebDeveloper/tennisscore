import { Client, Account, Databases, Storage } from "appwrite"

// Create a singleton client instance  
const createClient = (): Client => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)

    return client
}

// Export the client instance for real-time subscriptions
export const client = createClient()

// Create service instances
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export default createClient 