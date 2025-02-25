<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { IconPrint, IconSpin } from '../../../../common/icon'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { LaboratoryKit, LaboratoryKitService } from '../../../../modules/laboratory-kit'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlService,
} from '../../../../modules/print-html'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicLaboratoryApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketLaboratory } from '../../../../modules/ticket-laboratory'
import { arrayToKeyValue, DDom } from '../../../../utils'
import ModalTicketLaboratoryResult from './ModalTicketLaboratoryResult.vue'
import TicketClinicLaboratorySelectItem from './TicketClinicLaboratorySelectItem.vue'

const modalTicketLaboratoryResult = ref<InstanceType<typeof ModalTicketLaboratoryResult>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

let laboratoryKitAll: LaboratoryKit[] = []
let laboratoryGroupMap: Record<string, LaboratoryGroup> = {}

const laboratoryMap = ref<Record<string, Laboratory>>({})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketLaboratoryList = ref<TicketLaboratory[]>([])

const ticketLaboratoryMapGroup = computed(() => {
  const map: Record<string, TicketLaboratory[]> = {}
  ticketLaboratoryList.value.forEach((i) => {
    const laboratory = laboratoryMap.value[i.laboratoryId]
    const laboratoryGroupId = laboratory?.laboratoryGroupId || 0
    if (!map[laboratoryGroupId]) map[laboratoryGroupId] = []
    map[laboratoryGroupId].push(i)
  })
  return map
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicLaboratory.vue:75 ~ onMounted ~ onMounted:')
  try {
    const promiseResult = await Promise.all([
      LaboratoryKitService.list({}),
      LaboratoryGroupService.list({}),
    ])
    laboratoryMap.value = await LaboratoryService.getMap()

    laboratoryKitAll = promiseResult[0]
    laboratoryKitAll.forEach((i) => {
      try {
        const laboratoryIdList: number[] = JSON.parse(i.laboratoryIds)
        i.laboratoryList = laboratoryIdList
          .map((i) => {
            const laboratory = laboratoryMap.value[i]
            return laboratory
          })
          .filter((i) => !!i)
      } catch (error) {
        i.laboratoryList = []
      }
    })
    laboratoryGroupMap = arrayToKeyValue(promiseResult[1], 'id')
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

watch(
  () => ticketClinicRef.value.ticketLaboratoryList!,
  (newValue: TicketLaboratory[]) => {
    ticketLaboratoryList.value = TicketLaboratory.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

const startPrint = async (
  ticketLaboratoryDataList: TicketLaboratory[],
  laboratoryGroup: LaboratoryGroup
) => {
  try {
    let printHtmlId = laboratoryGroup?.printHtmlId || 0
    let printHtml: PrintHtml | undefined
    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.laboratory
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      data: {
        ticketLaboratoryList: ticketLaboratoryDataList,
        laboratoryGroup,
      },
      masterData: { laboratoryMap: laboratoryMap.value },
      printHtml: printHtml!,
    })

    await DDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicLaboratory.vue:137 ~ startPrint ~ error:', error)
  }
}

const handleAddTicketLaboratoryList = async (ticketLaboratoryAddList: TicketLaboratory[]) => {
  try {
    ticketLaboratoryList.value = [...ticketLaboratoryList.value, ...ticketLaboratoryAddList]
    await TicketClinicLaboratoryApi.addTicketLaboratoryList({
      ticketId: ticketClinicRef.value.id,
      ticketLaboratoryList: ticketLaboratoryAddList,
    })
  } catch (error) {
    console.log('🚀: TicketClinicLaboratory.vue:148 ~ handleAddTicketLaboratoryList :', error)
  }
}

const destroyTicketLaboratory = async (ticketLaboratoryId: number) => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return ModalStore.alert({
      title: 'Không thể xóa xét nghiệm ?',
      content: [
        '- Phiếu khám đã đóng không thể xóa xét nghiệm',
        '- Nếu bắt buộc phải xóa xét nghiệm này, bạn cần mở lại phiếu khám',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa xét nghiệm ?',
    content: [
      '- Hệ thống sẽ xóa xét nghiệm này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketClinicLaboratoryApi.destroyTicketLaboratory({
          ticketId: ticketClinicRef.value.id,
          ticketLaboratoryId,
        })
      } catch (error) {
        console.log('🚀: TicketClinicLaboratory.vue:176 ~ destroyTicketLaboratory:', error)
      }
    },
  })
}
</script>
<template>
  <ModalTicketLaboratoryResult ref="modalTicketLaboratoryResult" />
  <TicketClinicLaboratorySelectItem @success="handleAddTicketLaboratoryList" />
  <div class="mt-4">
    <div>Danh sách các xét nghiệm</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th>Kết quả</th>
            <th>Tham chiếu</th>
            <th>Đơn vị</th>
            <th>Giá</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketLaboratoryList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="(tlGroup, groupId) in ticketLaboratoryMapGroup" :key="groupId">
            <tr>
              <td colspan="2" class="font-bold">
                <div class="flex items-center gap-2">
                  <span>{{ laboratoryGroupMap[groupId]?.name || 'Xét nghiệm' }}</span>
                  <a @click="startPrint(tlGroup, laboratoryGroupMap[groupId])">
                    <IconPrint width="18px" height="18px" />
                  </a>
                </div>
              </td>
              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(
                      ticketClinicRef.ticketStatus
                    ) && permissionIdMap[PermissionId.TICKET_LABORATORY_RESULT]
                  "
                  class="text-orange-500"
                  @click="modalTicketLaboratoryResult?.openModal(Number(groupId), tlGroup)">
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
              <td colspan="3"></td>
              <td class="text-center"></td>
            </tr>
            <template v-for="(tpItem, index) in tlGroup" :key="tpItem.id">
              <tr
                v-for="(laboratoryParent, i) in laboratoryMap[tpItem.laboratoryId]
                  ? [laboratoryMap[tpItem.laboratoryId]]
                  : []"
                :key="i"
                :style="tpItem.attentionParse[laboratoryParent.id] ? 'color: red' : ''">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td>
                  {{ laboratoryParent?.name }}
                </td>
                <td class="text-center">
                  <div>{{ tpItem.resultParse[laboratoryParent.id] }}</div>
                </td>
                <td class="text-center">
                  <span v-if="laboratoryParent?.valueType === LaboratoryValueType.Number">
                    {{ laboratoryParent?.lowValue }} -
                    {{ laboratoryParent?.highValue }}
                  </span>
                </td>
                <td class="text-center">
                  <span v-if="laboratoryParent?.valueType === LaboratoryValueType.Number">
                    {{ laboratoryParent?.unit }}
                  </span>
                </td>
                <td class="text-right">{{ formatMoney(tpItem.expectedPrice) }}</td>
                <td class="text-center">
                  <a v-if="!tpItem.id">
                    <IconSpin width="16" height="16" />
                  </a>
                  <a
                    v-else-if="
                      permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_LABORATORY_LIST]
                    "
                    class="text-red-500"
                    @click="destroyTicketLaboratory(tpItem.id)">
                    <IconDelete width="20" height="20" />
                  </a>
                </td>
              </tr>
              <tr
                v-for="(laboratoryItem, i) in laboratoryMap[tpItem.laboratoryId]?.children || []"
                :key="i"
                :style="tpItem.attentionParse[laboratoryItem.id] ? 'color: red' : ''">
                <td></td>
                <td>{{ laboratoryItem?.name }}</td>
                <td class="text-center">
                  <div>{{ tpItem?.resultParse[laboratoryItem.id] }}</div>
                </td>
                <td class="text-center">
                  <span v-if="laboratoryItem?.valueType === LaboratoryValueType.Number">
                    {{ laboratoryItem?.lowValue }} -
                    {{ laboratoryItem?.highValue }}
                  </span>
                </td>
                <td class="text-center">
                  {{ laboratoryItem?.unit }}
                </td>
                <td class="text-right"></td>
                <td class="text-center"></td>
              </tr>
            </template>
          </template>

          <tr>
            <td colspan="5" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketLaboratoryList.reduce((acc: number, item) => {
                      return acc + item.expectedPrice
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
  <div class="mt-4 flex justify-between">
    <div></div>
  </div>
</template>
<style lang="scss" scope></style>
