
const { Client, Databases, Query } = require('node-appwrite');

// Hardcoded configs from .env.local
const endpoint = 'https://cloud.appwrite.io/v1';
const projectId = '68460965002524f1942e';
const apiKey = 'standard_5d9d8c2f9d497487b09c4c921b8060c001637610dd1d2c986af0de5f73ac89a7b8f7800b2803f56edb0332f7216cab10ae33937edc6b71303b149614937068fb803a117bbaea21305d76365b0cdf03967cb513f59543e02e83f929c494363445270d4c0380ff44af2bea6ad58cf6241e2ff2e0bd041f72dae03663e6dabc522d';
const databaseId = 'tennisscore_db';
const playersCollectionId = 'players';

const client = new Client();

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function checkPlayers() {
    console.log(`Checking Database: ${databaseId}, Collection: ${playersCollectionId} for ALL players...`);

    try {
        let offset = 0;
        let batchSize = 100;
        let total = 0;
        let badCount = 0;

        do {
            console.log(`Fetching batch with offset ${offset}...`);
            const response = await databases.listDocuments(
                databaseId,
                playersCollectionId,
                [
                    Query.limit(batchSize),
                    Query.offset(offset)
                ]
            );

            total = response.total;

            response.documents.forEach(doc => {
                const url = doc.profilePictureUrl;
                if (url && (url.includes('team-logos') || url.includes('ostrava') || url.includes('slavia'))) {
                    console.log(`Found legacy data: Player ${doc.firstName} ${doc.lastName} (${doc.$id}) has URL: ${url}`);
                    badCount++;
                }
            });

            offset += batchSize;
        } while (offset < total);

        if (badCount === 0) {
            console.log(`No players with "team-logos" in profilePictureUrl found in total ${total} records.`);
        } else {
            console.log(`Found ${badCount} bad records in total.`);
        }

    } catch (error) {
        console.error('Error fetching players:', error);
    }
}

checkPlayers();
