export interface OcrMenuResult {
  dishes: string[]
  text: string
  error?: string
  errorCode?: string
}

/** 上传菜单图片并调用云函数提取候选菜名 */
export async function recognizeMenuFromImage(imagePath: string): Promise<OcrMenuResult> {
  const cloudPath = `ocr-images/${Date.now()}.jpg`

  const uploadRes = await wx.cloud.uploadFile({
    cloudPath,
    filePath: imagePath,
  })

  try {
    const ocrRes = await wx.cloud.callFunction({
      name: 'ocrDetail',
      data: {
        imgUrl: uploadRes.fileID,
      },
    })

    const result = (ocrRes.result || {}) as Partial<OcrMenuResult>

    const rawError = typeof result.error === 'string' ? result.error : ''

    return {
      dishes: Array.isArray(result.dishes) ? result.dishes : [],
      text: typeof result.text === 'string' ? result.text : '',
      error: mapOcrErrorMessage(rawError),
      errorCode: getOcrErrorCode(rawError),
    }
  } finally {
    try {
      await wx.cloud.deleteFile({ fileList: [uploadRes.fileID] })
    } catch (err) {
      console.warn('删除 OCR 临时文件失败:', err)
    }
  }
}

function getOcrErrorCode(errorMessage: string): string {
  if (errorMessage.includes('101003') || errorMessage.includes('not enough market quota')) {
    return 'QUOTA_EXCEEDED'
  }

  return ''
}

function mapOcrErrorMessage(errorMessage: string): string {
  const errorCode = getOcrErrorCode(errorMessage)
  if (errorCode === 'QUOTA_EXCEEDED') {
    return '微信 OCR 配额已用尽，暂时无法自动识别，请手动添加菜品或切换 OCR 方案'
  }

  return errorMessage
}
