import { DiscountType } from '@/modules/enum'
import { Invoice } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { ref, watchEffect } from 'vue'

const invoice = ref<Invoice>(Invoice.blank())
const organizationStore = useOrganizationStore()

watchEffect(() => {
  const totalCostMoney = invoice.value.invoiceItems.reduce((acc, item) => acc + item.costPrice * item.quantity, 0)
  const totalItemMoney = invoice.value.invoiceItems.reduce((acc, item) => acc + item.actualPrice * item.quantity, 0)

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (invoice.value.discountType === DiscountType.VND) {
    discountMoney = invoice.value.discountMoney || 0
    discountPercent = totalItemMoney == 0 ? 0 : Math.floor(discountMoney * 100 / totalItemMoney)
    discountType = DiscountType.VND
  }
  if (invoice.value.discountType === DiscountType.Percent) {
    discountPercent = invoice.value.discountPercent || 0
    discountMoney = Math.floor(totalItemMoney * discountPercent / 100)
    discountType = DiscountType.Percent
  }

  const surcharge = invoice.value.surcharge || 0
  const expenses = invoice.value.expenses || 0
  const totalMoney = totalItemMoney - discountMoney + surcharge
  const profit = totalMoney - totalCostMoney - expenses

  invoice.value.totalCostMoney = totalCostMoney
  invoice.value.totalItemMoney = totalItemMoney
  invoice.value.discountMoney = discountMoney
  invoice.value.discountPercent = discountPercent
  invoice.value.discountType = discountType
  invoice.value.totalMoney = totalMoney
  invoice.value.profit = profit

  if (organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.paymentZero === true) {
    invoice.value.debt = totalMoney
  }
})

export { invoice }