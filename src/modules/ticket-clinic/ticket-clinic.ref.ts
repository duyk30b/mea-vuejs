import { computed, ref } from 'vue'
import { Ticket } from '../../modules/ticket'
import { DeliveryStatus } from '../enum'

export const ticketClinicRef = ref<Ticket>(Ticket.blank())
export const ticketClinicList = ref<Ticket[]>([])

export const ticketRefDeliveryStatus = computed(() => {
  let ticketProductList = ticketClinicRef.value.ticketProductList
  if (!ticketProductList?.length) {
    ticketProductList = [
      ...(ticketClinicRef.value.ticketProductConsumableList || []),
      ...(ticketClinicRef.value.ticketProductPrescriptionList || []),
    ]
  }

  if (!ticketProductList?.length) {
    return DeliveryStatus.NoStock
  }
  if (
    ticketProductList!.find((i) => {
      return i.deliveryStatus === DeliveryStatus.Pending
    })
  ) {
    return DeliveryStatus.Pending
  }
  if (
    ticketProductList!.find((i) => {
      return i.deliveryStatus === DeliveryStatus.Delivered
    })
  ) {
    return DeliveryStatus.Delivered
  }

  return DeliveryStatus.NoStock
})
