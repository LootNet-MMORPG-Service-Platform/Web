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
              placeholder="Search listings..."
              class="px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-green-500 transition-colors w-full sm:w-64"
          />
        </div>
      </header>

      <div v-if="showSellForm" class="mb-6 p-4 bg-zinc-800 border border-zinc-700 rounded-lg animate-fade-in">
        <h3 class="text-lg font-bold text-white mb-3">List an Item from your Inventory</h3>

        <div v-if="inventory.length === 0" class="text-yellow-500 text-sm mb-3 bg-zinc-900 p-3 rounded border border-zinc-700">
          Your inventory is empty. Go play the game to find loot before selling!
        </div>

        <div v-else class="flex flex-col sm:flex-row gap-3">
          <select
              v-model="sellForm.itemId"
              class="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none"
          >
            <option value="" disabled>Select item to sell...</option>
            <option v-for="invItem in inventory" :key="invItem.id" :value="invItem.id">
              {{ invItem.name || 'Unknown Item' }}
            </option>
          </select>

          <div class="relative w-full sm:w-48">
            <span class="absolute left-3 top-2 text-gray-400">🪙</span>
            <input
                v-model="sellForm.price"
                type="number"
                placeholder="Price"
                min="1"
                class="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded focus:border-blue-500 outline-none"
            />
          </div>

          <button
              @click="handleSell"
              class="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors"
          >
            Confirm Sale
          </button>
        </div>
      </div>

      <main class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative min-h-[200px]">

        <div v-if="isLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 rounded backdrop-blur-sm">
          <div class="text-white font-bold text-xl animate-pulse">Loading Market Data...</div>
        </div>

        <div
            v-for="item in filteredItems"
            :key="item.id"
            class="bg-zinc-800 border border-zinc-700 rounded-md p-4 flex flex-col gap-3 hover:-translate-y-1 hover:border-zinc-500 transition-all duration-200 shadow-sm border-l-4 border-l-zinc-500"
        >
          <div class="flex flex-col">
            <h3 class="text-lg font-semibold text-white m-0 truncate" :title="item.name">{{ item.name || 'Unknown Item' }}</h3>
            <span class="text-xs uppercase tracking-wider opacity-80 text-gray-400 mt-1">
              Category: {{ getCategoryName(item.category) }}
            </span>
            <p class="text-sm text-gray-400 mt-1 mb-0 truncate" :title="item.seller">Sold by: {{ item.seller || 'Anonymous' }}</p>
          </div>

          <div class="text-xl font-bold text-yellow-400 flex items-center gap-1 mt-auto">
            <span>🪙</span>
            {{ item.price.toLocaleString() }}
          </div>

          <button
              @click="handleBuy(item.id)"
              class="bg-blue-600 hover:bg-blue-500 w-full py-2 mt-2 text-white font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            Buy Item
          </button>
        </div>

        <div v-if="!isLoading && filteredItems.length === 0" class="col-span-full text-center p-10 text-gray-500 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
          No items found matching your criteria.
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  marketItems,
  buyItem,
  sellItem,
  isLoading,
  fetchMarketItems,
  inventory,
  fetchInventory,
  fetchPlayerData,
  ItemCategory
} from '../store';

// --- Local State ---
const searchQuery = ref('');
const showSellForm = ref(false);

const sellForm = ref({
  itemId: '',
  price: 100
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  // Fetch everything needed when the panel loads
  await Promise.all([
    fetchMarketItems(),
    fetchInventory(),
    fetchPlayerData()
  ]);
});

// --- Actions ---
const handleSell = async () => {
  if (!sellForm.value.itemId) return alert("Please select an item from your inventory.");
  if (sellForm.value.price <= 0) return alert("Price must be greater than 0.");

  await sellItem(sellForm.value.itemId, sellForm.value.price);

  // Reset form and hide
  sellForm.value = { itemId: '', price: 100 };
  showSellForm.value = false;
};

const handleBuy = async (listingId: string) => {
  await buyItem(listingId);
};

// --- Helpers ---
const getCategoryName = (categoryValue: number) => {
  // Converts backend enum int (0, 1) to readable string
  return ItemCategory[categoryValue] || 'Unknown';
};

// --- Computed ---
const filteredItems = computed(() => {
  if (!marketItems.value) return [];

  return marketItems.value.filter(item => {
    const itemName = item.name || '';
    return itemName.toLowerCase().includes(searchQuery.value.toLowerCase());
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