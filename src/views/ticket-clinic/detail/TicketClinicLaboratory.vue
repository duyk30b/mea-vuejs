<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconPrint } from '../../../common/icon'
import { IconDelete, IconEditSquare, IconVisibility } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../modules/laboratory'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtml, printHtmlCompiledTemplate, PrintHtmlService } from '../../../modules/print-html'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketLaboratory } from '../../../modules/ticket-laboratory'
import { arrayToKeyValue, customFilter, DDom } from '../../../utils'
import ModalTicketLaboratoryResult from './modal/ModalTicketLaboratoryResult.vue'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../modules/laboratory-group'

const modalTicketLaboratoryResult = ref<InstanceType<typeof ModalTicketLaboratoryResult>>()
const inputSearchLaboratory = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const laboratoryAll = ref<Laboratory[]>([])
const laboratoryMap = ref<Record<string, Laboratory>>({})
let laboratoryGroupMap: Record<string, LaboratoryGroup> = {}

const laboratory = ref(Laboratory.blank())
const laboratoryList = ref<Laboratory[]>([])
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

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicLaboratory.vue:54 ~ onMounted ~ onMounted:')
  try {
    const promiseResult = await Promise.all([
      LaboratoryService.list({}),
      LaboratoryGroupService.list({}),
    ])
    laboratoryAll.value = promiseResult[0]
    laboratoryMap.value = await LaboratoryService.getMap()
    laboratoryGroupMap = arrayToKeyValue(promiseResult[1], 'id')
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingLaboratory = async (text: string) => {
  laboratoryList.value = laboratoryAll.value.filter((i) => customFilter(i.name, text))
}

const selectLaboratory = (instance?: Laboratory) => {
  if (instance) {
    const ticketLaboratory = TicketLaboratory.blank()
    ticketLaboratory.ticketId = ticketClinicRef.value.id
    ticketLaboratory.customerId = ticketClinicRef.value.customerId
    ticketLaboratory.laboratoryId = instance.id

    ticketLaboratory.expectedPrice = instance.price
    ticketLaboratory.discountMoney = 0
    ticketLaboratory.discountPercent = 0
    ticketLaboratory.discountType = DiscountType.VND
    ticketLaboratory.actualPrice = instance.price

    ticketLaboratoryList.value.push(ticketLaboratory)
  }
  laboratory.value = Laboratory.blank()
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
      :options="laboratoryList.map((i) => ({ value: i.id, text: i.name, data: i }))"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)"
      @selectItem="({ data }) => selectLaboratory(data)"
      @update:text="searchingLaboratory">
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
          - {{ formatMoney(data.price) }}
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
                  {{ laboratoryItem?.lowValue }} -
                  {{ laboratoryItem?.highValue }}
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
