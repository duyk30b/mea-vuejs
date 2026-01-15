<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputNumber, InputOptions, VueSelect } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Batch, BatchService } from '@/modules/batch'
import {
  DeliveryStatus,
  DiscountType,
  PaymentMoneyStatus,
  PickupStrategy,
  ProductType,
} from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Product, ProductService } from '@/modules/product'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import { TicketProduct, TicketProductType } from '@/modules/ticket-product'
import { ESTimer } from '@/utils'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '@/views/product/upsert/ModalProductUpsert.vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success', value: TicketProduct[]): void }>()

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const { userPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchList = ref<Batch[]>([])

const ticketProductConsumable = ref<TicketProduct>(TicketProduct.blank())

const handleFocusFirstSearchProduct = async () => {
  await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
}

const warehouseIdOptions = ref<number[]>([0])

const searchingProduct = async (text: string) => {
  if (!text) {
    clear()
  } else {
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
                quantity: settingStore.TICKET_CLINIC_DETAIL.consumable.searchIncludeZeroQuantity
                  ? undefined
                  : { NOT: 0 },
              },
              { warehouseIds: '[]' },
            ],
          },
        ],
        warehouseIds: (productWarehouseIds) => {
          try {
            const warehouseIdAcceptList =
              settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
            const productWarehouseIdList: number[] = JSON.parse(productWarehouseIds)
            if (!warehouseIdAcceptList.length || warehouseIdAcceptList.includes(0)) return true
            if (!productWarehouseIdList.length || productWarehouseIdList.includes(0)) return true

            for (let i = 0; i < productWarehouseIdList.length; i++) {
              if (warehouseIdAcceptList.includes(productWarehouseIdList[i])) {
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
}

const clear = () => {
  ticketProductConsumable.value = TicketProduct.blank()
  productOptions.value = []
  batchList.value = []
}

const selectProduct = async (productSelect?: Product) => {
  if (productSelect) {
    const priorityList = (ticketRoomRef.value.ticketProductConsumableList || []).map((i) => {
      return i.priority
    })
    priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
    const priorityMax = Math.max(...priorityList)

    const temp = TicketProduct.blank()
    temp.priority = priorityMax + 1
    temp.pickupStrategy = MeService.getPickupStrategy(productSelect).consumable
    temp.customerId = ticketRoomRef.value.customerId
    temp.product = Product.from(productSelect)
    temp.productId = productSelect.id
    temp.batchId = 0

    temp.type = TicketProductType.Consumable
    temp.deliveryStatus = DeliveryStatus.Pending
    temp.unitRate = productSelect.unitDefaultRate

    temp.unitExpectedPrice = productSelect.retailPrice * productSelect.unitDefaultRate
    temp.discountType = DiscountType.Percent
    temp.discountPercent = 0
    temp.unitDiscountMoney = 0
    temp.unitActualPrice = productSelect.retailPrice * productSelect.unitDefaultRate
    temp.warehouseIds = JSON.stringify(settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList) // set tạm trước thôi, tí nữa tính toán lại

    temp.createdAt = Date.now()

    await ProductService.executeRelation([productSelect], { discountList: true })
    const discountApply = productSelect?.discountApply
    if (discountApply) {
      let { discountType, discountPercent, discountMoney } = discountApply
      const expectedPrice = (temp.unitExpectedPrice || 0) / temp.unitRate
      if (discountType === DiscountType.Percent) {
        discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
      }
      if (discountType === DiscountType.VND) {
        discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
      }
      temp.discountType = discountType
      temp.discountPercent = discountPercent
      temp.unitDiscountMoney = discountMoney * temp.unitRate
      temp.unitActualPrice = temp.unitExpectedPrice - temp.unitDiscountMoney
    }

    ticketProductConsumable.value = temp

    // Tính toán cho batchID // lằng nhằng nhé
    if (productSelect.productType === ProductType.SplitBatch) {
      const warehouseIdAcceptList: number[] =
        settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
      let canGetAllWarehouse = false
      if (!warehouseIdAcceptList.length) canGetAllWarehouse = true
      else if (warehouseIdAcceptList.includes(0)) canGetAllWarehouse = true
      const batchListFetch = await BatchService.list({
        filter: {
          productId: productSelect.id,
          ...(canGetAllWarehouse
            ? {}
            : {
                $OR: [
                  { warehouseId: { EQUAL: 0 } },
                  { warehouseId: { IN: warehouseIdAcceptList } },
                ],
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
  } else {
    clear()
  }
}

const selectBatch = (batchSelected: Batch) => {
  if (!batchSelected) return
  ticketProductConsumable.value.batch = Batch.from(batchSelected)
  ticketProductConsumable.value.batchId = batchSelected.id
  ticketProductConsumable.value.warehouseIds = JSON.stringify([batchSelected.warehouseId])
}

const addConsumableItem = async () => {
  const { product, batch } = ticketProductConsumable.value
  if (!ticketProductConsumable.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }

  if (
    product?.warehouseIds !== '[]' &&
    ticketProductConsumable.value.pickupStrategy !== PickupStrategy.NoImpact
  ) {
    if (ticketProductConsumable.value.quantity > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProductConsumable.value.quantity
        }`,
      )
    } else if (
      ticketProductConsumable.value.batchId &&
      ticketProductConsumable.value.quantity > batch!.quantity
    ) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${batch!.quantity} lấy ${
          ticketProductConsumable.value.quantity
        }`,
      )
    }
  }

  emit('success', [ticketProductConsumable.value])
  clear()
  inputOptionsProduct.value?.clear()
}

const handleUpdateUnitActualPrice = (price: number) => {
  ticketProductConsumable.value.unitActualPrice = price
  ticketProductConsumable.value.unitExpectedPrice = price
  ticketProductConsumable.value.unitDiscountMoney = 0
  ticketProductConsumable.value.discountPercent = 0
}

const handleModalProductUpsertSuccess = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName || '',
    data: instance,
    value: instance?.id,
  })
  selectProduct(instance)
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addConsumableItem()">
    <div style="flex-grow: 1; flex-basis: 90%">
      <div class="flex gap-1 flex-wrap">
        <span>Tên vật tư</span>
        <a
          v-if="ticketProductConsumable.product?.id"
          @click="modalProductDetail?.openModal(ticketProductConsumable.product)"
        >
          <IconFileSearch />
        </a>
        <div v-if="ticketProductConsumable.productId">
          (
          <span
            v-if="
              ticketProductConsumable.product?.warehouseIds !== '[]' &&
              ticketProductConsumable.pickupStrategy !== PickupStrategy.NoImpact
            "
            :class="
              ticketProductConsumable.quantity > ticketProductConsumable.product!.quantity
                ? 'text-red-500 font-bold'
                : ''
            "
          >
            Tồn:
            <b>
              {{ ticketProductConsumable.product?.unitQuantity }}
              {{ ticketProductConsumable.product?.unitDefaultName }}
            </b>
          </span>
          <span>
            - Giá
            <b>{{ formatMoney(ticketProductConsumable.product!.unitRetailPrice) }}</b>
          </span>
          )
        </div>

        <a
          v-if="userPermission[PermissionId.PRODUCT_UPDATE] && ticketProductConsumable.product?.id"
          @click="modalProductUpsert?.openModal(ticketProductConsumable.product.id)"
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
          :prepend="ticketProductConsumable.product?.productCode"
          placeholder="Tìm kiếm sản phẩm bằng tên hoặc hoạt chất của sản phẩm"
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
                v-if="
                  data?.warehouseIds !== '[]' &&
                  ticketProductConsumable.pickupStrategy !== PickupStrategy.NoImpact
                "
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
      v-if="ticketProductConsumable.product?.productType === ProductType.SplitBatch"
      style="flex-grow: 1; flex-basis: 90%"
    >
      <div>
        Lô hàng
        <span
          v-if="
            ticketProductConsumable.batch?.expiryDate &&
            ticketProductConsumable.batch?.expiryDate < Date.now()
          "
          class="text-red-500 font-bold"
        >
          (Hết hạn sử dụng)
        </span>
        <span
          v-if="ticketProductConsumable.productId && !batchList.length"
          class="text-red-500 font-bold"
        >
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :disabled="batchList.length == 0"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :value="ticketProductConsumable.batch!.id"
          @selectItem="({ data }) => selectBatch(data)"
        >
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProductConsumable.product!.unitDefaultName }}
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span
                :class="
                  ticketProductConsumable.quantity > data.quantity ? 'text-red-500 font-bold' : ''
                "
              >
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProductConsumable.product!.unitDefaultName }}
              </span>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Số lượng</span>
        <span v-if="ticketProductConsumable.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductConsumable.quantity }}</b>
          {{ ticketProductConsumable.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 100px">
          <VueSelect
            :value="ticketProductConsumable.unitRate"
            :disabled="ticketProductConsumable.product!.unitObject.length <= 1"
            :options="
              ticketProductConsumable.product!.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            @update:value="(v) => ticketProductConsumable.changeUnitRate(v)"
            required
          ></VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductConsumable.unitQuantity"
            :validate="{ gt: 0 }"
            required
          />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Giá tiền</span>
        <span v-if="ticketProductConsumable.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductConsumable.actualPrice }}</b>
          <span v-if="ticketProductConsumable.product?.unitBasicName">
            / {{ ticketProductConsumable.product?.unitBasicName }}
          </span>
          )
        </span>
      </div>
      <div class="flex">
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductConsumable.unitActualPrice"
            :validate="{ gte: 0 }"
            required
            @update:value="handleUpdateUnitActualPrice"
          />
        </div>
      </div>
    </div>

    <div class="mt-2 flex justify-center" style="flex-grow: 1; flex-basis: 90%">
      <VueButton
        :disabled="
          [TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status) ||
          !userPermission[PermissionId.TICKET_CHANGE_PRODUCT_CONSUMABLE]
        "
        color="blue"
        icon="plus"
        type="submit"
      >
        Thêm vào danh sách
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
