<script setup lang="ts">
import { message } from 'ant-design-vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { DiscountType } from '../../../../modules/enum'
import { Invoice } from '../../../../modules/invoice'
import { InvoiceItem, InvoiceItemType } from '../../../../modules/invoice-item/invoice-item.model'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure } from '../../../../modules/procedure'
import InvoiceItemDetail from './InvoiceItemDetail.vue'
import InvoiceSearchProcedure from './InvoiceSearchProcedure.vue'
import InvoiceSearchProduct from './InvoiceSearchProduct.vue'
import { Product } from '../../../../modules/product'
import { Batch, useBatchStore } from '../../../../modules/batch'

const invoiceSearchProduct = ref<InstanceType<typeof InvoiceSearchProduct>>()
const invoiceSearchProcedure = ref<InstanceType<typeof InvoiceSearchProcedure>>()
const invoiceItemDetail = ref<InstanceType<typeof InvoiceItemDetail>>()

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    if (tabsKey.value === 'product') {
      tabsKey.value = 'procedure'
      nextTick(() => invoiceSearchProcedure.value?.focus())
    }
    if (tabsKey.value === 'procedure') {
      tabsKey.value = 'product'
      nextTick(() => invoiceSearchProduct.value?.focus())
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

const screenStore = useScreenStore()
const productBatchStore = useBatchStore()
const meStore = useMeStore()
const { isMobile } = screenStore
const { permissionIdMap } = meStore

const defaultTabsKey = localStorage.getItem('ARRIVAL_INVOICE_UPSERT_TABS') || 'product'
const tabsKey = ref<'product' | 'procedure'>(defaultTabsKey as any)

const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const selectBatch = (batch: Batch | null) => {
  productOutSellType.value = 'retailPrice'
  if (batch) {
    const ii = InvoiceItem.blank()
    ii.batchId = batch.id
    ii.productId = batch.productId
    ii.procedureId = 0

    ii.type = InvoiceItemType.Batch
    ii.batch = Batch.clone(batch)
    ii.product = Product.clone(batch.product!)

    const unitDefault = batch.product!.unitDefault
    ii.unit = { name: unitDefault.name, rate: unitDefault.rate }
    ii.costPrice = batch.costPrice
    ii.expectedPrice = batch.product!.retailPrice
    ii.actualPrice = batch.product!.retailPrice
    ii.discountMoney = 0
    ii.discountPercent = 0
    ii.discountType = DiscountType.Percent
    ii.quantity = batch.product?.unitDefault.rate || 1
    ii.hintUsage = batch.product?.hintUsage || ''

    nextProcessInvoiceItem(ii)
  } else {
    nextProcessInvoiceItem(InvoiceItem.blank())
  }
}

const selectProduct = (product: Product | null) => {
  productOutSellType.value = 'retailPrice'
  if (product) {
    const ii = InvoiceItem.blank()
    ii.productId = product.id
    ii.batchId = 0
    ii.procedureId = 0

    if (product.hasManageQuantity) {
      ii.type = InvoiceItemType.Product
    } else {
      ii.type = InvoiceItemType.ProductNoManageQuantity
    }
    ii.product = Product.clone(product)

    const unitDefault = product!.unitDefault
    ii.unit = { name: unitDefault.name, rate: unitDefault.rate }
    ii.costPrice = product.costPrice
    ii.expectedPrice = product.retailPrice
    ii.actualPrice = product.retailPrice
    ii.discountMoney = 0
    ii.discountPercent = 0
    ii.discountType = DiscountType.Percent
    ii.quantity = product.unitDefault.rate || 1
    ii.hintUsage = product.hintUsage || ''

    nextProcessInvoiceItem(ii)
  } else {
    nextProcessInvoiceItem(InvoiceItem.blank())
  }
}

const selectProcedure = (procedure: Procedure | null) => {
  if (procedure) {
    const ii = InvoiceItem.blank()
    ii.procedureId = procedure.id
    ii.batchId = 0
    ii.productId = 0

    ii.type = InvoiceItemType.Procedure
    ii.procedure = Procedure.clone(procedure)

    ii.unit = { name: 'Lần', rate: 1 }
    ii.costPrice = 0
    ii.expectedPrice = procedure.price
    ii.actualPrice = procedure.price
    ii.discountMoney = 0
    ii.discountPercent = 0
    ii.discountType = DiscountType.Percent
    ii.quantity = 1

    nextProcessInvoiceItem(ii)
  } else {
    nextProcessInvoiceItem(InvoiceItem.blank())
  }
}

const nextProcessInvoiceItem = (ii: InvoiceItem) => {
  if (!screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch) {
    if (ii.quantity > 0) {
      addInvoiceItem(ii)
    }
  } else {
    invoiceItemDetail.value?.setInvoiceItem(ii)
  }
}

const addInvoiceItem = async (ii: InvoiceItem) => {
  if (!ii.productId && !ii.procedureId) {
    message.error('Lỗi: Chưa chọn sản phẩm hoặc dịch vụ')
    if (tabsKey.value === 'product') return invoiceSearchProduct.value?.focus()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.focus()
    return
  }

  // Kiểm tra số lượng
  if (!ii.quantity) {
    return message.error('Lỗi: Chưa chọn số lượng')
  }
  if (!screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity) {
    if (ii.procedureId) {
      // Không cần check
    }
    if (ii.batchId) {
      if (ii.quantity > ii.batch!.quantity) {
        return message.error('Lỗi: Số lượng tồn kho không đủ')
      }
    }
    if (!ii.batchId && ii.productId) {
      if (ii.product!.hasManageQuantity && ii.quantity > ii.product!.quantity) {
        return message.error('Lỗi: Số lượng tồn kho không đủ')
      }
    }
  }

  emit('addInvoiceItem', ii)

  invoiceItemDetail.value?.setInvoiceItem(InvoiceItem.blank())

  if (!isMobile) {
    if (tabsKey.value === 'product') return invoiceSearchProduct.value?.clearAndFocus()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.clearAndFocus()
  } else {
    if (tabsKey.value === 'product') return invoiceSearchProduct.value?.clear()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.clear()
  }
}

const handleChangeTabs = (activeKey: any) => {
  invoiceItemDetail.value?.setInvoiceItem(InvoiceItem.blank())
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
      v-if="permissionIdMap[PermissionId.PRODUCT_READ]"
      key="product"
      :tab="
        `Hàng hóa (` +
        invoice.invoiceItems!.filter((i) => i.type === InvoiceItemType.Batch).length +
        `)`
      "
    >
      <div class="flex flex-wrap gap-4">
        <InvoiceSearchProduct
          ref="invoiceSearchProduct"
          @selectProduct="selectProduct"
          @selectBatch="selectBatch"
        />
      </div>
    </a-tab-pane>
    <a-tab-pane
      v-if="permissionIdMap[PermissionId.PROCEDURE_READ]"
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

  <div v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch" class="mt-4">
    <InvoiceItemDetail
      ref="invoiceItemDetail"
      :tabsKey="tabsKey"
      @addInvoiceItem="addInvoiceItem"
    />
  </div>
</template>

<style lang="scss"></style>
