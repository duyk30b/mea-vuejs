<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch, IconSpin } from '@/common/icon-antd'
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import type { Product } from '@/modules/product'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import { TicketProduct, TicketProductService } from '@/modules/ticket-product'
import { TicketUser } from '@/modules/ticket-user'
import { TicketChangeProductApi } from '@/modules/ticket/api/ticket-change-product.api'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { computed, onMounted, ref, watch } from 'vue'
import ModalTicketClinicConsumableUpdate from './ModalTicketConsumableUpdate.vue'
import TicketConsumableSelectItem from './TicketConsumableSelectItem.vue'
import { CONFIG } from '@/config'
import { BugDevelopment } from '@/views/component'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'

const modalTicketClinicConsumableUpdate =
  ref<InstanceType<typeof ModalTicketClinicConsumableUpdate>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const { userPermission, organizationPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductConsumableList = ref<TicketProduct[]>([])

let ticketUserListOrigin: TicketUser[] = []
const ticketUserList = ref<TicketUser[]>([])

watch(
  () => ticketRoomRef.value.ticketProductConsumableList,
  (newValue, oldValue) => {
    ticketProductConsumableList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  TicketProductService.refreshRelation(ticketRoomRef.value.ticketProductList)
  await ticketRoomRef.value.refreshTicketProduct()
})

const hasChangePriority = computed(() => {
  for (
    let index = 0;
    index < (ticketRoomRef.value.ticketProductConsumableList || []).length;
    index++
  ) {
    const tpRoot = ticketRoomRef.value.ticketProductConsumableList![index]
    if (tpRoot.priority !== ticketProductConsumableList.value[index].priority) {
      return true
    }
  }
  return false
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(
    ticketUserListOrigin.filter((i) => !!i.userId),
    ticketUserList.value.filter((i) => !!i.userId),
  )
  return result
})

const hasChangeData = computed(() => {
  if (hasChangePriority.value) {
    return true
  }
  if (hasChangeTicketUserList.value) {
    return true
  }
  return false
})

const disabledButton = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return true
  }
  return !hasChangeData.value
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductConsumableList.value[index]
  ticketProductConsumableList.value[index] = ticketProductConsumableList.value[index + count]
  ticketProductConsumableList.value[index + count] = temp
}

const savePriorityTicketProductConsumable = async () => {
  try {
    await TicketChangeProductApi.updatePriorityTicketProductConsumable({
      ticketId: ticketRoomRef.value.id,
      ticketProductList: ticketProductConsumableList.value,
    })
  } catch (e: any) {
    console.log('🚀 ~ TicketClinicConsumable.vue:70 ~ saveConsumable ~ e:', e)
  }
}

const saveConsumable = async () => {
  if (hasChangePriority.value) {
    savePriorityTicketProductConsumable()
  }
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}

const handleAddTicketProductConsumable = async (ticketProductAddList: TicketProduct[]) => {
  const tpListOrigin = [...ticketProductConsumableList.value]
  try {
    ticketProductConsumableList.value = [...tpListOrigin, ...ticketProductAddList]
    await TicketChangeProductApi.addTicketProductConsumableList({
      ticketId: ticketRoomRef.value.id,
      ticketProductList: ticketProductAddList,
    })
  } catch (error) {
    ticketProductConsumableList.value = tpListOrigin
    console.log('🚀 TicketClinicConsumable.vue:90 ~ error:', error)
  }
}

const clickDestroyTicketProduct = async (ticketProductProp: TicketProduct) => {
  if (ticketProductProp.deliveryStatus === DeliveryStatus.Delivered) {
    return ModalStore.alert({
      title: 'Không thể xóa vật tư ?',
      content: [
        '- Vật tư đã được xuất khỏi kho sẽ không thể xóa',
        '- Chỉ có thể hoàn trả vật tư nếu bắt buộc phải thay đổi số lượng ?',
      ],
    })
  }
  if (
    [PaymentMoneyStatus.FullPaid, PaymentMoneyStatus.PartialPaid].includes(
      ticketProductProp.paymentMoneyStatus,
    )
  ) {
    return ModalStore.alert({
      title: 'Không thể xóa vật tư - vật tư ?',
      content: ['- Vật tư đã được thanh toán sẽ không thể xóa'],
    })
  }
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return ModalStore.alert({
      title: 'Không thể xóa vật tư ?',
      content: [
        '- Phiếu khám đã đóng không thể xóa vật tư',
        '- Nếu bắt buộc phải thay đổi số lượng, bạn cần mở lại phiếu khám',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa vật tư ?',
    content: [
      '- Hệ thống sẽ xóa vật tư này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProductApi.destroyTicketProductConsumable({
          ticketId: ticketRoomRef.value.id,
          ticketProductId: ticketProductProp.id,
        })
      } catch (error) {
        console.log('🚀 ~ TicketClinicConsumableContainer.vue:174  ~ error:', error)
      }
    },
  })
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <TicketConsumableSelectItem @success="handleAddTicketProductConsumable" />
  <ModalTicketClinicConsumableUpdate ref="modalTicketClinicConsumableUpdate" />

  <div class="mt-4">
    <div>Danh sách vật tư</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 40px" v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th style="width: 40px"></th>
            <th style="width: 40px"></th>
            <th>Tên vật tư</th>
            <th>SL</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProductConsumableList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProductConsumableList || []" :key="tpItem.productId">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
              <BugDevelopment :data="tpItem" />
            </td>
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
                  @click="changeItemPosition(index, -1)"
                >
                  <IconSortUp style="opacity: 0.6" />
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
                  @click="changeItemPosition(index, 1)"
                >
                  <IconSortDown style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td><PaymentMoneyStatusTooltip :paymentMoneyStatus="tpItem.paymentMoneyStatus" /></td>
            <td class="text-center">
              <TicketDeliveryStatusTooltip :deliveryStatus="tpItem.deliveryStatus" />
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
              <div v-if="tpItem.unitDiscountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpItem.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpItem.unitActualPrice) }}</div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.unitActualPrice * tpItem.unitQuantity || 0) }}
            </td>
            <td class="text-center">
              <a v-if="!tpItem.id">
                <IconSpin width="20" height="20" />
              </a>
              <a
                v-else-if="
                  [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                    tpItem.paymentMoneyStatus,
                  ) && userPermission[PermissionId.TICKET_CHANGE_PRODUCT_CONSUMABLE]
                "
                class="text-orange-500"
                @click="modalTicketClinicConsumableUpdate?.openModal(tpItem)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
            <td class="text-center">
              <a v-if="!tpItem.id">
                <IconSpin width="22" height="22" />
              </a>
              <a
                v-else-if="
                  [PaymentMoneyStatus.PendingPayment, PaymentMoneyStatus.TicketPaid].includes(
                    tpItem.paymentMoneyStatus,
                  ) && userPermission[PermissionId.TICKET_CHANGE_PRODUCT_PRESCRIPTION]
                "
                style="color: var(--text-red)"
                @click="clickDestroyTicketProduct(tpItem)"
              >
                <IconDelete width="22" height="22" />
              </a>
            </td>
          </tr>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="7" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProductConsumableList.reduce((acc: number, item: TicketProduct) => {
                      return (acc += item.unitActualPrice * item.unitQuantity)
                    }, 0),
                  )
                }}
              </b>
            </td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="mt-4 flex gap-4">
    <VueButton
      v-if="userPermission[PermissionId.TICKET_CHANGE_PRODUCT_CONSUMABLE]"
      :disabled="disabledButton"
      color="blue"
      style="margin-left: auto"
      icon="save"
      @click="saveConsumable"
    >
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
