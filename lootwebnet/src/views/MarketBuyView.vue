<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Coins, Shield, Sparkles, Sword } from 'lucide-vue-next'
import { MarketplaceService } from '../services/marketplaceService'
import { toAssetUrl } from '../services/urls'
import type { ArmorMarketDTO, ArmorQueryDTO, PagedResultDTO, WeaponMarketDTO, WeaponQueryDTO } from '../types/marketplace'
import { ArmorSortColumns, ItemElementType, SortDirection, WeaponSortColumns } from '../types/marketplace'
import { buyItem, fetchPlayerData } from '../store'
import { onRealtimeEvent } from '../services/realtimeService'

const tab = ref<'weapons' | 'armors'>('weapons')
const search = ref('')
const page = ref(1)
const pageSize = ref(12)
const isLoading = ref(false)
const errorMessage = ref('')
const totalCount = ref(0)
const weapons = ref<WeaponMarketDTO[]>([])
const armors = ref<ArmorMarketDTO[]>([])
let offRealtime: (() => void) | null = null

const sortDirection = ref(SortDirection.Asc)
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const minCut = ref<number | null>(null)
const maxCut = ref<number | null>(null)
const minBlunt = ref<number | null>(null)
const maxBlunt = ref<number | null>(null)
const selectedElements = ref<ItemElementType[]>([])
const selectedWeaponTypes = ref<number[]>([])
const selectedArmorTypes = ref<number[]>([])

const toNullableNumber = (v: unknown): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const fetchData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    if (tab.value === 'weapons') {
      const query: WeaponQueryDTO = {
        pageNumber: page.value,
        pageSize: pageSize.value,
        search: search.value,
        sortColumn: WeaponSortColumns.Price,
        sortDirection: sortDirection.value,
        price: { min: toNullableNumber(minPrice.value), max: toNullableNumber(maxPrice.value), isValid: true },
        cut: { min: toNullableNumber(minCut.value), max: toNullableNumber(maxCut.value), isValid: true },
        blunt: { min: toNullableNumber(minBlunt.value), max: toNullableNumber(maxBlunt.value), isValid: true },
        types: selectedWeaponTypes.value.length ? selectedWeaponTypes.value as any : undefined,
        elements: selectedElements.value.length ? selectedElements.value : undefined
      }
      const res: PagedResultDTO<WeaponMarketDTO> = await MarketplaceService.getWeapons(query)
      weapons.value = res.items ?? []
      totalCount.value = Number(res.totalCount ?? 0)
    } else {
      const query: ArmorQueryDTO = {
        pageNumber: page.value,
        pageSize: pageSize.value,
        search: search.value,
        sortColumn: ArmorSortColumns.Price,
        sortDirection: sortDirection.value,
        price: { min: toNullableNumber(minPrice.value), max: toNullableNumber(maxPrice.value), isValid: true },
        cutResistance: { min: toNullableNumber(minCut.value), max: toNullableNumber(maxCut.value), isValid: true },
        bluntResistance: { min: toNullableNumber(minBlunt.value), max: toNullableNumber(maxBlunt.value), isValid: true },
        types: selectedArmorTypes.value.length ? selectedArmorTypes.value as any : undefined,
        elements: selectedElements.value.length ? selectedElements.value : undefined
      }
      const res: PagedResultDTO<ArmorMarketDTO> = await MarketplaceService.getArmors(query)
      armors.value = res.items ?? []
      totalCount.value = Number(res.totalCount ?? 0)
    }
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to load market.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void fetchData()
  offRealtime = onRealtimeEvent((payload: any) => {
    if (payload?.domain === 'market') {
      void fetchData()
    }
  })
})

onUnmounted(() => {
  offRealtime?.()
})

watch([tab, pageSize, sortDirection], () => {
  page.value = 1
  void fetchData()
})

let searchDebounce: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    void fetchData()
  }, 350)
})

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const items = computed(() => (tab.value === 'weapons' ? weapons.value : armors.value))

const prevPage = async () => {
  if (page.value <= 1) return
  page.value -= 1
  await fetchData()
}

const nextPage = async () => {
  if (page.value >= totalPages.value) return
  page.value += 1
  await fetchData()
}

const handleBuy = async (listingId: string) => {
  await buyItem(listingId, tab.value)
  await fetchPlayerData()
  await fetchData()
}

const weaponTypeNames = ['TwoHandSword', 'Sword', 'Shortsword', 'Polearm', 'Crossbow', 'Bow']
const armorTypeNames = ['Helmet', 'Chestplate', 'Gauntlets', 'Greaves', 'Sabatons']
const elementTypeNames = ['Fire', 'Water', 'Earth', 'Air']
const round1 = (v: unknown) => Number(Number(v ?? 0).toFixed(1))
const elementLabel = (x: unknown) => elementTypeNames[Number(x)] ?? 'Unknown'

const toggleElement = (el: ItemElementType) => {
  if (selectedElements.value.includes(el)) {
    selectedElements.value = selectedElements.value.filter(x => x !== el)
  } else {
    selectedElements.value = [...selectedElements.value, el]
  }
  page.value = 1
  void fetchData()
}

const toggleWeaponType = (idx: number) => {
  selectedWeaponTypes.value = selectedWeaponTypes.value.includes(idx) ? selectedWeaponTypes.value.filter(x => x !== idx) : [...selectedWeaponTypes.value, idx]
  page.value = 1
  void fetchData()
}

const toggleArmorType = (idx: number) => {
  selectedArmorTypes.value = selectedArmorTypes.value.includes(idx) ? selectedArmorTypes.value.filter(x => x !== idx) : [...selectedArmorTypes.value, idx]
  page.value = 1
  void fetchData()
}
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 text-gray-200 flex justify-center items-center">
    <div class="w-full max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 class="text-2xl font-bold text-white">Marketplace · Buy</h1>
        <div class="inline-flex bg-zinc-800 rounded p-1">
          <RouterLink to="/market/buy" class="px-4 py-2 rounded bg-blue-600 text-white">Buy</RouterLink>
          <RouterLink to="/market/sell" class="px-4 py-2 rounded text-zinc-300 hover:text-white">Sell</RouterLink>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 wyszukiwarka-panel">
        <div class="md:col-span-2">
          <input v-model="search" type="text" placeholder="Search items..." class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" />
        </div>
        <div>
          <select v-model="tab" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700">
            <option value="weapons">Weapons</option>
            <option value="armors">Armors</option>
          </select>
        </div>
        <div>
          <select v-model.number="pageSize" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700">
            <option :value="12">12 / page</option>
            <option :value="24">24 / page</option>
            <option :value="48">48 / page</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-6 gap-3 liczbowe-panel">
        <input v-model.number="minPrice" type="number" placeholder="Min price" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" @change="page=1; fetchData()" />
        <input v-model.number="maxPrice" type="number" placeholder="Max price" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" @change="page=1; fetchData()" />
        <input v-model.number="minCut" type="number" placeholder="Min cut/res" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" @change="page=1; fetchData()" />
        <input v-model.number="maxCut" type="number" placeholder="Max cut/res" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" @change="page=1; fetchData()" />
        <input v-model.number="minBlunt" type="number" placeholder="Min blunt/res" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" @change="page=1; fetchData()" />
        <input v-model.number="maxBlunt" type="number" placeholder="Max blunt/res" class="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700" @change="page=1; fetchData()" />
      </div>

      <div class="flex flex-wrap items-center gap-2 tagi-panel">
        <button class="px-3 py-1.5 rounded border" :class="sortDirection===SortDirection.Asc?'bg-zinc-700 border-zinc-600':'bg-zinc-800 border-zinc-700'" @click="sortDirection=SortDirection.Asc">Price Asc</button>
        <button class="px-3 py-1.5 rounded border" :class="sortDirection===SortDirection.Desc?'bg-zinc-700 border-zinc-600':'bg-zinc-800 border-zinc-700'" @click="sortDirection=SortDirection.Desc">Price Desc</button>

        <button v-for="(name, idx) in elementTypeNames" :key="name" class="px-3 py-1.5 rounded border"
                :class="selectedElements.includes(idx as ItemElementType)?'bg-blue-700 border-blue-600':'bg-zinc-800 border-zinc-700'"
                @click="toggleElement(idx as ItemElementType)">
          {{ name }}
        </button>

        <template v-if="tab==='weapons'">
          <button v-for="(name, idx) in weaponTypeNames" :key="`wt-${name}`" class="px-3 py-1.5 rounded border"
                  :class="selectedWeaponTypes.includes(idx)?'bg-emerald-700 border-emerald-600':'bg-zinc-800 border-zinc-700'"
                  @click="toggleWeaponType(idx)">
            {{ name }}
          </button>
        </template>
        <template v-else>
          <button v-for="(name, idx) in armorTypeNames" :key="`at-${name}`" class="px-3 py-1.5 rounded border"
                  :class="selectedArmorTypes.includes(idx)?'bg-emerald-700 border-emerald-600':'bg-zinc-800 border-zinc-700'"
                  @click="toggleArmorType(idx)">
            {{ name }}
          </button>
        </template>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 rounded bg-red-900/40 border border-red-500 text-red-200">{{ errorMessage }}</div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[200px] relative">
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded z-10">Loading...</div>

        <article v-for="item in items" :key="item.listingId" class="bg-zinc-800 border border-zinc-700 rounded p-4 space-y-3">
          <div class="space-y-1">
            <h3 class="text-white font-semibold">{{ item.name }}</h3>
            <p class="text-xs text-zinc-400">
              {{ tab === 'weapons' ? weaponTypeNames[Number((item as any).weaponType)] : armorTypeNames[Number((item as any).armorType)] }}
            </p>
            <div class="text-xs text-zinc-400 inline-flex items-center gap-2">
              <img v-if="(item as any).sellerProfileImagePath" :src="toAssetUrl((item as any).sellerProfileImagePath)" class="w-5 h-5 rounded-full object-cover border border-zinc-600" />
              <RouterLink :to="`/users/${(item as any).sellerId || ''}`" class="hover:text-blue-300">Seller: {{ (item as any).sellerUsername || 'Unknown' }}</RouterLink>
            </div>
          </div>

          <div class="text-xs text-zinc-300 bg-zinc-900/70 rounded p-2 leading-6">
            <template v-if="tab === 'weapons'">
              <span class="inline-flex items-center gap-1 mr-8"><Sword class="w-3.5 h-3.5 text-red-400" />Cut: {{ round1((item as any).cut) }}</span>
              <span class="inline-flex items-center gap-1"><Sword class="w-3.5 h-3.5 text-orange-400" />Blunt: {{ round1((item as any).blunt) }}</span>
            </template>
            <template v-else>
              <span class="inline-flex items-center gap-1 mr-8"><Shield class="w-3.5 h-3.5 text-cyan-400" />Cut Res: {{ round1((item as any).cutResistance) }}</span>
              <span class="inline-flex items-center gap-1"><Shield class="w-3.5 h-3.5 text-blue-400" />Blunt Res: {{ round1((item as any).bluntResistance) }}</span>
            </template>
            <div class="mt-1">
              <span class="text-zinc-400 inline-flex items-center gap-1"><Sparkles class="w-3.5 h-3.5" />Elements:</span>
              <span v-if="!item.elements?.length" class="ml-2 text-zinc-500">None</span>
              <span v-for="el in item.elements" :key="`${el.type}-${el.value}`" class="ml-3">{{ elementLabel(el.type) }} {{ round1(el.value) }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="inline-flex items-center gap-1 text-yellow-400 font-bold"><Coins class="w-4 h-4" /> {{ Number(item.price).toLocaleString() }}</div>
            <button class="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold" @click="handleBuy(item.listingId)">Buy</button>
          </div>
        </article>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <div class="text-sm text-zinc-400">Total: {{ totalCount }}</div>
        <div class="inline-flex items-center gap-2">
          <button class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50" :disabled="page <= 1" @click="prevPage">Prev</button>
          <span class="text-sm text-zinc-300">Page {{ page }} / {{ totalPages }}</span>
          <button class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 disabled:opacity-50" :disabled="page >= totalPages" @click="nextPage">Next</button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>

.wyszukiwarka-panel,
.liczbowe-panel {
  margin-bottom: 28px !important;
}

.tagi-panel {
  margin-bottom: 32px !important;
}
</style>
