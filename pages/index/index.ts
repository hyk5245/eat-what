import { Dish, WeatherInfo, WeatherType } from '../../utils/types'
import { recipeLibrary } from '../../utils/recipe-data'
import { getWeatherType, smartRandom, getMealTime, getSeasonalTags } from '../../utils/random'
import { addHistory, getHistory, getPreference, getUserActions, addUserAction } from '../../utils/storage'
import { computePreferenceWeights, buildDishMap } from '../../utils/preference-engine'
import { fetchWeather, fetchCityName } from '../../utils/weather-api'

Page({
  data: {
    weather: null as WeatherInfo | null,
    weatherLoading: true,
    weatherError: '',
    weatherType: 'mild' as WeatherType,
    recommendDish: null as Dish | null,
    currentDish: null as Dish | null,
    modalVisible: false,
    activeCategory: '',
    seasonalTags: [] as string[],
    mealTimeLabel: '',
    dedupRelaxed: false,
  },

  onLoad() {
    this.getLocation()
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.loadWeather(res.latitude, res.longitude)
      },
      fail: () => {
        this.setData({
          weatherLoading: false,
          weatherError: '无法获取位置，下拉刷新重试',
        })
      },
    })
  },

  async loadWeather(lat: number, lon: number) {
    try {
      const [weather, city] = await Promise.all([
        fetchWeather(lat, lon),
        fetchCityName(lat, lon),
      ])
      weather.city = city
      const weatherType = getWeatherType(weather)

      const mealTime = getMealTime()
      const pref = getPreference()
      const history = getHistory()
      const actions = getUserActions()
      const dishMap = buildDishMap(recipeLibrary)

      const cutoff = Date.now() - pref.dedupDays * 86400000
      const recentDishIds = new Set(
        history.filter(h => h.createdAt > cutoff).map(h => h.dishId)
      )

      const { categoryWeights, tagBoosts } = computePreferenceWeights(actions, dishMap)

      const result = smartRandom(recipeLibrary, {
        weatherType,
        recentDishIds,
        mealTime,
        categoryWeights,
        tagBoosts,
        preferences: pref,
      })

      const seasonalTags = getSeasonalTags()
      const mealTimeLabels: Record<string, string> = {
        breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐',
      }

      this.setData({
        weather,
        weatherType,
        recommendDish: result.dish,
        dedupRelaxed: result.relaxed,
        seasonalTags,
        mealTimeLabel: mealTimeLabels[mealTime] || '',
        weatherLoading: false,
      })
    } catch {
      this.setData({
        weatherLoading: false,
        weatherError: '天气获取失败',
      })
    }
  },

  onRandomTap() {
    const mealTime = getMealTime()
    const pref = getPreference()
    const history = getHistory()
    const actions = getUserActions()
    const dishMap = buildDishMap(recipeLibrary)

    const cutoff = Date.now() - pref.dedupDays * 86400000
    const recentDishIds = new Set(
      history.filter(h => h.createdAt > cutoff).map(h => h.dishId)
    )

    const { categoryWeights, tagBoosts } = computePreferenceWeights(actions, dishMap)

    const result = smartRandom(recipeLibrary, {
      weatherType: this.data.weatherType,
      category: this.data.activeCategory || undefined,
      recentDishIds,
      mealTime,
      categoryWeights,
      tagBoosts,
      preferences: pref,
    })

    this.setData({
      currentDish: result.dish,
      modalVisible: true,
      dedupRelaxed: result.relaxed,
    })

    if (result.relaxed) {
      wx.showToast({ title: '最近吃的都过滤了，已放宽范围', icon: 'none', duration: 2000 })
    }
  },

  onChangeDish(e: any) {
    const dishId = e.detail.dishId
    if (dishId) {
      addUserAction({ dishId, action: 'skip', timestamp: Date.now() })
    }

    const mealTime = getMealTime()
    const pref = getPreference()
    const history = getHistory()
    const actions = getUserActions()
    const dishMap = buildDishMap(recipeLibrary)

    const cutoff = Date.now() - pref.dedupDays * 86400000
    const recentDishIds = new Set(
      history.filter(h => h.createdAt > cutoff).map(h => h.dishId)
    )

    const { categoryWeights, tagBoosts } = computePreferenceWeights(actions, dishMap)

    const result = smartRandom(recipeLibrary, {
      weatherType: this.data.weatherType,
      category: this.data.activeCategory || undefined,
      recentDishIds,
      mealTime,
      categoryWeights,
      tagBoosts,
      preferences: pref,
    })

    this.setData({ currentDish: result.dish })
  },

  onConfirmDish(e: any) {
    const dish: Dish = e.detail.dish
    const dishId = e.detail.dishId

    if (dishId) {
      addUserAction({ dishId, action: 'confirm', timestamp: Date.now() })
    }

    addHistory({
      id: Date.now().toString(),
      dishId: dish.id,
      dishName: dish.name,
      emoji: dish.emoji,
      source: 'random',
      weather: this.data.weather?.text,
      createdAt: Date.now(),
    })
    this.setData({ modalVisible: false })
    wx.showToast({ title: '已记录', icon: 'success' })
  },

  onCloseModal() {
    this.setData({ modalVisible: false })
  },

  onCategoryTap(e: any) {
    const category = e.currentTarget.dataset.category
    this.setData({
      activeCategory: this.data.activeCategory === category ? '' : category,
    })
  },

  onRefresh() {
    this.setData({ weatherLoading: true, weatherError: '' })
    this.getLocation()
  },
})
