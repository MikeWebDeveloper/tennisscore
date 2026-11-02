import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { DataExportCard, TrashCard } from './data-cards'
import { getExportPage, getTrash } from '@/lib/actions/data-export'
import { restoreMatch } from '@/lib/actions/matches'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/lib/actions/data-export', () => ({ getExportPage: jest.fn(), getTrash: jest.fn() }))
jest.mock('@/lib/actions/matches', () => ({ restoreMatch: jest.fn() }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/i18n', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}(${Object.values(values).join(',')})` : key,
  useLocale: () => 'cs',
}))

const match = (id: string) => ({ $id: id, matchDate: '2026-10-04T10:00:00.000Z', status: 'Completed', winnerId: 'me', playerOneId: 'me', playerTwoId: 'eva', score: JSON.stringify({ sets: [[6, 4]], games: [0, 0], points: [0, 0] }), pointLog: ['{"winner":"p1"}'] })

function mount() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  return { container, root, unmount: () => { act(() => root.unmount()); container.remove() } }
}

it('downloads every page of matches as a CSV that Czech Excel splits on semicolons', async () => {
  jest.mocked(getExportPage)
    .mockResolvedValueOnce({ matches: Array.from({ length: 50 }, (_, i) => match(`m${i}`)) as never, names: { me: 'Látalová Sofie', eva: 'Nová Eva' }, total: 51 })
    .mockResolvedValueOnce({ matches: [match('m50')] as never, names: { me: 'Látalová Sofie', eva: 'Nová Eva' }, total: 51 })
  const blobs: Blob[] = []
  ;(URL as unknown as { createObjectURL: (blob: Blob) => string }).createObjectURL = (blob: Blob) => { blobs.push(blob); return 'blob:x' }
  ;(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {}
  const { container, root, unmount } = mount()
  await act(async () => root.render(<DataExportCard />))
  const csv = [...container.querySelectorAll('button')].find(b => b.textContent === 'exportCsv')!
  await act(async () => { csv.click() })
  expect(getExportPage).toHaveBeenCalledWith(0)
  expect(getExportPage).toHaveBeenCalledWith(50)
  // jsdom's Blob has no text()
  const text = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blobs[0]) })
  // FileReader drops the BOM while decoding; toCsv's own test checks it is written
  expect(text.replace(/^\uFEFF/, '').split('\r\n')[0]).toBe('exportColId;exportColDate;exportColTournament;exportColType;exportColTeamOne;exportColTeamTwo;exportColScore;exportColStatus;exportColWinner;exportColEndReason;exportColDetail;exportColPoints')
  expect(text.split('\r\n').filter(Boolean)).toHaveLength(52)
  expect(text).toContain('m50;2026-10-04;;singles;Látalová Sofie;Nová Eva;6:4;completed;Látalová Sofie;;;1')
  unmount()
})

it('lists deleted matches with the days left and restores one', async () => {
  jest.mocked(getTrash).mockResolvedValue({ items: [{ id: 'd1', matchDate: '2026-10-04T10:00:00.000Z', teamOne: 'Látalová Sofie', teamTwo: 'Nová Eva', daysLeft: 5 }] })
  jest.mocked(restoreMatch).mockResolvedValue({ success: true } as never)
  const { container, root, unmount } = mount()
  await act(async () => root.render(<TrashCard />))
  expect(container.textContent).toContain('Látalová Sofie')
  expect(container.textContent).toContain('trashDaysLeft(5)')
  const restore = [...container.querySelectorAll('button')].find(b => b.textContent === 'trashRestore')!
  await act(async () => { restore.click() })
  expect(restoreMatch).toHaveBeenCalledWith('d1')
  expect(container.textContent).toContain('trashEmpty')
  unmount()
})
