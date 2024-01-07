<script setup lang="ts">
import { DiscountType } from '@/modules/enum'
import { Invoice, InvoiceItem, InvoiceItemType } from '@/modules/invoice'
import type { Procedure } from '@/modules/procedure'
import type { ProductBatch } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { message } from 'ant-design-vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import InvoiceItemCustom from './InvoiceItemCustom.vue'
import InvoiceSearchProcedure from './InvoiceSearchProcedure.vue'
import InvoiceSearchProduct from './InvoiceSearchProduct.vue'
import InvoiceSearchProductBatch from './InvoiceSearchProductBatch.vue'

const invoiceSearchProduct = ref<InstanceType<typeof InvoiceSearchProduct>>()
const invoiceSearchProductBatch = ref<InstanceType<typeof InvoiceSearchProductBatch>>()
const invoiceSearchProcedure = ref<InstanceType<typeof InvoiceSearchProcedure>>()
const invoiceItemCustom = ref<InstanceType<typeof InvoiceItemCustom>>()

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    if (tabsKey.value === 'product') {
      tabsKey.value = 'procedure'
      nextTick(() => {
        invoiceSearchProcedure.value?.focus()
      })
    } else if (tabsKey.value === 'procedure') {
      tabsKey.value = 'product'
      nextTick(() => {
        ;(invoiceSearchProduct.value || invoiceSearchProductBatch.value)?.focus()
      })
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleDocumentKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const emit = defineEmits<{ (e: 'addInvoiceItem', value: InvoiceItem): void }>()
const props = withDefaults(defineProps<{ invoice: Invoice }>(), { invoice: () => Invoice.blank() })

const organizationStore = useOrganizationStore()
const { isMobile } = organizationStore

const defaultTabsKey = localStorage.getItem('ARRIVAL_INVOICE_UPSERT_TABS') || 'product'
const tabsKey = ref<'product' | 'procedure'>(defaultTabsKey as any)

const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const selectProductBatch = (batch: ProductBatch) => {
  const ii = InvoiceItem.blank()
  ii.referenceId = batch.id
  ii.type = InvoiceItemType.ProductBatch
  ii.productBatch = batch

  const unitDefault = batch.product!.unitDefault
  ii.unit = { name: unitDefault.name, rate: unitDefault.rate }
  ii.costPrice = batch.costPrice
  ii.expectedPrice = batch.retailPrice
  ii.actualPrice = batch.retailPrice
  ii.discountMoney = 0
  ii.discountPercent = 0
  ii.discountType = DiscountType.Percent
  ii.quantity = batch.product?.unitDefault.rate || 1
  ii.hintUsage = batch.product?.hintUsage || ''

  productOutSellType.value = 'retailPrice'
  nextProcessInvoiceItem(ii)
}

const selectProcedure = (procedure: Procedure) => {
  const ii = InvoiceItem.blank()
  ii.referenceId = procedure.id
  ii.type = InvoiceItemType.Procedure
  ii.unit = { name: 'Lần', rate: 1 }

  ii.costPrice = 0
  ii.expectedPrice = procedure.price
  ii.actualPrice = procedure.price
  ii.discountMoney = 0
  ii.discountPercent = 0
  ii.discountType = DiscountType.Percent
  ii.quantity = 1
  ii.procedure = procedure

  nextProcessInvoiceItem(ii)
}

const nextProcessInvoiceItem = (ii: InvoiceItem) => {
  if (!organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch) {
    addInvoiceItem(ii)
  } else {
    invoiceItemCustom.value?.setInvoiceItem(ii)
  }
}

const addInvoiceItem = (ii: InvoiceItem) => {
  if (!ii.referenceId) {
    message.error('Lỗi: Chưa chọn sản phẩm hoặc dịch vụ')
    if (tabsKey.value === 'product')
      return (invoiceSearchProduct.value || invoiceSearchProductBatch.value)?.focus()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.focus()
    return
  }

  if (!ii.quantity) {
    return message.error('Lỗi: Chưa chọn số lượng')
  }

  emit('addInvoiceItem', ii)

  invoiceItemCustom.value?.setInvoiceItem(InvoiceItem.blank())

  if (!isMobile) {
    if (tabsKey.value === 'product')
      return (invoiceSearchProduct.value || invoiceSearchProductBatch.value)?.focus()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.focus()
  } else {
    if (tabsKey.value === 'product')
      return (invoiceSearchProduct.value || invoiceSearchProductBatch.value)?.clear()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.clear()
  }
}

// const autoAddConsumableByHint = async (hintText: string, quantity: number) => {
//   const consumableHint = JSON.parse(hintText) as { productId: number, quantity: number }[]
//   const productIds = consumableHint.map((i) => i.productId)
//   const productList = await ProductApi.getManyByIds(productIds, { productBatches: true })
//   consumableHint.forEach((i) => {
//     const pr = productList.find((j) => j.id === i.productId)
//     if (!pr) {
//       return message.warning('Cảnh báo: Vật tư dùng cho dịch vụ không tồn tại')
//     }
//     if (pr.productBatches.length === 0) {
//       return message.warning('Cảnh báo: Vật tư dùng cho dịch vụ không còn hàng tồn')
//     }

//     const pa = pr.productBatches[0]
//     const po = new InvoiceProduct()
//     po.product = pr
//     po.productId = pa.productId
//     po.productBatchId = pa.id!
//     po.batch = pa.batch
//     po.expiryDate = pa.expiryDate
//     po.costPrice = pa.costPrice
//     po.expectedPrice = pa.retailPrice
//     po.actualPrice = 0
//     po.discountMoney = pa.retailPrice
//     po.discountPercent = 100
//     po.discountType = '%'
//     po.quantity = i.quantity * quantity

//     const findExistPo = invoice.value.invoiceProducts.find((i) => {
//       return i.productBatchId === po.productBatchId
//     })
//     if (findExistPo) {
//       findExistPo.quantity += po.quantity
//       findExistPo.discountMoney = po.discountMoney
//       findExistPo.discountPercent = po.discountPercent
//       findExistPo.discountType = po.discountType
//       findExistPo.actualPrice = po.actualPrice
//     } else {
//       invoice.value.invoiceProducts.push(po)
//     }
//   })
// }

const handleChangeTabs = (activeKey: any) => {
  localStorage.setItem('ARRIVAL_INVOICE_UPSERT_TABS', activeKey)
}
</script>

<template>
  <a-tabs
    v-model:activeKey="tabsKey"
    type="card"
    :tabBarGutter="10"
    style="overflow: visible"
    @change="handleChangeTabs"
  >
    <a-tab-pane
      key="product"
      :tab="
        `Hàng hóa (` +
        invoice.invoiceItems!.filter((i) => i.type === InvoiceItemType.ProductBatch).length +
        `)`
      "
    >
      <div class="flex flex-wrap gap-4">
        <InvoiceSearchProduct
          v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.searchType === 'PRODUCT'"
          ref="invoiceSearchProduct"
          @selectProductBatch="selectProductBatch"
        />
        <InvoiceSearchProductBatch
          v-if="
            organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.searchType === 'PRODUCT_BATCH'
          "
          ref="invoiceSearchProductBatch"
          @selectProductBatch="selectProductBatch"
        />
      </div>
    </a-tab-pane>
    <a-tab-pane
      key="procedure"
      :tab="
        'Dịch vụ (' +
        invoice.invoiceItems!.filter((i) => i.type === InvoiceItemType.Procedure).length +
        ')'
      "
    >
      <InvoiceSearchProcedure ref="invoiceSearchProcedure" @selectProcedure="selectProcedure" />
    </a-tab-pane>
  </a-tabs>

  <div
    v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch"
    class="mt-4"
  >
    <InvoiceItemCustom
      ref="invoiceItemCustom"
      :tabsKey="tabsKey"
      @addInvoiceItem="addInvoiceItem"
    />
  </div>
</template>

<style lang="scss"></style>
