import { expect, test } from '@playwright/test'

// Read-only checks against the isolated in-memory Appwrite fixture.
test.skip(!process.env.FAKE_APPWRITE, 'requires the fake Appwrite backend')
const base = 'http://localhost:4100/v1/databases/d/collections'
const query = (method: string, attribute: string, ...values: unknown[]) => JSON.stringify({ method, attribute, values })

test('indexed Appwrite query filters main and non-main players without overlap', async ({ request }) => {
  const read = async (main: boolean) => {
    const url = new URL(`${base}/p/documents`)
    url.searchParams.set('queries[0]', query('equal', 'userId', 'test-user'))
    url.searchParams.set('queries[1]', query('equal', 'isMainPlayer', main))
    url.searchParams.set('queries[2]', JSON.stringify({ method: 'limit', values: [100] }))
    const response = await request.get(url.toString())
    expect(response.ok()).toBeTruthy()
    return (await response.json()).documents as { $id: string; isMainPlayer: boolean }[]
  }
  const main = await read(true)
  const others = await read(false)
  expect(main.map(p => p.$id)).toEqual(['pl1'])
  expect(others.map(p => p.$id).sort()).toEqual(['pl2', 'pl3', 'pl4'])
  expect(others.every(p => !main.some(m => m.$id === p.$id))).toBe(true)
})

test('validates selected attributes for indexed and repeated query encoding', async ({ request }) => {
  for (const key of ['queries[0]', 'queries[]']) {
    const url = new URL(`${base}/m/documents`)
    url.searchParams.append(key, query('select', '', '$id', 'attributeThatDoesNotExist'))
    const response = await request.get(url.toString())
    expect(response.status()).toBe(400)
    expect((await response.json()).type).toBe('general_query_invalid')
  }
})
