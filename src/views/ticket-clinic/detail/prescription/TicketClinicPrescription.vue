<script lang="ts" setup>
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconSpin } from '../../../../common/icon'
import { IconAddCircle, IconEditSquare } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputNumber } from '../../../../common/vue-form'
import WysiwygEditor from '../../../../common/wysiwyg-editor/WysiwygEditor.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlService,
} from '../../../../modules/print-html'
import { Product } from '../../../../modules/product'
import { TicketStatus } from '../../../../modules/ticket'
import {
  TicketAttributeKeyAdviceList,
  type TicketAttributeKeyAdviceType,
} from '../../../../modules/ticket-attribute'
import {
  TicketClinicApi,
  TicketClinicProductApi,
  ticketClinicRef,
} from '../../../../modules/ticket-clinic'
import { TicketProduct } from '../../../../modules/ticket-product'
import { DDom } from '../../../../utils'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalTicketClinicPrescriptionUpdate from './ModalTicketClinicPrescriptionUpdate.vue'
import TicketClinicPrescriptionSelectItem from './TicketClinicPrescriptionSelectItem.vue'
import ModalSelectPrescriptionSample from './ModalSelectPrescriptionSample.vue'

const modalTicketClinicPrescriptionUpdate =
  ref<InstanceType<typeof ModalTicketClinicPrescriptionUpdate>>()

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalSelectPrescriptionSample = ref<InstanceType<typeof ModalSelectPrescriptionSample>>()

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
  { immediate: true, deep: true }
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
  { immediate: true, deep: true }
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

    await DDom.startPrint('iframe-print', textDom)
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

const savePriorityTicketProductPrescriptionAndAdvice = async () => {
  if (hasChangePriority.value) {
    savePriorityTicketProductPrescription()
  }
  if (hasChangeAttribute.value) {
    console.log(
      '🚀 ~ TicketClinicPrescription.vue:179 ~ ~ hasChangeAttribute.value:',
      hasChangeAttribute.value
    )
  }

  let ticketAttributeChangeList = undefined
  if (hasChangeAttribute.value) {
    ticketAttributeChangeList = Object.entries(ticketAttributeMap.value)
      .map(([key, value]) => ({ key, value }))
      .filter((i) => !!i.value)
  }

  // await TicketClinicApi.updateTicketProductPrescription({
  //   ticketId: ticketClinicRef.value.id,
  //   ticketProductPrescriptionList: ticketProductPrescriptionListChange,
  //   ticketAttributeChangeList,
  //   ticketAttributeKeyList: TicketAttributeKeyAdviceList as any,
  // })
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
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <TicketClinicPrescriptionSelectItem @success="handleAddTicketProductPrescription" />
  <ModalTicketClinicPrescriptionUpdate ref="modalTicketClinicPrescriptionUpdate" />
  <ModalSelectPrescriptionSample ref="modalSelectPrescriptionSample" />
  <div class="mt-4">
    <div class="flex justify-between items-center">
      <span>Đơn thuốc</span>
      <div>
        <!-- <a @click="modalSelectPrescriptionSample?.openModal()">Chọn đơn mẫu</a> -->
      </div>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
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
            :key="tpItem.productId">
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
                    index === ticketProductPrescriptionList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div style="font-weight: 500">
                {{ tpItem.product?.brandName }}
                <a class="ml-1" @click="openModalProductDetail(tpItem.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
              <div class="text-xs italic">{{ tpItem.hintUsage }}</div>
            </td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitQuantityPrescription }}</td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitQuantity }}</td>
            <td class="text-center whitespace-nowrap">{{ tpItem.unitName }}</td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.unitExpectedPrice || 0) }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.expectedPrice * tpItem.quantityPrescription || 0) }}
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
                @click="modalTicketClinicPrescriptionUpdate?.openModal(tpItem)">
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
                    ticketProductPrescriptionList.reduce((acc, item) => {
                      return (acc += item.expectedPrice * item.quantityPrescription)
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
    <div class="flex justify-end">
      <!-- <a class="flex items-center gap-1" @click="addPrescriptionSample">
        <IconAddCircle />
        Lưu đơn mẫu
      </a> -->
    </div>

    <div class="mt-4">
      <div>Lời dặn của bác sĩ</div>
      <div style="height: 140px">
        <WysiwygEditor v-model:value="ticketAttributeMap.advice" menuType="COLLAPSE" />
      </div>
    </div>
  </div>
  <div class="mt-4 flex gap-4">
    <VueButton color="blue" icon="print" @click="startPrint">In đơn thuốc</VueButton>
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_PRESCRIPTION]"
      color="blue"
      class="ml-auto"
      :disabled="disabledButton"
      icon="save"
      @click="savePriorityTicketProductPrescriptionAndAdvice">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
