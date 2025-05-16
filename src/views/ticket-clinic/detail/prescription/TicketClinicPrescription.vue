<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClockCircle, IconShoppingCart, IconSpin } from '../../../../common/icon-antd'
import { IconEditSquare } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import CKEditor5Vue from '../../../../common/ckeditor5-vue/CKEditor5Vue.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlService,
} from '../../../../modules/print-html'
import type { Product } from '../../../../modules/product'
import { TicketStatus } from '../../../../modules/ticket'
import {
  TicketAttributeKeyAdviceList,
  type TicketAttributeKeyAdviceType,
} from '../../../../modules/ticket-attribute'
import {
  TicketClinicAttributeApi,
  TicketClinicProductApi,
  ticketClinicRef,
} from '../../../../modules/ticket-clinic'
import { TicketProduct } from '../../../../modules/ticket-product'
import { ESDom } from '../../../../utils'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalSavePrescriptionSample from './ModalSavePrescriptionSample.vue'
import ModalTicketClinicPrescriptionUpdate from './ModalTicketClinicPrescriptionUpdate.vue'
import TicketClinicPrescriptionSelectItem from './TicketClinicPrescriptionSelectItem.vue'
import { type MedicineType, PrescriptionSample } from '../../../../modules/prescription-sample'
import { IconSortDown, IconSortUp } from '../../../../common/icon-font-awesome'
import { IconFileSearch } from '../../../../common/icon-antd'
import VueTooltip from '../../../../common/popover/VueTooltip.vue'

const modalTicketClinicPrescriptionUpdate =
  ref<InstanceType<typeof ModalTicketClinicPrescriptionUpdate>>()

const ticketClinicPrescriptionSelectItem =
  ref<InstanceType<typeof TicketClinicPrescriptionSelectItem>>()

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalSavePrescriptionSample = ref<InstanceType<typeof ModalSavePrescriptionSample>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductPrescriptionList = ref<TicketProduct[]>([])

const ticketAttributeOriginMap: { [P in TicketAttributeKeyAdviceType]?: any } = {}
const ticketAttributeMap = ref<{ [P in TicketAttributeKeyAdviceType]?: any } & { advice: string }>({
  advice: '',
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicPrescription.vue:70 ~ onMounted')
})

watch(
  () => ticketClinicRef.value.ticketProductPrescriptionList,
  (newValue, oldValue) => {
    ticketProductPrescriptionList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketClinicRef.value.ticketAttributeList,
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

const hasChangePriority = computed(() => {
  for (
    let index = 0;
    index < (ticketClinicRef.value.ticketProductPrescriptionList || []).length;
    index++
  ) {
    const tpRoot = ticketClinicRef.value.ticketProductPrescriptionList![index]
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
    const rootValue = ticketClinicRef.value.ticketAttributeMap[k] || ''
    if (rootValue != value) {
      hasChange = true
    }
  })
  return hasChange
})

const disabledButton = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return true
  }
  if (hasChangePriority.value) {
    return false
  }
  if (hasChangeAttribute.value) {
    return false
  }
  return true
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductPrescriptionList.value[index]
  ticketProductPrescriptionList.value[index] = ticketProductPrescriptionList.value[index + count]
  ticketProductPrescriptionList.value[index + count] = temp
}

const startPrint = async () => {
  try {
    let printHtmlId = settingStore.TICKET_CLINIC_DETAIL.printHtmlIdSetting.prescription
    let printHtml: PrintHtml | undefined
    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.prescription
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }
    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      masterData: {},
      printHtml: printHtml!,
    })

    await ESDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const savePriorityTicketProductPrescription = async () => {
  try {
    await TicketClinicProductApi.updatePriorityTicketProductPrescription({
      ticketId: ticketClinicRef.value.id,
      ticketProductList: ticketProductPrescriptionList.value,
    })
  } catch (e: any) {
    console.log('🚀 ~ TicketClinicPrescription.vue:167 ~ e:', e)
  }
}

const saveAdvicePrescription = async () => {
  try {
    await TicketClinicAttributeApi.updateTicketAttributeList({
      ticketId: ticketClinicRef.value.id,
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

const savePriorityTicketProductPrescriptionAndAdvice = async () => {
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
  try {
    ticketProductPrescriptionList.value = [
      ...ticketProductPrescriptionList.value,
      ...ticketProductAddList,
    ]

    await TicketClinicProductApi.addTicketProductPrescriptionList({
      ticketId: ticketClinicRef.value.id,
      ticketProductList: ticketProductAddList,
    })
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

const handleModalSavePrescriptionSampleChange = async (v: boolean) => {
  if (v) {
    await ticketClinicPrescriptionSelectItem.value?.fetchPrescriptionSample()
  }
}

const clickOpenModalSavePrescriptionSample = () => {
  const medicineList: MedicineType[] = ticketProductPrescriptionList.value.map((i) => ({
    productId: i.productId,
    quantity: i.quantityPrescription,
    hintUsage: i.hintUsage || '',
  }))

  const psGenerate = PrescriptionSample.blank()
  psGenerate.name = ticketClinicRef.value.note
  psGenerate.medicineList = medicineList
  psGenerate.medicines = JSON.stringify(medicineList)
  modalSavePrescriptionSample.value?.openModal(psGenerate)
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <TicketClinicPrescriptionSelectItem
    ref="ticketClinicPrescriptionSelectItem"
    @success="handleAddTicketProductPrescription"
  />
  <ModalTicketClinicPrescriptionUpdate ref="modalTicketClinicPrescriptionUpdate" />
  <ModalSavePrescriptionSample
    ref="modalSavePrescriptionSample"
    @hasChangeData="handleModalSavePrescriptionSampleChange"
  />
  <div class="">
    <div class="flex justify-between items-center">
      <span>Đơn thuốc</span>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th style="width: 32px"></th>
            <th>Tên Thuốc</th>
            <th>SL kê</th>
            <th>SL mua</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
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
              <VueTooltip v-if="tpItem.deliveryStatus === DeliveryStatus.Pending">
                <template #trigger>
                  <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
                </template>
                <div>Chưa xuất thuốc</div>
              </VueTooltip>

              <VueTooltip v-else>
                <template #trigger>
                  <IconShoppingCart style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
                </template>
                <div>Đã xuất thuốc</div>
              </VueTooltip>
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
                  permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_PRESCRIPTION]
                "
                class="text-orange-500"
                @click="modalTicketClinicPrescriptionUpdate?.openModal(tpItem)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="7" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProductPrescriptionList.reduce((acc: number, item: TicketProduct) => {
                      return (acc += item.expectedPrice * item.quantityPrescription)
                    }, 0),
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4">
      <div>Lời dặn của bác sĩ</div>
      <div style="height: 140px">
        <CKEditor5Vue v-model:value="ticketAttributeMap.advice" menuType="COLLAPSE" />
      </div>
    </div>
  </div>
  <div class="mt-4 flex gap-2">
    <VueButton color="blue" icon="print" @click="startPrint">In đơn thuốc</VueButton>
    <VueButton @click="clickOpenModalSavePrescriptionSample">Lưu vào đơn mẫu</VueButton>
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_PRESCRIPTION]"
      color="blue"
      style="margin-left: auto"
      :disabled="disabledButton"
      icon="save"
      @click="savePriorityTicketProductPrescriptionAndAdvice"
    >
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
