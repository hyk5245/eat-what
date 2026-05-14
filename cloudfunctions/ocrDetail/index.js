const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  try {
    const result = await cloud.openapi.ocr.printedText({
      imgUrl: event.imgUrl,
    })
    return { items: result.items, text: result.items.map(i => i.text).join('\n') }
  } catch (err) {
    return { items: [], text: '', error: err.message }
  }
}
