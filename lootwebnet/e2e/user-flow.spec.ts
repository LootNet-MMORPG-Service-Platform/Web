import { expect, test } from '@playwright/test'

const weaponListing = {
  listingId: 'listing-weapon-1',
  itemId: 'weapon-1',
  sellerId: 'seller-1',
  sellerUsername: 'TraderJoe',
  sellerProfileImagePath: null,
  name: 'Iron Sword',
  price: 125,
  weaponType: 1,
  cut: 9.4,
  blunt: 2.1,
  elements: [{ type: 0, value: 3 }],
}

const myListing = {
  listingId: 'my-listing-1',
  itemId: 'armor-1',
  name: 'Guard Helmet',
  category: 1,
  armorType: 0,
  price: 90,
  cutResistance: 4,
  bluntResistance: 5,
  elements: [],
  createdAt: '2026-05-26T10:00:00Z',
}

async function mockApi(page: import('@playwright/test').Page) {
  const calls: string[] = []
  const globalMessages = [{
    id: 'msg-1',
    senderId: 'seller-1',
    senderUsername: 'TraderJoe',
    senderProfileImagePath: null,
    text: 'Welcome to the market.',
    createdAt: '2026-05-26T12:00:00Z',
  }]

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api', '')

    calls.push(`${request.method()} ${path}`)

    if (path === '/auth/login') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'access-token', refreshToken: 'refresh-token' }),
      })
      return
    }

    if (path === '/auth/logout') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('ok') })
      return
    }

    if (path === '/market/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 'user-1',
          username: 'player1',
          currency: 1000,
          profileImagePath: null,
        }),
      })
      return
    }

    if (path === '/market/listing/weapons') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [weaponListing], totalCount: 1 }),
      })
      return
    }

    if (path === '/market/listing/armors') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], totalCount: 0 }),
      })
      return
    }

    if (path === '/market/listing-weapon-1/buy') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('ok') })
      return
    }

    if (path === '/mobile/items') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ weapons: [], armors: [] }) })
      return
    }

    if (path === '/market/daily') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ currencyReward: 50 }),
      })
      return
    }

    if (path === '/market/me/listings') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [myListing], totalCount: 1 }),
      })
      return
    }

    if (path === '/market/me/listings/summary') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalItemsListed: 1, totalListedValue: 90 }),
      })
      return
    }

    if (path === '/market/me/transactions') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{
            transactionId: 'tx-1',
            itemName: 'Iron Sword',
            isSale: false,
            counterpartyUserId: 'seller-1',
            counterpartyUsername: 'TraderJoe',
            price: 125,
            timestamp: '2026-05-26T11:00:00Z',
          }],
          totalCount: 1,
        }),
      })
      return
    }

    if (path === '/market/me/transactions/summary') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalSold: 0, totalBought: 125, difference: -125 }),
      })
      return
    }

    if (path === '/chat/global' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: globalMessages, totalCount: globalMessages.length }),
      })
      return
    }

    if (path === '/chat/global' && request.method() === 'POST') {
      const body = request.postDataJSON()
      globalMessages.push({
        id: 'msg-2',
        senderId: 'user-1',
        senderUsername: 'player1',
        senderProfileImagePath: null,
        text: String(body?.text ?? ''),
        createdAt: '2026-05-26T12:05:00Z',
      })
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(globalMessages.at(-1)) })
      return
    }

    if (path === '/chat/private/conversations') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ userId: 'seller-1', username: 'TraderJoe', profileImagePath: null, lastMessageText: 'Deal?', lastMessageAt: '2026-05-26T12:10:00Z' }]),
      })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  return calls
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').first().fill('player@example.com')
  await page.getByLabel('Password').first().fill('short')
  await page.getByRole('button', { name: 'Enter Realm' }).click()
  await expect(page).toHaveURL(/\/market\/buy/)
}

test('main web user flow covers marketplace, daily reward, dashboard and logout', async ({ page }) => {
  const calls = await mockApi(page)
  page.on('dialog', dialog => dialog.accept())

  await login(page)

  await expect(page.getByRole('heading', { name: /marketplace/i })).toBeVisible()
  await expect(page.getByText('Iron Sword')).toBeVisible()
  await expect(page.getByText('TraderJoe')).toBeVisible()

  await page.getByRole('button', { name: 'Buy' }).click()
  await expect.poll(() => calls.includes('POST /market/listing-weapon-1/buy')).toBe(true)

  await page.getByRole('button', { name: 'Daily' }).click()
  await expect.poll(() => calls.includes('POST /market/daily')).toBe(true)

  await page.getByRole('link', { name: 'Player Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Player Dashboard' })).toBeVisible()
  await expect(page.getByText('Guard Helmet')).toBeVisible()
  await expect(page.getByText('Total listed value')).toBeVisible()

  await page.getByRole('button', { name: 'Transactions' }).click()
  await expect(page.getByText('Bought from')).toBeVisible()
  await expect(page.getByText('Iron Sword')).toBeVisible()

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull()
})

test('protected web routes redirect unauthenticated users to login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /login to lootnet/i })).toBeVisible()
})

test('web market filters send query and show empty armor state', async ({ page }) => {
  const calls = await mockApi(page)
  await login(page)

  await page.getByPlaceholder('Search items...').fill('iron')
  await expect.poll(() => calls.filter(x => x === 'POST /market/listing/weapons').length).toBeGreaterThan(1)

  await page.getByRole('combobox').first().selectOption('armors')
  await expect.poll(() => calls.includes('POST /market/listing/armors')).toBe(true)
  await expect(page.getByText('Total: 0')).toBeVisible()
})

test('web chat loads global messages and sends a new one', async ({ page }) => {
  const calls = await mockApi(page)
  await login(page)

  await page.getByRole('link', { name: 'Chat' }).click()
  await expect(page.getByRole('heading', { name: /chat/i })).toBeVisible()
  await expect(page.getByText('Welcome to the market.')).toBeVisible()

  await page.getByPlaceholder('Write message...').fill('Hello market')
  await page.getByRole('button', { name: /send/i }).click()
  await expect.poll(() => calls.includes('POST /chat/global')).toBe(true)
})

test('web redirects authenticated users away from login', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.setItem('token', 'access-token')
    localStorage.setItem('refreshToken', 'refresh-token')
  })
  await page.goto('/login')
  await expect(page).toHaveURL(/\/market\/buy/)
})

test('web market shows API error message when listings fail', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api', '')

    if (path === '/auth/login') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'access-token', refreshToken: 'refresh-token' }) })
      return
    }

    if (path === '/market/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: 'player1', currency: 1000 }) })
      return
    }

    if (path === '/market/listing/weapons') {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Market query rejected.' }) })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await login(page)
  await expect(page.getByText('Market query rejected.')).toBeVisible()
})
