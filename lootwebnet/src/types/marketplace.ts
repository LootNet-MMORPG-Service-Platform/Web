// src/types/marketplace.ts

export enum WeaponType { Sword = 1, Axe = 2, Bow = 3, Dagger = 4, Staff = 5 } // Update to match your C# Enum
export enum ArmorType { Helmet = 1, Chest = 2, Legs = 3, Boots = 4, Gloves = 5 } // Update to match your C# Enum
export enum ItemElementType { Fire = 1, Ice = 2, Lightning = 3, Earth = 4 } // Update to match your C# Enum
export enum SortDirection { Asc = 0, Desc = 1 }
export enum WeaponSortColumns { Name = 0, Price = 1, Cut = 2, Blunt = 3 }
export enum ArmorSortColumns { Name = 0, Price = 1, CutResistance = 2, BluntResistance = 3 }
export enum ItemCategory { Weapon = 0, Armor = 1, Consumable = 2 }

export interface ItemElementDTO {
    type: ItemElementType;
    value: number;
}

export interface WeaponMarketDTO {
    listingId: string;
    itemId: string;
    name: string;
    price: number;
    weaponType: WeaponType;
    cut: number;
    blunt: number;
    elements: ItemElementDTO[];
}

export interface ArmorMarketDTO {
    listingId: string;
    itemId: string;
    name: string;
    price: number;
    armorType: ArmorType;
    cutResistance: number;
    bluntResistance: number;
    elements: ItemElementDTO[];
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
    sortColumn?: WeaponSortColumns;
}

export interface ArmorQueryDTO extends BaseQueryDTO {
    types?: ArmorType[];
    cutResistance?: RangeFilter<number>;
    bluntResistance?: RangeFilter<number>;
    sortColumn?: ArmorSortColumns;
}

export interface PagedResultDTO<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}