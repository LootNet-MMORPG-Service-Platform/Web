// src/store.ts
import { ref } from 'vue';
import { api } from './components/api';
import { MarketplaceService } from './services/marketplaceService';
import type {
    WeaponMarketDTO,
    ArmorMarketDTO,
    WeaponQueryDTO,
    ArmorQueryDTO,
    CreateMarketListingDTO
} from './types/marketplace';

// --- Types ---
export interface InventoryItem {
    id: string;
    name: string;
    category?: number;
}

// --- Global State ---
export const userBalance = ref(0);
export const weapons = ref<WeaponMarketDTO[]>([]);
export const armors = ref<ArmorMarketDTO[]>([]);
export const inventory = ref<InventoryItem[]>([]);
export const isLoading = ref(false);

// --- Actions ---

export const fetchWeapons = async (query: WeaponQueryDTO) => {
    isLoading.value = true;
    try {
        const result = await MarketplaceService.getWeapons(query);
        // 🔧 FIX: Check for both 'items' and 'Items' to avoid undefined crashes
        weapons.value = result?.items || (result as any)?.Items || [];
    } catch (error) {
        console.error("Failed to fetch weapons:", error);
    } finally {
        isLoading.value = false;
    }
};

export const fetchArmors = async (query: ArmorQueryDTO) => {
    isLoading.value = true;
    try {
        const result = await MarketplaceService.getArmors(query);
        // 🔧 FIX: Check for both 'items' and 'Items'
        armors.value = result?.items || (result as any)?.Items || [];
    } catch (error) {
        console.error("Failed to fetch armors:", error);
    } finally {
        isLoading.value = false;
    }
};

export const fetchInventory = async () => {
    try {
        const data = await api.get<InventoryItem[]>('/mobile/items');
        inventory.value = data || [];
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
    }
};

export const fetchPlayerData = async () => {
    try {
        const data = await api.get<any>('/mobile/me');
        if (data) {
            // 🔧 FIX: Safely check for both casing styles
            userBalance.value = data.balance ?? data.Balance ?? 0;
        }
    } catch (error) {
        console.error("Failed to fetch player data:", error);
    }
};

export const sellItem = async (dto: CreateMarketListingDTO) => {
    isLoading.value = true;
    try {
        await MarketplaceService.createListing(dto);
        alert("Item listed on the market!");
        await fetchInventory();
    } catch (error: any) {
        alert(error.response?.data?.message || error.message || "Failed to sell item");
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

export const buyItem = async (listingId: string, category: 'weapons' | 'armors') => {
    isLoading.value = true;
    try {
        await MarketplaceService.buyItem(listingId);

        // 🔧 FIX: Safely filter using both casing styles
        if (category === 'weapons') {
            weapons.value = weapons.value.filter(w => (w.listingId || (w as any).ListingId) !== listingId);
        } else {
            armors.value = armors.value.filter(a => (a.listingId || (a as any).ListingId) !== listingId);
        }

        await Promise.all([fetchPlayerData(), fetchInventory()]);
        alert("Purchase successful!");
    } catch (error: any) {
        alert(error.response?.data?.message || error.message || "Failed to buy item");
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};