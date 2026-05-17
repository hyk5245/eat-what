import { Dish, WeatherInfo, WeatherType, UserPreference } from './types'

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** 根据天气信息判断天气类型 */
export function getWeatherType(weather: WeatherInfo): WeatherType {
  const code = weather.code.toLowerCase()

  if (code.includes('rain') || code.includes('drizzle') || code.includes('shower')) {
    return 'rainy'
  }

  if (weather.temp > 30) {
    return 'hot'
  }

  if (weather.temp < 10) {
    return 'cold'
  }

  return 'mild'
}

/** Determine current meal time from system clock */
export function getMealTime(): MealTime {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 10) return 'breakfast'
  if (hour >= 11 && hour < 14) return 'lunch'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'snack'
}

/** Meal time weight multipliers per dish category */
const MEAL_TIME_WEIGHTS: Record<MealTime, Record<string, number>> = {
  breakfast: { noodle: 1.5, soup: 1.5, snack: 1.3, stew: 0.3, rice: 0.6, cold: 0.4, stirfry: 0.6 },
  lunch:     { rice: 1.5, stirfry: 1.5, noodle: 1.3, stew: 1.2, cold: 0.6, soup: 1.0, snack: 0.8 },
  dinner:    { stew: 1.5, rice: 1.3, stirfry: 1.3, noodle: 1.1, cold: 1.0, soup: 1.0, snack: 0.7 },
  snack:     { snack: 2.0, noodle: 1.2, cold: 0.8, stew: 0.2, rice: 0.5, stirfry: 0.5, soup: 0.8 },
}

/** Seasonal ingredients by month (1-indexed) */
const SEASONAL_INGREDIENTS: Record<number, string[]> = {
  1:  ['萝卜', '白菜', '羊肉', '冬笋', '腊味'],
  2:  ['萝卜', '白菜', '春笋', '韭菜', '菠菜'],
  3:  ['春笋', '韭菜', '菠菜', '荠菜', '香椿'],
  4:  ['春笋', '香椿', '豌豆', '蚕豆', '莴笋'],
  5:  ['芦笋', '蚕豆', '樱桃', '豌豆', '蒜苔'],
  6:  ['黄瓜', '番茄', '茄子', '豆角', '西瓜'],
  7:  ['黄瓜', '番茄', '冬瓜', '丝瓜', '苦瓜'],
  8:  ['冬瓜', '丝瓜', '莲藕', '秋葵', '毛豆'],
  9:  ['莲藕', '秋葵', '山药', '板栗', '南瓜'],
  10: ['山药', '板栗', '南瓜', '红薯', '莲藕'],
  11: ['萝卜', '白菜', '红薯', '山药', '芋头'],
  12: ['萝卜', '白菜', '羊肉', '冬笋', '腊味'],
}

export function getSeasonalTags(month?: number): string[] {
  return SEASONAL_INGREDIENTS[month ?? (new Date().getMonth() + 1)] || []
}

/** Check if a dish matches any seasonal ingredient */
function seasonalBoost(dish: Dish, seasonalTags: string[]): number {
  for (const tag of dish.tags) {
    for (const seasonal of seasonalTags) {
      if (tag.includes(seasonal) || seasonal.includes(tag)) return 1.3
    }
  }
  for (const seasonal of seasonalTags) {
    if (dish.name.includes(seasonal)) return 1.3
  }
  return 1.0
}

/** Filter out dishes eaten within dedup window */
export function filterRecentDishes(
  dishes: Dish[],
  recentDishIds: Set<string>
): { filtered: Dish[]; relaxed: boolean } {
  const filtered = dishes.filter(d => !recentDishIds.has(d.id))
  if (filtered.length > 0) {
    return { filtered, relaxed: false }
  }
  return { filtered: dishes, relaxed: true }
}

export interface SmartRandomOptions {
  weatherType: WeatherType
  category?: string
  recentDishIds: Set<string>
  mealTime: MealTime
  categoryWeights: Map<string, number>
  tagBoosts: Map<string, number>
  preferences: UserPreference
}

/** Multi-dimension weighted random pick */
export function smartRandom(dishes: Dish[], options: SmartRandomOptions): {
  dish: Dish
  relaxed: boolean
} {
  const { weatherType, category, recentDishIds, mealTime, categoryWeights, tagBoosts, preferences } = options

  let candidates = category
    ? dishes.filter(d => d.category === category)
    : dishes

  if (candidates.length === 0) {
    candidates = dishes
  }

  const { filtered, relaxed } = filterRecentDishes(candidates, recentDishIds)
  candidates = filtered

  const weights = candidates.map(dish => {
    let w = 1.0

    w *= dish.suitableWeather.includes(weatherType) ? 2.0 : 1.0

    const mtWeight = MEAL_TIME_WEIGHTS[mealTime][dish.category]
    w *= mtWeight !== undefined ? mtWeight : 1.0

    const catPref = categoryWeights.get(dish.category)
    if (catPref !== undefined) w *= catPref

    for (const tag of dish.tags) {
      const boost = tagBoosts.get(tag)
      if (boost !== undefined) w += boost
    }

    const seasonalTags = getSeasonalTags()
    w *= seasonalBoost(dish, seasonalTags)

    for (const avoid of preferences.avoid) {
      if (dish.tags.some(t => t.includes(avoid) || avoid.includes(t))
          || dish.name.includes(avoid)) {
        w *= 0.05
        break
      }
    }

    if (preferences.taste.length > 0) {
      let tasteMatch = false
      for (const taste of preferences.taste) {
        if (dish.tags.some(t => t.includes(taste) || taste.includes(t))) {
          tasteMatch = true
          break
        }
      }
      if (tasteMatch) w *= 1.5
    }

    return Math.max(w, 0.01)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return { dish: candidates[i], relaxed }
    }
  }

  return { dish: candidates[candidates.length - 1], relaxed }
}

/** Uniform random pick (for OCR results — no structured dish data) */
export function uniformRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}
