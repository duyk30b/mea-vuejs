<script lang="ts" setup>
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputNumber, InputOptions, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus, DiscountType } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../../modules/product'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProduct, TicketProductType } from '../../../../modules/ticket-product'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../../product/upsert/ModalProductUpsert.vue'

const emit = defineEmits<{ (e: 'success', value: TicketProduct[]): void }>()

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])

const ticketProductConsumable = ref<TicketProduct>(TicketProduct.blank())

const handleFocusFirstSearchProduct = async () => {
  try {
    await ProductService.refreshDB()
  } catch (error) {
    console.log('🚀 ~ TicketClinicConsumableSelectItem.vue:41 ~ error:', error)
  }
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
          { $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }] },
          {
            $OR: [
              {
                quantity: settingStore.TICKET_CLINIC_DETAIL.consumable.searchIncludeZeroQuantity
                  ? undefined
                  : { NOT: 0 },
              },
              { hasManageQuantity: 0 },
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
}

const selectProduct = async (productSelect?: Product) => {
  if (productSelect) {
    const priorityList = (ticketClinicRef.value.ticketProductConsumableList || []).map(
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

    temp.type = TicketProductType.Consumable
    temp.deliveryStatus = DeliveryStatus.Pending
    temp.unitRate = productSelect.unitDefaultRate

    temp.expectedPrice = productSelect.retailPrice
    temp.discountType = DiscountType.Percent
    temp.discountPercent = 0
    temp.discountMoney = 0
    temp.actualPrice = productSelect.retailPrice

    ticketProductConsumable.value = temp

    // tính toán cho warehouseID
    const warehouseIdAcceptList: number[] =
      settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
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
    ticketProductConsumable.value.warehouseId = warehouseIdOptions.value[0]
  } else {
    clear()
  }
}

const addConsumableItem = async () => {
  const { product } = ticketProductConsumable.value
  if (!ticketProductConsumable.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }

  if (product?.hasManageQuantity) {
    if (ticketProductConsumable.value.quantity > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProductConsumable.value.quantity
        }`,
      )
    }
  }

  // tính lại costAmount
  ticketProductConsumable.value.costAmount =
    ticketProductConsumable.value.quantity * (product?.costPrice || 0)
  emit('success', [ticketProductConsumable.value])
  clear()
  inputOptionsProduct.value?.clear()

  if (!isMobile) {
    inputOptionsProduct.value?.focus()
  }
}

const handleUpdateUnitActualPrice = (price: number) => {
  ticketProductConsumable.value.unitActualPrice = price
  ticketProductConsumable.value.unitExpectedPrice = price
}

const handleModalProductUpsertSuccess = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName,
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
    <div style="flex-grow: 1; flex-basis: 80%">
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
            v-if="ticketProductConsumable.product?.hasManageQuantity"
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
          v-if="permissionIdMap[PermissionId.PRODUCT_UPDATE] && ticketProductConsumable.product?.id"
          @click="modalProductUpsert?.openModal(ticketProductConsumable.product.id)"
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
          placeholder="Tìm kiếm sản phẩm bằng tên hoặc hoạt chất của sản phẩm"
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

    <div style="flex-grow: 1; flex-basis: 300px">
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
            v-model:value="ticketProductConsumable.unitRate"
            :disabled="ticketProductConsumable.product!.unitObject.length <= 1"
            :options="
              ticketProductConsumable.product!.unitObject.map((i) => ({
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
            v-model:value="ticketProductConsumable.unitQuantity"
            required
            :validate="{ gt: 0 }"
          />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Giá tiền</span>
        <span v-if="ticketProductConsumable.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductConsumable.quantity }}</b>
          {{ ticketProductConsumable.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductConsumable.unitActualPrice"
            required
            :validate="{ gte: 0 }"
            @update:value="handleUpdateUnitActualPrice"
          />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 80%" class="mt-2 flex justify-center">
      <VueButton
        :disabled="
          [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus) ||
          !permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE]
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
