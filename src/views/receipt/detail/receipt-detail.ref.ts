import { ref } from 'vue'
import { Receipt } from '../../../modules/receipt'

const receipt = ref<Receipt>(Receipt.blank())

export { receipt }
