import { PurchaseOrder } from '@/modules/purchase-order'
import { reactive, ref } from 'vue'

const purchaseOrderDetailRef = ref<PurchaseOrder>(PurchaseOrder.blank())
const purchaseOrderPaginationChange = reactive({
  time: new Date().toISOString(),
  purchaseOrderModified: PurchaseOrder.blank(),
})

export { purchaseOrderDetailRef, purchaseOrderPaginationChange }
