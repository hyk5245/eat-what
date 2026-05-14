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
