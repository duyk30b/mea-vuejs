<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import {
  IconCheckSquare,
  IconClockCircle,
  IconEye,
  IconPrint,
  IconSpin,
} from '../../../../common/icon-antd'
import { IconSortDown, IconSortUp } from '../../../../common/icon-font-awesome'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import VueTooltip from '../../../../common/popover/VueTooltip.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputOptions } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DiscountType } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { PrintHtmlService, compiledTemplatePrintHtml } from '../../../../modules/print-html'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketClinicRadiologyApi } from '../../../../modules/ticket-clinic/ticket-clinic-radiology.api'
import { TicketRadiology, TicketRadiologyStatus } from '../../../../modules/ticket-radiology'
import { ESDom } from '../../../../utils'
import ModalTicketRadiologyResult from '../../../room-radiology/ModalTicketRadiologyResult.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()
const inputSearchRadiology = ref<InstanceType<typeof InputOptions>>()

const { userPermission, organization } = MeService

const radiologyOptions = ref<{ value: number; text: string; data: Radiology }[]>([])

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketRadiologyList = ref<TicketRadiology[]>([])

watch(
  () => ticketClinicRef.value.ticketRadiologyList!,
  (newValue: TicketRadiology[]) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

const hasChangePriority = computed(() => {
  for (let index = 0; index < (ticketClinicRef.value.ticketRadiologyList || []).length; index++) {
    const tpRoot = ticketClinicRef.value.ticketRadiologyList![index]
    if (tpRoot.priority !== ticketRadiologyList.value[index].priority) {
      return true
    }
  }
  return false
})

onMounted(async () => {
  try {
    const radiologyAll = await RadiologyService.list({})
    ticketClinicRef.value.refreshRadiology()
    radiologyOptions.value = radiologyAll.map((i) => ({ value: i.id, text: i.name, data: i }))
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const selectRadiology = async (radiologyData?: Radiology) => {
  if (radiologyData) {
    const priorityList = (ticketClinicRef.value.ticketRadiologyList || []).map((i) => i.priority)
    priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
    const priorityMax = Math.max(...priorityList)

    const temp = TicketRadiology.init()
    temp.ticketId = ticketClinicRef.value.id
    temp.priority = priorityMax + 1
    temp.customerId = ticketClinicRef.value.customerId
    temp.radiologyId = radiologyData.id

    temp.radiology = radiologyData

    temp.registeredAt = Date.now()
    temp.costPrice = radiologyData.costPrice
    temp.expectedPrice = radiologyData.price
    temp.discountMoney = 0
    temp.discountPercent = 0
    temp.discountType = DiscountType.VND
    temp.actualPrice = radiologyData.price

    await RadiologyService.executeRelation([radiologyData], { discountList: true })
    const discountApply = radiologyData?.discountApply
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

    ticketRadiologyList.value.push(temp)

    await TicketClinicRadiologyApi.addTicketRadiology({
      ticketId: ticketClinicRef.value.id,
      ticketRadiology: temp,
    })
  }
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketRadiologyList.value[index]
  ticketRadiologyList.value[index] = ticketRadiologyList.value[index + count]
  ticketRadiologyList.value[index + count] = temp
}

const savePriorityTicketRadiology = async () => {
  try {
    await TicketClinicRadiologyApi.updatePriorityTicketRadiology({
      ticketId: ticketClinicRef.value.id,
      ticketRadiologyList: ticketRadiologyList.value,
    })
  } catch (error) {
    console.log('🚀 TicketClinicRadiology.vue:110 ~ savePriorityTicketRadiology ~ error:', error)
  }
}

const clickDestroy = async (ticketRadiologyId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa phiếu CĐHA ?',
    content: [
      '- Hệ thống sẽ xóa phiếu CĐHA này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    async onOk() {
      try {
        await TicketClinicRadiologyApi.destroyTicketRadiology({
          ticketId: ticketClinicRef.value.id,
          ticketRadiologyId,
        })
      } catch (error) {
        console.log('🚀 ~ TicketClinicRadiology.vue:132 ~ clickDestroy ~ error:', error)
      }
    },
  })
}

const startPrintRequest = async () => {
  try {
    const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
    const printHtmlRadiology = await PrintHtmlService.getPrintHtmlRadiologyRequest()

    if (!printHtmlHeader || !printHtmlRadiology || !printHtmlRadiology.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const compiledHeader = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlHeader,
    })
    const compiledContent = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlRadiology,
      _LAYOUT: {
        HEADER: compiledHeader.html,
      },
    })

    if (!compiledContent.html) {
      AlertStore.addError('Mẫu in không hợp lệ')
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: compiledContent.html,
      cssList: [compiledHeader.css, compiledContent.css],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const startPrintResult = async (ticketRadiologyData: TicketRadiology) => {
  try {
    const radiologyData = ticketRadiologyData.radiology || Radiology.blank()
    let printHtmlId = radiologyData.printHtmlId
    const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
    const printHtmlRadiology = await PrintHtmlService.getPrintHtmlRadiologyResult(printHtmlId)

    if (!printHtmlHeader || !printHtmlRadiology || !printHtmlRadiology.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const compiledHeader = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      data: ticketRadiologyData,
      printHtml: printHtmlHeader,
      customVariables: radiologyData.customVariables || '',
    })
    const compiledContent = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      data: ticketRadiologyData,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlRadiology,
      _LAYOUT: {
        HEADER: compiledHeader.html,
      },
      customVariables: radiologyData.customVariables || '',
    })

    if (!compiledContent.html) {
      AlertStore.addError('Mẫu in không hợp lệ')
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: compiledContent.html,
      cssList: [compiledHeader.css, compiledContent.css, radiologyData.customStyles],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
  <div class="mt-4 flex justify-between">
    <span>Chỉ định CĐHA</span>
    <span></span>
  </div>
  <div style="height: 40px">
    <InputFilter
      ref="inputSearchRadiology"
      :options="radiologyOptions"
      :maxHeight="320"
      placeholder="Tìm kiếm tên phiếu CĐHA"
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.status)"
      @selectItem="({ data }) => selectRadiology(data)"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
          - {{ formatMoney(data.price) }}
        </div>
      </template>
    </InputFilter>
  </div>
  <div class="mt-4">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các phiếu CĐHA</div>
      <div>
        <VueButton icon="print" size="small" @click="startPrintRequest">
          In phiếu chỉ định
        </VueButton>
      </div>
    </div>
    <div class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th style="width: 32px"></th>
            <th>Phiếu</th>
            <!-- <th>BS thực hiện</th> -->
            <th>Kết quả</th>
            <th>Giá</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketRadiologyList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketRadiologyList" :key="tpItem.radiologyId">
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
                  :disabled="index === 0"
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
                  :disabled="index === ticketRadiologyList.length - 1"
                  @click="changeItemPosition(index, 1)"
                >
                  <IconSortDown style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-center">
              <VueTooltip v-if="tpItem.status === TicketRadiologyStatus.Pending">
                <template #trigger>
                  <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
                </template>
                <div>Chưa có kết quả</div>
              </VueTooltip>

              <VueTooltip v-else>
                <template #trigger>
                  <IconCheckSquare style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
                </template>
                <div>Đã hoàn thành</div>
              </VueTooltip>
            </td>
            <td>{{ tpItem.radiology?.name }}</td>
            <td style="max-width: 300px">
              <div class="flex items-center justify-between gap-2">
                <div
                  style="
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2; /* Số dòng tối đa */
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-clamp: 2;
                  "
                >
                  {{ tpItem.result }}
                </div>
                <a v-if="tpItem.startedAt != null" @click="startPrintResult(tpItem)">
                  <IconPrint width="18px" height="18px" />
                </a>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpItem.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpItem.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpItem.actualPrice) }}</div>
            </td>
            <td class="text-center">
              <a v-if="!tpItem.id">
                <IconSpin width="20" height="20" />
              </a>
              <a
                v-else-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status) &&
                  userPermission[PermissionId.RADIOLOGY_UPDATE_RESULT]
                "
                class="text-orange-500"
                @click="modalTicketRadiologyResult?.openModal(tpItem.id)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
              <a v-else @click="modalTicketRadiologyResult?.openModal(tpItem.id, { noEdit: true })">
                <IconEye width="22" height="22" />
              </a>
            </td>
            <td class="text-center">
              <a
                v-if="
                  tpItem.id &&
                  tpItem.status === TicketRadiologyStatus.Pending &&
                  userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY_LIST]
                "
                style="color: var(--text-red)"
              >
                <IconDelete width="22" height="22" @click="clickDestroy(tpItem.id)" />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(ticketRadiologyList.reduce((acc, item) => acc + item.actualPrice, 0))
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
  <div class="mt-4 flex justify-between">
    <div></div>
    <VueButton
      v-if="
        userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY_LIST] &&
        ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status) &&
        hasChangePriority
      "
      color="blue"
      icon="save"
      @click="savePriorityTicketRadiology"
    >
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
