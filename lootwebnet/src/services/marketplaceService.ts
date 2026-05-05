// src/services/marketplaceService.ts
import { api } from '../components/api';
import type {
    WeaponQueryDTO, ArmorQueryDTO, PagedResultDTO,
    WeaponMarketDTO, ArmorMarketDTO, CreateMarketListingDTO
} from '../types/marketplace';

export const MarketplaceService = {
    async getWeapons(query: WeaponQueryDTO): Promise<PagedResultDTO<WeaponMarketDTO>> {
        // 🔧 FIX: Ensure the objects exist so C# doesn't crash on .IsValid checks!
        query.price = query.price || { isValid: true };
        query.cut = query.cut || { isValid: true };
        query.blunt = query.blunt || { isValid: true };

        query.price.isValid = true;
        query.cut.isValid = true;
        query.blunt.isValid = true;

        return await api.post<PagedResultDTO<WeaponMarketDTO>>('/market/listing/weapons', query);
    },

    async getArmors(query: ArmorQueryDTO): Promise<PagedResultDTO<ArmorMarketDTO>> {
        // 🔧 FIX: Ensure the objects exist so C# doesn't crash on .IsValid checks!
        query.price = query.price || { isValid: true };
        query.cutResistance = query.cutResistance || { isValid: true };
        query.bluntResistance = query.bluntResistance || { isValid: true };

        query.price.isValid = true;
        query.cutResistance.isValid = true;
        query.bluntResistance.isValid = true;

        return await api.post<PagedResultDTO<ArmorMarketDTO>>('/market/listing/armors', query);
    },

    async createListing(dto: CreateMarketListingDTO): Promise<void> {
        return await api.post('/market/sell', dto);
    },

    async buyItem(listingId: string): Promise<void> {
        // Note: passing an empty object {} because your api.post expects a body
        return await api.post(`/market/${listingId}/buy`, {});
    }
};