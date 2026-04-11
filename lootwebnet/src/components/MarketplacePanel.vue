<template>
  <div class="max-w-6xl mx-auto p-5 font-sans text-gray-200 bg-zinc-900 rounded-lg">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-zinc-800 gap-4">
      <h2 class="text-2xl font-bold m-0 text-white">Global Trade Market</h2>

      <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Search items..."
            class="px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors w-full sm:w-64"
        />

        <select
            v-model="selectedCategory"
            class="px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors w-full sm:w-auto"
        >
          <option value="All">All Categories</option>
          <option value="Weapons">Weapons</option>
          <option value="Armor">Armor</option>
          <option value="Consumables">Consumables</option>
          <option value="Materials">Materials</option>
        </select>
      </div>
    </header>

    <main class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-zinc-800 border border-zinc-700 rounded-md p-4 flex flex-col gap-3 hover:-translate-y-1 hover:border-zinc-500 transition-all duration-200 border-l-4"
          :class="rarityBorderClass(item.rarity)"
      >
        <div class="h-16 bg-zinc-900 rounded flex items-center justify-center font-bold text-gray-500">
          <span>{{ item.quantity }}x</span>
        </div>

        <div class="flex flex-col">
          <h3 class="text-lg font-semibold text-white m-0">{{ item.name }}</h3>
          <span class="text-xs uppercase tracking-wider opacity-80" :class="rarityTextClass(item.rarity)">
            {{ item.rarity }}
          </span>
          <p class="text-sm text-gray-400 mt-1 mb-0">Sold by: {{ item.seller }}</p>
        </div>

        <div class="text-xl font-bold text-yellow-400 flex items-center gap-1 mt-auto">
          <span>🪙</span>
          {{ item.price.toLocaleString() }}
        </div>

        <button class="w-full py-2 mt-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50">
          Buy
        </button>
      </div>

      <div v-if="filteredItems.length === 0" class="col-span-full text-center p-10 text-gray-500 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
        No items found matching your criteria.
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// --- Types ---
type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
type Category = 'All' | 'Weapons' | 'Armor' | 'Consumables' | 'Materials';

interface MarketItem {
  id: string;
  name: string;
  category: Exclude<Category, 'All'>;
  rarity: Rarity;
  price: number;
  quantity: number;
  seller: string;
}

// --- State ---
const searchQuery = ref('');
const selectedCategory = ref<Category>('All');

// --- Helpers for Tailwind ---
// We explicitly map rarities to exact Tailwind classes so PurgeCSS keeps them
const rarityBorderClass = (rarity: Rarity) => {
  const classes = {
    Common: 'border-l-gray-400',
    Uncommon: 'border-l-green-500',
    Rare: 'border-l-blue-500',
    Epic: 'border-l-purple-500',
    Legendary: 'border-l-orange-500'
  };
  return classes[rarity];
};

const rarityTextClass = (rarity: Rarity) => {
  const classes = {
    Common: 'text-gray-400',
    Uncommon: 'text-green-500',
    Rare: 'text-blue-500',
    Epic: 'text-purple-500',
    Legendary: 'text-orange-500'
  };
  return classes[rarity];
};

// Mock Data
const marketItems = ref<MarketItem[]>([
  { id: '1', name: 'Iron Sword', category: 'Weapons', rarity: 'Common', price: 150, quantity: 1, seller: 'WarriorBob99' },
  { id: '2', name: 'Health Potion (Large)', category: 'Consumables', rarity: 'Uncommon', price: 45, quantity: 20, seller: 'HealerJane' },
  { id: '3', name: 'Dragon Scale Chestplate', category: 'Armor', rarity: 'Epic', price: 15000, quantity: 1, seller: 'LootMaster' },
  { id: '4', name: 'Mithril Ore', category: 'Materials', rarity: 'Rare', price: 800, quantity: 50, seller: 'MinerDan' },
  { id: '5', name: 'Excalibur', category: 'Weapons', rarity: 'Legendary', price: 999999, quantity: 1, seller: 'KingArthur' },
]);

// --- Computed ---
const filteredItems = computed(() => {
  return marketItems.value.filter(item => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});
</script>