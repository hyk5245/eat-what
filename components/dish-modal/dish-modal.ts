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
      this.triggerEvent('change')
    },
    onConfirm() {
      this.triggerEvent('confirm', { dish: this.properties.dish })
    },
    onClose() {
      this.triggerEvent('close')
    },
  },
})
