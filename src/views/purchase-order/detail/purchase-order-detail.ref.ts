import { ref } from 'vue'
import { PurchaseOrder } from '../../../modules/purchase-order'

const purchaseOrder = ref<PurchaseOrder>(PurchaseOrder.blank())

export { purchaseOrder }
