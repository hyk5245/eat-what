import { Dish, WeatherInfo, WeatherType } from '../../utils/types'
import { recipeLibrary } from '../../utils/recipe-data'
import { getWeatherType, weightedRandom } from '../../utils/random'
import { addHistory } from '../../utils/storage'
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
      const recommendDish = weightedRandom(recipeLibrary, weatherType)
      this.setData({
        weather,
        weatherType,
        recommendDish,
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
    const dish = weightedRandom(
      recipeLibrary,
      this.data.weatherType,
      this.data.activeCategory || undefined
    )
    this.setData({ currentDish: dish, modalVisible: true })
  },

  onChangeDish() {
    const dish = weightedRandom(
      recipeLibrary,
      this.data.weatherType,
      this.data.activeCategory || undefined
    )
    this.setData({ currentDish: dish })
  },

  onConfirmDish(e: any) {
    const dish: Dish = e.detail.dish
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
