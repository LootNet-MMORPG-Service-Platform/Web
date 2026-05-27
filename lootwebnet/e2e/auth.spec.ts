import { expect, test } from '@playwright/test'

test('auth form uses email login and sends email to the API', async ({ page }) => {
  let loginPayload: Record<string, unknown> | undefined

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()

    if (url.endsWith('/api/auth/login')) {
      loginPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'access-token', refreshToken: 'refresh-token' }),
      })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/login')
  await expect(page.getByLabel('Email').first()).toBeVisible()

  await page.getByLabel('Email').first().fill('player@example.com')
  await page.getByLabel('Password').first().fill('short')
  await page.getByRole('button', { name: 'Enter Realm' }).click()

  await expect.poll(() => loginPayload?.email).toBe('player@example.com')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBe('access-token')
})

test('register and reset tabs expose email-based auth fields', async ({ page }) => {
  await page.goto('/login')

  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page.getByLabel('Username')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible()
})

test('register sends email, password and web verification client', async ({ page }) => {
  let registerPayload: Record<string, unknown> | undefined

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()

    if (url.endsWith('/api/auth/register')) {
      registerPayload = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('ok') })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/login')
  await page.getByRole('button', { name: 'Register' }).click()
  await page.getByLabel('Username').fill('player1')
  await page.getByLabel('Email').fill('player@example.com')
  await page.getByLabel('Password', { exact: true }).fill('short')
  await page.getByLabel('Confirm Password').fill('short')
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect.poll(() => registerPayload?.username).toBe('player1')
  await expect.poll(() => registerPayload?.email).toBe('player@example.com')
  await expect.poll(() => registerPayload?.verificationClient).toBe(0)
})

test('register shows API validation errors', async ({ page }) => {
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: {
          Email: ['The Email field is not a valid e-mail address.'],
        },
      }),
    })
  })

  await page.goto('/login')
  await page.getByRole('button', { name: 'Register' }).click()
  await page.getByLabel('Username').fill('player1')
  await page.getByLabel('Email').fill('player@example.com')
  await page.getByLabel('Password', { exact: true }).fill('short')
  await page.getByLabel('Confirm Password').fill('short')
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect(page.getByText(/valid e-mail address/i)).toBeVisible()
})

test('forgot password sends reset request by email', async ({ page }) => {
  let forgotPayload: Record<string, unknown> | undefined

  await page.route('**/api/**', async (route) => {
    const url = route.request().url()

    if (url.endsWith('/api/auth/forgot-password')) {
      forgotPayload = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('ok') })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/login')
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByLabel('Email').fill('player@example.com')
  await page.getByRole('button', { name: 'Send Reset Link' }).click()

  await expect.poll(() => forgotPayload?.email).toBe('player@example.com')
  await expect(page.getByText(/password reset link has been sent/i)).toBeVisible()
})

test('login failure shows a readable error and does not store token', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({ status: 401, contentType: 'text/plain', body: 'Invalid username or password.' })
  })

  await page.goto('/login')
  await page.getByLabel('Email').first().fill('player@example.com')
  await page.getByLabel('Password').first().fill('bad-password')
  await page.getByRole('button', { name: 'Enter Realm' }).click()

  await expect(page.getByText(/invalid username or password/i)).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull()
})
