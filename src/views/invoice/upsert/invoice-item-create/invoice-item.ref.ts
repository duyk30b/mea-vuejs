import { ref } from 'vue'
import { InvoiceItem } from '../../../../modules/invoice-item/invoice-item.model'

const invoiceItem = ref<InvoiceItem>(InvoiceItem.blank())

export { invoiceItem }
