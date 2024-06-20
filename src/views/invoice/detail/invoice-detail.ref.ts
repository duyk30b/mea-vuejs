import { ref } from 'vue'
import { Invoice } from '../../../modules/invoice'

const invoice = ref<Invoice>(Invoice.blank())

export { invoice }
