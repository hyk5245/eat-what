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
