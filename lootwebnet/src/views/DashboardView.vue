<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Coins, Crop, History, ScrollText, Shield, Sparkles, Sword } from 'lucide-vue-next'
import { MarketplaceService } from '../services/marketplaceService'
import { toAssetUrl } from '../services/urls'
import type {
  MarketTransactionDTO,
  MarketTransactionsQueryDTO,
  MarketTransactionsSummaryDTO,
  MyListingsQueryDTO,
  MyListingsSummaryDTO,
  MyMarketListingDTO,
  PagedResultDTO
} from '../types/marketplace'
import { ItemCategory } from '../types/marketplace'

const activeTab = ref<'listings' | 'transactions'>('listings')
const isLoading = ref(false)
const errorMessage = ref('')
const profileImagePath = ref('')
const profileImageUrl = computed(() => toAssetUrl(profileImagePath.value))
const cropSource = ref('')
const cropPreview = ref('')
const cropScale = ref(1)
const cropX = ref(0)
const cropY = ref(0)
const pendingFileType = ref('image/png')

const listings = ref<MyMarketListingDTO[]>([])
const listingSearch = ref('')
const listingPage = ref(1)
const listingPageSize = ref(10)
const listingTotal = ref(0)
const listingCategory = ref<'all' | 'weapon' | 'armor'>('all')
const listingSummary = ref<MyListingsSummaryDTO>({ totalItemsListed: 0, totalListedValue: 0 })

const transactions = ref<MarketTransactionDTO[]>([])
const txSearch = ref('')
const txPage = ref(1)
const txPageSize = ref(10)
const txTotal = ref(0)
const txRole = ref<'all' | 'sold' | 'bought'>('all')
const txSummary = ref<MarketTransactionsSummaryDTO>({ totalSold: 0, totalBought: 0, difference: 0 })

const armorTypeNames = ['Helmet', 'Chestplate', 'Gauntlets', 'Greaves', 'Sabatons']
const weaponTypeNames = ['TwoHandSword', 'Sword', 'Shortsword', 'Polearm', 'Crossbow', 'Bow']
const elementTypeNames = ['Fire', 'Water', 'Earth', 'Air']

const round1 = (v: unknown) => Number(Number(v ?? 0).toFixed(1))
const fmtDate = (v: string) => new Date(v).toLocaleString()

const loadProfile = async () => {
  try {
    const me = await MarketplaceService.getProfile()
    profileImagePath.value = String(me?.profileImagePath ?? '')
  } catch {
    profileImagePath.value = ''
  }
}

const prepareCrop = async (file: File) => {
  pendingFileType.value = file.type || 'image/png'
  cropScale.value = 1
  cropX.value = 0
  cropY.value = 0
  cropPreview.value = ''
  cropSource.value = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

const renderCropPreview = async () => {
  if (!cropSource.value) return
  const img = new Image()
  img.src = cropSource.value
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image for crop'))
  })

  const size = 320
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scaledW = img.width * cropScale.value
  const scaledH = img.height * cropScale.value
  const dx = (size - scaledW) / 2 + cropX.value
  const dy = (size - scaledH) / 2 + cropY.value

  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(img, dx, dy, scaledW, scaledH)
  cropPreview.value = canvas.toDataURL('image/png')
}

const uploadCroppedPfp = async () => {
  if (!cropPreview.value) return
  const response = await fetch(cropPreview.value)
  const blob = await response.blob()
  const file = new File([blob], `pfp.${pendingFileType.value.includes('jpeg') ? 'jpg' : 'png'}`, {
    type: blob.type || 'image/png'
  })
  const res = await MarketplaceService.uploadProfilePicture(file)
  profileImagePath.value = res.profileImagePath
  window.dispatchEvent(new CustomEvent('lootnet:profile-image-updated', {
    detail: { profileImagePath: res.profileImagePath }
  }))
  cropSource.value = ''
  cropPreview.value = ''
}

const handlePfpUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    await prepareCrop(file)
    await renderCropPreview()
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to upload profile image.'
  } finally {
    target.value = ''
  }
}

const loadListings = async () => {
  const query: MyListingsQueryDTO = {
    pageNumber: listingPage.value,
    pageSize: listingPageSize.value,
    search: listingSearch.value || undefined,
    category: listingCategory.value === 'all' ? undefined : listingCategory.value === 'weapon' ? ItemCategory.Weapon : ItemCategory.Armor
  }
  const [res, summary] = await Promise.all([
    MarketplaceService.getMyListings(query),
    MarketplaceService.getMyListingsSummary()
  ])
  listings.value = (res as PagedResultDTO<MyMarketListingDTO>).items ?? []
  listingTotal.value = Number((res as any).totalCount ?? 0)
  listingSummary.value = summary
}

const loadTransactions = async () => {
  const query: MarketTransactionsQueryDTO = {
    pageNumber: txPage.value,
    pageSize: txPageSize.value,
    search: txSearch.value || undefined,
    isSale: txRole.value === 'all' ? undefined : txRole.value === 'sold'
  }
  const [res, summary] = await Promise.all([
    MarketplaceService.getMyTransactions(query),
    MarketplaceService.getMyTransactionsSummary()
  ])
  transactions.value = (res as PagedResultDTO<MarketTransactionDTO>).items ?? []
  txTotal.value = Number((res as any).totalCount ?? 0)
  txSummary.value = summary
}

const loadActiveTab = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (activeTab.value === 'listings') await loadListings()
    else await loadTransactions()
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to load dashboard data.'
  } finally {
    isLoading.value = false
  }
}

const changePrice = async (listingId: string, oldPrice: number) => {
  const raw = window.prompt('New price', String(oldPrice))
  if (!raw) return
  const price = Number(raw)
  if (!Number.isFinite(price) || price <= 0) return
  await MarketplaceService.changeListingPrice(listingId, price)
  await loadListings()
}

const cancelListing = async (listingId: string) => {
  await MarketplaceService.cancelListing(listingId)
  await loadListings()
}

onMounted(() => {
  void loadActiveTab()
  void loadProfile()
})

watch(activeTab, async () => { await loadActiveTab() })

let listDebounce: ReturnType<typeof setTimeout>
watch([listingSearch, listingCategory, listingPageSize], () => {
  clearTimeout(listDebounce)
  listDebounce = setTimeout(async () => {
    listingPage.value = 1
    if (activeTab.value === 'listings') await loadActiveTab()
  }, 300)
})

let txDebounce: ReturnType<typeof setTimeout>
watch([txSearch, txRole, txPageSize], () => {
  clearTimeout(txDebounce)
  txDebounce = setTimeout(async () => {
    txPage.value = 1
    if (activeTab.value === 'transactions') await loadActiveTab()
  }, 300)
})

const listingPages = computed(() => Math.max(1, Math.ceil(listingTotal.value / listingPageSize.value)))
const txPages = computed(() => Math.max(1, Math.ceil(txTotal.value / txPageSize.value)))
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 text-gray-200 flex justify-center items-center">
    <div class="w-full max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Player Dashboard</h1>
        <div class="flex items-center gap-4">
          <div class="inline-flex bg-zinc-800 rounded p-1">
            <button class="px-4 py-2 rounded" :class="activeTab === 'listings' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="activeTab = 'listings'">Listings</button>
            <button class="px-4 py-2 rounded" :class="activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="activeTab = 'transactions'">Transactions</button>
          </div>
          <div class="flex items-center gap-2">
            <img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile image" class="w-10 h-10 rounded-full object-cover border border-zinc-700" />
            <div v-else class="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700"></div>
            <label class="px-3 py-2 text-sm rounded bg-zinc-800 border border-zinc-700 cursor-pointer hover:bg-zinc-700">
              Change PFP
              <input class="hidden" type="file" accept="image/png,image/jpeg,image/webp" @change="handlePfpUpload" />
            </label>
          </div>
        </div>
      </div>

      <section v-if="cropSource" class="bg-zinc-800 border border-zinc-700 rounded p-4 space-y-3">
        <div class="flex items-center gap-2 text-zinc-300">
          <Crop class="w-4 h-4" />
          <span class="text-sm">Crop your profile image before upload</span>
        </div>
        <div class="flex flex-col md:flex-row gap-4">
          <img :src="cropSource" alt="Source" class="w-40 h-40 rounded border border-zinc-700 object-cover" />
          <img v-if="cropPreview" :src="cropPreview" alt="Preview" class="w-40 h-40 rounded border border-zinc-700 object-cover" />
          <div class="flex-1 grid grid-cols-1 gap-2">
            <label class="text-xs text-zinc-400">Zoom</label>
            <input v-model.number="cropScale" min="0.5" max="2.5" step="0.05" type="range" @input="renderCropPreview" />
            <label class="text-xs text-zinc-400">Move Horizontal</label>
            <input v-model.number="cropX" min="-180" max="180" step="2" type="range" @input="renderCropPreview" />
            <label class="text-xs text-zinc-400">Move Vertical</label>
            <input v-model.number="cropY" min="-180" max="180" step="2" type="range" @input="renderCropPreview" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm" @click="uploadCroppedPfp">Save PFP</button>
          <button class="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm" @click="cropSource=''; cropPreview=''">Cancel</button>
        </div>
      </section>

      <div v-if="errorMessage" class="p-3 rounded bg-red-900/40 border border-red-500 text-red-200">{{ errorMessage }}</div>

      <section v-if="activeTab === 'listings'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-zinc-800 border border-zinc-700 rounded p-4">
            <div class="text-zinc-400 text-sm">Total items listed</div>
            <div class="text-2xl font-bold text-white inline-flex items-center gap-2"><ScrollText class="w-5 h-5 text-cyan-400" /> {{ listingSummary.totalItemsListed }}</div>
          </div>
          <div class="bg-zinc-800 border border-zinc-700 rounded p-4">
            <div class="text-zinc-400 text-sm">Total listed value</div>
            <div class="text-2xl font-bold text-yellow-400 inline-flex items-center gap-2"><Coins class="w-5 h-5" /> {{ Number(listingSummary.totalListedValue).toLocaleString() }}</div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input v-model="listingSearch" type="text" placeholder="Search listings..." class="md:col-span-2 px-3 py-2 rounded bg-zinc-800 border border-zinc-700" />
          <select v-model="listingCategory" class="px-3 py-2 rounded bg-zinc-800 border border-zinc-700">
            <option value="all">All categories</option><option value="weapon">Weapons</option><option value="armor">Armors</option>
          </select>
          <select v-model.number="listingPageSize" class="px-3 py-2 rounded bg-zinc-800 border border-zinc-700">
            <option :value="10">10 / page</option><option :value="20">20 / page</option><option :value="40">40 / page</option>
          </select>
        </div>
        <div class="space-y-3 min-h-[140px]">
          <div v-if="isLoading" class="text-zinc-400 animate-pulse">Loading...</div>
          <article v-for="l in listings" :key="l.listingId" class="bg-zinc-800 border border-zinc-700 rounded p-3">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-white font-semibold">{{ l.name }}</h3>
                <p class="text-xs text-zinc-400 mt-1">{{ l.category === 0 ? weaponTypeNames[Number(l.weaponType)] : armorTypeNames[Number(l.armorType)] }} · {{ fmtDate(l.createdAt) }}</p>
              </div>
              <div class="text-yellow-400 font-bold inline-flex items-center gap-1"><Coins class="w-4 h-4" /> {{ Number(l.price).toLocaleString() }}</div>
            </div>
            <div class="mt-2 text-xs text-zinc-300 bg-zinc-900/70 rounded p-2 leading-6">
              <template v-if="l.category === 0">
                <span class="inline-flex items-center gap-1 mr-8"><Sword class="w-3.5 h-3.5 text-red-400" />Cut: {{ round1(l.cut) }}</span>
                <span class="inline-flex items-center gap-1"><Sword class="w-3.5 h-3.5 text-orange-400" />Blunt: {{ round1(l.blunt) }}</span>
              </template>
              <template v-else>
                <span class="inline-flex items-center gap-1 mr-8"><Shield class="w-3.5 h-3.5 text-cyan-400" />Cut Res: {{ round1(l.cutResistance) }}</span>
                <span class="inline-flex items-center gap-1"><Shield class="w-3.5 h-3.5 text-blue-400" />Blunt Res: {{ round1(l.bluntResistance) }}</span>
              </template>
              <div class="mt-1">
                <span class="text-zinc-400 inline-flex items-center gap-1"><Sparkles class="w-3.5 h-3.5" />Elements:</span>
                <span v-if="!l.elements?.length" class="ml-2 text-zinc-500">None</span>
                <span v-for="el in l.elements" :key="`${l.listingId}-${el.type}-${el.value}`" class="ml-3">{{ elementTypeNames[Number(el.type)] }} {{ round1(el.value) }}</span>
              </div>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <button class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs" @click="changePrice(l.listingId, Number(l.price))">Change price</button>
              <button class="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 text-xs" @click="cancelListing(l.listingId)">Cancel listing</button>
            </div>
          </article>
        </div>
        <div class="flex items-center justify-end gap-2">
          <button class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50" :disabled="listingPage<=1" @click="listingPage -= 1; void loadActiveTab()">Prev</button>
          <span class="text-sm text-zinc-300">Page {{ listingPage }} / {{ listingPages }}</span>
          <button class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50" :disabled="listingPage>=listingPages" @click="listingPage += 1; void loadActiveTab()">Next</button>
        </div>
      </section>

      <section v-else class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-zinc-800 border border-zinc-700 rounded p-4"><div class="text-zinc-400 text-sm">Total sold</div><div class="text-2xl font-bold text-green-400">{{ Number(txSummary.totalSold).toLocaleString() }}</div></div>
          <div class="bg-zinc-800 border border-zinc-700 rounded p-4"><div class="text-zinc-400 text-sm">Total bought</div><div class="text-2xl font-bold text-blue-400">{{ Number(txSummary.totalBought).toLocaleString() }}</div></div>
          <div class="bg-zinc-800 border border-zinc-700 rounded p-4"><div class="text-zinc-400 text-sm">Difference</div><div class="text-2xl font-bold text-yellow-400 inline-flex items-center gap-2"><History class="w-5 h-5" />{{ Number(txSummary.difference).toLocaleString() }}</div></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input v-model="txSearch" type="text" placeholder="Search transactions..." class="md:col-span-2 px-3 py-2 rounded bg-zinc-800 border border-zinc-700" />
          <select v-model="txRole" class="px-3 py-2 rounded bg-zinc-800 border border-zinc-700"><option value="all">All</option><option value="sold">Sold</option><option value="bought">Bought</option></select>
          <select v-model.number="txPageSize" class="px-3 py-2 rounded bg-zinc-800 border border-zinc-700"><option :value="10">10 / page</option><option :value="20">20 / page</option><option :value="40">40 / page</option></select>
        </div>
        <div class="space-y-3 min-h-[140px]">
          <div v-if="isLoading" class="text-zinc-400 animate-pulse">Loading...</div>
          <article v-for="t in transactions" :key="t.transactionId" class="bg-zinc-800 border border-zinc-700 rounded p-3">
            <div class="flex items-start justify-between gap-4">
              <div><h3 class="text-white font-semibold">{{ t.itemName }}</h3><p class="text-xs mt-1" :class="t.isSale ? 'text-green-400' : 'text-blue-400'">{{ t.isSale ? 'Sold to ' : 'Bought from ' }}<span v-if="t.counterpartyUsername === 'LootNet Bot'">{{ t.counterpartyUsername }}</span><RouterLink v-else :to="`/users/${t.counterpartyUserId}`" class="underline">{{ t.counterpartyUsername }}</RouterLink></p><p class="text-xs text-zinc-500 mt-1">{{ fmtDate(t.timestamp) }}</p></div>
              <div class="text-right">
                <div class="text-yellow-400 font-bold inline-flex items-center gap-1"><Coins class="w-4 h-4" /> {{ Number(t.price).toLocaleString() }}</div>
                <div v-if="t.isSale" class="text-xs text-zinc-500">Net {{ Number(t.sellerPayout ?? t.price).toLocaleString() }} · Tax {{ Number(t.taxAmount ?? 0).toLocaleString() }}</div>
              </div>
            </div>
          </article>
        </div>
        <div class="flex items-center justify-end gap-2">
          <button class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50" :disabled="txPage<=1" @click="txPage -= 1; void loadActiveTab()">Prev</button>
          <span class="text-sm text-zinc-300">Page {{ txPage }} / {{ txPages }}</span>
          <button class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50" :disabled="txPage>=txPages" @click="txPage += 1; void loadActiveTab()">Next</button>
        </div>
      </section>
    </div>
  </div>
</template>
