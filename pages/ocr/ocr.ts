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
