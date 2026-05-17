import { Dish } from '../../utils/types'

Component({
  properties: {
    dish: {
      type: Object,
      value: null as Dish | null,
    },
    visible: {
      type: Boolean,
      value: false,
    },
    source: {
      type: String,
      value: 'random',
    },
  },
  methods: {
    onChange() {
      this.triggerEvent('change', { dishId: this.properties.dish?.id })
    },
    onConfirm() {
      this.triggerEvent('confirm', { dish: this.properties.dish, dishId: this.properties.dish?.id })
    },
    onClose() {
      this.triggerEvent('close')
    },
  },
})
