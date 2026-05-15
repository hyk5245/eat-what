import { WeatherInfo } from '../../utils/types'
import {getWeatherType} from "../../utils/random";

Component({
  properties: {
    weather: {
      type: Object,
      value: null as WeatherInfo | null,
    },
    loading: {
      type: Boolean,
      value: false,
    },
    error: {
      type: String,
      value: '',
    },
  },
  data: {
    weatherEmoji: '',
    weatherType: 'mild'
  },
  observers: {
    weather(weather: WeatherInfo | null) {
      if (!weather) return
      const code = weather.code
      let emoji = '🌤️'
      if (code.includes('rain') || code.includes('drizzle')) emoji = '🌧️'
      else if (code.includes('snow')) emoji = '❄️'
      else if (code.includes('100') || code.includes('sunny')) emoji = '☀️'
      else if (code.includes('cloud')) emoji = '☁️'
      const weatherType = getWeatherType(weather)
      this.setData({ weatherEmoji: emoji, weatherType })
    },
  },
})
