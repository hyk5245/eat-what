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
