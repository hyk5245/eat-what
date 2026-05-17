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

  const categoryCount: Record<string, number> = {}
  const dishFreq: Record<string, { name: string; emoji: string; count: number }> = {}

  for (const r of records) {
    const dishKey = r.dishName
    if (!dishFreq[dishKey]) {
      dishFreq[dishKey] = { name: r.dishName, emoji: r.emoji, count: 0 }
    }
    dishFreq[dishKey].count++
  }

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

  const topDishes = Object.values(dishFreq)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

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
