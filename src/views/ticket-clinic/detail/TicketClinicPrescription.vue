<script lang="ts" setup>
import { FileSearchOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch, IconTrash } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputHint, InputNumber, InputOptions, VueSelect } from '../../../common/vue-form'
import WysiwygEditor from '../../../common/wysiwyg-editor/WysiwygEditor.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../modules/batch'
import { DeliveryStatus, DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  type MedicineType,
  PrescriptionSample,
  PrescriptionSampleService,
} from '../../../modules/prescription-sample'
import { PrintHtml, printHtmlCompiledTemplate, PrintHtmlService } from '../../../modules/print-html'
import { Product, ProductService } from '../../../modules/product'
import { TicketStatus } from '../../../modules/ticket'
import {
  TicketAttributeKeyAdviceList,
  type TicketAttributeKeyAdviceType,
} from '../../../modules/ticket-attribute'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketProduct, TicketProductApi, TicketProductType } from '../../../modules/ticket-product'
import { DDom, DString, DTimer } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<
  {
    value: number
    text: string
    data: {
      type: 'product' | 'prescriptionSample'
      product?: Product
      prescriptionSample?: PrescriptionSample
    }
  }[]
>([])

const batchList = ref<Batch[]>([])

const ticketProductPrescription = ref<TicketProduct>(TicketProduct.blank())
const ticketProductPrescriptionList = ref<TicketProduct[]>([])

const ticketAttributeOriginMap: { [P in TicketAttributeKeyAdviceType]?: any } = {}
const ticketAttributeMap = ref<{ [P in TicketAttributeKeyAdviceType]?: any } & { advice: string }>({
  advice: '',
})

const saveLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicPrescription.vue:70 ~ onMounted')
})

watch(
  () => ticketClinicRef.value.ticketProductPrescriptionList,
  (newValue, oldValue) => {
    ticketProductPrescriptionList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)

watch(
  () => ticketClinicRef.value.ticketAttributeList,
  (newValue, oldValue) => {
    if (!newValue) {
      return (ticketAttributeMap.value = { advice: '' })
    }
    newValue.forEach((i) => {
      if (!TicketAttributeKeyAdviceList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyAdviceType
      if (i.value === ticketAttributeOriginMap[k]) return
      ticketAttributeOriginMap[k] = i.value
      ticketAttributeMap.value[k] = i.value
    })
  },
  { immediate: true, deep: true }
)

const hasChangeAttribute = computed(() => {
  let hasChange = false
  Object.entries(ticketAttributeMap.value).forEach(([key, value]) => {
    const k = key as unknown as TicketAttributeKeyAdviceType
    const rootValue = ticketClinicRef.value.ticketAttributeMap[k] || ''
    if (rootValue != value) {
      hasChange = true
    }
  })
  return hasChange
})

const disabledButton = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketClinicRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return false
  }

  if (hasChangeAttribute.value) {
    return false
  }
  return true
})

const handleFocusFirstSearchProduct = async () => {
  try {
    await Promise.all([
      ProductService.refreshDB(),
      BatchService.refreshDB(),
      PrescriptionSampleService.list({}),
    ])
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicPrescription.vue:138 ~ ~ error:', error)
  }
}

const searchingProduct = async (text: string) => {
  if (!text) {
    productOptions.value = []
    return
  }

  const productList = await ProductService.list({
    filter: {
      isActive: 1,
      $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
      warehouseIds: (value) => {
        try {
          const warehouseIdAcceptList =
            settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList
          const v: number[] = JSON.parse(value)
          if (!warehouseIdAcceptList.length || warehouseIdAcceptList.includes(0)) return true
          if (!v.length || v.includes(0)) return true

          for (let i = 0; i < v.length; i++) {
            if (warehouseIdAcceptList.includes(v[i])) {
              return true
            }
          }
          return false
        } catch (error) {
          return true
        }
      },
    },
  })
  const prescriptionSampleList: PrescriptionSample[] = await PrescriptionSampleService.search(text)

  productOptions.value = [
    ...prescriptionSampleList.map((i) => ({
      value: i.id,
      text: i.name,
      data: { type: 'prescriptionSample' as any, prescriptionSample: i },
    })),
    ...productList.map((i) => {
      return {
        value: i.id,
        text: i.brandName,
        data: {
          type: 'product' as any,
          product: i,
        },
      }
    }),
  ]
}

const clear = () => {
  ticketProductPrescription.value = TicketProduct.blank()
  batchList.value = []
  productOptions.value = []
}

const selectProduct = async (productSelect: Product) => {
  const temp = TicketProduct.blank()
  temp.customerId = ticketClinicRef.value.customerId
  temp.productId = productSelect.id
  temp.product = Product.from(productSelect)

  temp.type = TicketProductType.Prescription
  temp.deliveryStatus = DeliveryStatus.Pending
  temp.unitRate = productSelect.unitDefaultRate

  temp.expectedPrice = productSelect.retailPrice
  temp.discountType = DiscountType.Percent
  temp.discountPercent = 0
  temp.discountMoney = 0
  temp.actualPrice = productSelect.retailPrice
  temp.hintUsage = productSelect.hintUsage

  if (!productSelect.hasManageQuantity) {
    temp.warehouseId = 0 // set tạm như này để cho trường hợp !hasManageQuantity, khi gắn batch set lại sau
    temp.costPrice = productSelect.costPrice // set tạm như này để cho trường hợp !hasManageQuantity, khi gắn batch set lại sau
  }

  ticketProductPrescription.value = temp

  const warehouseIdAcceptList = settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList
  const batchListResponse = await BatchService.list({
    filter: {
      productId: productSelect.id,
      quantity: { NOT: 0 },
      $OR: [{ warehouseId: { EQUAL: 0 } }, { warehouseId: { IN: warehouseIdAcceptList } }],
    },
    sort: { expiryDate: 'ASC' },
  })
  batchListResponse.forEach((i) => (i.product = productSelect))
  batchList.value = batchListResponse

  if (batchListResponse.length) {
    selectBatch(batchListResponse[0])
  } else {
    selectBatch(Batch.blank())
  }
  selectBatch(batchList.value[0])
}

const selectPrescriptionSample = (prescriptionSampleSelect: PrescriptionSample) => {
  prescriptionSampleSelect.medicineList.forEach(async (medicine) => {
    const productCurrent = medicine.product
    if (!productCurrent) return

    if (!productCurrent.hasManageQuantity) {
      const temp = TicketProduct.blank()
      temp.customerId = ticketClinicRef.value.customerId
      temp.productId = productCurrent.id
      temp.product = Product.from(productCurrent)

      temp.type = TicketProductType.Prescription
      temp.deliveryStatus = DeliveryStatus.Pending
      temp.unitRate = productCurrent.unitDefaultRate
      temp.hintUsage = productCurrent.hintUsage

      temp.costPrice = productCurrent.costPrice
      temp.expectedPrice = productCurrent.retailPrice
      temp.discountType = DiscountType.Percent
      temp.discountPercent = 0
      temp.discountMoney = 0
      temp.actualPrice = productCurrent.retailPrice
      temp.quantity = medicine.quantity || 0
      temp.quantityPrescription = medicine.quantity || 0
      ticketProductPrescriptionList.value.push(temp)
    } else {
      const warehouseIdAcceptList = settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
      const batchListCurrent = await BatchService.list({
        filter: {
          productId: productCurrent.id,
          quantity: { GT: 0 },
          $OR: [{ warehouseId: { EQUAL: 0 } }, { warehouseId: { IN: warehouseIdAcceptList } }],
        },
        sort: { expiryDate: 'ASC' },
      })
      let quantityRemain = medicine.quantity
      batchListCurrent.forEach((batch) => {
        if (quantityRemain <= 0) return
        const quantitySelect = Math.min(quantityRemain, batch.quantity)
        quantityRemain = quantityRemain - quantitySelect

        const temp = TicketProduct.blank()
        temp.customerId = ticketClinicRef.value.customerId
        temp.productId = productCurrent.id
        temp.batchId = batch.id
        temp.product = Product.from(productCurrent)
        temp.batch = Batch.from(batch)

        temp.type = TicketProductType.Prescription
        temp.deliveryStatus = DeliveryStatus.Pending
        temp.unitRate = productCurrent.unitDefaultRate
        temp.hintUsage = medicine.hintUsage

        temp.costPrice = batch.costPrice
        temp.expectedPrice = productCurrent.retailPrice
        temp.discountType = DiscountType.Percent
        temp.discountPercent = 0
        temp.discountMoney = 0
        temp.actualPrice = productCurrent.retailPrice
        temp.quantity = quantitySelect
        temp.quantityPrescription = quantitySelect
        ticketProductPrescriptionList.value.push(temp)
      })
    }
  })
}

const selectItemOptions = (dataSelected?: {
  type: 'product' | 'prescriptionSample'
  product: Product
  prescriptionSample: PrescriptionSample
}) => {
  if (!dataSelected) {
    return clear()
  }
  if (dataSelected.type === 'product') {
    selectProduct(dataSelected.product)
  }
  if (dataSelected.type === 'prescriptionSample') {
    clear()
    selectPrescriptionSample(dataSelected.prescriptionSample)
  }
}

const selectBatch = (batchSelected: Batch | null) => {
  if (!batchSelected) return

  ticketProductPrescription.value.batch = Batch.from(batchSelected)
  ticketProductPrescription.value.batchId = batchSelected.id
  ticketProductPrescription.value.warehouseId = batchSelected.warehouseId
  ticketProductPrescription.value.costPrice = batchSelected.costPrice
}

const addPrescriptionItem = () => {
  const { product, batch } = ticketProductPrescription.value
  if (!ticketProductPrescription.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }
  if (product?.hasManageQuantity && batchList.value.length <= 0) {
    return AlertStore.addError(
      'Lỗi: Sản phẩm này không còn hàng trong kho. Vui lòng nhập thêm hàng trước khi bán'
    )
  }
  if (ticketProductPrescription.value.quantity <= 0) {
    return AlertStore.addError('Lỗi: Số lượng không hợp lệ')
  }

  if (product?.hasManageQuantity) {
    if (!ticketProductPrescription.value.batchId) {
      return AlertStore.addError('Lỗi: Không có lô hàng phù hợp')
    }
    if (!settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
      if (ticketProductPrescription.value.quantity > batch!.quantity) {
        return AlertStore.addError(
          `Lỗi: Số lượng tồn kho không đủ, tồn ${batch!.quantity} lấy ${
            ticketProductPrescription.value.quantity
          }`
        )
      }
    }
  }

  // gán số lượng trong đơn
  ticketProductPrescription.value.quantityPrescription = ticketProductPrescription.value.quantity
  ticketProductPrescriptionList.value.push(ticketProductPrescription.value)

  clear()
  inputOptionsProduct.value?.clear()

  if (!isMobile) {
    inputOptionsProduct.value?.focus()
  }
}

const changeQuantityTable = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductPrescriptionList.value[index]
  ticketProductCurrent.unitQuantityPrescription = unitQuantity
  ticketProductCurrent.unitQuantity = unitQuantity
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductPrescriptionList.value[index]
  ticketProductPrescriptionList.value[index] = ticketProductPrescriptionList.value[index + count]
  ticketProductPrescriptionList.value[index + count] = temp
}

const startPrint = async () => {
  try {
    let printHtmlId = settingStore.TICKET_CLINIC_DETAIL.printHtmlIdSetting.prescription
    let printHtml: PrintHtml | undefined
    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.prescription
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }
    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      masterData: {},
      printHtml: printHtml!,
    })

    await DDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const savePrescription = async () => {
  let ticketProductPrescriptionListChange: TicketProduct[] | undefined = undefined

  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketClinicRef.value.ticketProductPrescriptionList || []
    )
  ) {
    ticketProductPrescriptionListChange = ticketProductPrescriptionList.value.filter((i) => {
      return [DeliveryStatus.NoStock, DeliveryStatus.Pending].includes(i.deliveryStatus)
    })
  }

  let ticketAttributeChangeList = undefined
  if (hasChangeAttribute.value) {
    ticketAttributeChangeList = Object.entries(ticketAttributeMap.value)
      .map(([key, value]) => ({ key, value }))
      .filter((i) => !!i.value)
  }

  await TicketClinicApi.updateTicketProductPrescription({
    ticketId: ticketClinicRef.value.id,
    ticketProductPrescriptionList: ticketProductPrescriptionListChange,
    ticketAttributeChangeList,
    ticketAttributeKeyList: TicketAttributeKeyAdviceList as any,
  })
}

const destroyTicketProductZeroQuantity = async (ticketProductId: number) => {
  await TicketProductApi.destroyZeroQuantity(ticketProductId)
  const findIndexCurrent = ticketProductPrescriptionList.value.findIndex((i) => {
    return i.id === ticketProductId
  })
  if (findIndexCurrent !== -1) {
    ticketProductPrescriptionList.value.splice(findIndexCurrent, 1)
  }

  const findIndexRoot = ticketClinicRef.value.ticketProductPrescriptionList!.findIndex((i) => {
    return i.id === ticketProductId
  })
  if (findIndexRoot !== -1) {
    ticketClinicRef.value.ticketProductPrescriptionList!.splice(findIndexCurrent, 1)
  }
}

const handleModalProductUpsertSuccess = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName,
    data: instance,
    value: instance?.id,
  })
  if (instance) {
    selectProduct(instance)
  }
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <form @submit.prevent="(e) => addPrescriptionItem()">
    <div class="mt-4">
      <div class="flex gap-1 flex-wrap">
        <span>Tên thuốc</span>
        <a
          v-if="ticketProductPrescription.product?.id"
          @click="modalProductDetail?.openModal(ticketProductPrescription.product)">
          <IconFileSearch />
        </a>
        <div v-if="ticketProductPrescription.productId">
          (
          <span
            v-if="ticketProductPrescription.product?.hasManageQuantity"
            :class="
              ticketProductPrescription.quantity > ticketProductPrescription.product!.quantity
                ? 'text-red-500 font-bold'
                : ''
            ">
            Tồn:
            <b>
              {{ ticketProductPrescription.product?.unitQuantity }}
              {{ ticketProductPrescription.product?.unitDefaultName }}
            </b>
          </span>
          <span>
            - Giá
            <b>{{ formatMoney(ticketProductPrescription.product!.unitRetailPrice) }}</b>
          </span>
          )
        </div>
        <a
          v-if="
            permissionIdMap[PermissionId.PRODUCT_UPDATE] && ticketProductPrescription.product?.id
          "
          @click="modalProductUpsert?.openModal(ticketProductPrescription.product.id)">
          Sửa thông tin sản phẩm
        </a>
      </div>

      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProduct"
          required
          :options="productOptions"
          :maxHeight="320"
          placeholder="Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
          "
          @selectItem="({ data }) => selectItemOptions(data)"
          @onFocusinFirst="handleFocusFirstSearchProduct"
          @update:text="searchingProduct">
          <template #option="{ item: { data } }">
            <div v-if="data.type === 'product'">
              <div>
                <b>{{ data.product.brandName }}</b>
                -
                <span
                  style="font-weight: 700"
                  :class="data.product.unitQuantity <= 0 ? 'text-red-500' : ''">
                  {{ data.product.unitQuantity }}
                </span>
                {{ data.product.unitDefaultName }}
                - Giá
                <span style="font-weight: 600">
                  {{ formatMoney(data.product.unitRetailPrice) }}
                </span>
                /{{ data.product.unitDefaultName }}
              </div>
              <div>{{ data.product.substance }}</div>
            </div>
            <div v-if="data.type === 'prescriptionSample'">
              <b>-- {{ data.prescriptionSample.name }}</b>
              <div style="font-size: 13px; font-style: italic">
                {{
                  data.prescriptionSample.medicineList
                    .map((i: MedicineType) => {
                      return `${i.product?.brandName} (${i.quantity} ${i.product?.unitBasicName})`
                    })
                    .join(', ')
                }}
              </div>
            </div>
          </template>
        </InputOptions>
      </div>
    </div>
    <div class="mt-4" style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span
          v-if="
            ticketProductPrescription.batch?.expiryDate &&
            ticketProductPrescription.batch?.expiryDate < Date.now()
          "
          class="text-red-500 font-bold">
          (Hết hạn sử dụng)
        </span>
        <span
          v-if="ticketProductPrescription.productId && !batchList.length"
          class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="ticketProductPrescription.batch!.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProductPrescription.product!.unitDefaultName }}
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span
                :class="
                  ticketProductPrescription.quantity > data.quantity ? 'text-red-500 font-bold' : ''
                ">
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProductPrescription.product!.unitDefaultName }}
              </span>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>

    <div class="mt-4">
      <div class="flex flex-wrap item-center gap-2">
        <span>Số lượng</span>
        <span v-if="ticketProductPrescription.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductPrescription.quantity }}</b>
          {{ ticketProductPrescription.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 100px">
          <VueSelect
            v-model:value="ticketProductPrescription.unitRate"
            :disabled="ticketProductPrescription.product!.unitObject.length <= 1"
            :options="
              ticketProductPrescription.product!.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required></VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductPrescription.unitQuantity"
            required
            :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div>Hướng dẫn sử dụng</div>
      <InputHint
        v-model:value="ticketProductPrescription.hintUsage"
        :options="[
          ...(ticketProductPrescription.product!.hintUsage
            ? [ticketProductPrescription.product!.hintUsage]
            : []),
          ...settingStore.PRODUCT_HINT_USAGE,
        ]"
        :maxHeight="320"
        :logic-filter="(item: any, text: string) => DString.customFilter(item, text)"></InputHint>
    </div>
    <div class="mt-4 flex justify-center">
      <VueButton
        icon="plus"
        :disabled="
          [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
        "
        color="blue"
        type="submit">
        Thêm vào đơn
      </VueButton>
    </div>
  </form>

  <div class="mt-4">
    <div>Đơn thuốc</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên Thuốc</th>
            <th>SL kê</th>
            <th>SL mua</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProductPrescriptionList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(tpItem, index) in ticketProductPrescriptionList || []"
            :key="tpItem.productId">
            <td>
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0 || tpItem.deliveryStatus === DeliveryStatus.Delivered"
                  @click="changeItemPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <span>{{ index + 1 }}</span>
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="
                    index === ticketProductPrescriptionList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div style="font-weight: 500">
                {{ tpItem.product?.brandName }}
                <a class="ml-1" @click="openModalProductDetail(tpItem.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
              <div class="text-xs italic">{{ tpItem.hintUsage }}</div>
            </td>
            <td style="width: 150px">
              <div
                v-if="
                  tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
                "
                class="text-center">
                {{ tpItem.unitQuantityPrescription }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpItem.quantityPrescription <= 0"
                  type="button"
                  @click="changeQuantityTable(index, tpItem.unitQuantityPrescription - 1)">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpItem.unitQuantityPrescription"
                    @update:value="(value) => changeQuantityTable(index, value)" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  type="button"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="changeQuantityTable(index, tpItem.unitQuantityPrescription + 1)">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitQuantity }}</td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitName }}</td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.unitExpectedPrice || 0) }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.expectedPrice * tpItem.quantityPrescription || 0) }}
            </td>
            <td class="text-center">
              <a
                v-if="tpItem.deliveryStatus === DeliveryStatus.Delivered && tpItem.quantity == 0"
                class="text-red-500"
                @click="destroyTicketProductZeroQuantity(tpItem.id)">
                <IconTrash />
              </a>
              <a
                v-else-if="
                  !(
                    tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                    [TicketStatus.Debt, TicketStatus.Completed].includes(
                      ticketClinicRef.ticketStatus
                    )
                  )
                "
                class="text-red-500"
                @click="ticketProductPrescriptionList!.splice(index, 1)">
                <IconTrash />
              </a>
              <a-tooltip
                v-else-if="
                  tpItem.deliveryStatus === DeliveryStatus.Delivered && tpItem.quantity != 0
                ">
                <template #title>Đã xuất thuốc</template>
                <ShoppingCartOutlined style="color: #52c41a; cursor: not-allowed !important" />
              </a-tooltip>
            </td>
          </tr>
          <tr>
            <td colspan="6" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProductPrescriptionList.reduce((acc, item) => {
                      return (acc += item.expectedPrice * item.quantityPrescription)
                    }, 0)
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4">
      <div>Lời dặn của bác sĩ</div>
      <div style="min-height: 100px">
        <WysiwygEditor v-model:value="ticketAttributeMap.advice" menuType="COLLAPSE" />
      </div>
    </div>
  </div>
  <div class="mt-4 flex gap-4">
    <VueButton color="blue" icon="print" @click="startPrint">In đơn thuốc</VueButton>
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_PRESCRIPTION]"
      color="blue"
      class="ml-auto"
      :disabled="disabledButton"
      icon="save"
      @click="savePrescription">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
