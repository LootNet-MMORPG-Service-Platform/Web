// store.ts
import { ref } from 'vue';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type Category = 'All' | 'Weapons' | 'Armor' | 'Consumables' | 'Materials';

export interface MarketItem {
    id: string;
    name: string;
    category: Exclude<Category, 'All'>;
    rarity: Rarity;
    price: number;
    quantity: number;
    seller: string;
}

// Shared State
export const userBalance = ref(1250);

export const marketItems = ref<MarketItem[]>([
    { id: '1', name: 'Iron Sword', category: 'Weapons', rarity: 'Common', price: 150, quantity: 1, seller: 'WarriorBob99' },
    { id: '2', name: 'Health Potion (Large)', category: 'Consumables', rarity: 'Uncommon', price: 45, quantity: 20, seller: 'HealerJane' },
    { id: '3', name: 'Dragon Scale Chestplate', category: 'Armor', rarity: 'Epic', price: 15000, quantity: 1, seller: 'LootMaster' },
    { id: '4', name: 'Mithril Ore', category: 'Materials', rarity: 'Rare', price: 800, quantity: 50, seller: 'MinerDan' },
    { id: '5', name: 'Excalibur', category: 'Weapons', rarity: 'Legendary', price: 999999, quantity: 1, seller: 'KingArthur' },
]);

// Actions
export const buyItem = (item: MarketItem) => {
    if (userBalance.value >= item.price) {
        userBalance.value -= item.price;

        const index = marketItems.value.findIndex(i => i.id === item.id);
        if (index !== -1) {
            if (marketItems.value[index].quantity > 1) {
                marketItems.value[index].quantity--;
            } else {
                marketItems.value.splice(index, 1);
            }
        }
        alert(`Purchased ${item.name} for 🪙 ${item.price.toLocaleString()}!`);
    } else {
        alert("Not enough coins!");
    }
};

export const sellItem = (newItem: Omit<MarketItem, 'id' | 'seller'>) => {
    const id = Math.random().toString(36).substring(2, 9);

    marketItems.value.push({
        ...newItem,
        id,
        seller: 'You'
    });

    // For mock purposes: instantly grant the user coins when they list an item
    const totalEarned = newItem.price * newItem.quantity;
    userBalance.value += totalEarned;

    alert(`Sold ${newItem.quantity}x ${newItem.name} and earned 🪙 ${totalEarned.toLocaleString()}!`);
};