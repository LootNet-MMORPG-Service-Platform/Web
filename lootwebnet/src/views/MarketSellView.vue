<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CheckCircle2, Coins, Percent, Shield, Sparkles, Sword } from 'lucide-vue-next'
import { MarketplaceService } from '../services/marketplaceService'
import { fetchPlayerData } from '../store'
import { SortDirection, type BotSaleOfferDTO, type MarketEconomyDTO, type MarketSaleTaxDTO, type SellInventoryItemDTO } from '../types/marketplace'

const isLoading = ref(false)
const errorMessage = ref('')
const selectedId = ref('')
const priceByItem = ref<Record<string, number>>({})
const inventoryCards = ref<SellInventoryItemDTO[]>([])
const totalItems = ref(0)

const itemFilter = ref<'all' | 'weapon' | 'armor'>('all')
const search = ref('')
const sortBy = ref<'power' | 'name'>('power')
const sortDir = ref<'asc' | 'desc'>('desc')
const pageNumber = ref(1)
const pageSize = ref(30)

const economy = ref<MarketEconomyDTO | null>(null)
const taxPreview = ref<MarketSaleTaxDTO | null>(null)
const botOffer = ref<BotSaleOfferDTO | null>(null)
const actionMessage = ref('')
const isPreviewLoading = ref(false)
const isActionRunning = ref(false)

const weaponTypeNames = ['TwoHandSword', 'Sword', 'Shortsword', 'Polearm', 'Crossbow', 'Bow']
const armorTypeNames = ['Helmet', 'Chestplate', 'Gauntlets', 'Greaves', 'Sabatons']
const elementTypeNames = ['Fire', 'Water', 'Earth', 'Air']
const round1 = (v: unknown) => Number(Number(v ?? 0).toFixed(1))

const selectedItem = computed(() => inventoryCards.value.find(x => x.id === selectedId.value))
const selectedPrice = computed(() => Number(priceByItem.value[selectedId.value] ?? 0))
const hasNextPage = computed(() => pageNumber.value * pageSize.value < totalItems.value)

const displayBrackets = computed(() => {
  const source = economy.value?.progressiveTaxBrackets ?? []
  const uniq = new Map<string, { from: number; to?: number | null; rate: number }>()
  source.forEach(b => {
    const from = Number(b.from)
    const to = b.to == null ? null : Number(b.to)
    const rate = Number(b.rate)
    const key = `${from.toFixed(2)}|${to == null ? 'null' : to.toFixed(2)}|${rate.toFixed(6)}`
    if (!uniq.has(key)) uniq.set(key, { from, to, rate })
  })
  return Array.from(uniq.values()).sort((a, z) => a.from - z.from)
})

const loadEconomy = async () => {
  try {
    economy.value = await MarketplaceService.getEconomy()
  } catch {
    economy.value = null
  }
}

const loadInventory = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await MarketplaceService.getSellInventory({
      itemType: itemFilter.value,
      search: search.value,
      sortBy: sortBy.value,
      sortDirection: sortDir.value === 'asc' ? SortDirection.Asc : SortDirection.Desc,
      pageNumber: pageNumber.value,
      pageSize: pageSize.value
    })
    const cards = result.items ?? []
    inventoryCards.value = cards
    totalItems.value = Number(result.totalCount ?? cards.length)
    cards.forEach(x => { if (!priceByItem.value[x.id]) priceByItem.value[x.id] = 100 })
    if (selectedId.value && !cards.some(x => x.id === selectedId.value)) selectedId.value = ''
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to load inventory.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadEconomy()
  void loadInventory()
})

const refreshSelectedEconomy = async () => {
  taxPreview.value = null
  botOffer.value = null
  actionMessage.value = ''
  if (!selectedId.value) return

  const price = selectedPrice.value
  const tasks: Promise<void>[] = []
  isPreviewLoading.value = true

  if (Number.isFinite(price) && price > 0) {
    tasks.push(MarketplaceService.getTaxPreview(price).then(x => { taxPreview.value = x }).catch(() => { taxPreview.value = null }))
  }
  tasks.push(MarketplaceService.getBotSaleOffer(selectedId.value).then(x => { botOffer.value = x }).catch(() => { botOffer.value = null }))

  try {
    await Promise.all(tasks)
  } finally {
    isPreviewLoading.value = false
  }
}

const createListing = async () => {
  if (!selectedId.value) return
  const price = Number(priceByItem.value[selectedId.value] ?? 0)
  if (!Number.isFinite(price) || price <= 0) return
  isActionRunning.value = true
  errorMessage.value = ''
  try {
    await MarketplaceService.createListing({ itemId: selectedId.value, price })
    actionMessage.value = 'Item listed. Marketplace tax applies after another player buys it.'
    selectedId.value = ''
    await fetchPlayerData()
    await loadInventory()
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to list item.'
  } finally {
    isActionRunning.value = false
  }
}

const sellToBot = async () => {
  if (!selectedId.value) return
  isActionRunning.value = true
  errorMessage.value = ''
  try {
    const result = await MarketplaceService.sellItemToBot(selectedId.value)
    actionMessage.value = `Sold ${result.itemName} to bot for ${Number(result.paidAmount).toLocaleString()} gold.`
    selectedId.value = ''
    await Promise.all([fetchPlayerData(), loadInventory()])
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to sell item to bot.'
  } finally {
    isActionRunning.value = false
  }
}

let previewDebounce: ReturnType<typeof setTimeout>
watch([selectedId, selectedPrice], () => {
  clearTimeout(previewDebounce)
  previewDebounce = setTimeout(() => { void refreshSelectedEconomy() }, 200)
})

let listDebounce: ReturnType<typeof setTimeout>
watch([itemFilter, sortBy, sortDir, pageSize], () => {
  pageNumber.value = 1
  clearTimeout(listDebounce)
  listDebounce = setTimeout(() => { void loadInventory() }, 120)
})
watch(search, () => {
  pageNumber.value = 1
  clearTimeout(listDebounce)
  listDebounce = setTimeout(() => { void loadInventory() }, 220)
})
watch(pageNumber, () => { void loadInventory() })
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 text-gray-200 flex justify-center items-center">
    <div class="w-full max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 class="text-2xl font-bold text-white">Marketplace - Sell</h1>
        <div class="inline-flex bg-zinc-800 rounded p-1">
          <RouterLink to="/market/buy" class="px-4 py-2 rounded text-zinc-300 hover:text-white">Buy</RouterLink>
          <RouterLink to="/market/sell" class="px-4 py-2 rounded bg-blue-600 text-white">Sell</RouterLink>
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 rounded bg-red-900/40 border border-red-500 text-red-200">{{ errorMessage }}</div>
      <div v-if="actionMessage" class="p-3 rounded bg-green-900/30 border border-green-600 text-green-200 inline-flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4" />{{ actionMessage }}
      </div>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="rounded border border-zinc-700 bg-zinc-800 p-4">
          <div class="text-xs text-zinc-400">Bot sale source</div>
          <div class="mt-1 text-sm text-zinc-200">Instant sale based on item stats.</div>
          <div class="mt-2 text-xs text-zinc-500">{{ economy?.botSaleFormula || 'Economy settings unavailable.' }}</div>
        </div>
        <div class="rounded border border-zinc-700 bg-zinc-800 p-4">
          <div class="text-xs text-zinc-400">Marketplace drain</div>
          <div class="mt-1 text-sm text-zinc-200">Progressive tax removes gold from player-to-player sales.</div>
          <div class="mt-2 flex flex-wrap gap-1">
            <span v-for="bracket in displayBrackets" :key="`${bracket.from}-${bracket.to ?? 'up'}-${bracket.rate}`" class="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
              {{ Number(bracket.from).toLocaleString() }}-{{ bracket.to == null ? 'up' : Number(bracket.to).toLocaleString() }}: {{ Number(bracket.rate * 100).toFixed(0) }}%
            </span>
          </div>
        </div>
      </section>

      <section class="bg-zinc-800 border border-zinc-700 rounded p-4 space-y-3">
        <h2 class="font-semibold text-white">Create listing from your inventory</h2>
        <div v-if="selectedItem" class="text-sm text-zinc-300 inline-flex items-center gap-2">
          <span>Selected:</span>
          <span class="font-semibold text-white">{{ selectedItem.name }}</span>
          <div class="relative">
            <Coins class="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input v-model.number="priceByItem[selectedItem.id]" type="number" min="1" class="w-32 pl-8 pr-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 ml-2" />
          </div>
          <button class="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded font-semibold disabled:opacity-50" :disabled="isActionRunning" @click="createListing">List item</button>
          <button class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded font-semibold disabled:opacity-50" :disabled="isActionRunning" @click="sellToBot">Sell to bot</button>
        </div>
        <div v-if="selectedItem" class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rounded border border-zinc-700 bg-zinc-900 p-3">
            <div class="text-xs text-zinc-400 inline-flex items-center gap-1"><Percent class="w-3.5 h-3.5" />Marketplace tax</div>
            <div v-if="isPreviewLoading" class="mt-1 text-sm text-zinc-500">Calculating...</div>
            <div v-else-if="!taxPreview" class="mt-1 text-sm text-zinc-500">Preview unavailable.</div>
            <div v-else class="mt-1 text-sm text-zinc-200">Seller gets <span class="font-semibold text-green-400">{{ Number(taxPreview?.sellerPayout ?? 0).toLocaleString() }}</span></div>
            <div v-if="taxPreview" class="text-xs text-zinc-500">Tax {{ Number(taxPreview?.taxAmount ?? 0).toLocaleString() }} - {{ Number((taxPreview?.effectiveTaxRate ?? 0) * 100).toFixed(2) }}%</div>
          </div>
          <div class="rounded border border-zinc-700 bg-zinc-900 p-3">
            <div class="text-xs text-zinc-400 inline-flex items-center gap-1"><Coins class="w-3.5 h-3.5" />Bot offer</div>
            <div class="mt-1 text-lg font-bold text-yellow-400">{{ Number(botOffer?.sellerPayout ?? botOffer?.offeredPrice ?? 0).toLocaleString() }}</div>
            <div class="text-xs text-zinc-500">Gross {{ Number(botOffer?.offeredPrice ?? 0).toLocaleString() }} - Tax {{ Number(botOffer?.taxAmount ?? 0).toLocaleString() }}</div>
            <div class="text-xs text-zinc-500">Stat score {{ Number(botOffer?.statScore ?? 0).toFixed(1) }}</div>
          </div>
          <div class="rounded border border-zinc-700 bg-zinc-900 p-3">
            <div class="text-xs text-zinc-400">Gold flow</div>
            <div class="mt-1 text-sm text-zinc-200">Bot creates gold immediately; market listings wait for a buyer.</div>
            <div v-if="economy" class="text-xs text-zinc-500">P2P tax {{ economy.isPlayerToPlayerTaxEnabled ? 'enabled' : 'disabled' }} - Bot tax {{ economy.isPlayerToBotTaxEnabled ? 'enabled' : 'disabled' }}</div>
            <div v-else class="text-xs text-zinc-500">Economy settings unavailable.</div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <div class="inline-flex rounded border border-zinc-700 bg-zinc-800 p-1 text-xs">
            <button class="px-2 py-1 rounded" :class="itemFilter==='all' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="itemFilter='all'">All</button>
            <button class="px-2 py-1 rounded" :class="itemFilter==='weapon' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="itemFilter='weapon'">Weapons</button>
            <button class="px-2 py-1 rounded" :class="itemFilter==='armor' ? 'bg-blue-600 text-white' : 'text-zinc-300'" @click="itemFilter='armor'">Armors</button>
          </div>
          <div class="flex gap-2">
            <input v-model="search" type="text" placeholder="Search name..." class="w-44 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-sm" />
            <select v-model="sortBy" class="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-sm">
              <option value="power">Power</option>
              <option value="name">Name</option>
            </select>
            <select v-model="sortDir" class="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-sm">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[180px] relative">
          <div v-if="isLoading" class="absolute inset-0 bg-zinc-900/80 rounded flex items-center justify-center">Loading...</div>
          <article
            v-for="item in inventoryCards"
            :key="item.id"
            class="bg-zinc-800 border rounded p-4 space-y-3 cursor-pointer transition-colors"
            :class="selectedId===item.id ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-500'"
            @click="selectedId=item.id"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-white font-semibold">{{ item.name }}</h3>
                <p class="text-xs text-zinc-400 mt-1">{{ item.itemKind==='weapon' ? weaponTypeNames[Number(item.weaponType)] : armorTypeNames[Number(item.armorType)] }}</p>
              </div>
              <div class="text-xs text-zinc-500">{{ round1(item.powerScore) }} power</div>
            </div>
            <div class="text-xs text-zinc-300 bg-zinc-900/70 rounded p-2 leading-6">
              <template v-if="item.itemKind==='weapon'">
                <span class="inline-flex items-center gap-1 mr-8"><Sword class="w-3.5 h-3.5 text-red-400" />Cut: {{ round1(item.cut) }}</span>
                <span class="inline-flex items-center gap-1"><Sword class="w-3.5 h-3.5 text-orange-400" />Blunt: {{ round1(item.blunt) }}</span>
              </template>
              <template v-else>
                <span class="inline-flex items-center gap-1 mr-8"><Shield class="w-3.5 h-3.5 text-cyan-400" />Cut Res: {{ round1(item.cutResistance) }}</span>
                <span class="inline-flex items-center gap-1"><Shield class="w-3.5 h-3.5 text-blue-400" />Blunt Res: {{ round1(item.bluntResistance) }}</span>
              </template>
              <div class="mt-1">
                <span class="text-zinc-400 inline-flex items-center gap-1"><Sparkles class="w-3.5 h-3.5" />Elements:</span>
                <span v-if="!item.elements?.length" class="ml-2 text-zinc-500">None</span>
                <span v-for="el in item.elements.slice(0,2)" :key="`${item.id}-${el.type}-${el.value}`" class="ml-3">{{ elementTypeNames[Number(el.type)] }} {{ round1(el.value) }}</span>
                <span v-if="item.elements?.length > 2" class="ml-2 text-zinc-500">+{{ item.elements.length - 2 }}</span>
              </div>
            </div>
          </article>
          <div v-if="!inventoryCards.length && !isLoading" class="col-span-full text-center text-zinc-500 py-10">No items for current filters.</div>
        </div>
        <div class="flex items-center justify-between text-xs text-zinc-400">
          <div>Total {{ totalItems }}</div>
          <div class="inline-flex gap-2">
            <button class="px-2 py-1 rounded border border-zinc-700 disabled:opacity-50" :disabled="pageNumber<=1 || isLoading" @click="pageNumber--">Prev</button>
            <span>Page {{ pageNumber }}</span>
            <button class="px-2 py-1 rounded border border-zinc-700 disabled:opacity-50" :disabled="!hasNextPage || isLoading" @click="pageNumber++">Next</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
