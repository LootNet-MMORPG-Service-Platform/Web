<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Coins, MessageCircle, Shield, Sparkles, Sword } from 'lucide-vue-next'
import { MarketplaceService } from '../services/marketplaceService'
import { ItemCategory } from '../types/marketplace'
import type { MyMarketListingDTO, PagedResultDTO } from '../types/marketplace'

const route = useRoute()
const router = useRouter()
const userId = String(route.params.userId || '')
const username = ref('')
const profileImagePath = ref('')
const listings = ref<MyMarketListingDTO[]>([])
const totalCount = ref(0)

const armorTypeNames = ['Helmet', 'Chestplate', 'Gauntlets', 'Greaves', 'Sabatons']
const weaponTypeNames = ['TwoHandSword', 'Sword', 'Shortsword', 'Polearm', 'Crossbow', 'Bow']
const elementTypeNames = ['Fire', 'Water', 'Earth', 'Air']
const round1 = (v: unknown) => Number(Number(v ?? 0).toFixed(1))

const load = async () => {
  const [u, l] = await Promise.all([
    MarketplaceService.getUserProfile(userId),
    MarketplaceService.getUserListings(userId, { pageNumber: 1, pageSize: 100 })
  ])
  username.value = u.username
  profileImagePath.value = String(u.profileImagePath || '')
  const paged = l as PagedResultDTO<MyMarketListingDTO>
  listings.value = paged.items ?? []
  totalCount.value = Number(paged.totalCount ?? 0)
}

const startPrivateChat = async () => {
  await router.push({ path: '/chat', query: { userId } })
}

onMounted(() => { void load() })
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 text-gray-200">
    <div class="max-w-6xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img v-if="profileImagePath" :src="profileImagePath" class="w-12 h-12 rounded-full object-cover border border-zinc-700" />
          <div v-else class="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700"></div>
          <div>
            <h1 class="text-2xl font-bold text-white">{{ username }}</h1>
            <p class="text-sm text-zinc-400">Active listings: {{ totalCount }}</p>
          </div>
        </div>
        <button class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 inline-flex items-center gap-2" @click="startPrivateChat"><MessageCircle class="w-4 h-4" />Private chat</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <article v-for="l in listings" :key="l.listingId" class="bg-zinc-800 border border-zinc-700 rounded p-3 space-y-2">
          <h3 class="text-white font-semibold">{{ l.name }}</h3>
          <p class="text-xs text-zinc-400">{{ l.category===ItemCategory.Weapon ? weaponTypeNames[Number(l.weaponType)] : armorTypeNames[Number(l.armorType)] }}</p>
          <div class="text-xs text-zinc-300 bg-zinc-900/70 rounded p-2 leading-6">
            <template v-if="l.category===ItemCategory.Weapon">
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
          <div class="text-yellow-400 font-bold inline-flex items-center gap-1"><Coins class="w-4 h-4" />{{ Number(l.price).toLocaleString() }}</div>
        </article>
      </div>
    </div>
  </div>
</template>
