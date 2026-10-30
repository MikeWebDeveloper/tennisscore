import { test, expect } from '@playwright/test'

// Mike's PDF point 10: the new-match player search listed players whose names had nothing to do with
// the text typed. Read-only against the fake samples (Latal, Dvořák, Novotný, Procházka).
test.skip(!process.env.FAKE_APPWRITE, 'requires the fake Appwrite backend')
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

async function openOpponentSearch(page: import('@playwright/test').Page, locale: 'en' | 'cs') {
  await page.goto(`/${locale}/matches/new`)
  await page.getByRole('button', { name: locale === 'en' ? /Singles/ : /Dvouhra/ }).click()
  await page.getByRole('combobox').nth(1).click()
  return page.getByRole('listbox')
}

test('finds a player without typing the diacritics, and lists nobody else', async ({ page }) => {
  const list = await openOpponentSearch(page, 'en')
  await page.getByPlaceholder('Search by first or last name').fill('dvorak')
  await expect(list.getByRole('option')).toHaveText([/Dvořák/, 'Create new player'])
})

test('shows "no player found" in Czech when no name contains the text', async ({ page }) => {
  const list = await openOpponentSearch(page, 'cs')
  // The old fuzzy filter matched k-a-r-l-a across "Karel" and listed him
  await page.getByPlaceholder('Hledat podle jména nebo příjmení').fill('Karla')
  await expect(list.getByText('Žádný hráč nenalezen')).toBeVisible()
  await expect(list.getByText('Zkuste jiné jméno nebo vytvořte nového hráče.')).toBeVisible()
  await expect(list.getByRole('option')).toHaveText(['Vytvořit nového hráče'])
})
