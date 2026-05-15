const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const CATEGORY_KEYWORDS = [
  '招牌',
  '推荐',
  '热销',
  '特价',
  '新品',
  '凉菜',
  '热菜',
  '主食',
  '小吃',
  '汤',
  '酒水',
  '饮料',
  '套餐',
  '盖饭',
  '炒饭',
  '面食',
  '粉面',
  '甜品',
  '加料',
  '备注',
  '规格',
  '系列',
  '联系电话',
  '地址',
  '营业时间',
]

const NOISE_KEYWORDS = [
  '扫码',
  '下单',
  '关注',
  '公众号',
  '会员',
  '欢迎光临',
  '谢谢惠顾',
  '本店',
  '活动',
  '优惠',
  '赠送',
  '免费',
]

const DISH_HINT_SUFFIXES = [
  '饭',
  '面',
  '粉',
  '汤',
  '粥',
  '饼',
  '锅',
  '鱼',
  '虾',
  '肉',
  '鸡',
  '鸭',
  '牛',
  '羊',
  '排骨',
  '豆腐',
  '茄子',
  '土豆',
  '白菜',
  '时蔬',
  '沙拉',
  '丸子',
  '水饺',
  '馄饨',
  '炒饭',
  '炒面',
]

function normalizeText(value) {
  return String(value || '')
    .replace(/[·•●]/g, ' ')
    .replace(/[（(].*?[）)]/g, ' ')
    .replace(/[【】\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripPrice(value) {
  return value
    .replace(/¥\s*\d+(?:\.\d{1,2})?/g, ' ')
    .replace(/\d+(?:\.\d{1,2})?\s*(元|块|\/份|\/例|\/斤)?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasChinese(value) {
  return /[\u4e00-\u9fa5]/.test(value)
}

function isMostlyDigits(value) {
  const compact = value.replace(/\s+/g, '')
  return compact.length > 0 && /^[0-9¥$.,:/-]+$/.test(compact)
}

function isLikelyCategory(value) {
  return CATEGORY_KEYWORDS.some((keyword) => value.includes(keyword))
}

function isLikelyNoise(value) {
  return NOISE_KEYWORDS.some((keyword) => value.includes(keyword))
}

function looksLikeDishName(value) {
  if (!value) return false
  if (!hasChinese(value)) return false
  if (isMostlyDigits(value)) return false
  if (value.length < 2 || value.length > 14) return false
  if (isLikelyCategory(value) || isLikelyNoise(value)) return false

  if (/[0-9a-zA-Z@#%]/.test(value) && !/[\u4e00-\u9fa5]{2,}/.test(value)) {
    return false
  }

  return DISH_HINT_SUFFIXES.some((suffix) => value.endsWith(suffix)) || value.length >= 3
}

function scoreDish(value) {
  let score = 0

  if (DISH_HINT_SUFFIXES.some((suffix) => value.endsWith(suffix))) {
    score += 3
  }

  if (value.length >= 3 && value.length <= 8) {
    score += 2
  }

  if (!/[0-9]/.test(value)) {
    score += 1
  }

  if (/(炒|烧|煮|蒸|卤|炸|拌|焖|炖|煎|烤|椒盐|麻辣|香锅)/.test(value)) {
    score += 2
  }

  return score
}

function extractCandidateDishes(items) {
  const deduped = new Map()

  for (const item of items) {
    const mergedText = normalizeText(item.text)
    const withoutPrice = stripPrice(mergedText)

    const segments = withoutPrice
      .split(/[、,，|/ ]+/)
      .map((part) => part.trim())
      .filter(Boolean)

    const candidates = segments.length > 1 ? segments : [withoutPrice]

    for (const candidate of candidates) {
      const normalized = normalizeText(candidate)
      if (!looksLikeDishName(normalized)) {
        continue
      }

      const currentScore = scoreDish(normalized)
      const previous = deduped.get(normalized)
      if (!previous || currentScore > previous.score) {
        deduped.set(normalized, {
          name: normalized,
          score: currentScore,
        })
      }
    }
  }

  return [...deduped.values()]
    .filter((item) => item.score >= 3)
    .map((item) => item.name)
}

exports.main = async (event) => {
  try {
    if (!event.imgUrl) {
      return {
        items: [],
        text: '',
        dishes: [],
        error: '缺少图片地址',
      }
    }

    const urlRes = await cloud.getTempFileURL({
      fileList: [event.imgUrl],
    })
    const httpUrl = urlRes.fileList[0] && urlRes.fileList[0].tempFileURL

    if (!httpUrl) {
      return {
        items: [],
        text: '',
        dishes: [],
        error: '获取图片临时链接失败',
      }
    }

    const result = await cloud.openapi.ocr.printedText({
      img_url: httpUrl,
    })

    const items = Array.isArray(result.items) ? result.items : []
    const text = items.map((item) => item.text).join('\n')
    const dishes = extractCandidateDishes(items)

    if (items.length === 0) {
      return { items: [], text: '', dishes: [], error: 'OCR 未识别到文字' }
    }

    if (dishes.length === 0) {
      return {
        items,
        text,
        dishes: [],
        error: '识别到文字，但没提取出明确菜名，请手动补充或换一张更清晰的菜单',
      }
    }

    return {
      items,
      text,
      dishes,
    }
  } catch (err) {
    return {
      items: [],
      text: '',
      dishes: [],
      error: err.message || String(err),
    }
  }
}
