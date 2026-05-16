# 自定义菜单 Tab - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增第 4 个 tab「菜单」，支持用户创建菜单并在菜单中管理菜品、随机选择。

**Architecture:** 两个新页面（menu-list 菜单列表、menu-detail 菜单详情），数据层扩展现有 storage.ts，随机结果复用 dish-modal 组件。CustomDish 通过映射函数转为 Dish 兼容对象供弹窗展示。

**Tech Stack:** 微信小程序原生 + TypeScript，本地 Storage

---

### Task 1: 扩展类型定义

**Files:**
- Modify: `utils/types.ts`

- [ ] **Step 1: 添加 CustomMenu 和 CustomDish 接口**

在 `utils/types.ts` 末尾追加：

```typescript
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
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/Zhuanz/Documents/code/eat-what && npx tsc --noEmit 2>&1 | head -5`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add utils/types.ts
git commit -m "feat: add CustomMenu and CustomDish type definitions"
```

---

### Task 2: 添加 Storage CRUD 函数

**Files:**
- Modify: `utils/storage.ts`

- [ ] **Step 1: 添加 ID 生成和菜品映射工具函数**

在 `utils/storage.ts` 顶部 import 语句后、现有函数前插入：

```typescript
import { CustomMenu, CustomDish, Dish } from './types'

const MENUS_KEY = 'eat_what_menus'
const DISHES_KEY = 'eat_what_custom_dishes'

/** 将 CustomDish 映射为 Dish 兼容对象，供 dish-modal 展示 */
export function mapCustomDishToDish(dish: CustomDish): Dish {
  return {
    id: dish.id,
    name: dish.name,
    emoji: dish.emoji || '🍽️',
    category: (dish.category as Dish['category']) || 'stirfry',
    suitableWeather: [],
    cookingTime: 0,
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
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/Zhuanz/Documents/code/eat-what && npx tsc --noEmit 2>&1 | head -5`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add utils/storage.ts
git commit -m "feat: add menu and custom dish CRUD functions to storage"
```

---

### Task 3: 创建菜单列表页（menu-list）

**Files:**
- Create: `pages/menu-list/menu-list.json`
- Create: `pages/menu-list/menu-list.ts`
- Create: `pages/menu-list/menu-list.wxml`
- Create: `pages/menu-list/menu-list.wxss`

- [ ] **Step 1: 创建页面配置文件**

```json
{
  "navigationBarTitleText": "我的菜单"
}
```

Write to: `pages/menu-list/menu-list.json`

- [ ] **Step 2: 创建页面逻辑文件**

```typescript
import { CustomMenu } from '../../utils/types'
import { getMenus, saveMenu, deleteMenu, getCustomDishes } from '../../utils/storage'

interface MenuWithCount extends CustomMenu {
  dishCount: number
}

function generateMenuId(): string {
  const hex = 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
  return `${hex}-${Date.now().toString(36)}`
}

Page({
  data: {
    menus: [] as MenuWithCount[],
  },

  onShow() {
    this.loadMenus()
  },

  loadMenus() {
    const menus = getMenus()
    const menusWithCount: MenuWithCount[] = menus.map(m => ({
      ...m,
      dishCount: getCustomDishes(m.id).length,
    }))
    this.setData({ menus: menusWithCount })
  },

  onCreateMenu() {
    wx.showModal({
      title: '新建菜单',
      editable: true,
      placeholderText: '输入菜单名称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          saveMenu({
            id: generateMenuId(),
            name: res.content.trim(),
            createdAt: Date.now(),
          })
          wx.showToast({ title: '创建成功', icon: 'success' })
          this.loadMenus()
        }
      },
    })
  },

  onTapMenu(e: WechatMiniprogram.TouchEvent) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/menu-detail/menu-detail?menuId=${id}&menuName=${encodeURIComponent(name)}`,
    })
  },

  onDeleteMenu(e: WechatMiniprogram.TouchEvent) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '删除菜单',
      content: `确定删除「${name}」及其所有菜品吗？`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          deleteMenu(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadMenus()
        }
      },
    })
  },
})
```

Write to: `pages/menu-list/menu-list.ts`

- [ ] **Step 3: 创建页面模板文件**

```xml
<view class="container">
  <view class="menu-list" wx:if="{{menus.length > 0}}">
    <view
      class="menu-card"
      wx:for="{{menus}}"
      wx:key="id"
      data-id="{{item.id}}"
      data-name="{{item.name}}"
      bindtap="onTapMenu"
    >
      <view class="menu-card-body">
        <view class="menu-card-name">{{item.name}}</view>
        <view class="menu-card-count">{{item.dishCount}}道菜</view>
      </view>
      <view class="menu-card-delete" data-id="{{item.id}}" data-name="{{item.name}}" catchtap="onDeleteMenu">×</view>
    </view>
  </view>

  <view class="empty" wx:else>
    <view class="empty-icon">📋</view>
    <view class="empty-text">还没有菜单</view>
    <view class="empty-hint">点击下方按钮创建第一个菜单</view>
  </view>

  <view class="create-btn-wrapper">
    <button class="create-btn" bindtap="onCreateMenu">+ 新建菜单</button>
  </view>
</view>
```

Write to: `pages/menu-list/menu-list.wxml`

- [ ] **Step 4: 创建页面样式文件**

```css
.container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 16px;
  padding-bottom: 100px;
}

.menu-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.menu-card-body {
  flex: 1;
}

.menu-card-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.menu-card-count {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.menu-card-delete {
  font-size: 22px;
  color: #ccc;
  padding: 8px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 120px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
  margin-top: 8px;
}

.create-btn-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, #f5f7fa 20%);
}

.create-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  text-align: center;
  background: #333;
  color: #fff;
  border-radius: 12px;
  font-size: 16px;
  border: none;
}

.create-btn::after {
  border: none;
}
```

Write to: `pages/menu-list/menu-list.wxss`

- [ ] **Step 5: 验证 TypeScript 编译**

Run: `cd /Users/Zhuanz/Documents/code/eat-what && npx tsc --noEmit 2>&1 | head -10`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add pages/menu-list/
git commit -m "feat: add menu list page"
```

---

### Task 4: 创建菜单详情页（menu-detail）

**Files:**
- Create: `pages/menu-detail/menu-detail.json`
- Create: `pages/menu-detail/menu-detail.ts`
- Create: `pages/menu-detail/menu-detail.wxml`
- Create: `pages/menu-detail/menu-detail.wxss`

- [ ] **Step 1: 创建页面配置文件**

```json
{
  "usingComponents": {
    "dish-modal": "/components/dish-modal/dish-modal"
  },
  "navigationBarTitleText": "菜单详情"
}
```

Write to: `pages/menu-detail/menu-detail.json`

- [ ] **Step 2: 创建页面逻辑文件**

```typescript
import { CustomDish, Dish } from '../../utils/types'
import {
  getCustomDishes,
  addCustomDish,
  updateCustomDish,
  deleteCustomDish,
  mapCustomDishToDish,
} from '../../utils/storage'
import { uniformRandom } from '../../utils/random'

function generateDishId(): string {
  const hex = 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
  return `${hex}-${Date.now().toString(36)}`
}

Page({
  data: {
    menuId: '',
    menuName: '',
    dishes: [] as CustomDish[],
    modalDish: null as Dish | null,
    modalVisible: false,

    // 编辑弹窗
    showEditor: false,
    editingDishId: '' as string,
    formName: '',
    formNote: '',
    formCategory: '',
    formEmoji: '',
    formCategoryIndex: 0,
    formCategoryLabel: '不限',
  },

  categories: ['', 'noodle', 'rice', 'stew', 'cold', 'soup', 'stirfry', 'snack'] as const,
  categoryLabels: ['不限', '面食', '米饭', '炖菜', '凉拌', '汤', '炒菜', '小吃'] as const,

  onLoad(options: Record<string, string>) {
    this.setData({
      menuId: options.menuId,
      menuName: decodeURIComponent(options.menuName),
    })
    wx.setNavigationBarTitle({ title: this.data.menuName })
  },

  onShow() {
    this.loadDishes()
  },

  loadDishes() {
    const dishes = getCustomDishes(this.data.menuId)
    this.setData({ dishes })
  },

  onRandomPick() {
    if (this.data.dishes.length === 0) {
      wx.showToast({ title: '请先添加菜品', icon: 'none' })
      return
    }
    const dish = uniformRandom(this.data.dishes)
    this.setData({ modalDish: mapCustomDishToDish(dish), modalVisible: true })
  },

  onChangeDish() {
    if (this.data.dishes.length === 0) return
    const dish = uniformRandom(this.data.dishes)
    this.setData({ modalDish: mapCustomDishToDish(dish) })
  },

  onConfirmDish(e: WechatMiniprogram.CustomEvent) {
    this.setData({ modalVisible: false })
    wx.showToast({ title: '就它了！', icon: 'success' })
  },

  onCloseModal() {
    this.setData({ modalVisible: false })
  },

  // 添加菜品打开编辑弹窗
  onAddDish() {
    this.setData({
      showEditor: true,
      editingDishId: '',
      formName: '',
      formNote: '',
      formCategory: '',
      formEmoji: '',
      formCategoryIndex: 0,
      formCategoryLabel: '不限',
    })
  },

  // 点击菜品编辑
  onTapDish(e: WechatMiniprogram.TouchEvent) {
    const dishId = e.currentTarget.dataset.id
    const dish = this.data.dishes.find(d => d.id === dishId)
    if (!dish) return

    const catIndex = this.categories.indexOf((dish.category || '') as any)
    this.setData({
      showEditor: true,
      editingDishId: dish.id,
      formName: dish.name,
      formNote: dish.note || '',
      formCategory: dish.category || '',
      formEmoji: dish.emoji || '',
      formCategoryIndex: catIndex >= 0 ? catIndex : 0,
      formCategoryLabel: this.categoryLabels[catIndex >= 0 ? catIndex : 0],
    })
  },

  // 删除菜品
  onDeleteDish(e: WechatMiniprogram.TouchEvent) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '删除菜品',
      content: `确定删除「${name}」吗？`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          deleteCustomDish(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadDishes()
        }
      },
    })
  },

  // 编辑弹窗 - 保存
  onSaveDish() {
    const { editingDishId, formName, formNote, formCategory, formEmoji } = this.data
    const name = formName.trim()
    if (!name) {
      wx.showToast({ title: '请输入菜名', icon: 'none' })
      return
    }

    if (editingDishId) {
      updateCustomDish(editingDishId, {
        name,
        note: formNote.trim() || undefined,
        category: formCategory || undefined,
        emoji: formEmoji.trim() || undefined,
      })
    } else {
      addCustomDish({
        id: generateDishId(),
        menuId: this.data.menuId,
        name,
        note: formNote.trim() || undefined,
        category: formCategory || undefined,
        emoji: formEmoji.trim() || undefined,
        createdAt: Date.now(),
      })
    }

    wx.showToast({ title: editingDishId ? '已更新' : '已添加', icon: 'success' })
    this.setData({ showEditor: false })
    this.loadDishes()
  },

  onCloseEditor() {
    this.setData({ showEditor: false })
  },

  onCategoryChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value)
    this.setData({
      formCategoryIndex: index,
      formCategory: this.categories[index],
      formCategoryLabel: this.categoryLabels[index],
    })
  },
})
```

Write to: `pages/menu-detail/menu-detail.ts`

- [ ] **Step 3: 创建页面模板文件**

```xml
<view class="container">
  <view class="header">
    <view class="header-title">{{menuName}}</view>
    <view class="header-count">{{dishes.length}}道菜</view>
  </view>

  <!-- 菜品列表 -->
  <view class="dish-list" wx:if="{{dishes.length > 0}}">
    <view
      class="dish-item"
      wx:for="{{dishes}}"
      wx:key="id"
      data-id="{{item.id}}"
      bindtap="onTapDish"
    >
      <view class="dish-emoji">{{item.emoji || '🍽️'}}</view>
      <view class="dish-name">{{item.name}}</view>
      <view class="dish-delete" data-id="{{item.id}}" data-name="{{item.name}}" catchtap="onDeleteDish">×</view>
    </view>
  </view>

  <view class="empty" wx:else>
    <view class="empty-icon">🥢</view>
    <view class="empty-text">还没有菜品</view>
    <view class="empty-hint">点击下方按钮添加</view>
  </view>

  <!-- 底部操作栏 -->
  <view class="bottom-bar">
    <button class="add-btn" bindtap="onAddDish">+ 添加菜品</button>
    <button class="random-btn" bindtap="onRandomPick" disabled="{{dishes.length === 0}}">🎲 随机选一个</button>
  </view>

  <!-- 编辑弹窗 -->
  <view class="editor-overlay" wx:if="{{showEditor}}" bindtap="onCloseEditor">
    <view class="editor-panel" catchtap="noop">
      <view class="editor-header">
        <text>{{editingDishId ? '编辑菜品' : '添加菜品'}}</text>
        <text class="editor-close" bindtap="onCloseEditor">×</text>
      </view>
      <view class="editor-body">
        <view class="form-item">
          <text class="form-label">菜名 *</text>
          <input class="form-input" placeholder="输入菜名" value="{{formName}}" bindinput="onFormName" />
        </view>
        <view class="form-item">
          <text class="form-label">备注</text>
          <input class="form-input" placeholder="如：少辣、多放醋" value="{{formNote}}" bindinput="onFormNote" />
        </view>
        <view class="form-item">
          <text class="form-label">分类</text>
          <picker mode="selector" range="{{['不限','面食','米饭','炖菜','凉拌','汤','炒菜','小吃']}}" value="{{formCategoryIndex}}" bindchange="onCategoryChange">
            <view class="form-picker">{{formCategoryLabel}}</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">Emoji</text>
          <input class="form-input" placeholder="如：🍜" value="{{formEmoji}}" bindinput="onFormEmoji" />
        </view>
      </view>
      <view class="editor-footer">
        <button class="save-btn" bindtap="onSaveDish">保存</button>
      </view>
    </view>
  </view>

  <!-- 随机结果弹窗 -->
  <dish-modal
    dish="{{modalDish}}"
    visible="{{modalVisible}}"
    bind:change="onChangeDish"
    bind:confirm="onConfirmDish"
    bind:close="onCloseModal"
  />
</view>
```

Write to: `pages/menu-detail/menu-detail.wxml`

- [ ] **Step 4: 创建页面样式文件**

```css
.container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 16px;
  padding-bottom: 140px;
}

.header {
  margin-bottom: 20px;
}

.header-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.header-count {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.dish-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.dish-emoji {
  font-size: 24px;
  margin-right: 12px;
}

.dish-name {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.dish-delete {
  font-size: 20px;
  color: #ccc;
  padding: 6px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
  margin-top: 8px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
}

.add-btn {
  flex: 1;
  height: 44px;
  line-height: 44px;
  text-align: center;
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
}

.add-btn::after {
  border: none;
}

.random-btn {
  flex: 1;
  height: 44px;
  line-height: 44px;
  text-align: center;
  background: #333;
  color: #fff;
  border-radius: 10px;
  font-size: 15px;
  border: none;
}

.random-btn::after {
  border: none;
}

.random-btn[disabled] {
  background: #ccc;
  color: #fff;
}

/* 编辑弹窗 */
.editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.editor-panel {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

.editor-close {
  font-size: 22px;
  color: #999;
  padding: 4px;
}

.editor-body {
  padding: 16px 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 44px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 15px;
  box-sizing: border-box;
}

.form-picker {
  height: 44px;
  line-height: 44px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 15px;
  color: #333;
}

.editor-footer {
  padding: 0 20px 16px;
}

.save-btn {
  width: 100%;
  height: 48px;
  line-height: 48px;
  text-align: center;
  background: #333;
  color: #fff;
  border-radius: 10px;
  font-size: 16px;
  border: none;
}

.save-btn::after {
  border: none;
}
```

Write to: `pages/menu-detail/menu-detail.wxss`

- [ ] **Step 5: 补充 WXML 中缺少的 bindinput 处理函数**

需要确保 `onFormName`、`onFormNote`、`onFormEmoji` 三个 input 绑定函数存在。在 `menu-detail.ts` 的 Page({}) 内补充：

```typescript
  onFormName(e: WechatMiniprogram.Input) {
    this.setData({ formName: e.detail.value })
  },

  onFormNote(e: WechatMiniprogram.Input) {
    this.setData({ formNote: e.detail.value })
  },

  onFormEmoji(e: WechatMiniprogram.Input) {
    this.setData({ formEmoji: e.detail.value })
  },
```

用 Edit 工具在 `onCloseEditor` 之后插入这三个方法。确保 `pages/menu-detail/menu-detail.ts` 中包含这些方法。

- [ ] **Step 6: 验证 TypeScript 编译**

Run: `cd /Users/Zhuanz/Documents/code/eat-what && npx tsc --noEmit 2>&1 | head -10`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add pages/menu-detail/
git commit -m "feat: add menu detail page with dish CRUD and random pick"
```

---

### Task 5: 注册页面并配置 TabBar

**Files:**
- Modify: `app.json`

- [ ] **Step 1: 修改 app.json**

在 `pages` 数组中添加两个新页面路径，在 `tabBar.list` 中添加菜单 tab：

```json
{
  "pages": [
    "pages/index/index",
    "pages/ocr/ocr",
    "pages/menu-list/menu-list",
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
        "pagePath": "pages/menu-list/menu-list",
        "text": "菜单",
        "iconPath": "assets/icons/menu.png",
        "selectedIconPath": "assets/icons/menu-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "assets/icons/profile.png",
        "selectedIconPath": "assets/icons/profile-active.png"
      }
    ]
  },
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于获取当地天气和菜品推荐"
    }
  },
  "requiredPrivateInfos": [
    "getLocation"
  ],
  "cloud": true
}
```

用 Edit 工具完成修改。

- [ ] **Step 2: 验证编译**

Run: `cd /Users/Zhuanz/Documents/code/eat-what && npx tsc --noEmit 2>&1 | head -10`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app.json assets/icons/menu.png assets/icons/menu-active.png
git commit -m "feat: register menu tab and configure tabBar"
```

---

### Task 6: 最终验证

- [ ] **Step 1: TypeScript 编译检查**

Run: `cd /Users/Zhuanz/Documents/code/eat-what && npx tsc --noEmit 2>&1`
Expected: no errors

- [ ] **Step 2: 文件完整性检查**

Run: `ls -la pages/menu-list/ pages/menu-detail/ assets/icons/menu*.png`
Expected: all 8 page files + 2 icon files exist

- [ ] **Step 3: 在微信开发者工具中验证**

打开项目，确认：
- Tab bar 显示 4 个 tab，第 3 个为「菜单」
- 菜单列表页：可创建菜单、点击进入详情、可删除菜单
- 菜单详情页：可添加菜品、点击编辑、删除菜品
- 随机按钮：从当前菜单随机选取并弹窗展示
