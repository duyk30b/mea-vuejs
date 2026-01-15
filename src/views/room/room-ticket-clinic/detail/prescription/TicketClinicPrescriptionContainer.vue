<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch, IconSpin } from '@/common/icon-antd'
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputArea, VueSwitch } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrescriptionSample, PrescriptionSampleItem } from '@/modules/prescription-sample'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'
import { Product, ProductService } from '@/modules/product'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeAttributeApi, TicketChangeProductApi, TicketStatus } from '@/modules/ticket'
import {
  TicketAttributeKeyAdviceList,
  type TicketAttributeKeyAdviceType,
} from '@/modules/ticket-attribute'
import { TicketProduct, TicketProductService, TicketProductType } from '@/modules/ticket-product'
import { TicketUser } from '@/modules/ticket-user'
import { BugDevelopment } from '@/views/component'
import InputSearchPrescriptionSample from '@/views/component/InputSearchPrescriptionSample.vue'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { computed, onMounted, ref, watch } from 'vue'
import ModalSavePrescriptionSample from './ModalSavePrescriptionSample.vue'
import ModalSelectItemFromPrescriptionSample from './ModalSelectItemFromPrescriptionSample.vue'
import ModalTicketPrescriptionUpdate from './ModalTicketPrescriptionUpdate.vue'
import TicketPrescriptionSelectItem from './TicketPrescriptionSelectItem.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'

const modalTicketPrescriptionUpdate = ref<InstanceType<typeof ModalTicketPrescriptionUpdate>>()
const ticketSpaPrescriptionSelectItem = ref<InstanceType<typeof TicketPrescriptionSelectItem>>()
const modalSelectItemFromPrescriptionSample =
  ref<InstanceType<typeof ModalSelectItemFromPrescriptionSample>>()

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalSavePrescriptionSample = ref<InstanceType<typeof ModalSavePrescriptionSample>>()

const { userPermission, organizationPermission, organization } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductPrescriptionList = ref<TicketProduct[]>([])

let ticketUserListOrigin: TicketUser[] = []
const ticketUserList = ref<TicketUser[]>([])

const ticketAttributeOriginMap: { [P in TicketAttributeKeyAdviceType]?: any } = {}
const ticketAttributeMap = ref<{ [P in TicketAttributeKeyAdviceType]?: any } & { advice: string }>({
  advice: '',
})

onMounted(async () => {
  await TicketProductService.refreshRelation(ticketRoomRef.value.ticketProductList)
  ticketRoomRef.value.refreshTicketProduct()
})

const selectPrescriptionSample = async (psSelect?: PrescriptionSample) => {
  if (psSelect) {
    modalSelectItemFromPrescriptionSample?.value?.openModal(psSelect)
  }
}

watch(
  () => ticketRoomRef.value.ticketProductPrescriptionList,
  (newValue, oldValue) => {
    ticketProductPrescriptionList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value.ticketAttributeList,
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
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value.ticketUserTree,
  (newValue, oldValue) => {},
  { immediate: true, deep: true },
)

const hasChangePriority = computed(() => {
  for (
    let index = 0;
    index < (ticketRoomRef.value.ticketProductPrescriptionList || []).length;
    index++
  ) {
    const tpRoot = ticketRoomRef.value.ticketProductPrescriptionList![index]
    if (tpRoot.priority !== ticketProductPrescriptionList.value[index].priority) {
      return true
    }
  }
  return false
})

const hasChangeAttribute = computed(() => {
  let hasChange = false
  Object.entries(ticketAttributeMap.value).forEach(([key, value]) => {
    const k = key as unknown as TicketAttributeKeyAdviceType
    const rootValue = ticketRoomRef.value.ticketAttributeMap[k] || ''
    if (rootValue != value) {
      hasChange = true
    }
  })
  return hasChange
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
  if (hasChangeAttribute.value) {
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
  const temp = ticketProductPrescriptionList.value[index]
  ticketProductPrescriptionList.value[index] = ticketProductPrescriptionList.value[index + count]
  ticketProductPrescriptionList.value[index + count] = temp
}

const startPrint = async () => {
  await PrintHtmlAction.startPrintPrescription({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}

const savePriorityTicketProductPrescription = async () => {
  try {
    await TicketChangeProductApi.updatePriorityTicketProductPrescription({
      ticketId: ticketRoomRef.value.id,
      ticketProductList: ticketProductPrescriptionList.value,
    })
  } catch (e: any) {
    console.log('🚀 ~ TicketClinicPrescription.vue:167 ~ e:', e)
  }
}

const saveAdvicePrescription = async () => {
  try {
    await TicketChangeAttributeApi.updateTicketAttributeList({
      ticketId: ticketRoomRef.value.id,
      ticketAttributeList: Object.entries(ticketAttributeMap.value).map(([key, value]) => {
        return {
          key,
          value,
        }
      }),
    })
  } catch (e: any) {
    console.log('🚀 ~ TicketClinicPrescription.vue:184 ~ e:', e)
  }
}

const savePrescription = async () => {
  if (hasChangePriority.value) {
    savePriorityTicketProductPrescription()
  }
  if (hasChangeAttribute.value) {
    saveAdvicePrescription()
  }
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}

const handleAddTicketProductPrescription = async (ticketProductAddList: TicketProduct[]) => {
  const tpListOrigin = [...ticketProductPrescriptionList.value]
  try {
    ticketProductPrescriptionList.value = [...tpListOrigin, ...ticketProductAddList]

    await TicketChangeProductApi.addTicketProductPrescriptionList({
      ticketId: ticketRoomRef.value.id,
      ticketProductList: ticketProductAddList,
    })
  } catch (error) {
    ticketProductPrescriptionList.value = tpListOrigin
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

const clickOpenModalSavePrescriptionSample = () => {
  const psGenerate = PrescriptionSample.blank()
  psGenerate.name = ticketRoomRef.value.note
  psGenerate.prescriptionSampleItemList = ticketProductPrescriptionList.value.map((i) => {
    const psiBlank = PrescriptionSampleItem.blank()
    psiBlank.productId = i.productId
    psiBlank.unitQuantity = i.unitQuantityPrescription
    psiBlank.unitRate = i.unitRate
    psiBlank.hintUsage = i.hintUsage || ''
    return psiBlank
  })
  modalSavePrescriptionSample.value?.openModal(psGenerate)
}

const handleSelectPrescriptionSampleItemList = async (
  prescriptionSampleItemList: PrescriptionSampleItem[],
) => {
  if (
    ![
      TicketStatus.Schedule,
      TicketStatus.Draft,
      TicketStatus.Deposited,
      TicketStatus.Executing,
    ].includes(ticketRoomRef.value.status)
  ) {
    return AlertStore.addWarning(`Trạng thái phiếu khám không hợp lệ`)
  }

  const priorityList = (ticketRoomRef.value.ticketProductPrescriptionList || []).map((i) => {
    return i.priority
  })
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  let priority = Math.max(...priorityList)

  const ticketProductList = prescriptionSampleItemList
    .map((psItem) => {
      const { product } = psItem
      if (!product) {
        return null
      }
      priority = priority + 1
      const temp = TicketProduct.blank()
      temp.priority = priority
      temp.productId = psItem.productId
      temp.product = Product.from(product)
      temp.pickupStrategy = MeService.getPickupStrategy(product).prescription
      temp.customerId = ticketRoomRef.value.customerId
      temp.batchId = 0

      temp.unitRate = psItem.unitRate || 1
      temp.unitQuantity = psItem.unitQuantity // lấy theo mẫu
      temp.unitQuantityPrescription = psItem.unitQuantity // lấy theo mẫu
      temp.hintUsage = psItem.hintUsage // lấy theo mẫu

      temp.createdAt = Date.now()
      if (product?.warehouseIds !== '[]') {
        if (temp.quantity > product!.quantity) {
          AlertStore.addWarning(
            `Cảnh báo: ${product.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
              temp.quantity
            }`,
          )
        }
      }

      temp.type = TicketProductType.Prescription
      temp.deliveryStatus = DeliveryStatus.Pending

      temp.unitExpectedPrice = product.retailPrice * temp.unitRate
      temp.discountType = DiscountType.Percent
      temp.discountPercent = 0
      temp.unitDiscountMoney = 0
      temp.unitActualPrice = product.retailPrice * temp.unitRate

      temp.warehouseIds = JSON.stringify(
        settingStore.TICKET_CLINIC_DETAIL.prescriptions.warehouseIdList,
      )

      return temp
    })
    .filter((i) => !!i)

  for (let i = 0; i < ticketProductList.length; i++) {
    const tpItem = ticketProductList[i]
    await ProductService.executeRelation([tpItem.product!], { discountList: true })
    const discountApply = tpItem.product?.discountApply
    if (discountApply) {
      let { discountType, discountPercent, discountMoney } = discountApply
      const expectedPrice = Math.floor((tpItem.unitExpectedPrice || 0) / tpItem.unitRate)
      if (discountType === DiscountType.Percent) {
        discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
      }
      if (discountType === DiscountType.VND) {
        discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
      }
      tpItem.discountType = discountType
      tpItem.discountPercent = discountPercent
      tpItem.unitDiscountMoney = discountMoney * tpItem.unitRate
      tpItem.unitActualPrice = tpItem.unitExpectedPrice - tpItem.unitDiscountMoney
    }
  }

  handleAddTicketProductPrescription(ticketProductList)
}

const clickDestroyTicketProduct = async (ticketProductProp: TicketProduct) => {
  if (ticketProductProp.deliveryStatus === DeliveryStatus.Delivered) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc ?',
      content: [
        '- Thuốc đã được xuất khỏi kho sẽ không thể xóa',
        '- Chỉ có thể hoàn trả thuốc nếu bắt buộc phải thay đổi số lượng ?',
      ],
    })
  }
  if (
    [PaymentMoneyStatus.FullPaid, PaymentMoneyStatus.PartialPaid].includes(
      ticketProductProp.paymentMoneyStatus,
    )
  ) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc - vật tư ?',
      content: ['- Thuốc - vật tư đã được thanh toán sẽ không thể xóa'],
    })
  }
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc ?',
      content: [
        '- Phiếu khám đã đóng không thể xóa thuốc',
        '- Nếu bắt buộc phải thay đổi số lượng, bạn cần mở lại phiếu khám',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa thuốc ?',
    content: [
      '- Hệ thống sẽ xóa thuốc này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProductApi.destroyTicketProductPrescription({
          ticketId: ticketRoomRef.value.id,
          ticketProductId: ticketProductProp.id,
        })
      } catch (error) {
        console.log('🚀 ~ ModalTicketPrescriptionUpdate.vue:227 ~ clickDestroy ~ error:', error)
      }
    },
  })
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <TicketPrescriptionSelectItem
    ref="ticketSpaPrescriptionSelectItem"
    @success="handleAddTicketProductPrescription"
  />
  <ModalTicketPrescriptionUpdate ref="modalTicketPrescriptionUpdate" />
  <ModalSavePrescriptionSample ref="modalSavePrescriptionSample" />
  <ModalSelectItemFromPrescriptionSample
    ref="modalSelectItemFromPrescriptionSample"
    @success="handleSelectPrescriptionSampleItemList"
  />
  <div class="mt-4">
    <div class="flex flex-wrap justify-between items-baseline">
      <div>Đơn thuốc</div>
      <div style="width: 500px; max-width: 90%">
        <InputSearchPrescriptionSample
          @selectPrescriptionSample="selectPrescriptionSample"
          removeLabelWrapper
          :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status)"
          prepend="Đơn mẫu"
        />
      </div>
    </div>
    <div class="mt-1 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th style="width: 32px"></th>
            <th style="width: 32px"></th>
            <th>Tên Thuốc</th>
            <th>SL kê</th>
            <th>SL mua</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th>In</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProductPrescriptionList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(tpItem, index) in ticketProductPrescriptionList || []"
            :key="tpItem.productId"
          >
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
                    index === ticketProductPrescriptionList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)"
                >
                  <IconSortDown style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-center">
              <TicketDeliveryStatusTooltip :deliveryStatus="tpItem.deliveryStatus" />
            </td>
            <td class="text-center">
              <PaymentMoneyStatusTooltip :paymentMoneyStatus="tpItem.paymentMoneyStatus" />
            </td>
            <td>
              <div style="font-weight: 500">
                {{ tpItem.product?.brandName }}
                <a class="ml-1" @click="openModalProductDetail(tpItem.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
              <div class="text-xs italic">{{ tpItem.hintUsage }}</div>
            </td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitQuantityPrescription }}</td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitQuantity }}</td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitName }}</td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpItem.unitDiscountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpItem.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpItem.unitActualPrice) }}</div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.unitActualPrice * tpItem.unitQuantity || 0) }}
            </td>
            <td class="">
              <div class="flex justify-center">
                <VueSwitch size="16px" :modelValue="tpItem.printPrescription" />
              </div>
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
                style="color: var(--text-orange)"
                @click="modalTicketPrescriptionUpdate?.openModal(tpItem)"
              >
                <IconEditSquare width="22" height="22" />
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
            <td colspan="8" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProductPrescriptionList.reduce((acc: number, item: TicketProduct) => {
                      return (acc += item.unitActualPrice * item.unitQuantity)
                    }, 0),
                  )
                }}
              </b>
            </td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4">
      <div>Lời dặn của bác sĩ</div>
      <div>
        <InputArea
          v-model:value="ticketAttributeMap.advice"
          :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status)"
        />
        <!-- <VueTinyMCE
          v-model="ticketAttributeMap.advice"
          :readonly="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status)"
        /> -->
      </div>
    </div>
  </div>
  <div class="mt-4 flex gap-2">
    <VueButton color="blue" icon="print" @click="startPrint">In đơn thuốc</VueButton>
    <VueButton @click="clickOpenModalSavePrescriptionSample">Lưu vào đơn mẫu</VueButton>
    <VueButton
      v-if="userPermission[PermissionId.TICKET_CHANGE_PRODUCT_PRESCRIPTION]"
      color="blue"
      style="margin-left: auto"
      :disabled="disabledButton"
      icon="save"
      @click="savePrescription"
    >
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
