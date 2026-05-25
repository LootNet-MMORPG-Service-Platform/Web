
import { ref } from 'vue';
import { api } from './services/api';
import { MarketplaceService } from './services/marketplaceService';
import type {
    WeaponMarketDTO,
    ArmorMarketDTO,
    WeaponQueryDTO,
    ArmorQueryDTO,
    CreateMarketListingDTO
} from './types/marketplace';


export interface InventoryItem {
    id: string;
    name: string;
    category?: number;
}

interface ItemCollectionResponse {
    weapons?: Array<{ id?: string; Id?: string; name?: string; Name?: string; category?: number; Category?: number }>;
    armors?: Array<{ id?: string; Id?: string; name?: string; Name?: string; category?: number; Category?: number }>;
    Weapons?: Array<{ id?: string; Id?: string; name?: string; Name?: string; category?: number; Category?: number }>;
    Armors?: Array<{ id?: string; Id?: string; name?: string; Name?: string; category?: number; Category?: number }>;
}


export const userBalance = ref(0);
export const weapons = ref<WeaponMarketDTO[]>([]);
export const armors = ref<ArmorMarketDTO[]>([]);
export const inventory = ref<InventoryItem[]>([]);
export const isLoading = ref(false);



export const fetchWeapons = async (query: WeaponQueryDTO) => {
    isLoading.value = true;
    try {
        const result = await MarketplaceService.getWeapons(query);
        const raw = result?.items || (result as any)?.Items || [];
        weapons.value = raw.map(normalizeWeapon);
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
        const raw = result?.items || (result as any)?.Items || [];
        armors.value = raw.map(normalizeArmor);
    } catch (error) {
        console.error("Failed to fetch armors:", error);
    } finally {
        isLoading.value = false;
    }
};

export const fetchInventory = async () => {
    try {
        const data = await api.get<ItemCollectionResponse>('/mobile/items');
        const weapons = data?.weapons ?? data?.Weapons ?? [];
        const armors = data?.armors ?? data?.Armors ?? [];

        inventory.value = [...weapons, ...armors].map((item) => ({
            id: String(item.id ?? item.Id ?? ''),
            name: String(item.name ?? item.Name ?? 'Unknown Item'),
            category: Number(item.category ?? item.Category ?? 0)
        })).filter((item) => item.id.length > 0);
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
    }
};

export const fetchPlayerData = async () => {
    try {
        const data = await MarketplaceService.getProfile();
        if (data) {
            userBalance.value = Number(data.currency ?? 0);
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

const round1 = (v: unknown): number => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 10) / 10;
};

const normalizeWeapon = (w: any): WeaponMarketDTO => ({
    listingId: w.listingId ?? w.ListingId,
    itemId: w.itemId ?? w.ItemId,
    sellerId: w.sellerId ?? w.SellerId ?? '',
    name: w.name ?? w.Name,
    price: Number(w.price ?? w.Price ?? 0),
    weaponType: w.weaponType ?? w.WeaponType,
    cut: round1(w.cut ?? w.Cut),
    blunt: round1(w.blunt ?? w.Blunt),
    sellerUsername: w.sellerUsername ?? w.SellerUsername ?? 'Unknown',
    sellerProfileImagePath: w.sellerProfileImagePath ?? w.SellerProfileImagePath ?? null,
    elements: (w.elements ?? w.Elements ?? []).map((e: any) => ({
        type: e.type ?? e.Type,
        value: round1(e.value ?? e.Value)
    }))
});

const normalizeArmor = (a: any): ArmorMarketDTO => ({
    listingId: a.listingId ?? a.ListingId,
    itemId: a.itemId ?? a.ItemId,
    sellerId: a.sellerId ?? a.SellerId ?? '',
    name: a.name ?? a.Name,
    price: Number(a.price ?? a.Price ?? 0),
    armorType: a.armorType ?? a.ArmorType,
    cutResistance: round1(a.cutResistance ?? a.CutResistance),
    bluntResistance: round1(a.bluntResistance ?? a.BluntResistance),
    sellerUsername: a.sellerUsername ?? a.SellerUsername ?? 'Unknown',
    sellerProfileImagePath: a.sellerProfileImagePath ?? a.SellerProfileImagePath ?? null,
    elements: (a.elements ?? a.Elements ?? []).map((e: any) => ({
        type: e.type ?? e.Type,
        value: round1(e.value ?? e.Value)
    }))
});

