import { UserAction, Dish } from './types'

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
