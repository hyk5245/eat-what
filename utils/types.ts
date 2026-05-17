export interface Dish {
  id: string
  name: string
  category: 'noodle' | 'rice' | 'stew' | 'cold' | 'soup' | 'stirfry' | 'snack'
  suitableWeather: WeatherType[]
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  emoji: string
  mealTime?: ('breakfast' | 'lunch' | 'dinner' | 'snack')[]
  priceLevel?: 1 | 2 | 3
  calories?: number
}

export interface HistoryRecord {
  id: string
  dishId: string
  dishName: string
  emoji: string
  source: 'weather' | 'random' | 'ocr'
  weather?: string
  createdAt: number
}

export interface WeatherInfo {
  temp: number
  text: string
  code: string
  city: string
}

export type WeatherType = 'rainy' | 'hot' | 'cold' | 'mild'

export interface UserPreference {
  taste: string[]
  avoid: string[]
  dedupDays: number
}

export interface CustomMenu {
  id: string
  name: string
  createdAt: number
}

export interface CustomDish {
  id: string
  menuId: string
  name: string
  note?: string
  category?: string
  emoji?: string
  createdAt: number
}

export interface UserAction {
  dishId: string
  action: 'confirm' | 'skip'
  timestamp: number
}

export interface MemberStatus {
  isMember: boolean
  expireAt?: number
}
