<script lang="ts" setup>
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import { IconBug, IconEye, IconFileSearch, IconPrint, IconSpin } from '@/common/icon-antd'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { VueTooltip } from '@/common/popover'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeRadiologyApi, TicketStatus } from '@/modules/ticket'
import {
  TicketRadiology,
  TicketRadiologyService,
  TicketRadiologyStatus,
} from '@/modules/ticket-radiology'
import IndexAndSort from '@/views/component/IndexAndSort.vue'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalRadiologyDetail from '@/views/master-data/radiology/detail/ModalRadiologyDetail.vue'
import ModalTicketRadiologyResult from '@/views/room/room-radiology/ModalTicketRadiologyResult.vue'
import TicketRadiologyStatusTooltip from '@/views/room/room-radiology/TicketRadiologyStatusTooltip.vue'
import { computed, onMounted, ref, watch } from 'vue'
import ModalTicketRadiologyUpdate from './ModalTicketRadiologyUpdate.vue'
import TicketRadiologySelectItem from './TicketRadiologySelectItem.vue'
import { TicketLaboratoryService } from '@/modules/ticket-laboratory'

const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalTicketRadiologyUpdate = ref<InstanceType<typeof ModalTicketRadiologyUpdate>>()
const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()

const { userPermission, organization } = MeService

const radiologyOptions = ref<{ value: number; text: string; data: Radiology }[]>([])

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketRadiologyList = ref<TicketRadiology[]>([])

watch(
  () => ticketRoomRef.value.ticketRadiologyList!,
  (newValue: TicketRadiology[]) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

const hasChangePriority = computed(() => {
  for (let index = 0; index < (ticketRoomRef.value.ticketRadiologyList || []).length; index++) {
    const tpRoot = ticketRoomRef.value.ticketRadiologyList![index]
    if (tpRoot.priority !== ticketRadiologyList.value[index].priority) {
      return true
    }
  }
  return false
})

onMounted(async () => {
  try {
    const radiologyAll = await RadiologyService.list({})
    await Promise.all([
      TicketRadiologyService.refreshRelation(ticketRoomRef.value.ticketRadiologyList),
    ])
    ticketRoomRef.value.refreshTicketRadiology()
    radiologyOptions.value = radiologyAll.map((i) => ({ value: i.id, text: i.name, data: i }))
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketRadiologyList.value[index]
  ticketRadiologyList.value[index] = ticketRadiologyList.value[index + count]
  ticketRadiologyList.value[index + count] = temp
}

const savePriorityTicketRadiology = async () => {
  try {
    await TicketChangeRadiologyApi.updatePriorityTicketRadiology({
      ticketId: ticketRoomRef.value.id,
      ticketRadiologyList: ticketRadiologyList.value,
    })
  } catch (error) {
    console.log('🚀 TicketClinicRadiology.vue:110 ~ savePriorityTicketRadiology ~ error:', error)
  }
}

const startPrintResult = async (ticketRadiologySelect: TicketRadiology) => {
  const ticketRadiologyData = TicketRadiology.from(ticketRadiologySelect)
  ticketRadiologyData.customer = ticketRoomRef.value.customer
  ticketRadiologyData.ticket = ticketRoomRef.value
  ticketRadiologyData.radiology = await RadiologyService.detail(ticketRadiologyData.radiologyId, {
    relation: { radiologyGroup: true },
  })

  await PrintHtmlAction.startPrintResultTicketRadiology({
    ticketRadiologyData,
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}

const handleAddTicketRadiologyList = (value: TicketRadiology[]) => {
  ticketRadiologyList.value = [...ticketRadiologyList.value, ...value]
}

const openModalResult = (data: { ticketRadiology: TicketRadiology; noEdit?: boolean }) => {
  data.ticketRadiology.customer = ticketRoomRef.value.customer
  data.ticketRadiology.ticket = ticketRoomRef.value
  modalTicketRadiologyResult.value?.openModalByData({
    ticketRadiology: data.ticketRadiology,
    noEdit: data.noEdit,
  })
}

const startPrintParaClinicalRequest = async () => {
  await ticketRoomRef.value.refreshRelation()
  await PrintHtmlAction.startPrintParaClinicalRequest({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}

const clickDestroyTicketRadiology = async (tp: TicketRadiology) => {
  if (
    [PaymentMoneyStatus.FullPaid, PaymentMoneyStatus.PartialPaid].includes(tp.paymentMoneyStatus)
  ) {
    return ModalStore.alert({
      title: 'Không thể xóa phiếu chỉ định CĐHA ?',
      content: ['- Phiếu CĐHA đã được thanh toán sẽ không thể xóa'],
    })
  }
  if (tp.status !== TicketRadiologyStatus.Pending) {
    return ModalStore.alert({
      title: `Không thể xóa phiếu : ${tp.radiology?.name}!`,
      content: ['- Phiếu CĐHA đã được thực hiện sẽ không thể xóa'],
    })
  }

  ModalStore.confirm({
    title: 'Xác nhận xóa CĐHA ?',
    content: [
      '- Hệ thống sẽ xóa CĐHA này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeRadiologyApi.destroyTicketRadiology({
          ticketId: tp.ticketId,
          ticketRadiologyId: tp.id,
        })
      } catch (error) {
        console.log('🚀 ~ TicketClinicRadiologyContainer.vue:155 ~ clickDestroy ~ error:', error)
      }
    },
  })
}
</script>
<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <ModalTicketRadiologyUpdate ref="modalTicketRadiologyUpdate" />
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
  <TicketRadiologySelectItem @addTicketRadiologyList="handleAddTicketRadiologyList" />

  <div class="mt-4">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các phiếu đã chỉ định</div>
      <VueButton icon="print" @click="startPrintParaClinicalRequest">
        In phiếu chỉ định CLS
      </VueButton>
    </div>
    <div class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th style="width: 40px"></th>
            <th style="width: 40px"></th>
            <th>Phiếu</th>
            <th>Kết quả</th>
            <th>Giá NY</th>
            <th>Đơn giá</th>
            <th v-if="CONFIG.MODE === 'development'">NV Chỉ định</th>
            <th v-if="CONFIG.MODE === 'development'">NV Kết quả</th>
            <th>In KQ</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketRadiologyList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tp, index) in ticketRadiologyList" :key="tp.radiologyId">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(tp, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td>
              <IndexAndSort
                :index="index + 1"
                :disabledUp="index === 0"
                :disabledDown="index === ticketRadiologyList.length - 1"
                @clickUp="changeItemPosition(index, -1)"
                @clickDown="changeItemPosition(index, 1)"
              />
            </td>
            <td><PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" /></td>
            <td class="text-center">
              <TicketRadiologyStatusTooltip :status="tp.status" />
            </td>
            <td>
              <div class="flex flex-wrap items-center gap-1">
                <span>{{ tp.radiology?.name }}</span>
                <a style="line-height: 0" @click="modalRadiologyDetail?.openModal(tp.radiologyId)">
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td style="max-width: 300px">
              <div v-if="tp.status === TicketRadiologyStatus.Completed" class="max-line-2">
                {{ tp.result }}
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div>{{ formatMoney(tp.expectedPrice) }}</div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div class="flex flex-wrap gap-2 items-center">
                <div>
                  <VueTag v-if="tp.discountMoney" color="green">
                    {{ tp.discountPercent + ' %' }}
                  </VueTag>
                </div>
                <div class="ml-auto">
                  <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                    <del>{{ formatMoney(tp.expectedPrice) }}</del>
                  </div>
                  <div>{{ formatMoney(tp.actualPrice) }}</div>
                </div>
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                      tp.paymentMoneyStatus,
                    ) &&
                    userPermission[PermissionId.TICKET_CHANGE_RADIOLOGY_REQUEST]
                  "
                  @click="modalTicketRadiologyUpdate?.openModal({ ticketRadiology: tp })"
                  style="color: var(--text-orange)"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </div>
            </td>
            <td v-if="CONFIG.MODE === 'development'" style="color: violet">
              <div v-for="tu in tp.ticketUserRequestList" :key="tu.id">
                <span>(P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})</span>
                <span>{{ tu.user?.fullName }}</span>
              </div>
            </td>
            <td v-if="CONFIG.MODE === 'development'" style="color: violet">
              <div v-for="tu in tp.ticketUserResultList" :key="tu.id">
                <span>(P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})</span>
                <span>{{ tu.user?.fullName }}</span>
              </div>
            </td>
            <td class="text-center">
              <a v-if="tp.status === TicketRadiologyStatus.Completed" @click="startPrintResult(tp)">
                <IconPrint width="18px" height="18px" />
              </a>
            </td>
            <template v-if="!tp.id">
              <td colspan="3" class="text-center">
                <IconSpin width="20" height="20" />
              </td>
            </template>
            <template v-else>
              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_RADIOLOGY_RESULT]
                  "
                  class="text-orange-500"
                  @click="openModalResult({ ticketRadiology: tp })"
                >
                  <IconEye width="20" height="20" />
                </a>
                <a v-else @click="openModalResult({ ticketRadiology: tp, noEdit: true })">
                  <IconEye width="20" height="20" />
                </a>
              </td>
              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    tp.status === TicketRadiologyStatus.Pending &&
                    [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                      tp.paymentMoneyStatus,
                    ) &&
                    userPermission[PermissionId.TICKET_CHANGE_RADIOLOGY_REQUEST]
                  "
                  style="color: var(--text-red)"
                  @click="clickDestroyTicketRadiology(tp)"
                >
                  <IconDelete width="22" height="22" />
                </a>
              </td>
            </template>
          </tr>
          <tr>
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center"></td>
            <td colspan="6" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(ticketRadiologyList.reduce((acc, item) => acc + item.actualPrice, 0))
                }}
              </b>
            </td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td></td>
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
        userPermission[PermissionId.TICKET_CHANGE_RADIOLOGY_REQUEST] &&
        ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
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
