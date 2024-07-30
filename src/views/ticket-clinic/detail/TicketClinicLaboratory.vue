<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconPrint } from '../../../common/icon'
import { IconDelete, IconEditSquare } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../modules/laboratory-group'
import { LaboratoryKit, LaboratoryKitService } from '../../../modules/laboratory-kit'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtml, printHtmlCompiledTemplate, PrintHtmlService } from '../../../modules/print-html'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketLaboratory } from '../../../modules/ticket-laboratory'
import { arrayToKeyValue, DDom, DString } from '../../../utils'
import ModalTicketLaboratoryResult from './modal/ModalTicketLaboratoryResult.vue'

const modalTicketLaboratoryResult = ref<InstanceType<typeof ModalTicketLaboratoryResult>>()
const inputSearchLaboratory = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

let laboratoryAll: Laboratory[] = []

let laboratoryKitAll: LaboratoryKit[] = []
let laboratoryGroupMap: Record<string, LaboratoryGroup> = {}

const laboratoryMap = ref<Record<string, Laboratory>>({})

const laboratoryOptions = ref<
  {
    value: number
    text: string
    data: {
      type: 'laboratory' | 'laboratoryKit'
      laboratory?: Laboratory
      laboratoryKit?: LaboratoryKit
    }
  }[]
>([])
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketLaboratoryList = ref<TicketLaboratory[]>([])

const ticketLaboratoryMapGroup = computed(() => {
  const map: Record<string, TicketLaboratory[]> = {}
  ticketLaboratoryList.value.forEach((i) => {
    const laboratory = laboratoryMap.value[i.laboratoryId]
    const laboratoryGroupId = laboratory?.laboratoryGroupId || 0
    if (!map[laboratoryGroupId]) {
      map[laboratoryGroupId] = []
    }
    try {
      i.resultParse = JSON.parse(i.result)
    } catch (error) {
      i.resultParse = {}
    }
    try {
      i.attentionParse = JSON.parse(i.attention)
    } catch (error) {
      i.attentionParse = {}
    }
    map[laboratoryGroupId].push(i)
  })
  return map
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicLaboratory.vue:75 ~ onMounted ~ onMounted:')
  try {
    const promiseResult = await Promise.all([
      LaboratoryService.list({}),
      LaboratoryKitService.list({}),
      LaboratoryGroupService.list({}),
    ])
    laboratoryAll = promiseResult[0]
    laboratoryMap.value = await LaboratoryService.getMap()

    laboratoryKitAll = promiseResult[1]
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
    laboratoryGroupMap = arrayToKeyValue(promiseResult[2], 'id')
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

const disabledButton = computed(() => {
  return (
    TicketLaboratory.equalList(
      ticketLaboratoryList.value,
      ticketClinicRef.value.ticketLaboratoryList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)
  )
})

const searchingLaboratory = async (text: string) => {
  const laboratoryList: Laboratory[] = laboratoryAll.filter((i) => {
    return DString.customFilter(i.name, text)
  })
  const laboratoryKitList: LaboratoryKit[] = laboratoryKitAll.filter((i) => {
    return DString.customFilter(i.name, text)
  })
  laboratoryOptions.value = [
    ...laboratoryKitList.map((i) => ({
      value: i.id,
      text: i.name,
      data: { type: 'laboratoryKit' as any, laboratoryKit: i },
    })),
    ...laboratoryList.map((i) => ({
      value: i.id,
      text: i.name,
      data: { type: 'laboratory' as any, laboratory: i },
    })),
  ]
}

const selectLaboratory = (laboratorySelect: Laboratory) => {
  const ticketLaboratory = TicketLaboratory.blank()
  ticketLaboratory.ticketId = ticketClinicRef.value.id
  ticketLaboratory.customerId = ticketClinicRef.value.customerId
  ticketLaboratory.laboratoryId = laboratorySelect.id

  ticketLaboratory.expectedPrice = laboratorySelect.price
  ticketLaboratory.discountMoney = 0
  ticketLaboratory.discountPercent = 0
  ticketLaboratory.discountType = DiscountType.VND
  ticketLaboratory.actualPrice = laboratorySelect.price

  ticketLaboratoryList.value.push(ticketLaboratory)
}

const selectItemOptions = (dataSelected?: {
  type: 'laboratory' | 'laboratoryKit'
  laboratory: Laboratory
  laboratoryKit: LaboratoryKit
}) => {
  if (!dataSelected) return
  if (dataSelected.type === 'laboratory') {
    selectLaboratory(dataSelected.laboratory)
  }
  if (dataSelected.type === 'laboratoryKit') {
    ;(dataSelected.laboratoryKit.laboratoryList || []).forEach((i) => selectLaboratory(i))
  }
}

const removeTicketLaboratory = (ins: TicketLaboratory) => {
  ticketLaboratoryList.value = ticketLaboratoryList.value.filter((i) => {
    return !(i.id === ins.id && i.laboratoryId === ins.laboratoryId)
  })
}

const saveTicketLaboratoryList = async () => {
  await TicketClinicApi.updateTicketLaboratoryList({
    ticketId: ticketClinicRef.value.id,
    customerId: ticketClinicRef.value.customerId || 0,
    ticketLaboratoryList: ticketLaboratoryList.value.filter((i) => i.startedAt == null),
  })
}

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
    console.log('🚀 ~ file: TicketClinicLaboratory.vue:154 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketLaboratoryResult ref="modalTicketLaboratoryResult" />
  <div class="mt-4 flex justify-between">
    <span>Chỉ định xét nghiệm</span>
    <span></span>
  </div>
  <div style="height: 40px">
    <InputOptions
      ref="inputSearchLaboratory"
      :options="laboratoryOptions"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)"
      @selectItem="({ data }) => selectItemOptions(data)"
      @update:text="searchingLaboratory">
      <template #option="{ item: { data } }">
        <div v-if="data.type === 'laboratory'">
          <b>{{ data.laboratory.name }}</b>
          - {{ formatMoney(data.laboratory.price) }}
        </div>
        <div v-if="data.type === 'laboratoryKit'">
          <b>-- {{ data.laboratoryKit.name }}</b>
          <div style="font-size: 13px; font-style: italic">
            {{ data.laboratoryKit.laboratoryList.map((i: Laboratory) => i.name).join(', ') }}
          </div>
        </div>
      </template>
    </InputOptions>
  </div>
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
            <template v-for="(ticketLaboratory, index) in tlGroup" :key="ticketLaboratory.id">
              <tr
                v-for="(laboratoryParent, i) in laboratoryMap[ticketLaboratory.laboratoryId]
                  ? [laboratoryMap[ticketLaboratory.laboratoryId]]
                  : []"
                :key="i"
                :style="ticketLaboratory.attentionParse[laboratoryParent.id] ? 'color: red' : ''">
                <td class="text-center">
                  {{ index + 1 }}
                </td>
                <td>
                  {{ laboratoryParent?.name }}
                </td>
                <td class="text-center">
                  <div>{{ ticketLaboratory.resultParse[laboratoryParent.id] }}</div>
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
                <td class="text-right">{{ formatMoney(ticketLaboratory.expectedPrice) }}</td>
                <td class="text-center">
                  <a
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(
                        ticketClinicRef.ticketStatus
                      ) && ticketLaboratory.startedAt == null
                    "
                    class="text-red-500"
                    @click="removeTicketLaboratory(ticketLaboratory)">
                    <IconDelete width="20" height="20" />
                  </a>
                </td>
              </tr>
              <tr
                v-for="(laboratoryItem, i) in laboratoryMap[ticketLaboratory.laboratoryId]
                  ?.children || []"
                :key="i"
                :style="ticketLaboratory.attentionParse[laboratoryItem.id] ? 'color: red' : ''">
                <td></td>
                <td>{{ laboratoryItem?.name }}</td>
                <td class="text-center">
                  <div>{{ ticketLaboratory?.resultParse[laboratoryItem.id] }}</div>
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
                    ticketLaboratoryList.reduce((acc, item) => acc + item.expectedPrice, 0)
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
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY_LIST]"
      color="blue"
      :disabled="disabledButton"
      icon="save"
      @click="saveTicketLaboratoryList">
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
