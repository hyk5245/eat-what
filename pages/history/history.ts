import { HistoryRecord } from '../../utils/types'
import { getHistory } from '../../utils/storage'

interface FormattedRecord extends HistoryRecord {
  timeText: string
  sourceText: string
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

Page({
  data: {
    records: [] as FormattedRecord[],
  },

  onShow() {
    const records = getHistory().map(r => ({
      ...r,
      timeText: formatTime(r.createdAt),
      sourceText: sourceLabel(r.source),
    }))
    this.setData({ records })
  },
})
