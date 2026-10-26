// Tiny fake Appwrite REST API for local end-to-end checks (singles, doubles and finished sample matches).
// Usage: node tools/fake-appwrite.js   then build/start the app with NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost:4100/v1 and database ids d / m / p.
const http = require('http')
const pts = (arr) => arr.map((o, i) => JSON.stringify({ id: String(i), pointNumber: i + 1, setNumber: 1, gameNumber: o.g, winner: o.w, server: o.s, isTiebreak: false, ...(o.sp ? { serverPlayer: o.sp } : {}) }))
const base = { $id: '', $createdAt: '2026-10-26T10:00:00.000Z', $updatedAt: '2026-10-26T10:00:00.000Z', $permissions: [], $databaseId: 'd', $collectionId: 'm', matchDate: '2026-10-26T10:00:00.000Z', userId: 'u', tournamentName: 'Club Cup' }
const fmt = (extra = {}) => JSON.stringify({ sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard', gamesPerSet: 6, tiebreakAt: 6, ...extra })
const docs = {
  'm/match1': { ...base, $id: 'match1', playerOneId: 'pl1', playerTwoId: 'pl2', status: 'In Progress',
    score: JSON.stringify({ sets: [[6, 4]], games: [2, 1], points: [2, 3], isTiebreak: false, tiebreakPoints: [0, 0] }),
    matchFormat: fmt(), pointLog: pts([{ g: 1, w: 'p1', s: 'p1' }, { g: 1, w: 'p1', s: 'p1' }]) },
  'm/match2': { ...base, $id: 'match2', playerOneId: 'pl1', playerTwoId: 'pl2', playerThreeId: 'pl3', playerFourId: 'pl4', status: 'In Progress',
    score: JSON.stringify({ sets: [], games: [1, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] }),
    matchFormat: fmt({ doublesServeOrder: { p1: 'p3', p2: 'p4' } }),
    pointLog: pts([{ g: 1, w: 'p1', s: 'p1', sp: 'p3' }, { g: 1, w: 'p1', s: 'p1', sp: 'p3' }, { g: 1, w: 'p1', s: 'p1', sp: 'p3' }, { g: 1, w: 'p1', s: 'p1', sp: 'p3' }]) },
  'm/match3': { ...base, $id: 'match3', playerOneId: 'pl1', playerTwoId: 'pl2', status: 'Completed', winnerId: 'pl2',
    score: JSON.stringify({ sets: [[4, 6], [3, 6]], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] }),
    matchFormat: fmt(), pointLog: [] },
  'p/pl1': { $id: 'pl1', firstName: 'Michal', lastName: 'Latal' },
  'p/pl2': { $id: 'pl2', firstName: 'Petr', lastName: 'Dvořák' },
  'p/pl3': { $id: 'pl3', firstName: 'Karel', lastName: 'Novotný' },
  'p/pl4': { $id: 'pl4', firstName: 'Jan', lastName: 'Procházka' },
}
http.createServer((req, res) => {
  const m = req.url.match(/\/databases\/[^/]+\/collections\/([^/]+)\/documents\/([^/?]+)/)
  const key = m && `${m[1]}/${m[2]}`
  if (key && docs[key]) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(docs[key])) }
  res.writeHead(404, { 'content-type': 'application/json' }); res.end(JSON.stringify({ message: 'not found', code: 404, type: 'document_not_found' }))
}).listen(4100, () => console.log('fake appwrite on 4100'))
