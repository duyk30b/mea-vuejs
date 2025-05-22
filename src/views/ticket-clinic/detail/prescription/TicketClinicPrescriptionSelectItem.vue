<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconCaretLeft, IconCaretRight, IconFileSearch } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputHint, InputNumber, InputOptions, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../../modules/batch'
import { DeliveryStatus, DiscountType, InventoryStrategy } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  PrescriptionSample,
  PrescriptionSampleService,
  type MedicineType,
} from '../../../../modules/prescription-sample'
import { Product, ProductService } from '../../../../modules/product'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProduct, TicketProductType } from '../../../../modules/ticket-product'
import { DString, ESTimer } from '../../../../utils'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../../product/upsert/ModalProductUpsert.vue'
import ModalSelectItemFromPrescriptionSample from './ModalSelectItemFromPrescriptionSample.vue'

const emit = defineEmits<{ (e: 'success', value: TicketProduct[]): void }>()

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalSelectItemFromPrescriptionSample =
  ref<InstanceType<typeof ModalSelectItemFromPrescriptionSample>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchList = ref<Batch[]>([])

const ticketProductPrescription = ref<TicketProduct>(TicketProduct.blank())
const prescriptionSampleList = ref<PrescriptionSample[]>([])
const prescriptionSamplePage = ref<number>(1)
const psPageLimit = ref<number>(5)
const psPageTotal = ref<number>(0)

const fetchPrescriptionSample = async () => {
  try {
    const { data, meta } = await PrescriptionSampleService.pagination({
      page: prescriptionSamplePage.value,
      limit: psPageLimit.value,
      sort: { priority: 'ASC' },
    })
    prescriptionSampleList.value = data
    psPageTotal.value = Math.ceil(meta.total / psPageLimit.value)
  } catch (error) {
    console.log('🚀 ~ TicketClinicPrescriptionSelectItem.vue:51 ~ onMounted ~ error:', error)
  }
}

onMounted(async () => {
  await fetchPrescriptionSample()
})

const handleChangePagePrescriptionSample = async (psPage: number) => {
  prescriptionSamplePage.value = psPage
  await fetchPrescriptionSample()
}

const handleFocusFirstSearchProduct = async () => {
  try {
    await ProductService.refreshDB()
  } catch (error) {
    console.log('🚀 ~ TicketClinicPrescriptionSelectItem.vue:71 ~ error:', error)
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
      $AND: [
        {
          $OR: [
            { productCode: { LIKE: text } },
            { brandName: { LIKE: text } },
            { substance: { LIKE: text } },
          ],
        },
        {
          $OR: [
            {
              quantity: settingStore.TICKET_CLINIC_DETAIL.prescriptions.searchIncludeZeroQuantity
                ? undefined
                : { NOT: 0 },
            },
            { inventoryStrategy: InventoryStrategy.NoImpact },
          ],
        },
      ],
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
  productOptions.value = []
  batchList.value = []
}

const selectProduct = async (productSelect: Product) => {
  const priorityList = (ticketClinicRef.value.ticketProductPrescriptionList || []).map((i) => {
    return i.priority
  })
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  const priorityMax = Math.max(...priorityList)

  const temp = TicketProduct.blank()
  temp.priority = priorityMax + 1
  temp.inventoryStrategy = productSelect.inventoryStrategyFix
  temp.customerId = ticketClinicRef.value.customerId
  temp.product = Product.from(productSelect)
  temp.productId = productSelect.id
  temp.batchId = 0

  temp.type = TicketProductType.Prescription
  temp.deliveryStatus = DeliveryStatus.Pending
  temp.unitRate = productSelect.unitDefaultRate

  temp.expectedPrice = productSelect.retailPrice
  temp.discountType = DiscountType.Percent
  temp.discountPercent = 0
  temp.discountMoney = 0
  temp.actualPrice = productSelect.retailPrice
  temp.hintUsage = productSelect.hintUsage
  temp.warehouseIds = JSON.stringify(
    settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList,
  ) // set tạm trước thôi, tí nữa tính toán lại

  ticketProductPrescription.value = temp

  // Tính toán cho batchID // lằng nhằng nhé
  if (temp.inventoryStrategy === InventoryStrategy.RequireBatchSelection) {
    const warehouseIdAcceptList: number[] =
      settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList
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
        if (a.expiryDate == null && b.expiryDate == null) {
          return a.registeredAt < b.registeredAt ? 1 : -1 // registeredAt xếp theo DESC
        }
        if (b.expiryDate == null) return -1
        if (a.expiryDate == null) return 1
        return a.expiryDate < b.expiryDate ? -1 : 1 // HSD xếp theo ASC
      })
    if (settingStore.PRODUCT_SETTING.allowNegativeQuantity && batchListResponse.length < 5) {
      let batchZero = batchListFetch
        .filter((i) => !i.quantity)
        .sort((a, b) => {
          if (a.expiryDate == null && b.expiryDate == null) {
            return a.registeredAt < b.registeredAt ? 1 : -1 // registeredAt xếp theo DESC
          }
          if (b.expiryDate == null) return 1
          if (a.expiryDate == null) return -1
          return a.expiryDate > b.expiryDate ? -1 : 1 // HSD xếp theo DESC
        })
      batchZero = batchZero.slice(0, 5 - batchListResponse.length)
      batchListResponse = [...batchListResponse, ...batchZero]
    }
    batchListResponse.forEach((i) => (i.product = productSelect))
    batchList.value = batchListResponse
    if (batchListResponse.length) {
      selectBatch(batchListResponse[0])
    } else {
      selectBatch(Batch.blank())
    }
  }
}

const selectBatch = (batchSelected: Batch) => {
  if (!batchSelected) return
  ticketProductPrescription.value.batch = Batch.from(batchSelected)
  ticketProductPrescription.value.batchId = batchSelected.id
  ticketProductPrescription.value.warehouseIds = JSON.stringify([batchSelected.warehouseId])
}

const addPrescriptionItem = () => {
  const { product, batch } = ticketProductPrescription.value
  if (!ticketProductPrescription.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }

  if (product?.inventoryStrategyFix !== InventoryStrategy.NoImpact) {
    if (ticketProductPrescription.value.quantity > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProductPrescription.value.quantity
        }`,
      )
    } else if (product?.inventoryStrategyFix == InventoryStrategy.RequireBatchSelection) {
      if (ticketProductPrescription.value.quantity > batch!.quantity) {
        AlertStore.addWarning(
          `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${batch!.quantity} lấy ${
            ticketProductPrescription.value.quantity
          }`,
        )
      }
    }
  }

  // gán số lượng và costAmount trong đơn
  ticketProductPrescription.value.quantityPrescription = ticketProductPrescription.value.quantity
  ticketProductPrescription.value.costAmount =
    ticketProductPrescription.value.quantity * (product?.costPrice || 0)

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

const clickSelectPrescriptionSample = (psSelect: PrescriptionSample) => {
  modalSelectItemFromPrescriptionSample?.value?.openModal(psSelect)
}

const handleSelectMedicineList = async (medicineList: MedicineType[]) => {
  if (
    ![
      TicketStatus.Schedule,
      TicketStatus.Draft,
      TicketStatus.Deposited,
      TicketStatus.Executing,
    ].includes(ticketClinicRef.value.ticketStatus)
  ) {
    return AlertStore.addWarning(`Trạng thái phiếu khám không hợp lệ`)
  }

  const priorityList = (ticketClinicRef.value.ticketProductPrescriptionList || []).map(
    (i) => i.priority,
  )
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  let priority = Math.max(...priorityList)

  const ticketProductList = medicineList
    .map((medicine) => {
      const { product } = medicine
      if (!product) {
        return null
      }
      priority = priority + 1
      const temp = TicketProduct.blank()
      temp.priority = priority
      temp.inventoryStrategy = InventoryStrategy.AutoWithFIFO // tự động nhặt thuốc nên chuyển sang dạng AUTO thôi
      temp.customerId = ticketClinicRef.value.customerId
      temp.product = Product.from(product)
      temp.productId = medicine.productId
      temp.batchId = 0

      temp.quantity = medicine.quantity // lấy theo mẫu
      temp.costAmount = medicine.quantity * (product.costPrice || 0)
      temp.quantityPrescription = medicine.quantity // lấy theo mẫu
      if (product?.inventoryStrategyFix !== InventoryStrategy.NoImpact) {
        if (ticketProductPrescription.value.quantity > product!.quantity) {
          AlertStore.addWarning(
            `Cảnh báo: ${product.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
              medicine.quantity
            }`,
          )
        }
      }

      temp.type = TicketProductType.Prescription
      temp.deliveryStatus = DeliveryStatus.Pending
      temp.unitRate = product.unitDefaultRate

      temp.expectedPrice = product.retailPrice
      temp.discountType = DiscountType.Percent
      temp.discountPercent = 0
      temp.discountMoney = 0
      temp.actualPrice = product.retailPrice
      temp.hintUsage = medicine.hintUsage // lấy theo mẫu
      temp.warehouseIds = JSON.stringify(
        settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList,
      )

      return temp
    })
    .filter((i) => !!i)

  emit('success', ticketProductList)
  clear()
}

defineExpose({ fetchPrescriptionSample })
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <ModalSelectItemFromPrescriptionSample
    ref="modalSelectItemFromPrescriptionSample"
    @success="handleSelectMedicineList"
  />
  <div class="mt-4 flex flex-wrap gap-4">
    <div style="flex-basis: 250px; flex-grow: 3">
      <form @submit.prevent="(e) => addPrescriptionItem()">
        <div>
          <div class="flex gap-1 flex-wrap">
            <span>Tên thuốc</span>
            <a
              v-if="ticketProductPrescription.product?.id"
              @click="modalProductDetail?.openModal(ticketProductPrescription.product)"
            >
              <IconFileSearch />
            </a>
            <div v-if="ticketProductPrescription.productId">
              (
              <span
                v-if="
                  ticketProductPrescription.product?.inventoryStrategyFix !==
                  InventoryStrategy.NoImpact
                "
                :class="
                  ticketProductPrescription.quantity > ticketProductPrescription.product!.quantity
                    ? 'text-red-500 font-bold'
                    : ''
                "
              >
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
                permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
                ticketProductPrescription.product?.id
              "
              @click="modalProductUpsert?.openModal(ticketProductPrescription.product.id)"
            >
              Sửa thông tin sản phẩm
            </a>
          </div>

          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsProduct"
              required
              :prepend="ticketProductPrescription.product?.productCode"
              :options="productOptions"
              :maxHeight="320"
              placeholder="Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
              :disabled="
                [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
              "
              @onFocusinFirst="handleFocusFirstSearchProduct"
              @selectItem="({ data }) => selectProduct(data)"
              @update:text="searchingProduct"
            >
              <template #option="{ item: { data } }">
                <div>
                  <span>{{ data.productCode }}</span>
                  -
                  <b>{{ data.brandName }}</b>
                  -
                  <span
                    style="font-weight: 700"
                    :class="data.unitQuantity <= 0 ? 'text-red-500' : ''"
                  >
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

        <div
          class="mt-3"
          style="flex-grow: 1; flex-basis: 80%"
          v-if="
            ticketProductPrescription.inventoryStrategy === InventoryStrategy.RequireBatchSelection
          "
        >
          <div>
            Lô hàng
            <span
              v-if="
                ticketProductPrescription.batch?.expiryDate &&
                ticketProductPrescription.batch?.expiryDate < Date.now()
              "
              class="text-red-500 font-bold"
            >
              (Hết hạn sử dụng)
            </span>
            <span
              v-if="ticketProductPrescription.productId && !batchList.length"
              class="text-red-500 font-bold"
            >
              (Không còn tồn kho)
            </span>
          </div>
          <div>
            <VueSelect
              :value="ticketProductPrescription.batch!.id"
              :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
              :disabled="batchList.length == 0"
              @selectItem="({ data }) => selectBatch(data)"
            >
              <template #option="{ item: { data } }">
                <div v-if="!data.id">Chưa chọn lô</div>
                <div v-if="data.id">
                  Lô {{ data.batchCode }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} -
                  Tồn
                  <b>{{ data.unitQuantity }}</b>
                  {{ ticketProductPrescription.product!.unitDefaultName }}
                </div>
              </template>
              <template #text="{ content: { data } }">
                <div v-if="!data?.id">Chưa chọn lô</div>
                <div v-if="data?.id">
                  Lô {{ data.batchCode }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
                  <span
                    :class="
                      ticketProductPrescription.quantity > data.quantity
                        ? 'text-red-500 font-bold'
                        : ''
                    "
                  >
                    - Tồn
                    <b>{{ data.unitQuantity }}</b>
                    {{ ticketProductPrescription.product!.unitDefaultName }}
                  </span>
                </div>
              </template>
            </VueSelect>
          </div>
        </div>

        <div class="mt-3">
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
                required
              ></VueSelect>
            </div>
            <div class="flex-1">
              <InputNumber
                v-model:value="ticketProductPrescription.unitQuantity"
                required
                :validate="{ gt: 0 }"
              />
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
            :logic-filter="(item: any, text: string) => DString.customFilter(item, text)"
          ></InputHint>
        </div>
        <div class="mt-3 flex justify-center">
          <VueButton
            icon="plus"
            :disabled="
              [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
            "
            color="blue"
            type="submit"
          >
            Thêm vào đơn
          </VueButton>
        </div>
      </form>
    </div>
    <div style="flex-basis: 250px; flex-grow: 1">
      <div>Chọn thuốc nhanh từ đơn mẫu</div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="index in psPageLimit"
              :key="index"
              style="cursor: pointer"
              @click="clickSelectPrescriptionSample(prescriptionSampleList[index - 1])"
            >
              <td class="text-center" style="width: 32px">
                {{ prescriptionSampleList[index - 1]?.priority || '&nbsp;' }}
              </td>
              <td>
                <div class="max-line-1">
                  {{ prescriptionSampleList[index - 1]?.name || '&nbsp;' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-2 flex justify-between items-center gap-4">
        <button
          style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
          class="cursor-pointer disabled:opacity-[30%] disabled:cursor-not-allowed"
          :disabled="prescriptionSamplePage == 1"
          @click="(e) => handleChangePagePrescriptionSample(prescriptionSamplePage - 1)"
        >
          <IconCaretLeft style="font-size: 22px; opacity: 0.6" />
        </button>
        <div class="flex justify-end items-center" style="font-size: 14px; color: gray">
          {{ prescriptionSamplePage }} / {{ psPageTotal }}
        </div>
        <button
          style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
          class="cursor-pointer disabled:opacity-[30%] disabled:cursor-not-allowed"
          :disabled="prescriptionSamplePage === psPageTotal"
          @click="(e) => handleChangePagePrescriptionSample(prescriptionSamplePage + 1)"
        >
          <IconCaretRight style="font-size: 22px; opacity: 0.6" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
