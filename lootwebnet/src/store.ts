// src/store.ts
import { ref } from 'vue';
import { api } from './components/api'; // Make sure you created this file from Step 1!

// --- Types & Enums ---
// Aligned with backend Enum: 0 = Weapons, 1 = Armor, etc. (Expand as needed)
export enum ItemCategory {
    Weapons = 0,
    Armor = 1,
    Consumables = 2,
    Materials = 3
}

export interface MarketItem {
    id: string; // The listing ID (UUID)
    itemId: string; // The game item UUID
    name: string; // Assuming backend returns this, otherwise you may need to map it
    category: ItemCategory;
    price: number;
    seller: string;
}

export interface InventoryItem {
    id: string; // The game item UUID in the player's possession
    name: string;
    category?: ItemCategory;
}

// --- Global State ---
export const userBalance = ref(0);
export const marketItems = ref<MarketItem[]>([]);
export const inventory = ref<InventoryItem[]>([]);
export const isLoading = ref(false);

// --- Actions ---

// 1. Fetch Market Listings
export const fetchMarketItems = async (pageNumber = 1, pageSize = 20) => {
    isLoading.value = true;
    try {
        // GET /api/market/listing
        const data = await api.get<MarketItem[]>(`/market/listing?pageNumber=${pageNumber}&pageSize=${pageSize}`);
        marketItems.value = data;
    } catch (error) {
        console.error("Failed to fetch market items:", error);
    } finally {
        isLoading.value = false;
    }
};

// 2. Fetch Player Inventory
export const fetchInventory = async () => {
    try {
        // GET /api/mobile/items
        const data = await api.get<InventoryItem[]>('/mobile/items');
        inventory.value = data;
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
    }
};

// 3. Fetch Player Data (for Balance)
export const fetchPlayerData = async () => {
    try {
        // GET /api/mobile/me (Assuming this returns game stats like coins)
        const data = await api.get<any>('/mobile/me');
        if (data && data.balance !== undefined) {
            userBalance.value = data.balance;
        }
    } catch (error) {
        console.error("Failed to fetch player data:", error);
    }
};

// 4. Buy an Item
export const buyItem = async (listingId: string) => {
    try {
        // POST /api/market/{id}/buy
        await api.post(`/market/${listingId}/buy`, {});
        alert("Item purchased successfully!");

        // Refresh data to reflect the purchase
        await Promise.all([fetchMarketItems(), fetchInventory(), fetchPlayerData()]);
    } catch (error: any) {
        alert(error.message || "Failed to buy item.");
    }
};

// 5. Sell an Item (Matches CreateMarketListingDTO)
export const sellItem = async (itemId: string, price: number) => {
    try {
        // POST /api/market/sell
        await api.post('/market/sell', { itemId, price });
        alert("Item listed on the market!");

        // Refresh data to show the new listing and remove it from inventory
        await Promise.all([fetchMarketItems(), fetchInventory()]);
    } catch (error: any) {
        alert(error.message || "Failed to list item.");
    }
};