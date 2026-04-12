<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-6xl p-6 text-gray-200 bg-zinc-900 rounded-lg shadow-2xl">

      <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-zinc-800 gap-4">
        <h2 class="text-2xl font-bold m-0 text-white">Global Trade Market</h2>

        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <button
              @click="showSellForm = !showSellForm"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors w-full sm:w-auto"
          >
            {{ showSellForm ? 'Cancel Selling' : '+ Sell Item' }}
          </button>

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

      <div v-if="showSellForm" class="mb-6 p-4 bg-zinc-800 border border-zinc-700 rounded-lg animate-fade-in">
        <h3 class="text-lg font-bold text-white mb-3">List an Item for Sale</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <input v-model="sellForm.name" type="text" placeholder="Item Name" class="px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none" />

          <select v-model="sellForm.category" class="px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none">
            <option value="Weapons">Weapons</option>
            <option value="Armor">Armor</option>
            <option value="Consumables">Consumables</option>
            <option value="Materials">Materials</option>
          </select>

          <select v-model="sellForm.rarity" class="px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none">
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
          </select>

          <input v-model="sellForm.price" type="number" placeholder="Price" min="1" class="px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none" />
          <input v-model="sellForm.quantity" type="number" placeholder="Qty" min="1" class="px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none" />
        </div>
        <button @click="handleSell" class="mt-4 w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors">
          Confirm Sale
        </button>
      </div>

      <main class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
            v-for="item in filteredItems"
            :key="item.id"
            class="bg-zinc-800 border border-zinc-700 rounded-md p-4 flex flex-col gap-3 hover:-translate-y-1 hover:border-zinc-500 transition-all duration-200 border-l-4 shadow-sm"
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

          <button
              @click="buyItem(item)"
              :disabled="item.seller === 'You'"
              :class="item.seller === 'You' ? 'bg-zinc-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'"
              class="w-full py-2 mt-2 text-white font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
          >
            {{ item.seller === 'You' ? 'Your Item' : 'Buy' }}
          </button>
        </div>

        <div v-if="filteredItems.length === 0" class="col-span-full text-center p-10 text-gray-500 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
          No items found matching your criteria.
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { marketItems, buyItem, sellItem, type Category, type Rarity } from '../store'; // Adjust path if needed

// --- State ---
const searchQuery = ref('');
const selectedCategory = ref<Category>('All');
const showSellForm = ref(false);

const sellForm = ref({
  name: '',
  category: 'Weapons' as Exclude<Category, 'All'>,
  rarity: 'Common' as Rarity,
  price: 100,
  quantity: 1
});

// --- Actions ---
const handleSell = () => {
  if (!sellForm.value.name) return alert("Please enter an item name.");
  if (sellForm.value.price <= 0 || sellForm.value.quantity <= 0) return alert("Price and quantity must be greater than 0.");

  sellItem({ ...sellForm.value });

  // Reset form
  sellForm.value = { name: '', category: 'Weapons', rarity: 'Common', price: 100, quantity: 1 };
  showSellForm.value = false;
};

// --- Helpers for Tailwind ---
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

// --- Computed ---
const filteredItems = computed(() => {
  return marketItems.value.filter(item => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>