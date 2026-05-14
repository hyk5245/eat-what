import { Dish } from './types'

export const recipeLibrary: Dish[] = [
  // 面食类
  { id: '1', name: '番茄鸡蛋面', category: 'noodle', suitableWeather: ['rainy', 'cold', 'mild'], cookingTime: 15, difficulty: 'easy', tags: ['家常', '快手'], emoji: '🍜' },
  { id: '2', name: '炸酱面', category: 'noodle', suitableWeather: ['mild', 'hot'], cookingTime: 20, difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🍝' },
  { id: '3', name: '红烧牛肉面', category: 'noodle', suitableWeather: ['rainy', 'cold'], cookingTime: 60, difficulty: 'medium', tags: ['硬菜', '暖身'], emoji: '🍜' },
  { id: '4', name: '阳春面', category: 'noodle', suitableWeather: ['rainy', 'cold', 'mild'], cookingTime: 10, difficulty: 'easy', tags: ['清淡', '快手'], emoji: '🍲' },
  { id: '5', name: '葱油拌面', category: 'noodle', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '下饭'], emoji: '🍝' },

  // 米饭类
  { id: '6', name: '红烧排骨', category: 'rice', suitableWeather: ['mild', 'cold'], cookingTime: 45, difficulty: 'medium', tags: ['硬菜', '下饭'], emoji: '🍖' },
  { id: '7', name: '番茄炒蛋', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['家常', '快手'], emoji: '🍅' },
  { id: '8', name: '宫保鸡丁', category: 'rice', suitableWeather: ['mild', 'cold'], cookingTime: 25, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥜' },
  { id: '9', name: '回锅肉', category: 'rice', suitableWeather: ['mild', 'cold'], cookingTime: 30, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥩' },
  { id: '10', name: '鱼香肉丝', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 20, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥕' },
  { id: '11', name: '蒜蓉西兰花', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['清淡', '快手'], emoji: '🥦' },
  { id: '12', name: '酸辣土豆丝', category: 'rice', suitableWeather: ['mild', 'hot'], cookingTime: 15, difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🥔' },

  // 炖菜/煲类
  { id: '13', name: '番茄牛腩煲', category: 'stew', suitableWeather: ['rainy', 'cold'], cookingTime: 90, difficulty: 'hard', tags: ['硬菜', '暖身'], emoji: '🥘' },
  { id: '14', name: '红烧肉', category: 'stew', suitableWeather: ['cold', 'mild'], cookingTime: 60, difficulty: 'medium', tags: ['硬菜', '下饭'], emoji: '🍖' },
  { id: '15', name: '土豆炖鸡块', category: 'stew', suitableWeather: ['rainy', 'cold'], cookingTime: 45, difficulty: 'easy', tags: ['家常', '暖身'], emoji: '🍗' },
  { id: '16', name: '排骨炖豆角', category: 'stew', suitableWeather: ['cold', 'rainy'], cookingTime: 50, difficulty: 'medium', tags: ['家常', '暖身'], emoji: '🥩' },

  // 凉菜类
  { id: '17', name: '凉拌黄瓜', category: 'cold', suitableWeather: ['hot', 'mild'], cookingTime: 10, difficulty: 'easy', tags: ['清爽', '快手'], emoji: '🥒' },
  { id: '18', name: '凉拌木耳', category: 'cold', suitableWeather: ['hot', 'mild'], cookingTime: 15, difficulty: 'easy', tags: ['清爽', '健康'], emoji: '🍄' },
  { id: '19', name: '蒜泥白肉', category: 'cold', suitableWeather: ['hot', 'mild'], cookingTime: 30, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🥩' },
  { id: '20', name: '拍黄瓜', category: 'cold', suitableWeather: ['hot'], cookingTime: 5, difficulty: 'easy', tags: ['清爽', '快手'], emoji: '🥒' },

  // 汤类
  { id: '21', name: '酸辣汤', category: 'soup', suitableWeather: ['rainy', 'cold'], cookingTime: 20, difficulty: 'easy', tags: ['开胃', '暖身'], emoji: '🥣' },
  { id: '22', name: '紫菜蛋花汤', category: 'soup', suitableWeather: ['rainy', 'cold', 'mild'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '清淡'], emoji: '🍲' },
  { id: '23', name: '番茄蛋花汤', category: 'soup', suitableWeather: ['mild', 'rainy'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '家常'], emoji: '🍅' },
  { id: '24', name: '冬瓜排骨汤', category: 'soup', suitableWeather: ['hot', 'mild'], cookingTime: 60, difficulty: 'medium', tags: ['清淡', '健康'], emoji: '🥣' },

  // 炒菜类
  { id: '25', name: '蒜蓉空心菜', category: 'stirfry', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '清淡'], emoji: '🥬' },
  { id: '26', name: '青椒肉丝', category: 'stirfry', suitableWeather: ['mild', 'cold'], cookingTime: 15, difficulty: 'easy', tags: ['家常', '下饭'], emoji: '🫑' },
  { id: '27', name: '地三鲜', category: 'stirfry', suitableWeather: ['mild', 'cold'], cookingTime: 25, difficulty: 'medium', tags: ['家常', '下饭'], emoji: '🍆' },
  { id: '28', name: '干煸四季豆', category: 'stirfry', suitableWeather: ['mild', 'hot'], cookingTime: 20, difficulty: 'medium', tags: ['下饭', '经典'], emoji: '🫘' },

  // 小吃/快手
  { id: '29', name: '蛋炒饭', category: 'snack', suitableWeather: ['mild', 'hot'], cookingTime: 10, difficulty: 'easy', tags: ['快手', '家常'], emoji: '🍚' },
  { id: '30', name: '煎饺', category: 'snack', suitableWeather: ['mild', 'cold'], cookingTime: 15, difficulty: 'easy', tags: ['快手', '下饭'], emoji: '🥟' },
  { id: '31', name: '炒年糕', category: 'snack', suitableWeather: ['rainy', 'cold'], cookingTime: 20, difficulty: 'easy', tags: ['快手', '暖身'], emoji: '🍡' },
  { id: '32', name: '麻辣香锅', category: 'snack', suitableWeather: ['rainy', 'cold'], cookingTime: 30, difficulty: 'medium', tags: ['重口', '下饭'], emoji: '🌶️' },
]

export const categoryLabels: Record<string, string> = {
  noodle: '面食',
  rice: '米饭',
  stew: '炖菜',
  cold: '凉拌',
  soup: '汤类',
  stirfry: '炒菜',
  snack: '小吃',
}
