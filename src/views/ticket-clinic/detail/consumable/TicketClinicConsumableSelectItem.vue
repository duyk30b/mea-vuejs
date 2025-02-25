<script lang="ts" setup>
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputNumber, InputOptions, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../../modules/batch'
import { DeliveryStatus, DiscountType } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../../modules/product'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProduct, TicketProductType } from '../../../../modules/ticket-product'
import { DTimer } from '../../../../utils'
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
const batchList = ref<Batch[]>([])

const ticketProductConsumable = ref<TicketProduct>(TicketProduct.blank())

const handleFocusFirstSearchProduct = async () => {
  try {
    await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
  } catch (error) {
    console.log('🚀 ~ TicketClinicConsumableSelectItem.vue:41 ~ error:', error)
  }
}

const searchingProduct = async (text: string) => {
  if (!text) {
    clear()
  } else {
    const productList = await ProductService.list({
      filter: {
        isActive: 1,
        $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
        warehouseIds: (value) => {
          try {
            const warehouseIdAcceptList =
              settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
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
}

const clear = () => {
  ticketProductConsumable.value = TicketProduct.blank()
  productOptions.value = []
  batchList.value = []
}

const selectProduct = async (productSelect?: Product) => {
  if (productSelect) {
    const priorityList = (ticketClinicRef.value.ticketProductConsumableList || []).map(
      (i) => i.priority
    )
    priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
    const priorityMax = Math.max(...priorityList)

    const temp = TicketProduct.blank()
    temp.priority = priorityMax + 1
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

    if (!productSelect.hasManageQuantity) {
      temp.warehouseId = 0 // set tạm như này để cho trường hợp !hasManageQuantity, khi gắn batch set lại sau
      temp.costPrice = productSelect.costPrice // set tạm như này để cho trường hợp !hasManageQuantity, khi gắn batch set lại sau
    }

    ticketProductConsumable.value = temp

    const warehouseIdAcceptList = settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
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

    // const batchListResponse = await BatchService.list({
    //   filter: {
    //     productId: instance.id,
    //     quantity: { NOT: 0 },
    //     ...(canGetAllWarehouse
    //       ? {}
    //       : {
    //           $OR: [{ warehouseId: { EQUAL: 0 } }, { warehouseId: { IN: warehouseIdAcceptList } }],
    //         }),
    //   },
    // })
    batchListResponse.forEach((i) => (i.product = productSelect))
    batchList.value = batchListResponse

    if (batchListResponse.length) {
      selectBatch(batchListResponse[0])
    } else {
      selectBatch(Batch.blank())
    }
  } else {
    clear()
  }
}

const selectBatch = (batchSelected: Batch | null) => {
  if (!batchSelected) return
  ticketProductConsumable.value.batch = Batch.from(batchSelected)
  ticketProductConsumable.value.batchId = batchSelected.id
  ticketProductConsumable.value.warehouseId = batchSelected.warehouseId
  ticketProductConsumable.value.costPrice = batchSelected.costPrice
}

const addConsumableItem = async () => {
  const { product, batch } = ticketProductConsumable.value
  if (!ticketProductConsumable.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }

  if (product?.hasManageQuantity) {
    if (!ticketProductConsumable.value.batchId) {
      return AlertStore.addError('Lỗi: Không có lô hàng phù hợp')
    }
    if (!settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
      if (ticketProductConsumable.value.quantity > batch!.quantity) {
        return AlertStore.addError(
          `Lỗi: Số lượng tồn kho không đủ, tồn ${batch!.quantity} lấy ${
            ticketProductConsumable.value.quantity
          }`
        )
      }
    }
  }
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
          @click="modalProductDetail?.openModal(ticketProductConsumable.product)">
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
            ">
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
          @click="modalProductUpsert?.openModal(ticketProductConsumable.product.id)">
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
    <div style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span
          v-if="
            ticketProductConsumable.batch?.expiryDate &&
            ticketProductConsumable.batch?.expiryDate < Date.now()
          "
          class="text-red-500 font-bold">
          (Hết hạn sử dụng)
        </span>
        <span
          v-if="ticketProductConsumable.productId && !batchList.length"
          class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="ticketProductConsumable.batch!.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProductConsumable.product!.unitDefaultName }}
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span
                :class="
                  ticketProductConsumable.quantity > data.quantity ? 'text-red-500 font-bold' : ''
                ">
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProductConsumable.product!.unitDefaultName }}
              </span>
            </div>
          </template>
        </VueSelect>
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
            required></VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductConsumable.unitQuantity"
            required
            :validate="{ gt: 0 }" />
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
            @update:value="handleUpdateUnitActualPrice" />
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
        type="submit">
        Thêm vào danh sách
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
