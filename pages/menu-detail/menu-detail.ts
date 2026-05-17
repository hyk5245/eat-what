import { CustomDish, Dish } from '../../utils/types'
import {
  getCustomDishes,
  addCustomDish,
  updateCustomDish,
  deleteCustomDish,
  mapCustomDishToDish,
  addHistory,
  addUserAction,
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

    // edit form
    showEditor: false,
    editingDishId: '' as string,
    formName: '',
    formNote: '',
    formCategory: '',
    formEmoji: '',
    formCategoryIndex: 0,
    formCategoryLabel: '不限',
    categoryLabels: ['不限', '面食', '米饭', '炖菜', '凉拌', '汤', '炒菜', '小吃'] as string[],
  },

  categories: ['', 'noodle', 'rice', 'stew', 'cold', 'soup', 'stirfry', 'snack'] as const,
  categoryLabels: ['不限', '面食', '米饭', '炖菜', '凉拌', '汤', '炒菜', '小吃'] as const,

  noop() {},

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
    // Record skip on current dish
    if (this.data.modalDish) {
      addUserAction({ dishId: this.data.modalDish.id, action: 'skip', timestamp: Date.now() })
    }
    const dish = uniformRandom(this.data.dishes)
    this.setData({ modalDish: mapCustomDishToDish(dish) })
  },

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

  onCloseModal() {
    this.setData({ modalVisible: false })
  },

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

  onFormName(e: WechatMiniprogram.Input) {
    this.setData({ formName: e.detail.value })
  },

  onFormNote(e: WechatMiniprogram.Input) {
    this.setData({ formNote: e.detail.value })
  },

  onFormEmoji(e: WechatMiniprogram.Input) {
    this.setData({ formEmoji: e.detail.value })
  },
})
