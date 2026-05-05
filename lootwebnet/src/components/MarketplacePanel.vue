<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-6xl p-6 text-gray-200 bg-zinc-900 rounded-lg shadow-2xl">

      <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-zinc-800 gap-4">
        <h2 class="text-2xl font-bold m-0 text-white">Global Trade Market</h2>

        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <div class="flex bg-zinc-800 rounded p-1">
            <button
                @click="activeCategory = 'weapons'"
                :class="['px-4 py-1 rounded transition-colors', activeCategory === 'weapons' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white']"
            >
              Weapons
            </button>
            <button
                @click="activeCategory = 'armors'"
                :class="['px-4 py-1 rounded transition-colors', activeCategory === 'armors' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white']"
            >
              Armor
            </button>
          </div>

          <button
              @click="showSellForm = !showSellForm"
              class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors w-full sm:w-auto"
          >
            {{ showSellForm ? 'Cancel Selling' : '+ Sell Item' }}
          </button>

          <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Search listings..."
              class="px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
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
            <option v-for="invItem in inventory" :key="invItem.id || (invItem as any).Id" :value="invItem.id || (invItem as any).Id">
              {{ invItem.name || (invItem as any).Name || 'Unknown Item' }}
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
            v-for="item in currentItems"
            :key="item.listingId || (item as any).ListingId"
            class="bg-zinc-800 border border-zinc-700 rounded-md p-4 flex flex-col gap-3 hover:-translate-y-1 hover:border-zinc-500 transition-all duration-200 shadow-sm border-l-4 border-l-zinc-500"
        >
          <div class="flex flex-col">
            <h3 class="text-lg font-semibold text-white m-0 truncate" :title="item.name || (item as any).Name">
              {{ item.name || (item as any).Name || 'Unknown Item' }}
            </h3>

            <div class="flex gap-2 mt-2 text-xs text-gray-400 bg-zinc-900 p-2 rounded">
              <span v-if="activeCategory === 'weapons'">
                ⚔️ Cut: {{ (item as any).cut ?? (item as any).Cut ?? 0 }} | 🔨 Blunt: {{ (item as any).blunt ?? (item as any).Blunt ?? 0 }}
              </span>
              <span v-if="activeCategory === 'armors'">
                🛡️ Cut Res: {{ (item as any).cutResistance ?? (item as any).CutResistance ?? 0 }} | Blunt Res: {{ (item as any).bluntResistance ?? (item as any).BluntResistance ?? 0 }}
              </span>
            </div>
          </div>

          <div class="text-xl font-bold text-yellow-400 flex items-center gap-1 mt-auto">
            <span>🪙</span>
            {{ ((item as any).price ?? (item as any).Price ?? 0).toLocaleString() }}
          </div>

          <button
              @click="handleBuy(item.listingId || (item as any).ListingId)"
              class="bg-blue-600 hover:bg-blue-500 w-full py-2 mt-2 text-white font-bold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            Buy Item
          </button>
        </div>

        <div v-if="!isLoading && currentItems.length === 0" class="col-span-full text-center p-10 text-gray-500 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
          No items found matching your criteria.
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  buyItem,
  sellItem,
  isLoading,
  inventory,
  fetchInventory,
  fetchPlayerData,
  weapons,
  armors,
  fetchWeapons,
  fetchArmors
} from '../store';

// --- Local State ---
const activeCategory = ref<'weapons' | 'armors'>('weapons');
const searchQuery = ref('');
const showSellForm = ref(false);

const sellForm = ref({
  itemId: '',
  price: 100
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  await Promise.all([
    fetchWeapons({ pageNumber: 1, pageSize: 20 }),
    fetchInventory(),
    fetchPlayerData()
  ]);
});

watch(activeCategory, async (newCat) => {
  if (newCat === 'weapons' && weapons.value.length === 0) {
    await fetchWeapons({ pageNumber: 1, pageSize: 20 });
  } else if (newCat === 'armors' && armors.value.length === 0) {
    await fetchArmors({ pageNumber: 1, pageSize: 20 });
  }
});

// --- Actions ---
const handleSell = async () => {
  if (!sellForm.value.itemId) return alert("Please select an item from your inventory.");
  if (sellForm.value.price <= 0) return alert("Price must be greater than 0.");

  await sellItem({ itemId: sellForm.value.itemId, price: sellForm.value.price });

  sellForm.value = { itemId: '', price: 100 };
  showSellForm.value = false;

  if(activeCategory.value === 'weapons') {
    await fetchWeapons({ pageNumber: 1, pageSize: 20, search: searchQuery.value });
  } else {
    await fetchArmors({ pageNumber: 1, pageSize: 20, search: searchQuery.value });
  }
};

const handleBuy = async (listingId: string) => {
  await buyItem(listingId, activeCategory.value);
};

let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (activeCategory.value === 'weapons') {
      fetchWeapons({ pageNumber: 1, pageSize: 20, search: searchQuery.value });
    } else {
      fetchArmors({ pageNumber: 1, pageSize: 20, search: searchQuery.value });
    }
  }, 500);
};

// --- Computed ---
const currentItems = computed(() => {
  return activeCategory.value === 'weapons' ? weapons.value : armors.value;
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