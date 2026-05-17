import { addHistory, addUserAction } from '../../utils/storage'
import { recognizeMenuFromImage } from '../../utils/ocr'
import { uniformRandom } from '../../utils/random'

Page({
  data: {
    imagePath: '',
    dishes: [] as string[],
    recognizing: false,
    ocrError: '',
    quotaExceeded: false,
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
    this.setData({ recognizing: true, dishes: [], ocrError: '', quotaExceeded: false })
    try {
      const result = await recognizeMenuFromImage(imagePath)
      const dishes = result.dishes || []
      const ocrError = result.error || ''
      const quotaExceeded = result.errorCode === 'QUOTA_EXCEEDED'

      if (dishes.length === 0) {
        const errMsg = ocrError || '未识别到菜品'
        wx.showToast({ title: errMsg, icon: 'none', duration: 3000 })
      } else if (ocrError) {
        wx.showToast({ title: ocrError, icon: 'none', duration: 3000 })
      }

      this.setData({ dishes, recognizing: false, ocrError, quotaExceeded })
    } catch (err) {
      console.error('OCR 失败:', err)
      const ocrError = '识别失败，请重试'
      this.setData({ recognizing: false, ocrError, quotaExceeded: false })
      wx.showToast({ title: ocrError, icon: 'none' })
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
    // Record skip
    if (this.data.selectedDish) {
      addUserAction({ dishId: `ocr:${this.data.selectedDish}`, action: 'skip', timestamp: Date.now() })
    }
    const dish = uniformRandom(this.data.dishes)
    this.setData({ selectedDish: dish as string })
  },

  onConfirmDish(e: any) {
    const dishName: string = e.detail.dish || this.data.selectedDish
    addUserAction({ dishId: `ocr:${dishName}`, action: 'confirm', timestamp: Date.now() })
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

  noop() {},

  onReset() {
    this.setData({
      imagePath: '',
      dishes: [],
      ocrError: '',
      quotaExceeded: false,
      selectedDish: '',
    })
  },
})
