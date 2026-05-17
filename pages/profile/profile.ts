import { UserPreference } from '../../utils/types'
import { getPreference, setPreference } from '../../utils/storage'

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '微信用户',
    },
    preference: { taste: [], avoid: [], dedupDays: 3 } as UserPreference,
    dedupDaysLabel: '3天',
  },

  onShow() {
    this.loadPreference()
  },

  onChooseAvatar(e: any) {
    this.setData({ 'userInfo.avatarUrl': e.detail.avatarUrl })
  },

  loadPreference() {
    const pref = getPreference()
    this.setData({
      preference: pref,
      dedupDaysLabel: pref.dedupDays === 0 ? '不限制' : `${pref.dedupDays}天`,
    })
  },

  onTasteSetting() {
    const tastes = ['不辣', '微辣', '中辣', '重辣', '清淡', '重口', '酸辣', '麻辣', '清甜']
    const current = this.data.preference.taste

    wx.showActionSheet({
      itemList: tastes.map(t => current.includes(t) ? `${t} ✓` : t),
      success: (res) => {
        const selected = tastes[res.tapIndex]
        let newTastes = [...current]
        const idx = newTastes.indexOf(selected)
        if (idx > -1) {
          newTastes.splice(idx, 1)
        } else {
          newTastes.push(selected)
        }
        const pref = { ...this.data.preference, taste: newTastes }
        setPreference(pref)
        this.setData({ preference: pref })
        wx.showToast({ title: idx > -1 ? `已移除 ${selected}` : `已添加 ${selected}`, icon: 'success' })
      },
    })
  },

  onAvoidSetting() {
    const avoidOptions = ['海鲜', '内脏', '香菜', '香菇', '羊肉', '鸭肉', '猪肉', '牛肉', '鸡蛋', '花生']
    const currentAvoid = this.data.preference.avoid || []

    wx.showActionSheet({
      itemList: avoidOptions.map(a => currentAvoid.includes(a) ? `${a} ✓` : a),
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

  onDedupSetting() {
    const options = ['不限制', '1天', '3天', '7天']
    const values = [0, 1, 3, 7]
    const current = this.data.preference.dedupDays

    wx.showActionSheet({
      itemList: options.map((o, i) => values[i] === current ? `${o} ✓` : o),
      success: (res) => {
        const newVal = values[res.tapIndex]
        const pref = { ...this.data.preference, dedupDays: newVal }
        setPreference(pref)
        this.setData({
          preference: pref,
          dedupDaysLabel: newVal === 0 ? '不限制' : `${newVal}天`,
        })
      },
    })
  },

  onGoHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
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
