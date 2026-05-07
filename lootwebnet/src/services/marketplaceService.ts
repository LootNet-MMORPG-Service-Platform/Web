
import { api } from './api';
import type {
    WeaponQueryDTO, ArmorQueryDTO, PagedResultDTO,
    WeaponMarketDTO, ArmorMarketDTO, CreateMarketListingDTO, MyMarketListingDTO, MarketTransactionDTO, MyListingsQueryDTO,
    MarketTransactionsQueryDTO, MarketTransactionsSummaryDTO, MyListingsSummaryDTO, ChatConversationDTO, ChatMessageDTO
} from '../types/marketplace';

export const MarketplaceService = {
    async getWeapons(query: WeaponQueryDTO): Promise<PagedResultDTO<WeaponMarketDTO>> {
        
        query.price = query.price || { isValid: true };
        query.cut = query.cut || { isValid: true };
        query.blunt = query.blunt || { isValid: true };

        query.price.isValid = true;
        query.cut.isValid = true;
        query.blunt.isValid = true;

        return await api.post<PagedResultDTO<WeaponMarketDTO>>('/market/listing/weapons', query);
    },

    async getArmors(query: ArmorQueryDTO): Promise<PagedResultDTO<ArmorMarketDTO>> {
        
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
        
        return await api.post(`/market/${listingId}/buy`, {});
    },

    async getMyListings(query: MyListingsQueryDTO): Promise<PagedResultDTO<MyMarketListingDTO>> {
        return await api.post<PagedResultDTO<MyMarketListingDTO>>('/market/me/listings', query);
    },

    async getMyTransactions(query: MarketTransactionsQueryDTO): Promise<PagedResultDTO<MarketTransactionDTO>> {
        return await api.post<PagedResultDTO<MarketTransactionDTO>>('/market/me/transactions', query);
    },

    async getMyTransactionsSummary(): Promise<MarketTransactionsSummaryDTO> {
        return await api.get<MarketTransactionsSummaryDTO>('/market/me/transactions/summary');
    },

    async getMyListingsSummary(): Promise<MyListingsSummaryDTO> {
        return await api.get<MyListingsSummaryDTO>('/market/me/listings/summary');
    },

    async changeListingPrice(listingId: string, price: number): Promise<void> {
        return await api.post(`/market/${listingId}/change-price`, { price });
    },

    async cancelListing(listingId: string): Promise<void> {
        return await api.post(`/market/${listingId}/cancel`, {});
    },

    async uploadProfilePicture(file: File): Promise<{ profileImagePath: string }> {
        const form = new FormData();
        form.append('file', file);
        return await api.postForm<{ profileImagePath: string }>('/mobile/me/pfp', form);
    },

    async getGlobalChat(pageNumber = 1, pageSize = 30): Promise<PagedResultDTO<ChatMessageDTO>> {
        return await api.get<PagedResultDTO<ChatMessageDTO>>(`/chat/global?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    },

    async sendGlobalChat(text: string): Promise<ChatMessageDTO> {
        return await api.post<ChatMessageDTO>('/chat/global', { text });
    },

    async getPrivateChat(otherUserId: string, pageNumber = 1, pageSize = 30): Promise<PagedResultDTO<ChatMessageDTO>> {
        return await api.post<PagedResultDTO<ChatMessageDTO>>('/chat/private', { otherUserId, pageNumber, pageSize });
    },

    async sendPrivateChat(recipientId: string, text: string): Promise<ChatMessageDTO> {
        return await api.post<ChatMessageDTO>('/chat/private/send', { recipientId, text });
    },

    async getPrivateConversations(): Promise<ChatConversationDTO[]> {
        return await api.get<ChatConversationDTO[]>('/chat/private/conversations');
    },

    async getUserProfile(userId: string): Promise<{ userId: string; username: string; profileImagePath?: string | null }> {
        return await api.get<{ userId: string; username: string; profileImagePath?: string | null }>(`/users/${userId}`);
    },

    async getUserListings(userId: string, query: MyListingsQueryDTO): Promise<PagedResultDTO<MyMarketListingDTO>> {
        return await api.post<PagedResultDTO<MyMarketListingDTO>>(`/users/${userId}/listings`, query);
    }
};

