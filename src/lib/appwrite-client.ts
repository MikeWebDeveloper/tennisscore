import { Client, Account, Databases, Storage } from "appwrite"

// Lazy client creation to ensure environment variables are available
let clientInstance: Client | null = null
let accountInstance: Account | null = null
let databasesInstance: Databases | null = null
let storageInstance: Storage | null = null

const getClient = (): Client => {
    if (!clientInstance) {
        // Trim whitespace and newlines from environment variables
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim()
        const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT?.trim()

        console.log("🔧 Creating Appwrite client with:", {
            endpoint: endpoint ? `${endpoint.slice(0, 30)}...` : "missing",
            project: project ? `${project.slice(0, 10)}...` : "missing",
            hasEndpoint: !!endpoint,
            hasProject: !!project
        })

        if (!endpoint || !project) {
            throw new Error(`Missing Appwrite configuration: endpoint=${!!endpoint}, project=${!!project}`)
        }

        clientInstance = new Client()
            .setEndpoint(endpoint)
            .setProject(project)

        console.log("✅ Appwrite client created successfully")
    }
    
    return clientInstance
}

// Export lazy-loaded instances
export const client = getClient()

export const account = (() => {
    if (!accountInstance) {
        accountInstance = new Account(getClient())
    }
    return accountInstance
})()

export const databases = (() => {
    if (!databasesInstance) {
        databasesInstance = new Databases(getClient())
    }
    return databasesInstance
})()

export const storage = (() => {
    if (!storageInstance) {
        storageInstance = new Storage(getClient())
    }
    return storageInstance
})()

export default getClient