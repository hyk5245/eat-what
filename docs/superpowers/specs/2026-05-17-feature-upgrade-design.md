# Feature Upgrade Design: "吃什么" 小程序功能升级

Date: 2026-05-17
Status: draft

## Overview

在现有"吃什么"小程序（基于天气的随机菜品推荐 + OCR 扫菜单 + 自定义菜单管理）基础上，分两阶段升级，增强用户粘性并为付费转化打基础。

- **目标用户**: 外卖/食堂选择困难户
- **核心流程**: 扫菜单 → 随机挑选
- **付费方向**: 内容/数据驱动
- **产品定位**: 轻度扩展，保持工具属性

---

## Architecture Changes

```
微信小程序（前端）
  ├── 本地 Storage（用户数据、偏好、历史、自定义菜单、行为记录）
  ├── 云函数（OCR 识别 + 付费内容接口）
  └── 云数据库（精选合集、季节推荐内容）★新增
```

保持轻量，使用微信云开发，无需自建后端。

---

## Data Model Changes

### Enhanced Dish (recipe-data.ts)

```typescript
interface Dish {
  // ...existing fields (id, name, category, suitableWeather, difficulty, tags, emoji)
  mealTime: ('breakfast' | 'lunch' | 'dinner' | 'snack')[]  // 新增：适用餐时
  priceLevel: 1 | 2 | 3                                       // 新增：价格档位
  calories?: number                                            // 新增：估算热量
}
```

### New Types (types.ts)

```typescript
interface UserAction {
  dishId: string
  action: 'confirm' | 'skip'
  timestamp: number
}

interface FeaturedCollection {
  id: string
  title: string
  description: string
  coverEmoji: string
  dishes: string[]
  tags: string[]
  season?: string
  isPremium: boolean
  createdAt: number
}

interface MemberStatus {
  isMember: boolean
  expireAt?: number
}
```

### Core Algorithm Upgrade (random.ts)

现有一维天气加权 → 多维加权：

```
finalWeight = weatherMatch(0~2) × preferenceMatch(0~2) × dedupPenalty(0 or 1) × mealTimeMatch(0.5~1.5)
```

---

## Phase 1: Free Features

All features below are free, targeting improved retention and DAU.

### 1. Smart Dedup

- Exclude dishes eaten within last N days (default 3, configurable: 1/3/7/unlimited)
- If all candidates excluded, auto-relax and notify user
- Applies to both random pick and daily recommendation

### 2. Preference Learning Engine

- Track confirm/skip actions in dish-modal as `UserAction`
- Category preference: confirmed categories get weight boost
- Tag preference: e.g. repeated confirm on "重口" dishes boosts that tag
- Skip decay: skipped categories/tags get slight weight reduction
- Data stored locally, not uploaded

### 3. Meal Time Awareness

| Time | Boost | Reduce |
|------|-------|--------|
| 6:00-10:00 | snack, noodle, soup | stew, heavy |
| 11:00-14:00 | rice, stirfry, noodle | cold dishes (primary) |
| 17:00-21:00 | balanced, slight stew/heavy | - |
| Other | snack, quick | heavy, complex |

### 4. Basic Seasonal Recommendations

- Show seasonal ingredient highlights based on month
- Season-based dish collections
- Extends existing weather recommendation on home page

### 5. Enhanced User Preferences

- Avoid list: expand from 6 to 10 common allergens/avoidances
- Taste: single-select → multi-select
- Actually integrate preferences into the random algorithm

### 6. History Analytics

- Weekly summary: meals count, category coverage
- Category distribution display
- TOP 3 most-eaten dishes
- Streak tracking (consecutive days without repeat)

---

## Phase 2: Paid Features

### Subscription Tiers

| Tier | Price (CNY) | Positioning |
|------|-------------|-------------|
| Monthly | 6-9 | Trial |
| Quarterly | 15-20 | Main tier |
| Yearly | 50-68 | Heavy users, includes badge |

### 1. AI Personalized Daily Report

- Generated on first open each day
- Weather + history + preferences + seasonal → 3 recommended dishes with reasoning
- Non-members see blurred preview
- Displayed as expandable card on home page

### 2. Premium Featured Collections

- Operationally-curated content via cloud database
- Themes: "打工人15分钟午餐", "周末犒劳自己", seasonal guides, city-specific collections
- Non-members see titles only, locked indicator on tap

### 3. Advanced Data Reports

- Monthly eating report: category heatmap, spending trends, novelty index
- Nutritional balance estimate: protein/carbs/vegetable distribution
- Exportable share card (WeChat Moments)

### 4. Enhanced Smart Features

- Extended dedup: up to 14/30 days
- Budget mode: filter by priceLevel within budget range
- Nutritional goal tracking: daily calorie/protein targets

### 5. Member Perks

- Member badge in profile
- Exclusive theme/accent color

---

## Paywall Entry Points

- Subtle persistent entrance at bottom of home page
- "Unlock full report" in history analytics
- Lock icon on premium collections, tap triggers subscription flow
- Member status display at top of profile page

---

## Error Handling

- Preference learning: cold start handles 0 actions gracefully (fall back to base weights)
- Dedup exhaustion: if all candidates filtered, relax constraint and toast user
- Meal time: gracefully handles device time being wrong (timezone-safe)
- Cloud DB fetch failure: premium collections fail silently, show only free content
- Subscription status: check on app launch, cache locally with TTL

---

## Edge Cases

- User has 0 history → all weights at baseline, no dedup
- User has 0 confirm actions → preference weights at neutral
- All dishes in a custom menu are recently eaten → relax dedup for that pick only
- OCR result dishes don't exist in recipe library → preference learning falls back to OCR-only random
- Clock at midnight boundary → meal time transitions naturally
