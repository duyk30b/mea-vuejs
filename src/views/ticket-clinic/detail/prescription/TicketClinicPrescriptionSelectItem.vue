<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconCaretLeft, IconCaretRight, IconFileSearch } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputHint, InputNumber, InputOptions, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus, DiscountType } from '../../../../modules/enum'
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
import { DString } from '../../../../utils'
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
const warehouseIdOptions = ref<number[]>([0])

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
        { $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }] },
        {
          $OR: [
            {
              quantity: settingStore.TICKET_CLINIC_DETAIL.prescriptions.searchIncludeZeroQuantity
                ? undefined
                : { NOT: 0 },
            },
            { hasManageQuantity: 0 },
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
}

const selectProduct = async (productSelect: Product) => {
  const priorityList = (ticketClinicRef.value.ticketProductPrescriptionList || []).map(
    (i) => i.priority,
  )
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  const priorityMax = Math.max(...priorityList)

  const temp = TicketProduct.blank()
  temp.priority = priorityMax + 1
  if (productSelect.hasManageQuantity) {
    temp.hasInventoryImpact = 1
  } else {
    temp.hasInventoryImpact = 0
  }
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

  ticketProductPrescription.value = temp

  // tính toán cho warehouseID
  const warehouseIdAcceptList: number[] =
    settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList
  const productWarehouseIdList: number[] = JSON.parse(productSelect.warehouseIds)
  if (!warehouseIdAcceptList.length || warehouseIdAcceptList.includes(0)) {
    warehouseIdOptions.value = [0]
  } else if (!productWarehouseIdList.length || productWarehouseIdList.includes(0)) {
    warehouseIdOptions.value = [0]
  } else {
    // trường hợp này có thể có nhiều warehouseID, thôi kệ, code sau
    warehouseIdOptions.value = []
    warehouseIdAcceptList.forEach((i) => {
      if (productWarehouseIdList.includes(i)) {
        warehouseIdOptions.value.push(i)
      }
    })
  }
  ticketProductPrescription.value.warehouseId = warehouseIdOptions.value[0]
}

const addPrescriptionItem = () => {
  const { product } = ticketProductPrescription.value
  if (!ticketProductPrescription.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }

  if (product?.hasManageQuantity) {
    if (ticketProductPrescription.value.quantity > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProductPrescription.value.quantity
        }`,
      )
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
      TicketStatus.Prepayment,
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
      const product = medicine.product
      if (!product) {
        return null
      }
      priority = priority + 1
      const tp = TicketProduct.blank()
      tp.priority = priority
      if (product.hasManageQuantity === 0) {
        tp.hasInventoryImpact = 0
      } else {
        tp.hasInventoryImpact = 1
      }
      tp.customerId = ticketClinicRef.value.customerId
      tp.productId = medicine.productId
      tp.product = Product.from(product)

      tp.quantity = medicine.quantity // lấy theo mẫu
      tp.costAmount = medicine.quantity * (product.costPrice || 0)
      tp.quantityPrescription = medicine.quantity // lấy theo mẫu
      if (product?.hasManageQuantity) {
        if (ticketProductPrescription.value.quantity > product!.quantity) {
          AlertStore.addWarning(
            `Cảnh báo: ${product.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
              medicine.quantity
            }`,
          )
        }
      }

      tp.type = TicketProductType.Prescription
      tp.deliveryStatus = DeliveryStatus.Pending
      tp.unitRate = product.unitDefaultRate

      tp.expectedPrice = product.retailPrice
      tp.discountType = DiscountType.Percent
      tp.discountPercent = 0
      tp.discountMoney = 0
      tp.actualPrice = product.retailPrice
      tp.hintUsage = medicine.hintUsage // lấy theo mẫu

      // tính toán cho warehouseID
      const warehouseIdAcceptList: number[] =
        settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList
      const productWarehouseIdList: number[] = JSON.parse(product.warehouseIds)
      if (!warehouseIdAcceptList.length || warehouseIdAcceptList.includes(0)) {
        warehouseIdOptions.value = [0]
      } else if (!productWarehouseIdList.length || productWarehouseIdList.includes(0)) {
        warehouseIdOptions.value = [0]
      } else {
        // trường hợp này có thể có nhiều warehouseID, thôi kệ, code sau
        warehouseIdOptions.value = []
        warehouseIdAcceptList.forEach((i) => {
          if (productWarehouseIdList.includes(i)) {
            warehouseIdOptions.value.push(i)
          }
        })
      }
      tp.warehouseId = warehouseIdOptions.value[0]

      return tp
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
                v-if="ticketProductPrescription.product?.hasManageQuantity"
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
              :options="productOptions"
              :maxHeight="320"
              placeholder="Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
              :disabled="
                [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
              "
              @onFocusinFirst="handleFocusFirstSearchProduct"
              @selectItem="({ data }) => selectProduct(data)"
              @update:text="searchingProduct"
            >
              <template #option="{ item: { data } }">
                <div>
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
