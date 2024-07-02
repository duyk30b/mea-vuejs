import { ref } from 'vue'
import { Invoice } from '../../../modules/invoice'
import { Visit } from '../../../modules/visit'

const invoice = ref<Invoice>(Invoice.blank())

export const visit = ref<Visit>(Visit.blank())

export { invoice }
