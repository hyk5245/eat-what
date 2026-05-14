# 吃什么小程序 - 开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款微信小程序，根据天气推荐菜品、随机生成菜品、OCR 识别菜单照片。

**Architecture:** 原生微信小程序 + TypeScript，纯前端 + 本地存储。和风天气 API 获取天气，微信云开发 OCR 识别菜单。4 个页面（首页/扫菜单/历史/我的），2 个组件（天气栏/菜品弹窗），4 个工具模块。

**Tech Stack:** 微信小程序原生框架、TypeScript、和风天气 API、微信云开发 OCR

**前置准备：**
1. 注册微信小程序 AppID
2. 在微信开发者工具中开启云开发（用于 OCR）
3. 注册和风天气 API Key（免费版）：https://dev.qweather.com

---

### Task 1: 项目脚手架与全局配置

**Files:**
- Create: `app.json`, `app.ts`, `app.wxss`, `utils/types.ts`
- Create: `project.config.json`

- [ ] **Step 1: 创建项目配置文件**

创建 `project.config.json`：
```json
{
  "description": "吃什么小程序",
  "packOptions": { "ignore": [] },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": true,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "ignoreDevUnusedFiles": false
  },
  "compileType": "miniprogram",
  "libVersion": "3.6.0",
  "appid": "YOUR_APPID",
  "projectname": "eat-what",
  "condition": {}
}
```

- [ ] **Step 2: 创建 app.json — 页面路由 + 底部 TabBar**

```json
{
  "pages": [
    "pages/index/index",
    "pages/ocr/ocr",
    "pages/history/history",
    "pages/profile/profile"
  ],
  "window": {
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTitleText": "吃什么",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f7fa"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#333333",
    "backgroundColor": "#ffffff",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "assets/icons/home.png",
        "selectedIconPath": "assets/icons/home-active.png"
      },
      {
        "pagePath": "pages/ocr/ocr",
        "text": "扫菜单",
        "iconPath": "assets/icons/scan.png",
        "selectedIconPath": "assets/icons/scan-active.png"
      },
      {
        "pagePath": "pages/history/history",
        "text": "历史",
        "iconPath": "assets/icons/history.png",
        "selectedIconPath": "assets/icons/history-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "assets/icons/profile.png",
        "selectedIconPath": "assets/icons/profile-active.png"
      }
    ]
  },
  "cloud": true
}
```

- [ ] **Step 3: 创建 app.ts — 应用入口，初始化云开发**

```typescript
App<IAppOption>({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'YOUR_CLOUD_ENV_ID',
        traceUser: true
      })
    }
  }
})
```

- [ ] **Step 4: 创建 app.wxss — 全局样式**

```css
page {
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #333333;
  font-size: 28rpx;
}

.container {
  padding: 32rpx;
  min-height: 100vh;
  box-sizing: border-box;
}
```

- [ ] **Step 5: 创建 utils/types.ts — 全局类型定义**

```typescript
export interface Dish {
  id: string
  name: string
  category: 'noodle' | 'rice' | 'stew' | 'cold' | 'soup' | 'stirfry' | 'snack'
  suitableWeather: WeatherType[]
  cookingTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  emoji: string
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
  taste: string
  avoid: string[]
}
```

- [ ] **Step 6: 提交**

```bash
git add app.json app.ts app.wxss project.config.json utils/types.ts
git commit -m "feat: 项目脚手架与全局配置"
```

---

### Task 2: 内置菜谱库

**Files:**
- Create: `utils/recipe-data.ts`

- [ ] **Step 1: 创建菜谱数据文件**

```typescript
import { Dish } from './types'

export const recipeLibrary: Dish[] = [
  // 面食类
  { id: '1', name: '番茄鸡蛋面', category: 'noodle', suitableWeather: ['rainy', 'cold', 'mild'], cookingTime: 15, difficulty: 'easy', tags: ['家常', '快手'], emoji: '🍜' },
  { id: '2', name: '炸酱面', category: 'noodle', suitableWeather: ['mild', 'hot'], cookingTime: 20, difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🍝' },
  { id: '3', name: '红烧牛肉面', category: 'noodle', suitableWeather: ['rainy', 'cold'], cookingTime: 60, difficulty: 'medium', tags: ['硬菜', '暖身'], emoji: '🍜' },
  { id: '4', name: '阳春面', category: 'noodle', suitableWeather: ['rainy', 'cold', 'mild'], cookingTime: 10, difficulty: 'easy', tags: ['清淡', '快手'], emoji: '🍲' },
  { id: '5', name: '葱油拌面', category: 'noodle', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '下饭'], emoji: '🍝' },

  // 米饭类
  { id: '6', name: '红烧排骨', category: 'rice', suitableWeather: ['mild', 'cold'], cookingTime: 45, difficulty: 'medium', tags: ['硬菜', '下饭'], emoji: '🍖' },
  { id: '7', name: '番茄炒蛋', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['家常', '快手'], emoji: '🍅' },
  { id: '8', name: '宫保鸡丁', category: 'rice', suitableWeather: ['mild', 'cold'], cookingTime: 25, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥜' },
  { id: '9', name: '回锅肉', category: 'rice', suitableWeather: ['mild', 'cold'], cookingTime: 30, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥩' },
  { id: '10', name: '鱼香肉丝', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 20, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥕' },
  { id: '11', name: '蒜蓉西兰花', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['清淡', '快手'], emoji: '🥦' },
  { id: '12', name: '酸辣土豆丝', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 15, difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🥔' },

  // 炖菜/煲类
  { id: '13', name: '番茄牛腩煲', category: 'stew', suitableWeather: ['rainy', 'cold'], cookingTime: 90, difficulty: 'hard', tags: ['硬菜', '暖身'], emoji: '🥘' },
  { id: '14', name: '红烧肉', category: 'stew', suitableWeather: ['cold', 'mild'], cookingTime: 60, difficulty: 'medium', tags: ['硬菜', '下饭'], emoji: '🍖' },
  { id: '15', name: '土豆炖鸡块', category: 'stew', suitableWeather: ['rainy', 'cold'], cookingTime: 45, difficulty: 'easy', tags: ['家常', '暖身'], emoji: '🍗' },
  { id: '16', name: '排骨炖豆角', category: 'stew', suitableWeather: ['cold', 'rainy'], cookingTime: 50, difficulty: 'medium', tags: ['家常', '暖身'], emoji: '🥩' },

  // 凉菜类
  { id: '17', name: '凉拌黄瓜', category: 'cold', suitableWeather: ['hot', 'mild'], cookingTime: 10, difficulty: 'easy', tags: ['清爽', '快手'], emoji: '🥒' },
  { id: '18', name: '凉拌木耳', category: 'cold', suitableWeather: ['hot', 'mild'], cookingTime: 15, difficulty: 'easy', tags: ['清爽', '健康'], emoji: '🍄' },
  { id: '19', name: '蒜泥白肉', category: 'cold', suitableWeather: ['hot', 'mild'], cookingTime: 30, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥩' },
  { id: '20', name: '拍黄瓜', category: 'cold', suitableWeather: ['hot'], cookingTime: 5, difficulty: 'easy', tags: ['清爽', '快手'], emoji: '🥒' },

  // 汤类
  { id: '21', name: '酸辣汤', category: 'soup', suitableWeather: ['rainy', 'cold'], cookingTime: 20, difficulty: 'easy', tags: ['开胃', '暖身'], emoji: '🥣' },
  { id: '22', name: '紫菜蛋花汤', category: 'soup', suitableWeather: ['rainy', 'cold', 'mild'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '清淡'], emoji: '🍲' },
  { id: '23', name: '番茄蛋花汤', category: 'soup', suitableWeather: ['mild', 'rainy'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '家常'], emoji: '🍅' },
  { id: '24', name: '冬瓜排骨汤', category: 'soup', suitableWeather: ['hot', 'mild'], cookingTime: 60, difficulty: 'medium', tags: ['清淡', '健康'], emoji: '🥣' },

  // 炒菜类
  { id: '25', name: '蒜蓉空心菜', category: 'stirfry', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '清淡'], emoji: '🥬' },
  { id: '26', name: '青椒肉丝', category: 'stirfry', suitableWeather: ['mild', 'cold'], cookingTime: 15, difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🫑' },
  { id: '27', name: '地三鲜', category: 'stirfry', suitableWeather: ['mild', 'cold'], cookingTime: 25, difficulty: 'medium', tags: ['家常', '下饭'], emoji: '🍆' },
  { id: '28', name: '干煸四季豆', category: 'stirfry', suitableWeather: ['mild', 'hot'], cookingTime: 20, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🫘' },

  // 小吃/快手
  { id: '29', name: '蛋炒饭', category: 'snack', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '家常'], emoji: '🍚' },
  { id: '30', name: '煎饺', category: 'snack', suitableWeather: ['mild', 'cold'], cookingTime: 15, difficulty: 'easy', tags: ['快手', '下饭'], emoji: '🥟' },
  { id: '31', name: '炒年糕', category: 'snack', suitableWeather: ['rainy', 'cold'], cookingTime: 20, difficulty: 'easy', tags: ['快手', '暖身'], emoji: '🍡' },
  { id: '32', name: '麻辣香锅', category: 'snack', suitableWeather: ['rainy', 'cold'], cookingTime: 30, difficulty: 'medium', tags: ['重口', '下饭'], emoji: '🌶️' },
]

export const categoryLabels: Record<string, string> = {
  noodle: '面食',
  rice: '米饭',
  stew: '炖菜',
  cold: '凉拌',
  soup: '汤类',
  stirfry: '炒菜',
  snack: '小吃',
}
```

- [ ] **Step 2: 提交**

```bash
git add utils/recipe-data.ts
git commit -m "feat: 添加内置菜谱库（32道）"
```

---

### Task 3: 随机算法

**Files:**
- Create: `utils/random.ts`

- [ ] **Step 1: 创建随机工具模块**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add utils/random.ts
git commit -m "feat: 随机算法（加权+均匀）"
```

---

### Task 4: 本地存储工具

**Files:**
- Create: `utils/storage.ts`

- [ ] **Step 1: 创建存储工具模块**

```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add utils/storage.ts
git commit -m "feat: 本地存储工具"
```

---

### Task 5: 天气 API 封装

**Files:**
- Create: `utils/weather-api.ts`

- [ ] **Step 1: 创建天气 API 模块**

```typescript
import { WeatherInfo } from './types'

const QWEATHER_KEY = 'YOUR_QWEATHER_KEY'
const BASE_URL = 'https://devapi.qweather.com/v7'

export function fetchWeather(lat: number, lon: number): Promise<WeatherInfo> {
  const location = `${lon.toFixed(2)},${lat.toFixed(2)}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/weather/now`,
      data: {
        location,
        key: QWEATHER_KEY,
      },
      success(res: any) {
        if (res.data.code === '200') {
          const now = res.data.now
          resolve({
            temp: parseInt(now.temp),
            text: now.text,
            code: now.icon,
            city: '',
          })
        } else {
          reject(new Error(`天气 API 错误: ${res.data.code}`))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

export function fetchCityName(lat: number, lon: number): Promise<string> {
  const location = `${lon.toFixed(2)},${lat.toFixed(2)}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/city/lookup`,
      data: {
        location,
        key: QWEATHER_KEY,
      },
      success(res: any) {
        if (res.data.code === '200' && res.data.location && res.data.location.length > 0) {
          resolve(res.data.location[0].name)
        } else {
          resolve('未知城市')
        }
      },
      fail() {
        resolve('未知城市')
      },
    })
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add utils/weather-api.ts
git commit -m "feat: 和风天气 API 封装"
```

---

### Task 6: OCR 工具模块

**Files:**
- Create: `utils/ocr.ts`

- [ ] **Step 1: 创建 OCR 工具模块**

```typescript
/** 调用微信云开发 OCR 识别菜品名 */
export function recognizeDishes(imagePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    wx.cloud
      .callFunction({
        name: 'ocr',
        data: { imagePath },
      })
      .then((res: any) => {
        const text = res.result?.text || ''
        const lines = text
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
        resolve(lines)
      })
      .catch(reject)
  })
}

/** 使用微信本地 OCR（需基础库 2.20.1+） */
export function recognizeDishesLocal(imagePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'ocrDetail',
      data: {
        imgUrl: imagePath,
        dataType: 3,
      },
      success(res: any) {
        const items = res.result?.items || []
        const names = items.map((item: any) => item.text.trim()).filter((n: string) => n)
        resolve(names)
      },
      fail(err) {
        reject(err)
      },
    })
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add utils/ocr.ts
git commit -m "feat: OCR 识别工具模块"
```

---

### Task 7: 天气栏组件

**Files:**
- Create: `components/weather-bar/weather-bar.json`
- Create: `components/weather-bar/weather-bar.ts`
- Create: `components/weather-bar/weather-bar.wxml`
- Create: `components/weather-bar/weather-bar.wxss`

- [ ] **Step 1: 组件配置 `weather-bar.json`**

```json
{
  "component": true,
  "usingComponents": {}
}
```

- [ ] **Step 2: 组件逻辑 `weather-bar.ts`**

```typescript
import { WeatherInfo } from '../../utils/types'

Component({
  properties: {
    weather: {
      type: Object,
      value: null as WeatherInfo | null,
    },
    loading: {
      type: Boolean,
      value: false,
    },
    error: {
      type: String,
      value: '',
    },
  },
  data: {
    weatherEmoji: '',
  },
  observers: {
    weather(weather: WeatherInfo | null) {
      if (!weather) return
      const code = weather.code
      let emoji = '🌤️'
      if (code.includes('rain') || code.includes('drizzle')) emoji = '🌧️'
      else if (code.includes('snow')) emoji = '❄️'
      else if (code.includes('100') || code.includes('sunny')) emoji = '☀️'
      else if (code.includes('cloud')) emoji = '☁️'
      this.setData({ weatherEmoji: emoji })
    },
  },
})
```

- [ ] **Step 3: 组件模板 `weather-bar.wxml`**

```xml
<view class="weather-bar">
  <block wx:if="{{loading}}">
    <view class="weather-loading">获取天气中...</view>
  </block>
  <block wx:elif="{{error}}">
    <view class="weather-error">{{error}}</view>
  </block>
  <block wx:elif="{{weather}}">
    <view class="weather-emoji">{{weatherEmoji}}</view>
    <view class="weather-info">
      <view class="weather-city">{{weather.city}} · 今天</view>
      <view class="weather-temp">{{weather.temp}}°C {{weather.text}}</view>
    </view>
    <view class="weather-hint">适合吃<slot></slot></view>
  </block>
</view>
```

- [ ] **Step 4: 组件样式 `weather-bar.wxss`**

```css
.weather-bar {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 32rpx;
}

.weather-emoji {
  font-size: 64rpx;
}

.weather-info {
  flex: 1;
}

.weather-city {
  font-size: 26rpx;
  color: #999999;
}

.weather-temp {
  font-size: 40rpx;
  font-weight: 600;
  color: #333333;
}

.weather-hint {
  font-size: 24rpx;
  color: #999999;
}

.weather-loading,
.weather-error {
  font-size: 28rpx;
  color: #999999;
  padding: 16rpx 0;
}
```

- [ ] **Step 5: 提交**

```bash
git add components/weather-bar/
git commit -m "feat: 天气栏组件"
```

---

### Task 8: 菜品弹窗组件

**Files:**
- Create: `components/dish-modal/dish-modal.json`
- Create: `components/dish-modal/dish-modal.ts`
- Create: `components/dish-modal/dish-modal.wxml`
- Create: `components/dish-modal/dish-modal.wxss`

- [ ] **Step 1: 组件配置 `dish-modal.json`**

```json
{
  "component": true,
  "usingComponents": {}
}
```

- [ ] **Step 2: 组件逻辑 `dish-modal.ts`**

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
      value: 'random', // 'random' | 'ocr' | 'weather'
    },
  },
  methods: {
    onChange() {
      this.triggerEvent('change')
    },
    onConfirm() {
      this.triggerEvent('confirm', { dish: this.properties.dish })
    },
    onClose() {
      this.triggerEvent('close')
    },
  },
})
```

- [ ] **Step 3: 组件模板 `dish-modal.wxml`**

```xml
<view class="modal-overlay" wx:if="{{visible}}" bindtap="onClose">
  <view class="modal-content" catchtap="noop">
    <view class="modal-emoji">{{dish.emoji}}</view>
    <view class="modal-name">{{dish.name}}</view>
    <view class="modal-meta">{{dish.tags.join(' · ')}} · {{dish.cookingTime}}分钟 · {{dish.difficulty === 'easy' ? '简单' : dish.difficulty === 'medium' ? '中等' : '复杂'}}</view>
    <view class="modal-actions">
      <view class="action-btn secondary" bindtap="onChange">🔄 换一个</view>
      <view class="action-btn primary" bindtap="onConfirm">👍 就这个</view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: 组件样式 `dish-modal.wxss`**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx;
  margin: 64rpx;
  text-align: center;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.12);
}

.modal-emoji {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.modal-name {
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16rpx;
}

.modal-meta {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 40rpx;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

.action-btn.secondary {
  border: 2rpx solid #e8e8e8;
  color: #666666;
  background: #ffffff;
}

.action-btn.primary {
  background: #333333;
  color: #ffffff;
}
```

- [ ] **Step 5: 提交**

```bash
git add components/dish-modal/
git commit -m "feat: 菜品弹窗组件"
```

---

### Task 9: 首页（index）

**Files:**
- Create: `pages/index/index.json`
- Create: `pages/index/index.ts`
- Create: `pages/index/index.wxml`
- Create: `pages/index/index.wxss`

- [ ] **Step 1: 页面配置 `index.json`**

```json
{
  "usingComponents": {
    "weather-bar": "/components/weather-bar/weather-bar",
    "dish-modal": "/components/dish-modal/dish-modal"
  },
  "navigationBarTitleText": "吃什么"
}
```

- [ ] **Step 2: 页面逻辑 `index.ts`**

```typescript
import { Dish, WeatherInfo, WeatherType } from '../../utils/types'
import { recipeLibrary } from '../../utils/recipe-data'
import { getWeatherType, weightedRandom } from '../../utils/random'
import { addHistory } from '../../utils/storage'
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
      const recommendDish = weightedRandom(recipeLibrary, weatherType)
      this.setData({
        weather,
        weatherType,
        recommendDish,
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
    const dish = weightedRandom(
      recipeLibrary,
      this.data.weatherType,
      this.data.activeCategory || undefined
    )
    this.setData({ currentDish: dish, modalVisible: true })
  },

  onChangeDish() {
    const dish = weightedRandom(
      recipeLibrary,
      this.data.weatherType,
      this.data.activeCategory || undefined
    )
    this.setData({ currentDish: dish })
  },

  onConfirmDish(e: any) {
    const dish: Dish = e.detail.dish
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

- [ ] **Step 3: 页面模板 `index.wxml`**

```xml
<view class="container">
  <weather-bar
    weather="{{weather}}"
    loading="{{weatherLoading}}"
    error="{{weatherError}}"
    bindtap="onRefresh"
  >{{weatherType === 'rainy' ? '暖身热食' : weatherType === 'hot' ? '清爽凉菜' : weatherType === 'cold' ? '暖身炖菜' : '随便吃'}}</weather-bar>

  <view class="recommend-card" wx:if="{{recommendDish}}">
    <view class="recommend-label">今日适合吃</view>
    <view class="recommend-name">{{recommendDish.emoji}} {{recommendDish.name}}</view>
    <view class="recommend-meta">{{recommendDish.tags[0]}} · {{recommendDish.cookingTime}}分钟 · {{recommendDish.difficulty === 'easy' ? '简单' : recommendDish.difficulty === 'medium' ? '中等' : '复杂'}}</view>
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

- [ ] **Step 4: 页面样式 `index.wxss`**

```css
.recommend-card {
  background: #f5f7fa;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-top: 32rpx;
  text-align: center;
}

.recommend-label {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 16rpx;
}

.recommend-name {
  font-size: 56rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16rpx;
}

.recommend-meta {
  font-size: 24rpx;
  color: #999999;
}

.random-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 64rpx 0;
}

.random-btn {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: #333333;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  text-align: center;
  line-height: 1.5;
}

.random-hint {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #999999;
}

.category-tags {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.category-tag {
  background: #f5f7fa;
  border-radius: 40rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  color: #666666;
  transition: all 0.2s;
}

.category-tag.active {
  background: #333333;
  color: #ffffff;
}
```

- [ ] **Step 5: 提交**

```bash
git add pages/index/
git commit -m "feat: 首页（天气推荐+随机+分类筛选）"
```

---

### Task 10: 扫菜单页面（ocr）

**Files:**
- Create: `pages/ocr/ocr.json`
- Create: `pages/ocr/ocr.ts`
- Create: `pages/ocr/ocr.wxml`
- Create: `pages/ocr/ocr.wxss`

- [ ] **Step 1: 页面配置 `ocr.json`**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "扫菜单"
}
```

- [ ] **Step 2: 页面逻辑 `ocr.ts`**

```typescript
import { addHistory } from '../../utils/storage'
import { uniformRandom } from '../../utils/random'

Page({
  data: {
    imagePath: '',
    dishes: [] as string[],
    recognizing: false,
    selectedDish: '',
    modalVisible: false,
  },

  onTakePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.setData({ imagePath: path })
        this.recognizeMenu(path)
      },
    })
  },

  onChooseAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.setData({ imagePath: path })
        this.recognizeMenu(path)
      },
    })
  },

  async recognizeMenu(imagePath: string) {
    this.setData({ recognizing: true, dishes: [] })
    try {
      // 上传到云存储后调用云函数 OCR
      const cloudPath = `ocr-images/${Date.now()}.jpg`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: imagePath,
      })

      const ocrRes = await wx.cloud.callFunction({
        name: 'ocrDetail',
        data: {
          imgUrl: uploadRes.fileID,
          dataType: 3,
        },
      })

      const result = ocrRes.result as any
      const items = result?.items || []
      const dishes = items
        .map((item: any) => item.text.trim())
        .filter((t: string) => t.length > 0)

      if (dishes.length === 0) {
        wx.showToast({ title: '未识别到菜品', icon: 'none' })
      }

      this.setData({ dishes, recognizing: false })

      // 清理云存储
      wx.cloud.deleteFile({ fileList: [uploadRes.fileID] })
    } catch (err) {
      console.error('OCR 失败:', err)
      this.setData({ recognizing: false })
      wx.showToast({ title: '识别失败，请重试', icon: 'none' })
    }
  },

  onDeleteDish(e: any) {
    const index = e.currentTarget.dataset.index
    const dishes = [...this.data.dishes]
    dishes.splice(index, 1)
    this.setData({ dishes })
  },

  onAddDish() {
    wx.showModal({
      title: '添加菜品',
      editable: true,
      placeholderText: '输入菜品名称',
      success: (res) => {
        if (res.confirm && res.content) {
          const dishes = [...this.data.dishes, res.content.trim()]
          this.setData({ dishes })
        }
      },
    })
  },

  onPickOne() {
    if (this.data.dishes.length === 0) {
      wx.showToast({ title: '请先识别菜单', icon: 'none' })
      return
    }
    const dish = uniformRandom(this.data.dishes)
    this.setData({ selectedDish: dish as string, modalVisible: true })
  },

  onChangeDish() {
    const dish = uniformRandom(this.data.dishes)
    this.setData({ selectedDish: dish as string })
  },

  onConfirmDish(e: any) {
    const dishName: string = e.detail.dish || this.data.selectedDish
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

  onCloseModal() {
    this.setData({ modalVisible: false })
  },

  onReset() {
    this.setData({
      imagePath: '',
      dishes: [],
      selectedDish: '',
    })
  },
})
```

- [ ] **Step 3: 页面模板 `ocr.wxml`**

```xml
<view class="container">
  <block wx:if="{{!imagePath && !recognizing}}">
    <view class="upload-area">
      <view class="upload-icon">📷</view>
      <view class="upload-title">拍菜单，帮我选</view>
      <view class="upload-desc">拍照或从相册选择菜单照片</view>
      <view class="upload-actions">
        <view class="upload-btn primary" bindtap="onTakePhoto">📷 拍照</view>
        <view class="upload-btn secondary" bindtap="onChooseAlbum">🖼️ 相册</view>
      </view>
    </view>
  </block>

  <block wx:if="{{recognizing}}">
    <view class="recognizing-area">
      <image class="preview-img" src="{{imagePath}}" mode="aspectFit" />
      <view class="recognizing-mask">
        <view class="loading-spinner"></view>
        <view class="recognizing-text">正在识别菜单中的菜品…</view>
      </view>
    </view>
  </block>

  <block wx:if="{{dishes.length > 0 && !recognizing}}">
    <view class="result-header">
      <text>已识别出 <strong>{{dishes.length}}</strong> 个菜品</text>
      <text class="edit-link" bindtap="onReset">重新拍照</text>
    </view>
    <view class="dish-tags">
      <view
        wx:for="{{dishes}}"
        wx:key="index"
        class="dish-tag"
        data-index="{{index}}"
        bindlongpress="onDeleteDish"
      >{{item}} <text class="tag-close" data-index="{{index}}" bindtap="onDeleteDish">✕</text></view>
      <view class="dish-tag add-tag" bindtap="onAddDish">+ 添加</view>
    </view>
    <view class="pick-btn" bindtap="onPickOne">🎲 帮我选一个</view>
  </block>

  <block wx:if="{{selectedDish && modalVisible}}">
    <view class="modal-overlay" bindtap="onCloseModal">
      <view class="modal-content" catchtap="noop">
        <view class="modal-emoji">🎉</view>
        <view class="modal-name">{{selectedDish}}</view>
        <view class="modal-actions">
          <view class="action-btn secondary" bindtap="onChangeDish">🔄 换一个</view>
          <view class="action-btn primary" bindtap="onConfirmDish">👍 就这个</view>
        </view>
      </view>
    </view>
  </block>
</view>
```

- [ ] **Step 4: 页面样式 `ocr.wxss`**

```css
.upload-area {
  border: 4rpx dashed #d0d0d0;
  border-radius: 32rpx;
  padding: 96rpx 48rpx;
  text-align: center;
  margin-top: 64rpx;
}

.upload-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.upload-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12rpx;
}

.upload-desc {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 32rpx;
}

.upload-actions {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}

.upload-btn {
  border-radius: 16rpx;
  padding: 20rpx 48rpx;
  font-size: 28rpx;
}

.upload-btn.primary {
  background: #333333;
  color: #ffffff;
}

.upload-btn.secondary {
  border: 2rpx solid #d0d0d0;
  color: #333333;
  background: #ffffff;
}

.recognizing-area {
  position: relative;
  border-radius: 24rpx;
  overflow: hidden;
  margin-top: 32rpx;
}

.preview-img {
  width: 100%;
  height: 480rpx;
}

.recognizing-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  margin-bottom: 24rpx;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.recognizing-text {
  font-size: 28rpx;
  color: #ffffff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  color: #333333;
}

.edit-link {
  font-size: 26rpx;
  color: #999999;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 48rpx;
}

.dish-tag {
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 12rpx 24rpx;
  font-size: 28rpx;
  color: #333333;
}

.dish-tag.add-tag {
  border: 2rpx dashed #d0d0d0;
  background: transparent;
  color: #999999;
}

.tag-close {
  margin-left: 8rpx;
  color: #cccccc;
  font-size: 22rpx;
}

.pick-btn {
  background: #333333;
  color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx;
  margin: 64rpx;
  text-align: center;
}

.modal-emoji {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.modal-name {
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 40rpx;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

.action-btn.secondary {
  border: 2rpx solid #e8e8e8;
  color: #666666;
  background: #ffffff;
}

.action-btn.primary {
  background: #333333;
  color: #ffffff;
}
```

- [ ] **Step 5: 提交**

```bash
git add pages/ocr/
git commit -m "feat: 扫菜单页面（拍照+OCR+随机选择）"
```

---

### Task 11: 历史记录页面（history）

**Files:**
- Create: `pages/history/history.json`
- Create: `pages/history/history.ts`
- Create: `pages/history/history.wxml`
- Create: `pages/history/history.wxss`

- [ ] **Step 1: 页面配置 `history.json`**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "历史记录"
}
```

- [ ] **Step 2: 页面逻辑 `history.ts`**

```typescript
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
```

- [ ] **Step 3: 页面模板 `history.wxml`**

```xml
<view class="container">
  <view wx:if="{{records.length === 0}}" class="empty">
    <view class="empty-icon">📋</view>
    <view class="empty-text">还没有记录</view>
    <view class="empty-desc">去首页随机一个或扫菜单试试吧</view>
  </view>

  <view wx:else class="record-list">
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
```

- [ ] **Step 4: 页面样式 `history.wxss`**

```css
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 32rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999999;
}

.record-count {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 24rpx;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  border-bottom: 2rpx solid #f5f5f5;
  padding: 24rpx 0;
}

.record-emoji {
  font-size: 56rpx;
  width: 80rpx;
  text-align: center;
}

.record-info {
  flex: 1;
}

.record-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8rpx;
}

.record-meta {
  font-size: 24rpx;
  color: #999999;
}
```

- [ ] **Step 5: 提交**

```bash
git add pages/history/
git commit -m "feat: 历史记录页面"
```

---

### Task 12: 我的页面（profile）

**Files:**
- Create: `pages/profile/profile.json`
- Create: `pages/profile/profile.ts`
- Create: `pages/profile/profile.wxml`
- Create: `pages/profile/profile.wxss`

- [ ] **Step 1: 页面配置 `profile.json`**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "我的"
}
```

- [ ] **Step 2: 页面逻辑 `profile.ts`**

```typescript
import { UserPreference } from '../../utils/types'
import { getPreference, setPreference } from '../../utils/storage'

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '微信用户',
    },
    preference: {} as UserPreference,
  },

  onShow() {
    this.loadPreference()
  },

  onChooseAvatar(e: any) {
    this.setData({ 'userInfo.avatarUrl': e.detail.avatarUrl })
  },

  loadPreference() {
    this.setData({ preference: getPreference() })
  },

  onTasteSetting() {
    const tastes = ['不辣', '微辣', '中辣', '重辣']
    const current = tastes.indexOf(this.data.preference.taste)

    wx.showActionSheet({
      itemList: tastes,
      success: (res) => {
        const pref = { ...this.data.preference, taste: tastes[res.tapIndex] }
        setPreference(pref)
        this.setData({ preference: pref })
      },
    })
  },

  onAvoidSetting() {
    const currentAvoid = this.data.preference.avoid || []
    const avoidOptions = ['海鲜', '内脏', '香菜', '香菇', '羊肉', '鸭肉']

    wx.showActionSheet({
      itemList: avoidOptions,
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

  onGoHistory() {
    wx.switchTab({ url: '/pages/history/history' })
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

- [ ] **Step 3: 页面模板 `profile.wxml`**

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
      <text class="menu-value">{{preference.taste || '不限'}} ▸</text>
    </view>
    <view class="menu-item" bindtap="onAvoidSetting">
      <text>忌口食材</text>
      <text class="menu-value">{{preference.avoid.length ? preference.avoid.join('、') : '未设置'}} ▸</text>
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

- [ ] **Step 4: 页面样式 `profile.wxss`**

```css
.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 32rpx;
}

.avatar-btn {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  padding: 0;
  margin-bottom: 24rpx;
  background: transparent;
  border: none;
  line-height: 1;
}

.avatar-btn::after {
  border: none;
}

.avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #e8e8e8;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.user-desc {
  font-size: 24rpx;
  color: #999999;
}

.menu-group {
  border: 2rpx solid #e8e8e8;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.menu-group-title {
  padding: 28rpx 32rpx;
  font-size: 26rpx;
  color: #999999;
  background: #fafafa;
  border-bottom: 2rpx solid #e8e8e8;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  font-size: 30rpx;
  color: #333333;
  border-bottom: 2rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-value {
  font-size: 26rpx;
  color: #999999;
}

.menu-arrow {
  font-size: 26rpx;
  color: #cccccc;
}
```

- [ ] **Step 5: 提交**

```bash
git add pages/profile/
git commit -m "feat: 我的页面（偏好设置+入口）"
```

---

### Task 13: TabBar 图标 & 云函数

**Files:**
- Create: `assets/icons/` 目录下 8 个图标文件
- Create: `cloudfunctions/ocrDetail/` 云函数

- [ ] **Step 1: 创建 TabBar 图标**

生成 8 个 81x81 的纯色 PNG 图标（可使用微信开发者工具自动生成或使用简单纯色占位图）：
- `assets/icons/home.png` / `assets/icons/home-active.png`
- `assets/icons/scan.png` / `assets/icons/scan-active.png`
- `assets/icons/history.png` / `assets/icons/history-active.png`
- `assets/icons/profile.png` / `assets/icons/profile-active.png`

可使用简单 SVG 转 PNG 工具生成，或先使用纯色方块占位，后续替换。

- [ ] **Step 2: 创建 OCR 云函数**

创建 `cloudfunctions/ocrDetail/` 目录：

`cloudfunctions/ocrDetail/config.json`：
```json
{
  "permissions": {
    "openapi": ["ocr.printedText"]
  }
}
```

`cloudfunctions/ocrDetail/index.js`：
```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  try {
    const result = await cloud.openapi.ocr.printedText({
      imgUrl: event.imgUrl,
    })
    return { items: result.items, text: result.items.map(i => i.text).join('\n') }
  } catch (err) {
    return { items: [], text: '', error: err.message }
  }
}
```

`cloudfunctions/ocrDetail/package.json`：
```json
{
  "name": "ocrDetail",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

在微信开发者工具中右键 `ocrDetail` 文件夹 → 上传并部署。

- [ ] **Step 3: 提交**

```bash
git add assets/icons/ cloudfunctions/
git commit -m "feat: TabBar 图标与 OCR 云函数"
```

---

### Task 14: 最终集成与验证

- [ ] **Step 1: 创建 `.gitignore`**

```gitignore
node_modules/
miniprogram_npm/
.superpowers/
```

- [ ] **Step 2: 初始化 Git 仓库并提交所有文件**

```bash
git init
git add -A
git commit -m "feat: 吃什么小程序 - 初始版本"
```

- [ ] **Step 3: 验证清单**

在微信开发者工具中打开项目，逐一验证：
1. 首页加载 → 获取天气 → 显示推荐菜品
2. 点击随机按钮 → 弹窗展示菜品 → 换一个/就这个 → 记入历史
3. 点击分类标签 → 筛选后随机
4. 扫菜单 → 拍照 → OCR 识别 → 编辑菜品 → 帮我选
5. 历史记录页面 → 查看历史
6. 我的页面 → 偏好设置 → 跳转历史

---

## 任务依赖图

```
Task 1 (脚手架)
 ├─ Task 2 (菜谱库)
 ├─ Task 3 (随机算法)
 ├─ Task 4 (存储工具)
 ├─ Task 5 (天气 API)
 ├─ Task 6 (OCR 工具)
 ├─ Task 7 (天气栏组件)
 └─ Task 8 (菜品弹窗组件)
      ├─ Task 9 (首页)
      ├─ Task 10 (扫菜单)
      ├─ Task 11 (历史记录)
      └─ Task 12 (我的)
           └─ Task 13 (图标+云函数)
                └─ Task 14 (集成验证)
```
