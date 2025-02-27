<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClock, IconFileSearch, IconShoppingCart, IconSpin } from '../../../../common/icon'
import { IconEditSquare } from '../../../../common/icon-google'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import type { Product } from '../../../../modules/product'
import { TicketClinicProductApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProduct } from '../../../../modules/ticket-product'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalTicketClinicConsumableUpdate from './ModalTicketClinicConsumableUpdate.vue'
import TicketClinicConsumableSelectItem from './TicketClinicConsumableSelectItem.vue'

const modalTicketClinicConsumableUpdate =
  ref<InstanceType<typeof ModalTicketClinicConsumableUpdate>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductConsumableList = ref<TicketProduct[]>([])

const hasChangePriority = computed(() => {
  for (
    let index = 0;
    index < (ticketClinicRef.value.ticketProductConsumableList || []).length;
    index++
  ) {
    const tpRoot = ticketClinicRef.value.ticketProductConsumableList![index]
    if (tpRoot.priority !== ticketProductConsumableList.value[index].priority) {
      return true
    }
  }
  return false
})

watch(
  () => ticketClinicRef.value.ticketProductConsumableList,
  (newValue, oldValue) => {
    ticketProductConsumableList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicConsumable.vue:52  ~ onMounted')
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductConsumableList.value[index]
  ticketProductConsumableList.value[index] = ticketProductConsumableList.value[index + count]
  ticketProductConsumableList.value[index + count] = temp
}

const savePriorityTicketProductConsumable = async () => {
  try {
    await TicketClinicProductApi.updatePriorityTicketProductConsumable({
      ticketId: ticketClinicRef.value.id,
      ticketProductList: ticketProductConsumableList.value,
    })
  } catch (e: any) {
    console.log('🚀 ~ TicketClinicConsumable.vue:70 ~ savePriorityTicketProductConsumable ~ e:', e)
  }
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}

const handleAddTicketProductConsumable = async (ticketProductAddList: TicketProduct[]) => {
  try {
    ticketProductConsumableList.value = [
      ...ticketProductConsumableList.value,
      ...ticketProductAddList,
    ]
    await TicketClinicProductApi.addTicketProductConsumableList({
      ticketId: ticketClinicRef.value.id,
      ticketProductList: ticketProductAddList,
    })
  } catch (error) {
    console.log('🚀 TicketClinicConsumable.vue:90 ~ error:', error)
  }
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <TicketClinicConsumableSelectItem @success="handleAddTicketProductConsumable" />
  <ModalTicketClinicConsumableUpdate ref="modalTicketClinicConsumableUpdate" />

  <div class="mt-4">
    <div>Danh sách vật tư</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th style="width: 32px"></th>
            <th>Tên vật tư</th>
            <th>SL</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProductConsumableList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProductConsumableList || []" :key="tpItem.productId">
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
                    index === ticketProductConsumableList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-center">
              <a-tooltip v-if="tpItem.deliveryStatus === DeliveryStatus.Pending">
                <template #title>Chưa xuất vật tư</template>
                <IconClock
                  width="16"
                  height="16"
                  style="color: orange; cursor: not-allowed !important" />
              </a-tooltip>
              <a-tooltip v-else>
                <template #title>Đã xuất vật tư</template>
                <IconShoppingCart
                  width="18"
                  height="18"
                  style="color: #52c41a; cursor: not-allowed !important" />
              </a-tooltip>
            </td>
            <td>
              <div style="font-weight: 500">
                {{ tpItem.product?.brandName }}
                <a class="ml-1" @click="openModalProductDetail(tpItem.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
            </td>
            <td class="text-center">
              {{ formatMoney(tpItem.unitQuantity) }}
            </td>
            <td class="text-center whitespace-nowrap">
              {{ tpItem.unitName }}
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpItem.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpItem.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpItem.unitActualPrice) }}</div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.actualPrice * tpItem.quantity || 0) }}
            </td>
            <td class="text-center">
              <a v-if="!tpItem.id">
                <IconSpin width="20" height="20" />
              </a>
              <a
                v-else-if="
                  permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE]
                "
                class="text-orange-500"
                @click="modalTicketClinicConsumableUpdate?.openModal(tpItem)">
                <IconEditSquare width="20" height="20" />
              </a>
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
                    ticketProductConsumableList.reduce((acc: number, item: TicketProduct) => {
                      return (acc += item.actualPrice * item.quantity)
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
  </div>
  <div class="mt-4 flex gap-4">
    <VueButton
      v-if="
        permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE] &&
        hasChangePriority
      "
      color="blue"
      class="ml-auto"
      icon="save"
      @click="savePriorityTicketProductConsumable">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
