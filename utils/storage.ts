import { HistoryRecord, UserPreference, CustomMenu, CustomDish, Dish, UserAction } from './types'

const MENUS_KEY = 'eat_what_menus'
const DISHES_KEY = 'eat_what_custom_dishes'
const HISTORY_KEY = 'eat_what_history'
const PREFERENCE_KEY = 'eat_what_preference'
const ACTIONS_KEY = 'eat_what_actions'
const MAX_HISTORY = 100
const MAX_ACTIONS = 500

/** 将 CustomDish 映射为 Dish 兼容对象，供 dish-modal 展示 */
export function mapCustomDishToDish(dish: CustomDish): Dish {
  return {
    id: dish.id,
    name: dish.name,
    emoji: dish.emoji || '🍽️',
    category: (dish.category as Dish['category']) || 'stirfry',
    suitableWeather: [],
    difficulty: 'easy',
    tags: dish.note ? [dish.note] : [],
  }
}

export function getMenus(): CustomMenu[] {
  try {
    return wx.getStorageSync(MENUS_KEY) || []
  } catch {
    return []
  }
}

export function saveMenu(menu: CustomMenu): void {
  const menus = getMenus()
  menus.push(menu)
  wx.setStorageSync(MENUS_KEY, menus)
}

export function deleteMenu(menuId: string): void {
  const menus = getMenus().filter(m => m.id !== menuId)
  wx.setStorageSync(MENUS_KEY, menus)
  const dishes = getCustomDishes().filter(d => d.menuId !== menuId)
  wx.setStorageSync(DISHES_KEY, dishes)
}

export function getCustomDishes(menuId?: string): CustomDish[] {
  try {
    const all: CustomDish[] = wx.getStorageSync(DISHES_KEY) || []
    return menuId ? all.filter(d => d.menuId === menuId) : all
  } catch {
    return []
  }
}

function saveAllDishes(dishes: CustomDish[]): void {
  wx.setStorageSync(DISHES_KEY, dishes)
}

export function addCustomDish(dish: CustomDish): void {
  const all = getCustomDishes()
  all.push(dish)
  saveAllDishes(all)
}

export function updateCustomDish(id: string, updates: Partial<CustomDish>): void {
  const all = getCustomDishes()
  const idx = all.findIndex(d => d.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates }
    saveAllDishes(all)
  }
}

export function deleteCustomDish(id: string): void {
  const all = getCustomDishes().filter(d => d.id !== id)
  saveAllDishes(all)
}

export function getHistory(): HistoryRecord[] {
  try {
    return wx.getStorageSync(HISTORY_KEY) || []
  } catch {
    return []
  }
}

export function addHistory(record: HistoryRecord): void {
  const history = getHistory()
  history.unshift(record)
  if (history.length > MAX_HISTORY) {
    history.pop()
  }
  wx.setStorageSync(HISTORY_KEY, history)
}

export function getPreference(): UserPreference {
  try {
    const stored = wx.getStorageSync(PREFERENCE_KEY)
    return stored
      ? { taste: stored.taste || [], avoid: stored.avoid || [], dedupDays: stored.dedupDays ?? 3 }
      : { taste: [], avoid: [], dedupDays: 3 }
  } catch {
    return { taste: [], avoid: [], dedupDays: 3 }
  }
}

export function setPreference(pref: UserPreference): void {
  wx.setStorageSync(PREFERENCE_KEY, pref)
}

export function getUserActions(): UserAction[] {
  try {
    return wx.getStorageSync(ACTIONS_KEY) || []
  } catch {
    return []
  }
}

export function addUserAction(action: UserAction): void {
  const actions = getUserActions()
  actions.push(action)
  if (actions.length > MAX_ACTIONS) {
    actions.splice(0, actions.length - MAX_ACTIONS)
  }
  wx.setStorageSync(ACTIONS_KEY, actions)
}

export function clearUserActions(): void {
  wx.setStorageSync(ACTIONS_KEY, [])
}
