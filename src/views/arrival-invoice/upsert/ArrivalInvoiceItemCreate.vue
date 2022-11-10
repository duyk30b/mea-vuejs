<script setup lang="ts">
import { InputOptions } from '@/common/vue-form'
import { DiscountType, InvoiceItemType } from '@/modules/enum'
import { Invoice, InvoiceItem } from '@/modules/invoice'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { Product, ProductBatch, ProductService } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import ModalProcedureUpsert from '../../procedure/components/ModalProcedureUpsert.vue'

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    if (tabsKey.value === 'product') {
      tabsKey.value = 'procedure'
      nextTick(() => {
        inputSearchProcedure.value?.focus()
      })
    }
    else if (tabsKey.value === 'procedure') {
      tabsKey.value = 'product'
      nextTick(() => {
        inputSearchProduct.value?.focus()
      })
    }
  }
}
onMounted(() => {
  window.addEventListener('keydown', handleDocumentKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const emit = defineEmits<{ (e: 'add_invoice_item', value: InvoiceItem): void }>()
const props = withDefaults(
  defineProps<{ invoice: Invoice }>(),
  { invoice: () => Invoice.blank() }
)

const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()
const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()
const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()

const organizationStore = useOrganizationStore()

const defaultTabsKey = localStorage.getItem('ARRIVAL_INVOICE_UPSERT_TABS') || 'product'
const tabsKey = ref<'product' | 'procedure'>(defaultTabsKey as any)

const procedure = ref(Procedure.blank())
const procedureList = ref<Procedure[]>([])

const product = ref(Product.blank())
const productList = ref<Product[]>([])
const productBatch = ref<ProductBatch>(new ProductBatch())

const invoiceItem = ref<InvoiceItem>(new InvoiceItem())

const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const searchingProduct = async (text: string) => {
  product.value.id = 0
  productList.value = []
  invoiceItem.value = new InvoiceItem()
  if (text) {
    productList.value = await ProductService.search({
      limit: 10,
      filter: {
        search_text: text,
        is_active: 'true',
        overdue: 'true',
        quantity_zero: 'false',
      },
      relations: { product_batches: true },
    })
  }
}

const searchingProcedure = async (text: string) => {
  procedure.value.id = 0
  procedureList.value = []
  invoiceItem.value = InvoiceItem.blank()
  if (text) {
    procedureList.value = await ProcedureService.list({
      limit: 10,
      filter: {
        search_text: text,
        is_active: 'true',
      },
    })
  }
}

const selectProduct = (p: Product) => {
  product.value = p
  if (product.value.productBatches.length > 0) {
    selectProductBatch(product.value.productBatches[0])
  }
  // productList.value = []
}

const handleChangeSelectProductBatch = (value: number) => {
  const pa = product.value.productBatches.find((i) => i.id === value)
  if (pa) selectProductBatch(pa)
}

const selectProductBatch = (batch: ProductBatch) => {
  const ii = new InvoiceItem()
  ii.referenceId = batch.id
  ii.type = InvoiceItemType.ProductBatch
  ii.unit = product.value?.unit?.[0] || { name: '', rate: 1 }

  ii.costPrice = batch.costPrice
  ii.expectedPrice = batch.retailPrice
  ii.actualPrice = batch.retailPrice
  ii.discountMoney = 0
  ii.discountPercent = 0
  ii.discountType = DiscountType.Percent
  ii.quantity = 0
  ii.productBatch = batch
  ii.productBatch.product = product.value

  productBatch.value = batch
  invoiceItem.value = ii
}

const selectProcedure = (p: Procedure) => {
  const ii = new InvoiceItem()
  ii.referenceId = p.id
  ii.type = InvoiceItemType.Procedure
  ii.unit = { name: 'Lần', rate: 1 }

  ii.costPrice = 0
  ii.expectedPrice = p.price
  ii.actualPrice = p.price
  ii.discountMoney = 0
  ii.discountPercent = 0
  ii.discountType = DiscountType.Percent
  ii.quantity = 1
  ii.procedure = p

  procedure.value = p
  invoiceItem.value = ii
}

const handleChangeSelectUnit = (value: number) => {
  const unit = product.value.unit.find((i) => i.rate === value)
  invoiceItem.value.unit = unit || { name: '', rate: 1 }
}

const handleChangeInvoiceProductSellType = (type: 'retailPrice' | 'wholesalePrice' | 'costPrice') => {
  let expectedPrice = productBatch.value[type] || 0

  if (invoiceItem.value.discountType === '%') {
    const discountPercent = invoiceItem.value.discountPercent || 0
    const discountMoney = Math.round(expectedPrice * discountPercent / 100)
    invoiceItem.value.discountMoney = discountMoney
    invoiceItem.value.actualPrice = expectedPrice - discountMoney
  }
  if (invoiceItem.value.discountType === 'VNĐ') {
    const discountMoney = invoiceItem.value.discountMoney || 0
    const discountPercent = expectedPrice == 0 ? 0 : Math.round(discountMoney * 100 / expectedPrice)
    invoiceItem.value.discountPercent = discountPercent
    invoiceItem.value.actualPrice = expectedPrice - discountMoney
  }
  invoiceItem.value.expectedPrice = expectedPrice
}

const handleChangeDiscountMoney = (data: number) => {
  const discountMoney = data / invoiceItem.value.unit.rate
  const expectedPrice = invoiceItem.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round(discountMoney * 100 / expectedPrice)
  invoiceItem.value.discountPercent = discountPercent
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = invoiceItem.value.expectedPrice || 0
  const discountMoney = Math.round(expectedPrice * (data || 0) / 100)
  invoiceItem.value.discountPercent = data
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data / invoiceItem.value.unit.rate
  const expectedPrice = invoiceItem.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round(discountMoney * 100 / expectedPrice)
  invoiceItem.value.discountPercent = discountPercent
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.discountType = DiscountType.VND
  invoiceItem.value.actualPrice = actualPrice
}

const addInvoiceItem = () => {
  if (!product.value.id && !procedure.value.id) {
    message.error('Lỗi: Chưa chọn sản phẩm hoặc dịch vụ')
    if (tabsKey.value === 'product') return inputSearchProduct.value?.focus()
    if (tabsKey.value === 'procedure') return inputSearchProcedure.value?.focus()
    return
  }

  if (!invoiceItem.value.referenceId) {
    return message.error('Lỗi: Chưa chọn lô hàng')
  }

  if (!invoiceItem.value.quantity) {
    return message.error('Lỗi: Chưa chọn số lượng')
  }

  emit('add_invoice_item', invoiceItem.value)

  product.value = Product.blank()
  productBatch.value = new ProductBatch()
  invoiceItem.value = new InvoiceItem()
  procedure.value = new Procedure()

  // if (tabsKey.value === 'product') return inputSearchProduct.value?.focus()
  // if (tabsKey.value === 'procedure') return inputSearchProcedure.value?.focus()
}

// const autoAddConsumableByHint = async (hintText: string, quantity: number) => {
//   const consumableHint = JSON.parse(hintText) as { productId: number, quantity: number }[]
//   const productIds = consumableHint.map((i) => i.productId)
//   const productList = await ProductService.getManyByIds(productIds, { productBatches: true })
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
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="selectProcedure" />
  <a-tabs v-model:activeKey="tabsKey" @change="handleChangeTabs" type="card" :tabBarGutter="10"
    style="overflow: visible;">
    <a-tab-pane key="product"
      :tab="'Hàng hóa (' + invoice.invoiceItems.filter(i => i.type === InvoiceItemType.ProductBatch).length + ')'">
      <div>
        <div>Tên hàng hóa</div>
        <InputOptions ref="inputSearchProduct" :options="productList" v-model:searchText="product.brandName"
          @selectItem="selectProduct" @update:searchText="searchingProduct" :maxHeight="320"
          placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm">
          <template v-slot:each="{ item: { brandName, substance, unit, productBatches } }">
            <div> <b>{{ brandName }}</b> - {{ substance }} </div>
            <div v-if="productBatches.length == 0">
              - Hàng tồn <b>0</b> {{ unit?.[0].name }}
            </div>
            <div v-for="(batch, i) in productBatches" :key="i">
              - Lô hàng {{ batch.batch }} - {{ timeToText(batch.expiryDate) }}
              - Tồn <b>{{ batch.quantity }} {{ unit?.[0].name }}</b> - Giá bán <b>{{ formatNumber(batch.retailPrice)
              }}</b>
            </div>
          </template>
        </InputOptions>
      </div>
      <div class="mt-4 flex flex-wrap gap-4">
        <div style="flex: 1; flex-basis: 400px;">
          <div>Lô hàng
            <span v-if="invoiceItem.productBatch?.expiryDate && invoiceItem.productBatch?.expiryDate < Date.now()"
              class="text-red-500 font-bold">
              (Hết hạn sử dụng)
            </span>
          </div>
          <a-select v-model:value="invoiceItem.referenceId" class="w-full" @change="handleChangeSelectProductBatch"
            :options="product.productBatches.map((i: ProductBatch) => ({
              value: i.id,
              label: `Lô ${i.batch} - HSD ${timeToText(i.expiryDate, 'DD/MM/YYYY')}`
                + ` - Tồn ${i.quantity} ${product.unit?.[0].name} - G.Bán ${formatNumber(i.retailPrice, 0)}`,
            }))" :disabled="product.productBatches.length == 1"></a-select>
        </div>
        <div v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemInput.expectedPrice"
          style="flex: 1; flex-basis: 400px;">
          <div>Giá bán
            <span v-if="invoiceItem.unit.rate !== 1">
              (Quy đổi: <b>{{ formatNumber(invoiceItem.expectedPrice) }} / </b>
              {{ product.unit.find(i => i.rate === 1)?.name }})
            </span>
          </div>
          <a-input-group compact>
            <a-select style="width: 120px;" v-model:value="productOutSellType"
              @change="handleChangeInvoiceProductSellType">
              <a-select-option value="retailPrice">Giá bán lẻ</a-select-option>
              <a-select-option v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemInput.wholesalePrice"
                value="wholesalePrice">Giá bán sỉ</a-select-option>
              <a-select-option v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemInput.costPrice"
                value="costPrice">Giá nhập</a-select-option>
            </a-select>
            <a-input-number :value="invoiceItem.expectedPrice * invoiceItem.unit.rate" style="width: calc(100% - 120px)"
              :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value: any) => value.replace(/(,*)/g, '')" disabled />
          </a-input-group>
        </div>
      </div>
    </a-tab-pane>
    <a-tab-pane key="procedure"
      :tab="'Dịch vụ (' + invoice.invoiceItems.filter(i => i.type === InvoiceItemType.Procedure).length + ')'">
      <div>
        <div class="flex justify-between">
          <span>Tên dịch vụ</span>
          <a @click="modalProcedureUpsert?.openModal()">Thêm dịch vụ mới</a>
        </div>
        <InputOptions ref="inputSearchProcedure" :options="procedureList" v-model:searchText="procedure.nameVi"
          @selectItem="selectProcedure" @update:searchText="searchingProcedure" :maxHeight="320"
          placeholder="(F3) Tìm kiếm tên dịch vụ">
          <template v-slot:each="{ item: { nameVi, price } }">
            <div> <b>{{ nameVi }}</b> - {{ formatNumber(price) }} </div>
          </template>
        </InputOptions>
      </div>
    </a-tab-pane>
  </a-tabs>

  <div class="mt-4">
    <div class="flex flex-wrap gap-4">
      <div v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemInput.quantity"
        style="flex: 1; flex-basis: 400px;">
        <div>Số lượng
          <span v-if="invoiceItem.unit.rate !== 1">
            (Quy đổi: <b>{{ invoiceItem.quantity }}</b>
            {{ product.unit.find(i => i.rate === 1)?.name }})
          </span>
        </div>
        <a-input-number style="width: 100%;" :value="invoiceItem.quantity / invoiceItem.unit.rate"
          @update:value="(e: number) => invoiceItem.quantity = e * invoiceItem.unit.rate" :min="0">
          <template #addonBefore>
            <a-select :value="invoiceItem.unit.rate" @change="handleChangeSelectUnit" style="width: 80px"
              :disabled="(productBatch.product?.unit?.length || 0) <= 1">
              <a-select-option v-for="(item, index) in productBatch.product?.unit || [{ name: '', rate: 1 }]" :key="index"
                :value="item.rate">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </template>
        </a-input-number>
      </div>

      <div v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemInput.discount"
        style="flex: 1; flex-basis: 400px;">
        <div>Chiết khấu
          <span
            v-if="(invoiceItem.discountType === DiscountType.Percent && invoiceItem.discountPercent !== 0) || invoiceItem.unit.rate > 1">
            <b>({{ formatNumber(invoiceItem.discountMoney) }} / </b>
            {{ product.unit.find(i => i.rate === 1)?.name }})
          </span>
        </div>
        <a-input-group compact>
          <a-select style="width: 120px;" v-model:value="invoiceItem.discountType">
            <a-select-option :value="DiscountType.Percent">%</a-select-option>
            <a-select-option :value="DiscountType.VND">VNĐ</a-select-option>
          </a-select>
          <a-input-number v-if="invoiceItem.discountType === DiscountType.VND"
            :value="invoiceItem.discountMoney * invoiceItem.unit.rate" @change="handleChangeDiscountMoney"
            :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            :parser="(value: any) => value.replace(/(,*)/g, '')" style="width: calc(100% - 120px)" />
          <a-input-number v-if="invoiceItem.discountType === DiscountType.Percent" :value="invoiceItem.discountPercent"
            @change="handleChangeDiscountPercent" :min="0" :max="100" style="width: calc(100% - 120px)" />
        </a-input-group>
      </div>

      <div v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemInput.actualPrice"
        style="flex: 1;flex-basis: 400px;">
        <div>Giá thực tế
          <span v-if="invoiceItem.unit.rate !== 1">
            (Quy đổi: <b>{{ formatNumber(invoiceItem.actualPrice) }} / </b>
            {{ product.unit.find(i => i.rate === 1)?.name }})
          </span>
        </div>
        <a-input-number style="width: 100%;" :value="invoiceItem.actualPrice * invoiceItem.unit.rate"
          @change="handleChangeActualPrice" step="1000"
          :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(value: any) => value.replace(/(,*)/g, '')" />
      </div>
    </div>
    <div class="mt-4 text-center">
      <a-button type="primary" @click="addInvoiceItem">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm vào đơn
      </a-button>
    </div>
  </div>
</template>

<style lang="scss"></style>
