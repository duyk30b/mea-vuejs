<script lang="ts" setup>
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputHint, InputNumber, InputOptions, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../../modules/batch'
import { DeliveryStatus, DiscountType } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  type MedicineType,
  PrescriptionSample,
  PrescriptionSampleService,
} from '../../../../modules/prescription-sample'
import { Product, ProductService } from '../../../../modules/product'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProduct, TicketProductType } from '../../../../modules/ticket-product'
import { DString, DTimer } from '../../../../utils'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../../product/upsert/ModalProductUpsert.vue'

const emit = defineEmits<{ (e: 'success', value: TicketProduct[]): void }>()

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchList = ref<Batch[]>([])

const ticketProductPrescription = ref<TicketProduct>(TicketProduct.blank())

const handleFocusFirstSearchProduct = async () => {
  try {
    await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
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
  productOptions.value = productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))
}

const clear = () => {
  ticketProductPrescription.value = TicketProduct.blank()
  batchList.value = []
  productOptions.value = []
}

const selectProduct = async (productSelect: Product) => {
  const priorityList = (ticketClinicRef.value.ticketProductPrescriptionList || []).map(
    (i) => i.priority
  )
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  const priorityMax = Math.max(...priorityList)

  const temp = TicketProduct.blank()
  temp.priority = priorityMax + 1
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
  let canGetAllWarehouse = false
  if (!warehouseIdAcceptList.length) canGetAllWarehouse = true
  else if (warehouseIdAcceptList.includes(0)) canGetAllWarehouse = true

  const batchListFetch = await BatchService.list({
    filter: {
      productId: productSelect.id,
      ...(canGetAllWarehouse
        ? {}
        : {
            $OR: [{ warehouseId: { EQUAL: 0 } }, { warehouseId: { IN: warehouseIdAcceptList } }],
          }),
    },
  })
  let batchListResponse = batchListFetch
    .filter((i) => !!i.quantity)
    .sort((a, b) => {
      if (b.expiryDate == null) return -1 // để NULL ở cuối
      else if (a.expiryDate == null) return 1
      else return a.expiryDate < b.expiryDate ? -1 : 1 // HSD xếp theo ASC
    })

  if (settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
    const batchZero = batchListFetch
      .filter((i) => !i.quantity)
      .sort((a, b) => {
        if (b.expiryDate == null) return 1 // để NULL ở đầu
        else if (a.expiryDate == null) return -1
        else return a.expiryDate > b.expiryDate ? -1 : 1 // HSD xếp theo DESC
      })
    batchListResponse = [...batchListResponse, ...batchZero]
  }
  batchListResponse = batchListResponse.slice(0, 5)

  batchListResponse.forEach((i) => (i.product = productSelect))
  batchList.value = batchListResponse

  if (batchListResponse.length) {
    selectBatch(batchListResponse[0])
  } else {
    selectBatch(Batch.blank())
  }
  selectBatch(batchList.value[0])
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

  emit('success', [ticketProductPrescription.value])
  clear()
  inputOptionsProduct.value?.clear()

  if (!isMobile) {
    inputOptionsProduct.value?.focus()
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
          @onFocusinFirst="handleFocusFirstSearchProduct"
          @selectItem="({ data }) => selectProduct(data)"
          @update:text="searchingProduct">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.brandName }}</b>
              -
              <span style="font-weight: 700" :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
                {{ data.unitQuantity }}
              </span>
              {{ data.unitDefaultName }}
              - Giá
              <span style="font-weight: 600">{{ formatMoney(data.unitRetailPrice) }}</span>
              /{{ data.unitDefaultName }}
            </div>
            <div>{{ data.substance }}</div>
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
</template>

<style lang="scss" scoped></style>
