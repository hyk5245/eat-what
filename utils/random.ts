import { Dish, WeatherInfo, WeatherType } from './types'

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

/** 加权随机：匹配天气的菜品权重 1.5，不匹配的 1.0 */
export function weightedRandom(
  dishes: Dish[],
  weatherType: WeatherType,
  category?: string
): Dish {
  let candidates = dishes

  if (category) {
    candidates = dishes.filter(d => d.category === category)
  }

  if (candidates.length === 0) {
    candidates = dishes
  }

  const totalWeight = candidates.reduce((sum, d) => {
    return sum + (d.suitableWeather.includes(weatherType) ? 1.5 : 1.0)
  }, 0)

  let random = Math.random() * totalWeight

  for (const dish of candidates) {
    const weight = dish.suitableWeather.includes(weatherType) ? 1.5 : 1.0
    random -= weight
    if (random <= 0) {
      return dish
    }
  }

  return candidates[candidates.length - 1]
}

/** 均匀随机 */
export function uniformRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}
