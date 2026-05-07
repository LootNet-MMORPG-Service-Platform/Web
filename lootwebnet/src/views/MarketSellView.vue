<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Coins, Shield, Sparkles, Sword } from 'lucide-vue-next'
import { api } from '../services/api'
import { MarketplaceService } from '../services/marketplaceService'

type InvWeapon = { id: string; name: string; weaponType: number; cut: number; blunt: number; elements: Array<{ type: number; value: number }>; category: number }
type InvArmor = { id: string; name: string; armorType: number; cutResistance: number; bluntResistance: number; elements: Array<{ type: number; value: number }>; category: number }
type ItemCollection = { weapons?: InvWeapon[]; armors?: InvArmor[]; Weapons?: InvWeapon[]; Armors?: InvArmor[] }

const isLoading = ref(false)
const errorMessage = ref('')
const selectedId = ref('')
const priceByItem = ref<Record<string, number>>({})
const inventoryCards = ref<Array<any>>([])

const weaponTypeNames = ['TwoHandSword', 'Sword', 'Shortsword', 'Polearm', 'Crossbow', 'Bow']
const armorTypeNames = ['Helmet', 'Chestplate', 'Gauntlets', 'Greaves', 'Sabatons']
const elementTypeNames = ['Fire', 'Water', 'Earth', 'Air']
const round1 = (v: unknown) => Number(Number(v ?? 0).toFixed(1))

const loadInventory = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await api.get<ItemCollection>('/mobile/items')
    const weapons = data.weapons ?? data.Weapons ?? []
    const armors = data.armors ?? data.Armors ?? []
    inventoryCards.value = [
      ...weapons.map(w => ({ ...w, kind: 'weapon' as const })),
      ...armors.map(a => ({ ...a, kind: 'armor' as const }))
    ]
    inventoryCards.value.forEach(x => { if (!priceByItem.value[x.id]) priceByItem.value[x.id] = 100 })
  } catch (e: any) {
    errorMessage.value = e?.message || 'Failed to load inventory.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => { void loadInventory() })

const selectedItem = computed(() => inventoryCards.value.find(x => x.id === selectedId.value))

const createListing = async () => {
  if (!selectedId.value) return
  const price = Number(priceByItem.value[selectedId.value] ?? 0)
  if (!Number.isFinite(price) || price <= 0) return
  await MarketplaceService.createListing({ itemId: selectedId.value, price })
  selectedId.value = ''
  await loadInventory()
}
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 text-gray-200">
    <div class="max-w-7xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 class="text-2xl font-bold text-white">Marketplace · Sell</h1>
        <div class="inline-flex bg-zinc-800 rounded p-1">
          <RouterLink to="/market/buy" class="px-4 py-2 rounded text-zinc-300 hover:text-white">Buy</RouterLink>
          <RouterLink to="/market/sell" class="px-4 py-2 rounded bg-blue-600 text-white">Sell</RouterLink>
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 rounded bg-red-900/40 border border-red-500 text-red-200">{{ errorMessage }}</div>

      <section class="bg-zinc-800 border border-zinc-700 rounded p-4 space-y-3">
        <h2 class="font-semibold text-white">Create listing from your inventory</h2>
        <div v-if="selectedItem" class="text-sm text-zinc-300 inline-flex items-center gap-2">
          <span>Selected:</span>
          <span class="font-semibold text-white">{{ selectedItem.name }}</span>
          <div class="relative">
            <Coins class="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input v-model.number="priceByItem[selectedItem.id]" type="number" min="1" class="w-32 pl-8 pr-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 ml-2" />
          </div>
          <button class="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded font-semibold" @click="createListing">List item</button>
        </div>
      </section>

      <section class="space-y-4">
        <div class="text-sm text-zinc-400">Pick an item card below:</div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[180px] relative">
          <div v-if="isLoading" class="absolute inset-0 bg-zinc-900/80 rounded flex items-center justify-center">Loading...</div>
          <article
            v-for="item in inventoryCards"
            :key="item.id"
            class="bg-zinc-800 border rounded p-4 space-y-3 cursor-pointer transition-colors"
            :class="selectedId===item.id ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-500'"
            @click="selectedId=item.id"
          >
            <div>
              <h3 class="text-white font-semibold">{{ item.name }}</h3>
              <p class="text-xs text-zinc-400 mt-1">{{ item.kind==='weapon' ? weaponTypeNames[Number(item.weaponType)] : armorTypeNames[Number(item.armorType)] }}</p>
            </div>
            <div class="text-xs text-zinc-300 bg-zinc-900/70 rounded p-2 leading-6">
              <template v-if="item.kind==='weapon'">
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
                <span v-for="el in item.elements" :key="`${item.id}-${el.type}-${el.value}`" class="ml-3">{{ elementTypeNames[Number(el.type)] }} {{ round1(el.value) }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
