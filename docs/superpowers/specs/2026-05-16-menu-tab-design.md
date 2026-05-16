# 自定义菜单 Tab - 设计文档

> 日期：2026-05-16 | 状态：待实现

## 概述

新增第 4 个 tab「菜单」，用户可以创建多个自定义菜单，在每个菜单中管理菜品（添加、编辑、删除），并从中随机选择菜品。数据存本地 Storage。

## 导航变更

Tab bar 从 3 个扩展为 4 个：

| 顺序 | Tab | 路径 |
|------|-----|------|
| 1 | 首页 | pages/index/index |
| 2 | 扫菜单 | pages/ocr/ocr |
| 3 | **菜单** | pages/menu-list/menu-list |
| 4 | 我的 | pages/profile/profile |

新增图标：`assets/icons/menu.png` + `assets/icons/menu-active.png`（81x81 线框风格）。

## 页面结构

### 菜单列表页（pages/menu-list/）

- 展示用户创建的所有菜单卡片
- 每张卡片显示：菜单名、菜品数量
- 底部「新建菜单」入口
- 左滑删除菜单（含确认提示：删除菜单会同时删除其中所有菜品）
- 点击菜单卡片进入菜单详情页
- 空态：提示"还没有菜单，点击下方创建"

### 菜单详情页（pages/menu-detail/）

- 接收 `menuId` 查询参数
- 顶部显示菜单名（可点击编辑）
- 菜品列表：每条显示菜名、emoji（如有）
- 点击菜品 → 编辑弹窗
- 左滑删除菜品
- 底部「添加菜品」入口
- 底部固定「随机选一个」按钮 → 调用随机算法 → 复用 dish-modal 展示结果
- 空态：提示"还没有菜品，点击添加"

## 数据模型

```typescript
interface CustomMenu {
  id: string        // UUID
  name: string      // 菜单名称
  createdAt: number // 时间戳
}

interface CustomDish {
  id: string        // UUID
  menuId: string    // 所属菜单 ID
  name: string      // 菜品名（必填）
  note?: string     // 备注（可选）
  category?: string // 分类：面食/米饭/炖菜/凉拌/汤/炒菜/小吃（可选）
  emoji?: string    // emoji（可选）
  createdAt: number // 时间戳
}
```

## Storage 方案

- `eat_what_menus`：菜单列表 `CustomMenu[]`
- `eat_what_custom_dishes`：所有菜品扁平存储 `CustomDish[]`，通过 `menuId` 过滤查询

## 随机算法

从当前菜单的菜品列表中均匀随机选取。复用 `utils/random.ts` 的随机函数。结果通过现有 `dish-modal` 组件展示，将 `CustomDish` 字段映射到 `Dish` 类型供弹窗使用。

## 菜品编辑弹窗

- 菜名（必填，文本输入）
- 备注（可选，文本输入）
- 分类（可选，下拉选择）
- emoji（可选，emoji 选择或文本输入）
- 确认 → 保存到 storage → 刷新列表

## 视觉风格

延续现有设计语言：
- 白底 + #f5f7fa 卡片背景
- 卡片圆角 12px
- 主按钮黑色 (#333)
- 标签圆角 20px/8px
- 系统默认字体

## 文件变更清单

```
新增:
├── pages/menu-list/menu-list.ts
├── pages/menu-list/menu-list.wxml
├── pages/menu-list/menu-list.wxss
├── pages/menu-list/menu-list.json
├── pages/menu-detail/menu-detail.ts
├── pages/menu-detail/menu-detail.wxml
├── pages/menu-detail/menu-detail.wxss
├── pages/menu-detail/menu-detail.json
├── assets/icons/menu.png
└── assets/icons/menu-active.png

修改:
├── app.json            # pages 注册 + tabBar 配置
├── utils/storage.ts    # 新增 menu/dish CRUD 函数
└── utils/types.ts      # 新增 CustomMenu, CustomDish 类型
```
