// Tiny fake Appwrite REST API for local end-to-end checks.
// Usage: node tools/fake-appwrite.js   then build/start the app with
//   NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost:4100/v1 and database ids d (db) / m (matches) / p (players).
// Extras for tests:  GET /__doc/<collection>/<id>  stored document,  GET /__reset  restore samples,
//                    GET /__fail?on=1|0  make saves (PATCH) fail with 500.
const http = require('http')
// Optional latency for exercising streaming states in isolated local tests.
const matchListDelay = Math.max(0, Math.min(5000, Number(process.env.FAKE_MATCH_LIST_DELAY_MS) || 0))

const pts = (arr) => arr.map((o, i) => JSON.stringify({ id: String(i), pointNumber: i + 1, setNumber: 1, gameNumber: o.g, winner: o.w, server: o.s, isTiebreak: false, ...(o.sp ? { serverPlayer: o.sp } : {}) }))
const base = { $id: '', $createdAt: '2026-10-26T10:00:00.000Z', $updatedAt: '2026-10-26T10:00:00.000Z', $permissions: [], $databaseId: 'd', $collectionId: 'm', matchDate: '2026-10-26T10:00:00.000Z', userId: 'test-user', tournamentName: 'Club Cup' }
const fmt = (extra = {}) => JSON.stringify({ sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard', gamesPerSet: 6, tiebreakAt: 6, ...extra })
const emptyScore = JSON.stringify({ sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] })

const samples = () => ({
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
  // Fresh "points only" match for live-scoring scenarios
  'm/match4': { ...base, $id: 'match4', playerOneId: 'pl1', playerTwoId: 'pl2', status: 'In Progress', detailLevel: 'points',
    score: emptyScore, matchFormat: fmt(), pointLog: [] },
  'p/pl1': { $id: 'pl1', userId: 'test-user', firstName: 'Michal', lastName: 'Latal', isMainPlayer: true, $createdAt: '2026-10-01T10:00:00.000Z' },
  'p/pl2': { $id: 'pl2', userId: 'test-user', isMainPlayer: false, firstName: 'Petr', lastName: 'Dvořák' },
  'p/pl3': { $id: 'pl3', userId: 'test-user', isMainPlayer: false, firstName: 'Karel', lastName: 'Novotný' },
  'p/pl4': { $id: 'pl4', userId: 'test-user', isMainPlayer: false, firstName: 'Jan', lastName: 'Procházka' },
})

// A season of finished matches so list, dashboard and statistics screens have data to show
const history = () => {
  const rows = [
    ['pl2', [[6, 4], [6, 3]], 'pl1'], ['pl3', [[4, 6], [6, 2], [7, 6]], 'pl1'], ['pl4', [[3, 6], [4, 6]], 'pl4'],
    ['pl2', [[6, 1], [6, 2]], 'pl1'], ['pl3', [[7, 5], [6, 7], [6, 4]], 'pl1'], ['pl4', [[6, 4], [3, 6], [4, 6]], 'pl4'],
    ['pl2', [[2, 6], [6, 4], [6, 3]], 'pl1'], ['pl3', [[6, 0], [6, 1]], 'pl1'],
  ]
  const out = {}
  rows.forEach(([opp, sets, winner], i) => {
    const id = 'hist' + (i + 1), d = new Date(Date.UTC(2026, 9, 25 - i * 3, 17, 0)).toISOString()
    out['m/' + id] = { ...base, $id: id, $createdAt: d, matchDate: d, playerOneId: 'pl1', playerTwoId: opp, status: 'Completed', winnerId: winner,
      score: JSON.stringify({ sets, games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] }), matchFormat: fmt(), pointLog: [],
      tournamentName: i % 2 ? 'Club Cup' : 'Friendly', startTime: d, endTime: new Date(Date.parse(d) + 5400000).toISOString() }
  })
  return out
}
Object.assign(samples, {})
let docs = { ...samples(), ...history() }
let failSaves = false
let failPlayerCreate = false
// Match attributes mirror the preview collection, including optional attributes absent
// from sample documents. Validate ordinary attributes as well as system attributes.
const matchAttributes = new Set(['playerOneId', 'playerTwoId', 'matchDate', 'matchFormat', 'status', 'winnerId', 'score', 'userId', 'pointLog', 'events', 'playerThreeId', 'playerFourId', 'isDoubles', 'detailLevel', 'endTime', 'retirementReason', 'startTime', 'setDurations', 'tournamentName', 'isDeleted', 'deletedAt', 'deletedBy'])
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/__reset') {
    docs = { ...samples(), ...history() }; failSaves = false; failPlayerCreate = false
    const marker = url.searchParams.get('marker')
    if (marker && /^[A-Za-z0-9]{1,40}$/.test(marker)) docs['p/pl1'].lastName = marker
    return json(res, 200, { ok: true })
  }
  if (url.pathname === '/__seed-search') {
    docs = { ...samples(), ...history() }
    docs['p/old-player'] = { $id: 'old-player', userId: 'test-user', firstName: 'Old', lastName: 'Opponent', isMainPlayer: false }
    for (let i = 0; i < 35; i++) {
      const id = `search-new-${i}`
      const date = new Date(Date.UTC(2027, 0, 1 + i)).toISOString()
      docs[`m/${id}`] = { ...base, $id: id, matchDate: date, playerOneId: 'pl1', playerTwoId: 'pl2', status: 'Completed', score: emptyScore, matchFormat: fmt() }
    }
    docs['m/search-old'] = { ...base, $id: 'search-old', matchDate: '2020-01-01T00:00:00.000Z', playerOneId: 'pl1', playerTwoId: 'old-player', status: 'Completed', score: emptyScore, matchFormat: fmt() }
    return json(res, 200, { ok: true })
  }
  if (url.pathname === '/__fail-player-create') { failPlayerCreate = url.searchParams.get('on') === '1'; return json(res, 200, { failPlayerCreate }) }
  if (url.pathname === '/__fail') { failSaves = url.searchParams.get('on') === '1'; return json(res, 200, { failSaves }) }
  const dbg = url.pathname.match(/^\/__doc\/([^/]+)\/([^/]+)$/)
  if (dbg) return docs[`${dbg[1]}/${dbg[2]}`] ? json(res, 200, docs[`${dbg[1]}/${dbg[2]}`]) : json(res, 404, {})

  const list = url.pathname.match(/\/databases\/[^/]+\/collections\/([^/]+)\/documents\/?$/)
  if (list && (list[1] === 'p' || list[1] === 'm') && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      if (list[1] === 'p' && failPlayerCreate) return json(res, 500, { message: 'simulated outage', code: 500, type: 'general_server_error' })
      try {
        const { documentId, data } = JSON.parse(body)
        if (!documentId || !data || !data.userId) return json(res, 400, { message: 'invalid document', code: 400 })
        const key = `${list[1]}/${documentId}`
        if (docs[key]) return json(res, 409, { message: 'document exists', code: 409 })
        const now = new Date().toISOString()
        docs[key] = { ...data, $id: documentId, $createdAt: now, $updatedAt: now, $permissions: [], $databaseId: 'd', $collectionId: list[1] }
        return json(res, 201, docs[key])
      } catch { return json(res, 400, { message: 'invalid JSON', code: 400 }) }
    })
    return
  }
  if (list && req.method === 'GET') {
    let limit = 25, offset = 0, cursorAfter = null, orderBy = null, ascending = false
    const filters = []
    // node-appwrite's Client.flatten emits queries[0], queries[1], ...;
    // support repeated queries[] as well for direct REST calls.
    const encodedQueries = [...url.searchParams.entries()]
      .filter(([key]) => /^queries\[(?:\d+)?\]$/.test(key)).map(([, value]) => value)
    for (const q of encodedQueries) {
      try {
        const { method, attribute, values } = JSON.parse(q)
        if (method === 'limit') limit = values[0]
        if (method === 'offset') offset = values[0]
        if (method === 'cursorAfter') cursorAfter = values[0]
        if (method === 'orderAsc' || method === 'orderDesc') { orderBy = attribute; ascending = method === 'orderAsc' }
        if (method === 'select') {
          const bad = values.find((v) => v.startsWith('$') ? !['$id', '$createdAt', '$updatedAt', '$permissions'].includes(v) : list[1] === 'm' && !matchAttributes.has(v))
          if (bad) return json(res, 400, { message: `Invalid query: Attribute not found in schema: ${bad}`, code: 400, type: 'general_query_invalid' })
        }
        if (method === 'equal' && attribute) filters.push((d) => values.includes(d[attribute]))
        if (method === 'greaterThan' && attribute) filters.push((d) => d[attribute] > values[0])
        if (method === 'isNull' && attribute) filters.push((d) => d[attribute] == null)
        if (method === 'greaterThanEqual' && attribute) filters.push((d) => d[attribute] >= values[0])
        if (method === 'or') filters.push((d) => values.some((q) => q.method === 'isNull' ? d[q.attribute] == null : q.method === 'equal' && q.values.includes(d[q.attribute])))
        if (method === 'notEqual' && attribute) filters.push((d) => !values.includes(d[attribute]))
      } catch { /* ignore */ }
    }
    const all = Object.entries(docs).filter(([k]) => k.startsWith(list[1] + '/')).map(([, v]) => v).filter((d) => filters.every((f) => f(d)))
    if (orderBy) all.sort((a, b) => {
      const compare = String(a[orderBy] ?? '').localeCompare(String(b[orderBy] ?? ''))
      return ascending ? compare : -compare
    })
    const start = cursorAfter ? Math.max(0, all.findIndex((doc) => doc.$id === cursorAfter) + 1) + offset : offset
    const respond = () => json(res, 200, { total: all.length, documents: all.slice(start, start + limit) })
    if (list[1] === 'm' && matchListDelay) return setTimeout(respond, matchListDelay)
    return respond()
  }

  const m = url.pathname.match(/\/databases\/[^/]+\/collections\/([^/]+)\/documents\/([^/?]+)/)
  const key = m && `${m[1]}/${m[2]}`
  if (!key || !docs[key]) return json(res, 404, { message: 'not found', code: 404, type: 'document_not_found' })

  if (req.method === 'PATCH') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      if (failSaves) return json(res, 500, { message: 'simulated outage', code: 500, type: 'general_server_error' })
      try { docs[key] = { ...docs[key], ...(JSON.parse(body || '{}').data || {}) } } catch { /* ignore */ }
      json(res, 200, docs[key])
    })
    return
  }
  json(res, 200, docs[key])
}).listen(4100, () => console.log('fake appwrite on 4100'))
