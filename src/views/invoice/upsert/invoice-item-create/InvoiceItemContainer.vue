<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Invoice } from '../../../../modules/invoice'
import { InvoiceItem, InvoiceItemType } from '../../../../modules/invoice-item/invoice-item.model'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import InvoiceItemDetail from './InvoiceItemDetail.vue'
import InvoiceSearchProcedure from './InvoiceSearchProcedure.vue'
import InvoiceSearchProduct from './InvoiceSearchProduct.vue'
import { invoiceItem } from './invoice-item.ref'
import VueTabs from '../../../../common/vue-tabs/VueTabs.vue'
import VueTabPanel from '../../../../common/vue-tabs/VueTabPanel.vue'
import VueTabMenu from '../../../../common/vue-tabs/VueTabMenu.vue'

const invoiceSearchProduct = ref<InstanceType<typeof InvoiceSearchProduct>>()
const invoiceSearchProcedure = ref<InstanceType<typeof InvoiceSearchProcedure>>()
const invoiceItemDetail = ref<InstanceType<typeof InvoiceItemDetail>>()

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    if (tabsKey.value === 'product') {
      tabsKey.value = 'procedure'
      nextTick(() => invoiceSearchProcedure.value?.focus())
    } else if (tabsKey.value === 'procedure') {
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

const settingStore = useSettingStore()
const meStore = useMeStore()
const { isMobile } = settingStore
const { permissionIdMap } = meStore

const defaultTabsKey = localStorage.getItem('ARRIVAL_INVOICE_UPSERT_TABS') || 'product'
const tabsKey = ref<'product' | 'procedure'>(defaultTabsKey as any)

const nextProcessInvoiceItem = () => {
  if (!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch) {
    invoiceItem.value.quantity = 1
    addInvoiceItem()
  }
}

const addInvoiceItem = async () => {
  const { product, batch, procedure, quantity } = invoiceItem.value

  if (!invoiceItem.value.productId && !invoiceItem.value.procedureId) {
    AlertStore.addError('Lỗi: Chưa chọn sản phẩm hoặc dịch vụ')
    if (tabsKey.value === 'product') return invoiceSearchProduct.value?.focus()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.focus()
    return
  }

  // Kiểm tra số lượng
  if (quantity <= 0) {
    return AlertStore.addError('Lỗi: Số lượng không hợp lệ')
  }

  if (!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity) {
    if (invoiceItem.value.procedureId) {
      // Không cần check
    }
    if (invoiceItem.value.batchId) {
      if (quantity > batch!.quantity) {
        return AlertStore.addError(
          `Lỗi: Số lượng tồn kho không đủ, tồn ${batch!.quantity} lấy ${quantity}`
        )
      }
    }
    if (!invoiceItem.value.batchId && invoiceItem.value.productId) {
      if (product!.hasManageQuantity && quantity > product!.quantity) {
        return AlertStore.addError(
          `Lỗi: Số lượng tồn kho không đủ, tồn ${product!.quantity} lấy ${quantity}`
        )
      }
    }
  }

  emit('addInvoiceItem', InvoiceItem.clone(invoiceItem.value))

  invoiceItem.value = InvoiceItem.blank()

  invoiceItemDetail.value?.clear()
  if (!isMobile) {
    if (tabsKey.value === 'product') return invoiceSearchProduct.value?.clearAndFocus()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.clearAndFocus()
  } else {
    if (tabsKey.value === 'product') return invoiceSearchProduct.value?.clear()
    if (tabsKey.value === 'procedure') return invoiceSearchProcedure.value?.clear()
  }
}

const handleChangeTabs = (activeKey: any) => {
  tabsKey.value = activeKey
  invoiceItem.value = InvoiceItem.blank()
  localStorage.setItem('ARRIVAL_INVOICE_UPSERT_TABS', activeKey)
}
</script>

<template>
  <form @submit.prevent="(e) => addInvoiceItem()">
    <VueTabs :tabStart="tabsKey" @changeTab="handleChangeTabs">
      <template #menu>
        <VueTabMenu v-if="permissionIdMap[PermissionId.PRODUCT_READ]" tabKey="product">
          Hàng hóa ({{
            invoice.invoiceItems!.filter((i) => i.type === InvoiceItemType.Batch).length
          }})
        </VueTabMenu>
        <VueTabMenu v-if="permissionIdMap[PermissionId.PROCEDURE_READ]" tabKey="procedure">
          Dịch vụ ({{
            invoice.invoiceItems!.filter((i) => i.type === InvoiceItemType.Procedure).length
          }})
        </VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel tabKey="product">
          <div class="mt-2">
            <InvoiceSearchProduct
              ref="invoiceSearchProduct"
              :tabsKey="tabsKey"
              @createInvoiceItemProduct="nextProcessInvoiceItem"
            />
          </div>
        </VueTabPanel>
        <VueTabPanel tabKey="procedure">
          <div class="mt-2">
            <InvoiceSearchProcedure
              ref="invoiceSearchProcedure"
              :tabsKey="tabsKey"
              @createInvoiceItemProcedure="nextProcessInvoiceItem"
            />
          </div>
        </VueTabPanel>
      </template>
    </VueTabs>
    <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch" class="mt-4">
      <InvoiceItemDetail ref="invoiceItemDetail" :tabsKey="tabsKey" />
    </div>

    <div class="mt-4 flex justify-center">
      <VueButton color="blue" type="submit">
        <PlusOutlined />
        Thêm vào đơn
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
