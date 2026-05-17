# Phase 1 Free Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement six free features (smart dedup, preference learning, meal time awareness, seasonal recommendations, enhanced preferences, history analytics) to boost retention and DAU.

**Architecture:** Extend the existing random algorithm from single-dimension weather weighting to multi-dimension scoring. Add a preference engine that learns from user confirm/skip actions. Enhance three pages (index, profile, history) and one component (dish-modal). All new data stored locally; no cloud changes.

**Tech Stack:** WeChat Mini Program (TypeScript, WXML, WXSS), local Storage, existing cloud functions unchanged.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `utils/types.ts` | Modify | Add UserAction, MemberStatus; enhance Dish, UserPreference |
| `utils/recipe-data.ts` | Modify | Add mealTime, priceLevel, calories to all dishes |
| `utils/storage.ts` | Modify | UserAction CRUD, enhanced preference defaults |
| `utils/preference-engine.ts` | **Create** | Compute preference weights from action history |
| `utils/random.ts` | Modify | Multi-dimension `smartRandom()` replacing simple `weightedRandom()` |
| `components/dish-modal/dish-modal.ts` | Modify | Track confirm/skip as UserAction |
| `pages/index/index.ts` | Modify | Wire smartRandom, dedup, meal time, seasonal data |
| `pages/index/index.wxml` | Modify | Seasonal highlights section |
| `pages/index/index.wxss` | Modify | Seasonal section styles |
| `pages/profile/profile.ts` | Modify | Multi-select taste, expanded avoid, dedup slider |
| `pages/profile/profile.wxml` | Modify | Enhanced preference UI |
| `pages/profile/profile.wxss` | Modify | New preference control styles |
| `pages/history/history.ts` | Modify | Compute and display analytics |
| `pages/history/history.wxml` | Modify | Analytics cards above record list |
| `pages/history/history.wxss` | Modify | Analytics card styles |
| `pages/menu-detail/menu-detail.ts` | Modify | Pass context to smartRandom |
| `pages/ocr/ocr.ts` | Modify | Pass context to enhanced random |

---

### Task 1: Update type definitions

**Files:**
- Modify: `utils/types.ts`

- [ ] **Step 1: Update types.ts with enhanced and new types**

Replace `utils/types.ts` with updated definitions. Key changes:
- `Dish`: add optional `mealTime`, `priceLevel`, `calories`
- `UserPreference`: `taste` becomes `string[]`, add `dedupDays`
- Add `UserAction` and `MemberStatus` interfaces

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add utils/types.ts
git commit -m "feat(types): add UserAction, MemberStatus, enhance Dish and UserPreference"
```

---

### Task 2: Enrich recipe data

**Files:**
- Modify: `utils/recipe-data.ts`

- [ ] **Step 1: Add mealTime, priceLevel, calories to recipe data**

The recipe library has ~120 dishes across 7 categories. Add three new fields to each dish entry following these rules:

**mealTime assignment rules:**
- noodle (n1-n22): `['breakfast', 'lunch', 'dinner']`
- rice (r1-r28): `['lunch', 'dinner']`
- stew (s1-s20): `['lunch', 'dinner']`
- cold (c1-c18): `['lunch', 'dinner']`
- soup (t1-t18): `['breakfast', 'lunch', 'dinner']`
- stirfry (f1-f22): `['lunch', 'dinner']`
- snack (k1-k22): most `['breakfast', 'lunch', 'dinner', 'snack']`

**priceLevel rules:**
- difficulty 'easy' → `1`, difficulty 'medium' → `2`, difficulty 'hard' → `3`
- Exception: meat-heavy easy dishes (e.g. 红烧鸡块, 葱爆羊肉) → `2`

**calories rules:**
- cold dishes: 80-250
- soups: 100-300
- vegetable stirfry: 150-350
- noodles: 350-600
- rice dishes: 300-700
- stews: 350-800
- snacks: 200-700

Here are updated entries for each category (the pattern carries through all dishes):

**Noodles (first 3, pattern repeats):**
```typescript
{ id: 'n1', name: '番茄鸡蛋面', category: 'noodle', suitableWeather: ['rainy', 'cold', 'mild'], difficulty: 'easy', tags: ['家常', '快手'], emoji: '🍜', mealTime: ['breakfast', 'lunch', 'dinner'], priceLevel: 1, calories: 380 },
{ id: 'n2', name: '炸酱面', category: 'noodle', suitableWeather: ['mild', 'hot'], difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🍝', mealTime: ['breakfast', 'lunch', 'dinner'], priceLevel: 1, calories: 450 },
{ id: 'n3', name: '红烧牛肉面', category: 'noodle', suitableWeather: ['rainy', 'cold'], difficulty: 'medium', tags: ['硬菜', '暖身'], emoji: '🍜', mealTime: ['breakfast', 'lunch', 'dinner'], priceLevel: 2, calories: 550 },
```

Apply the pattern: add `mealTime: ['breakfast', 'lunch', 'dinner']` to all noodle dishes, `priceLevel` based on difficulty (easy→1, medium→2, hard→3), and `calories` in the 350-600 range based on ingredients (meat-heavy higher, veggie lower).

**Rice dishes (first 3, pattern repeats):**
```typescript
{ id: 'r1', name: '红烧排骨', category: 'rice', suitableWeather: ['mild', 'cold'], difficulty: 'medium', tags: ['硬菜', '下饭'], emoji: '🍖', mealTime: ['lunch', 'dinner'], priceLevel: 2, calories: 550 },
{ id: 'r2', name: '番茄炒蛋', category: 'rice', suitableWeather: ['mild', 'hot'], difficulty: 'easy', tags: ['家常', '快手'], emoji: '🍅', mealTime: ['lunch', 'dinner'], priceLevel: 1, calories: 280 },
{ id: 'r3', name: '宫保鸡丁', category: 'rice', suitableWeather: ['mild', 'cold'], difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥜', mealTime: ['lunch', 'dinner'], priceLevel: 2, calories: 480 },
```

Apply: all rice dishes get `mealTime: ['lunch', 'dinner']`, `priceLevel` by difficulty, `calories` 250-700.

**Stews (first 3, pattern repeats):**
```typescript
{ id: 's1', name: '番茄牛腩煲', category: 'stew', suitableWeather: ['rainy', 'cold'], difficulty: 'hard', tags: ['硬菜', '暖身'], emoji: '🥘', mealTime: ['lunch', 'dinner'], priceLevel: 3, calories: 650 },
{ id: 's2', name: '红烧肉', category: 'stew', suitableWeather: ['cold', 'mild'], difficulty: 'medium', tags: ['硬菜', '下饭'], emoji: '🍖', mealTime: ['lunch', 'dinner'], priceLevel: 2, calories: 700 },
{ id: 's3', name: '土豆炖鸡块', category: 'stew', suitableWeather: ['rainy', 'cold'], difficulty: 'easy', tags: ['家常', '暖身'], emoji: '🍗', mealTime: ['lunch', 'dinner'], priceLevel: 2, calories: 450 },
```

Apply: all stews get `mealTime: ['lunch', 'dinner']`, `priceLevel` by difficulty, `calories` 350-800.

**Cold dishes (first 3, pattern repeats):**
```typescript
{ id: 'c1', name: '凉拌黄瓜', category: 'cold', suitableWeather: ['hot', 'mild'], difficulty: 'easy', tags: ['清爽', '快手'], emoji: '🥒', mealTime: ['lunch', 'dinner'], priceLevel: 1, calories: 80 },
{ id: 'c2', name: '凉拌木耳', category: 'cold', suitableWeather: ['hot', 'mild'], difficulty: 'easy', tags: ['清爽', '健康'], emoji: '🍄', mealTime: ['lunch', 'dinner'], priceLevel: 1, calories: 120 },
{ id: 'c3', name: '蒜泥白肉', category: 'cold', suitableWeather: ['hot', 'mild'], difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥩', mealTime: ['lunch', 'dinner'], priceLevel: 2, calories: 350 },
```

Apply: all cold dishes get `mealTime: ['lunch', 'dinner']`, `priceLevel` by difficulty, `calories` 80-350.

**Soups (first 3, pattern repeats):**
```typescript
{ id: 't1', name: '酸辣汤', category: 'soup', suitableWeather: ['rainy', 'cold'], difficulty: 'easy', tags: ['开胃', '暖身'], emoji: '🥣', mealTime: ['breakfast', 'lunch', 'dinner'], priceLevel: 1, calories: 120 },
{ id: 't2', name: '紫菜蛋花汤', category: 'soup', suitableWeather: ['rainy', 'cold', 'mild'], difficulty: 'easy', tags: ['快手', '清淡'], emoji: '🍲', mealTime: ['breakfast', 'lunch', 'dinner'], priceLevel: 1, calories: 80 },
{ id: 't3', name: '番茄蛋花汤', category: 'soup', suitableWeather: ['mild', 'rainy'], difficulty: 'easy', tags: ['快手', '家常'], emoji: '🍅', mealTime: ['breakfast', 'lunch', 'dinner'], priceLevel: 1, calories: 100 },
```

Apply: all soups get `mealTime: ['breakfast', 'lunch', 'dinner']`, `priceLevel` by difficulty, `calories` 80-300.

**Stir-fry (first 3, pattern repeats):**
```typescript
{ id: 'f1', name: '蒜蓉空心菜', category: 'stirfry', suitableWeather: ['mild', 'hot'], difficulty: 'easy', tags: ['快手', '清淡'], emoji: '🥬', mealTime: ['lunch', 'dinner'], priceLevel: 1, calories: 150 },
{ id: 'f2', name: '青椒肉丝', category: 'stirfry', suitableWeather: ['mild', 'cold'], difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🫑', mealTime: ['lunch', 'dinner'], priceLevel: 1, calories: 320 },
{ id: 'f3', name: '地三鲜', category: 'stirfry', suitableWeather: ['mild', 'cold'], difficulty: 'medium', tags: ['家常', '下饭'], emoji: '🍆', mealTime: ['lunch', 'dinner'], priceLevel: 2, calories: 380 },
```

Apply: all stir-fry get `mealTime: ['lunch', 'dinner']`, `priceLevel` by difficulty, `calories` 150-500.

**Snacks (first 3, pattern repeats):**
```typescript
{ id: 'k1', name: '蛋炒饭', category: 'snack', suitableWeather: ['mild', 'hot'], difficulty: 'easy', tags: ['快手', '家常'], emoji: '🍚', mealTime: ['breakfast', 'lunch', 'dinner', 'snack'], priceLevel: 1, calories: 400 },
{ id: 'k2', name: '煎饺', category: 'snack', suitableWeather: ['mild', 'cold'], difficulty: 'easy', tags: ['快手', '下饭'], emoji: '🥟', mealTime: ['breakfast', 'lunch', 'dinner', 'snack'], priceLevel: 1, calories: 420 },
{ id: 'k3', name: '炒年糕', category: 'snack', suitableWeather: ['rainy', 'cold'], difficulty: 'easy', tags: ['快手', '暖身'], emoji: '🍡', mealTime: ['breakfast', 'lunch', 'dinner', 'snack'], priceLevel: 1, calories: 380 },
```

Apply: all snacks get `mealTime: ['breakfast', 'lunch', 'dinner', 'snack']`, `priceLevel` by difficulty, `calories` 200-700.

> **Note:** The full updated recipe-data.ts has all ~120 dish entries updated. The pattern is mechanical — use the rules above for each dish. The complete updated file is available in the commit after this step.

- [ ] **Step 2: Commit**

```bash
git add utils/recipe-data.ts
git commit -m "feat(recipe-data): add mealTime, priceLevel, calories to all dishes"
```

---

### Task 3: Update storage layer

**Files:**
- Modify: `utils/storage.ts`

- [ ] **Step 1: Add UserAction CRUD and update preference defaults**

In `utils/storage.ts`, add a new key and functions for UserAction storage, and update the preference defaults to match the new `UserPreference` type (taste as array, dedupDays).

Add at the top of the file (after the existing `MENUS_KEY`/`DISHES_KEY` block):

```typescript
const HISTORY_KEY = 'eat_what_history'
const PREFERENCE_KEY = 'eat_what_preference'
const ACTIONS_KEY = 'eat_what_actions'
const MAX_HISTORY = 100
const MAX_ACTIONS = 500

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
```

Update the preference functions to reflect the new type:

```typescript
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
```

Update the import at the top of `utils/storage.ts` to include the new types:

```typescript
import { HistoryRecord, UserPreference, CustomMenu, CustomDish, Dish, UserAction } from './types'
```

- [ ] **Step 2: Commit**

```bash
git add utils/storage.ts
git commit -m "feat(storage): add UserAction CRUD and update preference defaults"
```

---

### Task 4: Create preference engine

**Files:**
- Create: `utils/preference-engine.ts`

- [ ] **Step 1: Create the preference engine module**

Create `utils/preference-engine.ts` with functions to compute preference-based weights from user action history.

```typescript
import { UserAction, Dish } from './types'

interface CategoryScores {
  [category: string]: number
}

interface TagScores {
  [tag: string]: number
}

/** Compute category affinity scores from user actions */
export function computeCategoryScores(actions: UserAction[]): CategoryScores {
  const scores: CategoryScores = {}
  for (const action of actions) {
    // We don't have category directly in UserAction, so scores are computed
    // by the caller who has dish context. This function operates on
    // pre-computed category-action pairs.
  }
  return scores
}

/** Given a list of actions with their dish categories, compute per-category weight multiplier */
export function computePreferenceWeights(
  actions: UserAction[],
  dishMap: Map<string, Pick<Dish, 'category' | 'tags'>>
): { categoryWeights: Map<string, number>; tagBoosts: Map<string, number> } {
  const catConfirms: Record<string, number> = {}
  const catSkips: Record<string, number> = {}
  const tagConfirms: Record<string, number> = {}
  const tagSkips: Record<string, number> = {}

  for (const action of actions) {
    const dish = dishMap.get(action.dishId)
    if (!dish) continue

    const catTarget = action.action === 'confirm' ? catConfirms : catSkips
    const tagTarget = action.action === 'confirm' ? tagConfirms : tagSkips

    catTarget[dish.category] = (catTarget[dish.category] || 0) + 1
    for (const tag of dish.tags) {
      tagTarget[tag] = (tagTarget[tag] || 0) + 1
    }
  }

  const categoryWeights = new Map<string, number>()
  for (const cat of Object.keys({ ...catConfirms, ...catSkips })) {
    const confirms = catConfirms[cat] || 0
    const skips = catSkips[cat] || 0
    const total = confirms + skips
    if (total < 2) {
      categoryWeights.set(cat, 1.0) // not enough data, neutral
    } else {
      const ratio = confirms / total
      categoryWeights.set(cat, 0.5 + ratio) // range 0.5–1.5
    }
  }

  const tagBoosts = new Map<string, number>()
  for (const tag of Object.keys({ ...tagConfirms, ...tagSkips })) {
    const confirms = tagConfirms[tag] || 0
    const skips = tagSkips[tag] || 0
    const total = confirms + skips
    if (total < 2) {
      tagBoosts.set(tag, 0)
    } else {
      const ratio = confirms / total
      tagBoosts.set(tag, (ratio - 0.5) * 0.6) // range -0.3 to +0.3
    }
  }

  return { categoryWeights, tagBoosts }
}

/** Build a dish lookup map from the recipe library */
export function buildDishMap(dishes: Dish[]): Map<string, Pick<Dish, 'category' | 'tags'>> {
  const map = new Map<string, Pick<Dish, 'category' | 'tags'>>()
  for (const d of dishes) {
    map.set(d.id, { category: d.category, tags: d.tags })
  }
  return map
}
```

- [ ] **Step 2: Commit**

```bash
git add utils/preference-engine.ts
git commit -m "feat(preference-engine): add preference weight computation from user actions"
```

---

### Task 5: Upgrade random algorithm

**Files:**
- Modify: `utils/random.ts`

- [ ] **Step 1: Add meal time detection, seasonal helpers, and smart weighted random**

Replace the contents of `utils/random.ts` with the upgraded version:

```typescript
import { Dish, WeatherInfo, WeatherType, UserAction, UserPreference } from './types'

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack'

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

/** Check if a dish matches any seasonal tags */
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

/** Filter out dishes eaten within dedupDays */
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

  // Step 1: Filter by category if specified
  let candidates = category
    ? dishes.filter(d => d.category === category)
    : dishes

  if (candidates.length === 0) {
    candidates = dishes
  }

  // Step 2: Dedup filter
  const { filtered, relaxed } = filterRecentDishes(candidates, recentDishIds)
  candidates = filtered

  // Step 3: Compute per-dish weight
  const weights = candidates.map(dish => {
    let w = 1.0

    // Weather match
    w *= dish.suitableWeather.includes(weatherType) ? 2.0 : 1.0

    // Meal time
    const mtWeight = MEAL_TIME_WEIGHTS[mealTime][dish.category]
    w *= mtWeight !== undefined ? mtWeight : 1.0

    // Category preference from learning
    const catPref = categoryWeights.get(dish.category)
    if (catPref !== undefined) w *= catPref

    // Tag boosts from learning
    for (const tag of dish.tags) {
      const boost = tagBoosts.get(tag)
      if (boost !== undefined) w += boost
    }

    // Seasonal
    const seasonalTags = getSeasonalTags()
    w *= seasonalBoost(dish, seasonalTags)

    // Avoidance penalty
    for (const avoid of preferences.avoid) {
      if (dish.tags.some(t => t.includes(avoid) || avoid.includes(t))
          || dish.name.includes(avoid)) {
        w *= 0.05
        break
      }
    }

    // Taste preference boost
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

  // Step 4: Weighted random selection
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

// Keep backward-compatible exports
export { getWeatherType } from './random-compat'
```

Wait — `getWeatherType` is currently defined in `random.ts`. Let me keep it here and not split:

```typescript
import { Dish, WeatherInfo, WeatherType, UserAction, UserPreference } from './types'

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
```

- [ ] **Step 2: Commit**

```bash
git add utils/random.ts
git commit -m "feat(random): upgrade to multi-dimension smartRandom with dedup, meal time, preferences"
```

---

### Task 6: Track confirm/skip in dish-modal

**Files:**
- Modify: `components/dish-modal/dish-modal.ts`

- [ ] **Step 1: Emit dishId on change and confirm events**

Update `components/dish-modal/dish-modal.ts` so it passes `dishId` in both `change` and `confirm` events, enabling the parent page to record user actions.

```typescript
import { Dish } from '../../utils/types'

Component({
  properties: {
    dish: {
      type: Object,
      value: null as Dish | null,
    },
    visible: {
      type: Boolean,
      value: false,
    },
    source: {
      type: String,
      value: 'random',
    },
  },
  methods: {
    onChange() {
      this.triggerEvent('change', { dishId: this.properties.dish?.id })
    },
    onConfirm() {
      this.triggerEvent('confirm', { dish: this.properties.dish, dishId: this.properties.dish?.id })
    },
    onClose() {
      this.triggerEvent('close')
    },
  },
})
```

> Note: The `source` property is kept for Phase 2 but unused in Phase 1. It's preserved for the OCR page which sets it explicitly.

- [ ] **Step 2: Commit**

```bash
git add components/dish-modal/dish-modal.ts
git commit -m "feat(dish-modal): emit dishId on change and confirm for preference tracking"
```

---

### Task 7: Update index page logic

**Files:**
- Modify: `pages/index/index.ts`

- [ ] **Step 1: Wire smartRandom with dedup, meal time, and preferences**

Rewrite `pages/index/index.ts` to use the new `smartRandom` function, passing dedup, meal time, and preference data. Also compute seasonal tags for display.

```typescript
import { Dish, WeatherInfo, WeatherType } from '../../utils/types'
import { recipeLibrary } from '../../utils/recipe-data'
import { getWeatherType, smartRandom, getMealTime, getSeasonalTags } from '../../utils/random'
import { addHistory, getHistory, getPreference, getUserActions, addUserAction } from '../../utils/storage'
import { computePreferenceWeights, buildDishMap } from '../../utils/preference-engine'
import { fetchWeather, fetchCityName } from '../../utils/weather-api'

Page({
  data: {
    weather: null as WeatherInfo | null,
    weatherLoading: true,
    weatherError: '',
    weatherType: 'mild' as WeatherType,
    recommendDish: null as Dish | null,
    currentDish: null as Dish | null,
    modalVisible: false,
    activeCategory: '',
    seasonalTags: [] as string[],
    mealTimeLabel: '',
    dedupRelaxed: false,
  },

  onLoad() {
    this.getLocation()
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.loadWeather(res.latitude, res.longitude)
      },
      fail: () => {
        this.setData({
          weatherLoading: false,
          weatherError: '无法获取位置，下拉刷新重试',
        })
      },
    })
  },

  async loadWeather(lat: number, lon: number) {
    try {
      const [weather, city] = await Promise.all([
        fetchWeather(lat, lon),
        fetchCityName(lat, lon),
      ])
      weather.city = city
      const weatherType = getWeatherType(weather)

      const mealTime = getMealTime()
      const pref = getPreference()
      const history = getHistory()
      const actions = getUserActions()
      const dishMap = buildDishMap(recipeLibrary)

      const cutoff = Date.now() - pref.dedupDays * 86400000
      const recentDishIds = new Set(
        history.filter(h => h.createdAt > cutoff).map(h => h.dishId)
      )

      const { categoryWeights, tagBoosts } = computePreferenceWeights(actions, dishMap)

      const result = smartRandom(recipeLibrary, {
        weatherType,
        recentDishIds,
        mealTime,
        categoryWeights,
        tagBoosts,
        preferences: pref,
      })

      const seasonalTags = getSeasonalTags()
      const mealTimeLabels: Record<string, string> = {
        breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐',
      }

      this.setData({
        weather,
        weatherType,
        recommendDish: result.dish,
        dedupRelaxed: result.relaxed,
        seasonalTags,
        mealTimeLabel: mealTimeLabels[mealTime] || '',
        weatherLoading: false,
      })
    } catch {
      this.setData({
        weatherLoading: false,
        weatherError: '天气获取失败',
      })
    }
  },

  onRandomTap() {
    const mealTime = getMealTime()
    const pref = getPreference()
    const history = getHistory()
    const actions = getUserActions()
    const dishMap = buildDishMap(recipeLibrary)

    const cutoff = Date.now() - pref.dedupDays * 86400000
    const recentDishIds = new Set(
      history.filter(h => h.createdAt > cutoff).map(h => h.dishId)
    )

    const { categoryWeights, tagBoosts } = computePreferenceWeights(actions, dishMap)

    const result = smartRandom(recipeLibrary, {
      weatherType: this.data.weatherType,
      category: this.data.activeCategory || undefined,
      recentDishIds,
      mealTime,
      categoryWeights,
      tagBoosts,
      preferences: pref,
    })

    this.setData({
      currentDish: result.dish,
      modalVisible: true,
      dedupRelaxed: result.relaxed,
    })

    if (result.relaxed) {
      wx.showToast({ title: '最近吃的都过滤了，已放宽范围', icon: 'none', duration: 2000 })
    }
  },

  onChangeDish(e: any) {
    // Record skip action
    const dishId = e.detail.dishId
    if (dishId) {
      addUserAction({ dishId, action: 'skip', timestamp: Date.now() })
    }

    const mealTime = getMealTime()
    const pref = getPreference()
    const history = getHistory()
    const actions = getUserActions()
    const dishMap = buildDishMap(recipeLibrary)

    const cutoff = Date.now() - pref.dedupDays * 86400000
    const recentDishIds = new Set(
      history.filter(h => h.createdAt > cutoff).map(h => h.dishId)
    )

    const { categoryWeights, tagBoosts } = computePreferenceWeights(actions, dishMap)

    const result = smartRandom(recipeLibrary, {
      weatherType: this.data.weatherType,
      category: this.data.activeCategory || undefined,
      recentDishIds,
      mealTime,
      categoryWeights,
      tagBoosts,
      preferences: pref,
    })

    this.setData({ currentDish: result.dish })
  },

  onConfirmDish(e: any) {
    const dish: Dish = e.detail.dish
    const dishId = e.detail.dishId

    // Record confirm action
    if (dishId) {
      addUserAction({ dishId, action: 'confirm', timestamp: Date.now() })
    }

    addHistory({
      id: Date.now().toString(),
      dishId: dish.id,
      dishName: dish.name,
      emoji: dish.emoji,
      source: 'random',
      weather: this.data.weather?.text,
      createdAt: Date.now(),
    })
    this.setData({ modalVisible: false })
    wx.showToast({ title: '已记录', icon: 'success' })
  },

  onCloseModal() {
    this.setData({ modalVisible: false })
  },

  onCategoryTap(e: any) {
    const category = e.currentTarget.dataset.category
    this.setData({
      activeCategory: this.data.activeCategory === category ? '' : category,
    })
  },

  onRefresh() {
    this.setData({ weatherLoading: true, weatherError: '' })
    this.getLocation()
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add pages/index/index.ts
git commit -m "feat(index): wire smartRandom with dedup, meal time, and preference tracking"
```

---

### Task 8: Update index page UI

**Files:**
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

- [ ] **Step 1: Add seasonal highlights and meal time indicator to the template**

Update `pages/index/index.wxml` to add a seasonal tags row and meal time label:

```xml
<view class="container">
  <weather-bar
    weather="{{weather}}"
    loading="{{weatherLoading}}"
    error="{{weatherError}}"
    bindtap="onRefresh"
  >{{weatherType === 'rainy' ? '暖身热食' : weatherType === 'hot' ? '清爽凉菜' : weatherType === 'cold' ? '暖身炖菜' : '任意菜'}} · {{mealTimeLabel}}</weather-bar>

  <view class="recommend-card" wx:if="{{recommendDish}}">
    <view class="recommend-label">今日适合吃</view>
    <view class="recommend-name">{{recommendDish.emoji}} {{recommendDish.name}}</view>
    <view class="recommend-meta">
      {{recommendDish.tags[0]}} · {{recommendDish.difficulty === 'easy' ? '简单' : recommendDish.difficulty === 'medium' ? '中等' : '复杂'}}
      <text wx:if="{{recommendDish.priceLevel}}"> · {{recommendDish.priceLevel === 1 ? '实惠' : recommendDish.priceLevel === 2 ? '适中' : '小贵'}}</text>
      <text wx:if="{{recommendDish.calories}}"> · 约{{recommendDish.calories}}千卡</text>
    </view>
    <view wx:if="{{dedupRelaxed}}" class="dedup-notice">最近吃过的已过滤，范围已放宽</view>
  </view>

  <view class="seasonal-bar" wx:if="{{seasonalTags.length > 0}}">
    <text class="seasonal-label">⏳ 时令食材：</text>
    <text class="seasonal-tags">{{seasonalTags.join(' · ')}}</text>
  </view>

  <view class="random-section">
    <view class="random-btn" bindtap="onRandomTap">
      <text>随机\n吃什么</text>
    </view>
    <view class="random-hint">点我试试</view>
  </view>

  <view class="category-tags">
    <view
      wx:for="{{['noodle', 'rice', 'stew', 'cold']}}"
      wx:key="*this"
      class="category-tag {{activeCategory === item ? 'active' : ''}}"
      data-category="{{item}}"
      bindtap="onCategoryTap"
    >{{item === 'noodle' ? '🍜 面食' : item === 'rice' ? '🍚 米饭' : item === 'stew' ? '🥘 炖菜' : '🥗 凉拌'}}</view>
  </view>

  <dish-modal
    dish="{{currentDish}}"
    visible="{{modalVisible}}"
    bindchange="onChangeDish"
    bindconfirm="onConfirmDish"
    bindclose="onCloseModal"
  />
</view>
```

- [ ] **Step 2: Add styles for new elements**

Append to `pages/index/index.wxss`:

```css
.seasonal-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 32rpx;
  margin: 0 32rpx 20rpx;
  background: rgba(255,255,255,0.7);
  border-radius: 16rpx;
  font-size: 24rpx;
}

.seasonal-label {
  color: #666666;
  flex-shrink: 0;
}

.seasonal-tags {
  color: #333333;
  font-weight: 500;
}

.dedup-notice {
  font-size: 22rpx;
  color: #f0a060;
  margin-top: 8rpx;
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/index/index.wxml pages/index/index.wxss
git commit -m "feat(index): add seasonal bar, meal time label, and dedup notice to UI"
```

---

### Task 9: Update profile page with enhanced preferences

**Files:**
- Modify: `pages/profile/profile.ts`
- Modify: `pages/profile/profile.wxml`
- Modify: `pages/profile/profile.wxss`

- [ ] **Step 1: Rewrite profile page logic for multi-select taste and dedup slider**

Update `pages/profile/profile.ts`:

```typescript
import { UserPreference } from '../../utils/types'
import { getPreference, setPreference } from '../../utils/storage'

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '微信用户',
    },
    preference: { taste: [], avoid: [], dedupDays: 3 } as UserPreference,
    dedupDaysLabel: '3天',
  },

  onShow() {
    this.loadPreference()
  },

  onChooseAvatar(e: any) {
    this.setData({ 'userInfo.avatarUrl': e.detail.avatarUrl })
  },

  loadPreference() {
    const pref = getPreference()
    this.setData({
      preference: pref,
      dedupDaysLabel: pref.dedupDays === 0 ? '不限制' : `${pref.dedupDays}天`,
    })
  },

  onTasteSetting() {
    const tastes = ['不辣', '微辣', '中辣', '重辣', '清淡', '重口', '酸辣', '麻辣', '清甜']
    const current = this.data.preference.taste

    wx.showActionSheet({
      itemList: tastes.map(t => current.includes(t) ? `${t} ✓` : t),
      success: (res) => {
        const selected = tastes[res.tapIndex]
        let newTastes = [...current]
        const idx = newTastes.indexOf(selected)
        if (idx > -1) {
          newTastes.splice(idx, 1)
        } else {
          newTastes.push(selected)
        }
        const pref = { ...this.data.preference, taste: newTastes }
        setPreference(pref)
        this.setData({ preference: pref })
        wx.showToast({ title: idx > -1 ? `已移除 ${selected}` : `已添加 ${selected}`, icon: 'success' })
      },
    })
  },

  onAvoidSetting() {
    const avoidOptions = ['海鲜', '内脏', '香菜', '香菇', '羊肉', '鸭肉', '猪肉', '牛肉', '鸡蛋', '花生']
    const currentAvoid = this.data.preference.avoid || []

    wx.showActionSheet({
      itemList: avoidOptions.map(a => currentAvoid.includes(a) ? `${a} ✓` : a),
      success: (res) => {
        const selected = avoidOptions[res.tapIndex]
        let avoid = [...currentAvoid]
        const idx = avoid.indexOf(selected)
        if (idx > -1) {
          avoid.splice(idx, 1)
        } else {
          avoid.push(selected)
        }
        const pref = { ...this.data.preference, avoid }
        setPreference(pref)
        this.setData({ preference: pref })
        wx.showToast({ title: idx > -1 ? `已移除 ${selected}` : `已添加 ${selected}`, icon: 'success' })
      },
    })
  },

  onDedupSetting() {
    const options = ['不限制', '1天', '3天', '7天']
    const values = [0, 1, 3, 7]
    const current = this.data.preference.dedupDays

    wx.showActionSheet({
      itemList: options.map((o, i) => values[i] === current ? `${o} ✓` : o),
      success: (res) => {
        const newVal = values[res.tapIndex]
        const pref = { ...this.data.preference, dedupDays: newVal }
        setPreference(pref)
        this.setData({
          preference: pref,
          dedupDaysLabel: newVal === 0 ? '不限制' : `${newVal}天`,
        })
      },
    })
  },

  onGoHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '吃什么小程序，帮你解决每天吃什么的选择困难。',
      showCancel: false,
    })
  },

  onFeedback() {
    wx.showModal({
      title: '反馈建议',
      editable: true,
      placeholderText: '说说你的想法...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({ title: '感谢反馈！', icon: 'success' })
        }
      },
    })
  },
})
```

- [ ] **Step 2: Update profile page template**

Update `pages/profile/profile.wxml` to add the dedup setting row:

```xml
<view class="container">
  <view class="user-header">
    <button class="avatar-btn" open-type="chooseAvatar" bindchooseavatar="onChooseAvatar">
      <image
        class="avatar"
        src="{{userInfo.avatarUrl || '/assets/icons/default-avatar.png'}}"
        mode="aspectFill"
      />
    </button>
    <view class="user-name">微信用户</view>
    <view class="user-desc">记录你的美食选择</view>
  </view>

  <view class="menu-group">
    <view class="menu-group-title">偏好设置</view>
    <view class="menu-item" bindtap="onTasteSetting">
      <text>口味偏好</text>
      <text class="menu-value">{{preference.taste.length ? preference.taste.join('、') : '不限'}} ▸</text>
    </view>
    <view class="menu-item" bindtap="onAvoidSetting">
      <text>忌口食材</text>
      <text class="menu-value">{{preference.avoid.length ? preference.avoid.join('、') : '未设置'}} ▸</text>
    </view>
    <view class="menu-item" bindtap="onDedupSetting">
      <text>去重天数</text>
      <text class="menu-value">{{dedupDaysLabel}} ▸</text>
    </view>
  </view>

  <view class="menu-group">
    <view class="menu-item" bindtap="onGoHistory">
      <text>📋 历史记录</text>
      <text class="menu-arrow">▸</text>
    </view>
    <view class="menu-item" bindtap="onAbout">
      <text>ℹ️ 关于我们</text>
      <text class="menu-arrow">▸</text>
    </view>
    <view class="menu-item" bindtap="onFeedback">
      <text>💬 反馈建议</text>
      <text class="menu-arrow">▸</text>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Verify profile WXSS needs no changes**

The existing `pages/profile/profile.wxss` already styles `.menu-item`, `.menu-value`, and `.menu-group` appropriately. No changes needed.

- [ ] **Step 4: Commit**

```bash
git add pages/profile/profile.ts pages/profile/profile.wxml
git commit -m "feat(profile): multi-select taste, expanded avoid list, dedup days setting"
```

---

### Task 10: Add analytics to history page

**Files:**
- Modify: `pages/history/history.ts`
- Modify: `pages/history/history.wxml`
- Modify: `pages/history/history.wxss`

- [ ] **Step 1: Add analytics computation to history page logic**

Update `pages/history/history.ts` to compute stats from history data:

```typescript
import { HistoryRecord } from '../../utils/types'
import { getHistory } from '../../utils/storage'

interface FormattedRecord extends HistoryRecord {
  timeText: string
  sourceText: string
}

interface Stats {
  totalMeals: number
  categoryBreakdown: { label: string; count: number; percent: number }[]
  topDishes: { name: string; emoji: string; count: number }[]
  streakDays: number
  weekCount: number
}

const categoryLabelMap: Record<string, string> = {
  noodle: '面食', rice: '米饭', stew: '炖菜', cold: '凉拌',
  soup: '汤类', stirfry: '炒菜', snack: '小吃',
}

const categoryEmojiMap: Record<string, string> = {
  noodle: '🍜', rice: '🍚', stew: '🥘', cold: '🥗',
  soup: '🥣', stirfry: '🍳', snack: '🍿',
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'weather': return '天气推荐'
    case 'random': return '随机'
    case 'ocr': return '菜单识别'
    default: return ''
  }
}

function computeStats(records: HistoryRecord[]): Stats {
  const now = Date.now()
  const weekAgo = now - 7 * 86400000

  const weekRecords = records.filter(r => r.createdAt > weekAgo)
  const weekCount = weekRecords.length

  // Category breakdown (from dishId prefix: n=r1, r=r2, etc.)
  // Since we don't store category directly in HistoryRecord,
  // we infer from dishId prefix or simply count dish names
  // For this version, count by dish name frequency as proxy
  const categoryCount: Record<string, number> = {}

  // Dish frequency
  const dishFreq: Record<string, { name: string; emoji: string; count: number }> = {}

  for (const r of records) {
    const dishKey = r.dishName
    if (!dishFreq[dishKey]) {
      dishFreq[dishKey] = { name: r.dishName, emoji: r.emoji, count: 0 }
    }
    dishFreq[dishKey].count++
  }

  // Category breakdown - detect category from dishId prefix pattern
  // dishIds: nX=noodle, rX=rice, sX=stew, cX=cold, tX=soup, fX=stirfry, kX=snack
  for (const r of records) {
    let cat = 'other'
    if (r.dishId) {
      const prefix = r.dishId.charAt(0)
      const map: Record<string, string> = {
        n: 'noodle', r: 'rice', s: 'stew', c: 'cold',
        t: 'soup', f: 'stirfry', k: 'snack',
      }
      cat = map[prefix] || 'other'
    }
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  }

  const total = records.length
  const categoryBreakdown = Object.entries(categoryCount)
    .map(([cat, count]) => ({
      label: categoryLabelMap[cat] || cat,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  // Top dishes
  const topDishes = Object.values(dishFreq)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Streak: consecutive days with records (looking back from today)
  const daysWithRecords = new Set<string>()
  for (const r of records) {
    daysWithRecords.add(new Date(r.createdAt).toDateString())
  }

  let streakDays = 0
  const checkDate = new Date()
  for (let i = 0; i < 30; i++) {
    if (daysWithRecords.has(checkDate.toDateString())) {
      streakDays++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return {
    totalMeals: total,
    categoryBreakdown,
    topDishes,
    streakDays,
    weekCount,
  }
}

Page({
  data: {
    records: [] as FormattedRecord[],
    stats: null as Stats | null,
    hasData: false,
  },

  onShow() {
    const records = getHistory()
    const formatted = records.map(r => ({
      ...r,
      timeText: formatTime(r.createdAt),
      sourceText: sourceLabel(r.source),
    }))
    const stats = records.length > 0 ? computeStats(records) : null
    this.setData({
      records: formatted,
      stats,
      hasData: records.length > 0,
    })
  },
})
```

- [ ] **Step 2: Add analytics cards to history template**

Update `pages/history/history.wxml`:

```xml
<view class="container">
  <view wx:if="{{!hasData}}" class="empty">
    <view class="empty-icon">📋</view>
    <view class="empty-text">还没有记录</view>
    <view class="empty-desc">去首页随机一个或扫菜单试试吧</view>
  </view>

  <view wx:else>
    <!-- Analytics Section -->
    <view class="stats-section">
      <view class="stats-row">
        <view class="stat-card">
          <view class="stat-number">{{stats.totalMeals}}</view>
          <view class="stat-label">总记录</view>
        </view>
        <view class="stat-card">
          <view class="stat-number">{{stats.weekCount}}</view>
          <view class="stat-label">本周</view>
        </view>
        <view class="stat-card">
          <view class="stat-number">{{stats.streakDays}}</view>
          <view class="stat-label">连续天数</view>
        </view>
      </view>

      <!-- Category Breakdown -->
      <view class="stats-block" wx:if="{{stats.categoryBreakdown.length > 0}}">
        <view class="block-title">品类分布</view>
        <view class="category-list">
          <view
            wx:for="{{stats.categoryBreakdown}}"
            wx:key="label"
            class="category-row"
          >
            <text class="category-label">{{item.label}}</text>
            <view class="category-bar-wrap">
              <view class="category-bar" style="width: {{item.percent}}%"></view>
            </view>
            <text class="category-pct">{{item.percent}}%</text>
          </view>
        </view>
      </view>

      <!-- Top Dishes -->
      <view class="stats-block" wx:if="{{stats.topDishes.length > 0}}">
        <view class="block-title">最爱 TOP{{stats.topDishes.length}}</view>
        <view class="top-list">
          <view
            wx:for="{{stats.topDishes}}"
            wx:key="name"
            class="top-item"
          >
            <text class="top-emoji">{{item.emoji}}</text>
            <text class="top-name">{{item.name}}</text>
            <text class="top-count">{{item.count}}次</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Record List -->
    <view class="record-list">
      <view class="record-count">共 {{records.length}} 条记录</view>
      <view
        wx:for="{{records}}"
        wx:key="id"
        class="record-item"
      >
        <view class="record-emoji">{{item.emoji}}</view>
        <view class="record-info">
          <view class="record-name">{{item.dishName}}</view>
          <view class="record-meta">{{item.timeText}} · {{item.sourceText}}</view>
        </view>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Add analytics styles**

Append analytics styles to `pages/history/history.wxss`:

```css
.stats-section {
  padding: 24rpx 32rpx;
}

.stats-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.stat-number {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
  line-height: 1.2;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
}

.stats-block {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.block-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.category-label {
  width: 80rpx;
  font-size: 24rpx;
  color: #666666;
  flex-shrink: 0;
}

.category-bar-wrap {
  flex: 1;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.category-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffa940, #ff7875);
  border-radius: 8rpx;
  min-width: 8rpx;
}

.category-pct {
  width: 60rpx;
  font-size: 22rpx;
  color: #999999;
  text-align: right;
  flex-shrink: 0;
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.top-emoji {
  font-size: 36rpx;
  width: 48rpx;
  text-align: center;
}

.top-name {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
}

.top-count {
  font-size: 24rpx;
  color: #999999;
}

.record-list {
  padding: 0 32rpx;
}
```

- [ ] **Step 4: Commit**

```bash
git add pages/history/history.ts pages/history/history.wxml pages/history/history.wxss
git commit -m "feat(history): add analytics dashboard with stats, category breakdown, top dishes"
```

---

### Task 11: Wire enhanced random in menu-detail and OCR pages

**Files:**
- Modify: `pages/menu-detail/menu-detail.ts`
- Modify: `pages/ocr/ocr.ts`

- [ ] **Step 1: Update menu-detail to track preferences and use smart context**

In `pages/menu-detail/menu-detail.ts`, the random pick operates on custom dishes (not the recipe library), so it uses `uniformRandom`. The change here is to also record user actions for preference learning.

Add `addUserAction` import and record actions in `onChangeDish` and `onConfirmDish`:

At the top, update the import:

```typescript
import {
  getCustomDishes,
  addCustomDish,
  updateCustomDish,
  deleteCustomDish,
  mapCustomDishToDish,
  addHistory,
  addUserAction,
} from '../../utils/storage'
```

In `onChangeDish` method (after line 73), add action recording:

```typescript
onChangeDish() {
  if (this.data.dishes.length === 0) return
  // Record skip on current dish
  if (this.data.modalDish) {
    addUserAction({ dishId: this.data.modalDish.id, action: 'skip', timestamp: Date.now() })
  }
  const dish = uniformRandom(this.data.dishes)
  this.setData({ modalDish: mapCustomDishToDish(dish) })
},
```

In `onConfirmDish`, add action recording before the existing `addHistory` call:

```typescript
onConfirmDish(e: WechatMiniprogram.CustomEvent) {
  const dish: Dish = e.detail.dish
  addUserAction({ dishId: dish.id, action: 'confirm', timestamp: Date.now() })
  addHistory({
    id: Date.now().toString(),
    dishId: dish.id,
    dishName: dish.name,
    emoji: dish.emoji,
    source: 'random',
    createdAt: Date.now(),
  })
  this.setData({ modalVisible: false })
  wx.showToast({ title: '就它了！', icon: 'success' })
},
```

- [ ] **Step 2: Update OCR page to record actions**

In `pages/ocr/ocr.ts`, similarly add `addUserAction` import and record actions. Since OCR dishes don't have Dish IDs, use the dish name as the identifier.

Update the import:

```typescript
import { addHistory, addUserAction } from '../../utils/storage'
```

In `onChangeDish`:

```typescript
onChangeDish() {
  // Record skip
  if (this.data.selectedDish) {
    addUserAction({ dishId: `ocr:${this.data.selectedDish}`, action: 'skip', timestamp: Date.now() })
  }
  const dish = uniformRandom(this.data.dishes)
  this.setData({ selectedDish: dish as string })
},
```

In `onConfirmDish`:

```typescript
onConfirmDish(e: any) {
  const dishName: string = e.detail.dish || this.data.selectedDish
  addUserAction({ dishId: `ocr:${dishName}`, action: 'confirm', timestamp: Date.now() })
  addHistory({
    id: Date.now().toString(),
    dishId: '',
    dishName,
    emoji: '📷',
    source: 'ocr',
    createdAt: Date.now(),
  })
  this.setData({ modalVisible: false })
  wx.showToast({ title: '已记录', icon: 'success' })
},
```

- [ ] **Step 3: Commit**

```bash
git add pages/menu-detail/menu-detail.ts pages/ocr/ocr.ts
git commit -m "feat: wire preference tracking in menu-detail and OCR pages"
```

---

### Task 12: Final integration and verification

**Files:** All modified files

- [ ] **Step 1: Verify no TypeScript compilation errors**

Run the WeChat Mini Program IDE's compile check (or `tsc --noEmit` if configured):

```bash
npx tsc --noEmit 2>&1 | head -50
```

Expected: no errors related to the changed files.

- [ ] **Step 2: Verify all imports resolve correctly**

```bash
# Quick grep for any broken imports
grep -rn "from '\.\./\.\./utils/random'" pages/ --include="*.ts"
grep -rn "from '\.\./\.\./utils/storage'" pages/ --include="*.ts"
grep -rn "from '\.\./\.\./utils/preference-engine'" pages/ --include="*.ts"
```

All should show valid imports.

- [ ] **Step 3: Manual verification checklist in WeChat DevTools**

1. **Index page**: Open the app → weather loads → recommend dish shows with meal time and price info → seasonal bar displays
2. **Random pick**: Tap "随机吃什么" → dish modal appears with relevant dish → tap "换一个" → new dish appears (skip recorded) → tap "就这个" → confirm recorded
3. **Dedup**: Pick the same dish multiple times → after confirming, it should not appear in the next 3 days (by default)
4. **Profile → preferences**: Set taste to "重口" + avoid "海鲜" → random picks should favor "重口" tagged dishes and avoid seafood
5. **Profile → dedup**: Change to "7天" or "不限制" → verify behavior
6. **History**: Check analytics cards → total, week count, streak, category bars, top dishes all display
7. **Menu detail / OCR**: Pick dishes → confirm/skip actions are recorded → preferences influence future picks

- [ ] **Step 4: Commit any final tweaks**

```bash
git add -A
git commit -m "chore: final integration tweaks for Phase 1 features"
```
