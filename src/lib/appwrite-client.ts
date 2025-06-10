import { Client, Account, Databases, Storage } from "appwrite"

const createClient = () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

    return client;
};

export default createClient;

export const account = new Account(createClient())
export const databases = new Databases(createClient())
export const storage = new Storage(createClient()) 