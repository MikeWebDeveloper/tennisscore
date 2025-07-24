// scripts/count-sofie-matches.js

import { Client, Databases, Query } from 'node-appwrite';

// === CONFIGURATION ===
const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('68460965002524f1942e')              // Your project ID
    .setKey('standard_8e0a8d8d3d0902f846887429cacf282a805f9b330056332d2c0283210edc2897688fba6c10f4c43f8332f8e09e740fcd880b94ac0aed97e38fe163f850abf835951c646246a5e36978b0a6c28199590007626e3fd37abc3355b30870d5c48c9847592f499aaf604d7afd7147d6aba3cfbe96b6eba6c677a51c8376f5445a4255'); // Your API key

const databaseId = 'tennisscore_db'; // Your database ID
const matchesCollectionId = 'YOUR_MATCHES_COLLECTION_ID'; // <-- Replace with your matches collection ID
const sofieId = 'SOFIE_PLAYER_ID'; // <-- Replace with Sofie Latalova's player $id

const databases = new Databases(client);

async function main() {
    try {
        // Query for matches where Sofie is in any player slot
        const query = [
            Query.or([
                Query.equal('playerOneId', sofieId),
                Query.equal('playerTwoId', sofieId),
                Query.equal('playerThreeId', sofieId),
                Query.equal('playerFourId', sofieId),
            ])
        ];

        let matches = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            const res = await databases.listDocuments(
                databaseId,
                matchesCollectionId,
                [...query, Query.limit(limit), Query.offset(offset)]
            );
            matches = matches.concat(res.documents);
            if (res.documents.length < limit) break;
            offset += limit;
        }

        console.log(`Sofie Latalova appears in ${matches.length} matches.`);
        // Optionally, print match IDs or details:
        // matches.forEach(m => console.log(m.$id, m.matchDate, m.status));
    } catch (err) {
        console.error('Error fetching matches:', err.message || err);
    }
}

main(); 