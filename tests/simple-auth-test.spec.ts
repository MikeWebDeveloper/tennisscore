import { test, expect } from '@playwright/test'

test('debug authentication', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')
  
  // Take screenshot to see the login page
  await page.screenshot({ path: 'login-page.png' })
  
  // Check what elements are available
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  const submitButton = page.locator('button[type="submit"]')
  
  console.log('Email input visible:', await emailInput.isVisible())
  console.log('Password input visible:', await passwordInput.isVisible())
  console.log('Submit button visible:', await submitButton.isVisible())
  
  if (await emailInput.isVisible()) {
    await emailInput.fill('michal.latal@yahoo.co.uk')
  }
  
  if (await passwordInput.isVisible()) {
    await passwordInput.fill('Mikemike88')
  }
  
  // Take screenshot before submit
  await page.screenshot({ path: 'before-submit.png' })
  
  if (await submitButton.isVisible()) {
    await submitButton.click()
  }
  
  // Wait a moment and see what happens
  await page.waitForTimeout(3000)
  
  // Take screenshot after submit
  await page.screenshot({ path: 'after-submit.png' })
  
  // Check current URL
  console.log('Current URL:', page.url())
  
  // Check if there are any error messages
  const errorMessages = await page.locator('.error, [role="alert"], .text-red-500').textContent()
  if (errorMessages) {
    console.log('Error messages:', errorMessages)
  }
})