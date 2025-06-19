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
export const client = new Proxy({} as Client, {
    get(target, prop) {
        const client = getClient()
        const value = client[prop as keyof Client]
        return typeof value === 'function' ? value.bind(client) : value
    }
})

export const account = new Proxy({} as Account, {
    get(target, prop) {
        if (!accountInstance) {
            accountInstance = new Account(getClient())
        }
        const value = accountInstance[prop as keyof Account]
        return typeof value === 'function' ? value.bind(accountInstance) : value
    }
})

export const databases = new Proxy({} as Databases, {
    get(target, prop) {
        if (!databasesInstance) {
            databasesInstance = new Databases(getClient())
        }
        const value = databasesInstance[prop as keyof Databases]
        return typeof value === 'function' ? value.bind(databasesInstance) : value
    }
})

export const storage = new Proxy({} as Storage, {
    get(target, prop) {
        if (!storageInstance) {
            storageInstance = new Storage(getClient())
        }
        const value = storageInstance[prop as keyof Storage]
        return typeof value === 'function' ? value.bind(storageInstance) : value
    }
})

export default getClient 