import { WeatherInfo } from './types'

const QWEATHER_KEY = 'YOUR_QWEATHER_KEY'
const BASE_URL = 'https://devapi.qweather.com/v7'

export function fetchWeather(lat: number, lon: number): Promise<WeatherInfo> {
  const location = `${lon.toFixed(2)},${lat.toFixed(2)}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/weather/now`,
      data: {
        location,
        key: QWEATHER_KEY,
      },
      success(res: any) {
        if (res.data.code === '200') {
          const now = res.data.now
          resolve({
            temp: parseInt(now.temp),
            text: now.text,
            code: now.icon,
            city: '',
          })
        } else {
          reject(new Error(`天气 API 错误: ${res.data.code}`))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

export function fetchCityName(lat: number, lon: number): Promise<string> {
  const location = `${lon.toFixed(2)},${lat.toFixed(2)}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/city/lookup`,
      data: {
        location,
        key: QWEATHER_KEY,
      },
      success(res: any) {
        if (res.data.code === '200' && res.data.location && res.data.location.length > 0) {
          resolve(res.data.location[0].name)
        } else {
          resolve('未知城市')
        }
      },
      fail() {
        resolve('未知城市')
      },
    })
  })
}
