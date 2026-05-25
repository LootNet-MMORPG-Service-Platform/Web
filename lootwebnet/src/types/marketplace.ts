

export enum WeaponType { TwoHandSword = 0, Sword = 1, Shortsword = 2, Polearm = 3, Crossbow = 4, Bow = 5 }
export enum ArmorType { Helmet = 0, Chestplate = 1, Gauntlets = 2, Greaves = 3, Sabatons = 4 }
export enum ItemElementType { Fire = 0, Water = 1, Earth = 2, Air = 3 }
export enum SortDirection { Asc = 0, Desc = 1 }
export const WeaponSortColumns = { Name: 'name', Price: 'price', Cut: 'cut', Blunt: 'blunt' } as const
export const ArmorSortColumns = { Name: 'name', Price: 'price', CutResistance: 'cutresistance', BluntResistance: 'bluntresistance' } as const
export type WeaponSortColumn = typeof WeaponSortColumns[keyof typeof WeaponSortColumns]
export type ArmorSortColumn = typeof ArmorSortColumns[keyof typeof ArmorSortColumns]
export enum ItemCategory { Weapon = 0, Armor = 1, Consumable = 2 }

export interface ItemElementDTO {
    type: ItemElementType;
    value: number;
}

export interface WeaponMarketDTO {
    listingId: string;
    itemId: string;
    sellerId: string;
    name: string;
    price: number;
    weaponType: WeaponType;
    cut: number;
    blunt: number;
    elements: ItemElementDTO[];
    sellerUsername: string;
    sellerProfileImagePath?: string | null;
}

export interface ArmorMarketDTO {
    listingId: string;
    itemId: string;
    sellerId: string;
    name: string;
    price: number;
    armorType: ArmorType;
    cutResistance: number;
    bluntResistance: number;
    elements: ItemElementDTO[];
    sellerUsername: string;
    sellerProfileImagePath?: string | null;
}

export interface ChatMessageDTO {
    id: string;
    senderId: string;
    senderUsername: string;
    senderProfileImagePath?: string | null;
    recipientId?: string | null;
    text: string;
    createdAt: string;
}

export interface ChatConversationDTO {
    userId: string;
    username: string;
    profileImagePath?: string | null;
    lastMessageText: string;
    lastMessageAt: string;
}

export interface CreateMarketListingDTO {
    itemId: string;
    price: number;
}

export interface RangeFilter<T> {
    min?: T | null;
    max?: T | null;
    isValid?: boolean;
}

export interface BaseQueryDTO {
    pageNumber: number;
    pageSize: number;
    search?: string;
    price?: RangeFilter<number>;
    elements?: ItemElementType[];
    sortDirection?: SortDirection;
}

export interface WeaponQueryDTO extends BaseQueryDTO {
    types?: WeaponType[];
    cut?: RangeFilter<number>;
    blunt?: RangeFilter<number>;
    sortColumn?: WeaponSortColumn;
}

export interface ArmorQueryDTO extends BaseQueryDTO {
    types?: ArmorType[];
    cutResistance?: RangeFilter<number>;
    bluntResistance?: RangeFilter<number>;
    sortColumn?: ArmorSortColumn;
}

export interface PagedResultDTO<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

export interface MyMarketListingDTO {
    listingId: string;
    itemId: string;
    name: string;
    price: number;
    category: ItemCategory;
    createdAt: string;
    weaponType?: WeaponType | null;
    armorType?: ArmorType | null;
    cut?: number | null;
    blunt?: number | null;
    cutResistance?: number | null;
    bluntResistance?: number | null;
    elements: ItemElementDTO[];
}

export interface MarketTransactionDTO {
    transactionId: string;
    itemId: string;
    itemName: string;
    price: number;
    taxAmount: number;
    sellerPayout: number;
    timestamp: string;
    isSale: boolean;
    counterpartyUsername: string;
    counterpartyUserId: string;
}

export interface MyListingsQueryDTO {
    search?: string;
    category?: ItemCategory;
    price?: RangeFilter<number>;
    pageNumber: number;
    pageSize: number;
}

export interface MarketTransactionsQueryDTO {
    search?: string;
    isSale?: boolean;
    from?: string;
    to?: string;
    price?: RangeFilter<number>;
    pageNumber: number;
    pageSize: number;
}

export interface MarketTransactionsSummaryDTO {
    totalSold: number;
    totalBought: number;
    difference: number;
}

export interface MyListingsSummaryDTO {
    totalItemsListed: number;
    totalListedValue: number;
}

export interface UserProfileDTO {
    username: string;
    currency: number;
    role: number;
    profileImagePath?: string | null;
}

export interface MarketSaleTaxDTO {
    grossPrice: number;
    taxAmount: number;
    sellerPayout: number;
    effectiveTaxRate: number;
}

export interface BotSaleOfferDTO {
    itemId: string;
    itemName: string;
    category: ItemCategory;
    statScore: number;
    offeredPrice: number;
    taxAmount: number;
    sellerPayout: number;
}

export interface BotSaleResultDTO {
    itemId: string;
    itemName: string;
    category: ItemCategory;
    paidAmount: number;
    currencyAfterSale: number;
}

export interface ItemRewardDTO {
    id: string;
    name: string;
    category: ItemCategory;
    currencyReward: number;
    currencyAfterReward: number;
}

export interface WebDailyRewardDTO {
    currencyReward: number;
    currencyAfterReward: number;
}

export interface MarketTaxBracketDTO {
    from: number;
    to?: number | null;
    rate: number;
}

export interface MarketEconomyDTO {
    dailyCurrencyReward: number;
    botBasePrice: number;
    botStatMultiplier: number;
    botElementMultiplier: number;
    isPlayerToPlayerTaxEnabled: boolean;
    isPlayerToBotTaxEnabled: boolean;
    botSaleFormula: string;
    progressiveTaxBrackets: MarketTaxBracketDTO[];
}

export interface SellInventoryQueryDTO {
    itemType: 'all' | 'weapon' | 'armor';
    search?: string;
    sortBy: 'power' | 'name';
    sortDirection: SortDirection;
    pageNumber: number;
    pageSize: number;
}

export interface SellInventoryItemDTO {
    id: string;
    name: string;
    category: ItemCategory;
    itemKind: 'weapon' | 'armor';
    weaponType?: WeaponType | null;
    armorType?: ArmorType | null;
    cut?: number | null;
    blunt?: number | null;
    cutResistance?: number | null;
    bluntResistance?: number | null;
    powerScore: number;
    elements: ItemElementDTO[];
}
