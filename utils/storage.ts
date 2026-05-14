import { HistoryRecord, UserPreference } from './types'

const HISTORY_KEY = 'eat_what_history'
const PREFERENCE_KEY = 'eat_what_preference'
const MAX_HISTORY = 100

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
    return wx.getStorageSync(PREFERENCE_KEY) || { taste: '不限', avoid: [] }
  } catch {
    return { taste: '不限', avoid: [] }
  }
}

export function setPreference(pref: UserPreference): void {
  wx.setStorageSync(PREFERENCE_KEY, pref)
}
