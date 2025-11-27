
export enum ItemCategory {
  WEAPON = 'Оружие',
  ARMOR = 'Броня',
  POTION = 'Зелья',
  SCROLL = 'Свитки',
  GEAR = 'Снаряжение',
  TREASURE = 'Сокровища',
  MISC = 'Разное'
}

export enum Rarity {
  COMMON = 'Обычный',
  UNCOMMON = 'Необычный',
  RARE = 'Редкий',
  VERY_RARE = 'Очень редкий',
  LEGENDARY = 'Легендарный',
  ARTIFACT = 'Артефакт'
}

export interface Currency {
  pp: number;
  gp: number;
  sp: number;
  cp: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  weight: number; // in lbs
  cost: number; // normalized to gp
  costLabel: string; // e.g. "10 gp"
  category: ItemCategory;
  rarity: Rarity;
  isMagic: boolean;
  attunement: boolean;
  // imageUrl removed from usage, kept optional to avoid breaking old data types immediately
  imageUrl?: string;
  isJunk?: boolean;
}

export interface CharacterStats {
  strength: number;
  name: string;
}

export interface HistoryEntry {
  id: string;
  type: 'add' | 'remove' | 'update' | 'currency' | 'system';
  description: string;
  timestamp: number;
  characterName?: string; // For Global Logs
  author?: string; // Who made the change
}

export interface InventoryState {
  items: Item[];
  currency: Currency;
  stats: CharacterStats;
  history: HistoryEntry[];
  ownerId?: number; // Server ID of the user who owns this character
  ownerName?: string; // Username of the owner
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}
