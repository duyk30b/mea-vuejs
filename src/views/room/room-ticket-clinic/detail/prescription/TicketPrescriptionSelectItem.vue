<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputHint, InputNumber, InputOptions, VueSelect } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Batch, BatchService } from '@/modules/batch'
import {
  DeliveryStatus,
  DiscountType,
  PaymentEffect,
  PaymentMoneyStatus,
  PickupStrategy,
  ProductType,
} from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Product, ProductService } from '@/modules/product'
import { TicketStatus } from '@/modules/ticket'
import { TicketProduct, TicketProductType } from '@/modules/ticket-product'
import { ESString, ESTimer } from '@/utils'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '@/views/product/upsert/ModalProductUpsert.vue'
import { ticketRoomRef } from '@/modules/room'

const emit = defineEmits<{ (e: 'success', value: TicketProduct[]): void }>()

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const { userPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchList = ref<Batch[]>([])

const ticketProductPrescription = ref<TicketProduct>(TicketProduct.blank())

const pickupStrategy = ref(MeService.getPickupStrategy().prescription)

onMounted(async () => {})

const handleFocusFirstSearchProduct = async () => {
  await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
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
            { warehouseIds: '[]' },
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
  const priorityList = (ticketRoomRef.value.ticketProductPrescriptionList || []).map((i) => {
    return i.priority
  })
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  const priorityMax = Math.max(...priorityList)

  const temp = TicketProduct.blank()
  temp.priority = priorityMax + 1
  temp.pickupStrategy = pickupStrategy.value
  temp.customerId = ticketRoomRef.value.customerId
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

  temp.createdAt = Date.now()
  temp.hintUsage = productSelect.hintUsage
  temp.warehouseIds = JSON.stringify(
    settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList,
  ) // set tạm trước thôi, tí nữa tính toán lại

  await ProductService.executeRelation([productSelect], { discountList: true })
  const discountApply = productSelect?.discountApply
  if (discountApply) {
    let { discountType, discountPercent, discountMoney } = discountApply
    const expectedPrice = temp.expectedPrice || 0
    if (discountType === DiscountType.Percent) {
      discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
    }
    if (discountType === DiscountType.VND) {
      discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
    }
    temp.discountType = discountType
    temp.discountPercent = discountPercent
    temp.discountMoney = discountMoney
    temp.actualPrice = expectedPrice - discountMoney
  }

  ticketProductPrescription.value = temp

  // Tính toán cho batchID // lằng nhằng nhé
  if (temp.product.productType === ProductType.SplitBatch) {
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

  if (product?.warehouseIds !== '[]' && pickupStrategy.value !== PickupStrategy.NoImpact) {
    if (ticketProductPrescription.value.quantity > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProductPrescription.value.quantity
        }`,
      )
    } else if (
      ticketProductPrescription.value.batchId &&
      ticketProductPrescription.value.quantity > batch!.quantity
    ) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${batch!.quantity} lấy ${
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
}
const handleModalProductUpsertSuccess = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName || '',
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

  <div class="mt-4">
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
                ticketProductPrescription.product?.warehouseIds !== '[]' &&
                pickupStrategy !== PickupStrategy.NoImpact
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
              userPermission[PermissionId.PRODUCT_UPDATE] && ticketProductPrescription.product?.id
            "
            @click="modalProductUpsert?.openModal(ticketProductPrescription.product.id)"
          >
            Sửa thông tin sản phẩm
          </a>
        </div>

        <div style="height: 40px">
          <InputOptions
            ref="inputOptionsProduct"
            :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status)"
            :maxHeight="320"
            :options="productOptions"
            :prepend="ticketProductPrescription.product?.productCode"
            placeholder="Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
            required
            @onFocusinFirst="handleFocusFirstSearchProduct"
            @selectItem="({ data }) => selectProduct(data)"
            @update:text="searchingProduct"
          >
            <template #option="{ item: { data } }">
              <div>
                <span>{{ data.productCode }}</span>
                -
                <b>{{ data.brandName }}</b>
                <span
                  v-if="data?.warehouseIds !== '[]' && pickupStrategy !== PickupStrategy.NoImpact"
                  :class="data.unitQuantity <= 0 ? 'text-red-500' : ''"
                  style="font-weight: 700"
                >
                  -
                  {{ data.unitQuantity }}
                  {{ data.unitDefaultName }}
                </span>
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
        v-if="ticketProductPrescription.product?.productType === ProductType.SplitBatch"
        class="mt-3"
        style="flex-grow: 1; flex-basis: 80%"
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
            :disabled="batchList.length == 0"
            :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
            :value="ticketProductPrescription.batch!.id"
            @selectItem="({ data }) => selectBatch(data)"
          >
            <template #option="{ item: { data } }">
              <div v-if="!data.id">Chưa chọn lô</div>
              <div v-if="data.id">
                Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} -
                Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProductPrescription.product!.unitDefaultName }}
              </div>
            </template>
            <template #text="{ content: { data } }">
              <div v-if="!data?.id">Chưa chọn lô</div>
              <div v-if="data?.id">
                Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
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
              :validate="{ gt: 0 }"
              required
            />
          </div>
        </div>
      </div>
      <div class="mt-4">
        <div>Hướng dẫn sử dụng</div>
        <InputHint
          v-model:value="ticketProductPrescription.hintUsage"
          :logic-filter="(item: any, text: string) => ESString.customFilter(item, text)"
          :maxHeight="320"
          :options="[
            ...(ticketProductPrescription.product!.hintUsage
              ? [ticketProductPrescription.product!.hintUsage]
              : []),
            ...settingStore.PRODUCT_HINT_USAGE,
          ]"
        ></InputHint>
      </div>
      <div class="mt-3 flex justify-center">
        <VueButton
          :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status)"
          color="blue"
          icon="plus"
          type="submit"
        >
          Thêm vào đơn
        </VueButton>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped></style>
