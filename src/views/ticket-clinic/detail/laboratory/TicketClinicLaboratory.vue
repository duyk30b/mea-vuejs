<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { IconCheckSquare, IconClockCircle, IconPrint, IconSpin } from '../../../../common/icon-antd'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import VueTooltip from '../../../../common/popover/VueTooltip.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputDate, InputText } from '../../../../common/vue-form'
import VueButton from '../../../../common/VueButton.vue'
import { CONFIG } from '../../../../config'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DiscountType } from '../../../../modules/enum'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { LaboratoryKit, LaboratoryKitService } from '../../../../modules/laboratory-kit'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  compiledTemplatePrintHtml,
  PrintHtml,
  PrintHtmlService,
} from '../../../../modules/print-html'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicLaboratoryApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketLaboratory, TicketLaboratoryStatus } from '../../../../modules/ticket-laboratory'
import { TicketLaboratoryGroup } from '../../../../modules/ticket-laboratory-group'
import { DString, ESArray, ESDom } from '../../../../utils'
import ModalTicketLaboratoryResult from './ModalTicketLaboratoryResult.vue'
import ModalTicketLaboratoryUpdateMoney from './ModalTicketLaboratoryUpdateMoney.vue'
import { MeService } from '../../../../modules/_me/me.service'

const modalTicketLaboratoryUpdateMoney =
  ref<InstanceType<typeof ModalTicketLaboratoryUpdateMoney>>()
const modalTicketLaboratoryResult = ref<InstanceType<typeof ModalTicketLaboratoryResult>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore
const settingStore = useSettingStore()
const { formatMoney } = settingStore

let laboratoryAll: Laboratory[] = []
let laboratoryKitAll: LaboratoryKit[] = []
const laboratoryGroupAll = ref<LaboratoryGroup[]>([])

const laboratoryOptions = ref<{ laboratoryGroup: LaboratoryGroup; laboratoryList: Laboratory[] }[]>(
  [],
)
const laboratorySelects = ref<Record<string, Laboratory[]>>({})
const laboratoryKitOptions = ref<LaboratoryKit[]>([])

const laboratoryIdCheckbox = ref<Record<string, boolean>>({})
const laboratoryKitIdCheckbox = ref<Record<string, { checked: boolean; indeterminate: boolean }>>(
  {},
)
const registeredAt = ref<number | null>(null)

const laboratoryMap = ref<Record<string, Laboratory>>({})
const laboratoryGroupMap = ref<Record<string, LaboratoryGroup>>({})

const searchText = ref('')
const tlgEdit = ref<TicketLaboratoryGroup>(TicketLaboratoryGroup.blank())

const startFilterLaboratory = (text: string) => {
  const laboratoryFilter = laboratoryAll.filter((l) => {
    if (l.level !== 1) return false
    if (!DString.customFilter(l.name, text, 2)) return false
    return true
  })
  const laboratoryKeyArray = ESArray.arrayToKeyArray(laboratoryFilter, 'laboratoryGroupId')
  laboratoryOptions.value = Object.keys(laboratoryKeyArray).map((lgId) => {
    let laboratoryGroup = laboratoryGroupMap.value[lgId]
    if (!laboratoryGroup) {
      if (Number(lgId) === 0) {
        laboratoryGroup = LaboratoryGroup.blank()
        laboratoryGroup.name = 'Chưa phân nhóm phiếu'
      } else {
        laboratoryGroup = LaboratoryGroup.blank()
        laboratoryGroup.id = Number(lgId)
        laboratoryGroup.name = `(ID${lgId}) Nhóm bị xóa`
      }
    }
    return {
      laboratoryGroup: laboratoryGroup,
      laboratoryList: laboratoryKeyArray[lgId],
    }
  })

  laboratoryKitOptions.value = laboratoryKitAll.filter((l) => {
    return DString.customFilter(l.name, text, 2)
  })
}

onMounted(async () => {
  try {
    const promiseResult = await Promise.all([
      LaboratoryService.list({ sort: { priority: 'ASC' } }),
      LaboratoryGroupService.list({}),
      LaboratoryKitService.list({}),
    ])
    await ticketClinicRef.value.refreshLaboratory()
    laboratoryAll = promiseResult[0]
    laboratoryGroupMap.value = await LaboratoryGroupService.getMap()

    laboratoryGroupAll.value = promiseResult[1]
    laboratoryGroupAll.value.forEach((g) => {
      laboratoryOptions.value = []
      laboratorySelects.value[g.id] = []
    })

    laboratoryMap.value = await LaboratoryService.getFlatMap()

    laboratoryKitAll = promiseResult[2]
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

    startFilterLaboratory('')
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const startPrint = async (ticketLaboratoryGroup: TicketLaboratoryGroup) => {
  try {
    let printHtmlId = ticketLaboratoryGroup.laboratoryGroup?.printHtmlId || 0
    const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
    const printHtmlLaboratory = await PrintHtmlService.getPrintHtmlLaboratory(printHtmlId)

    if (!printHtmlHeader || !printHtmlLaboratory || !printHtmlLaboratory.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const compiledHeader = compiledTemplatePrintHtml({
      organization,
      ticket: ticketClinicRef.value,
      data: {
        ticketLaboratoryGroup,
      },
      printHtml: printHtmlHeader,
    })
    const compiledContent = compiledTemplatePrintHtml({
      organization,
      ticket: ticketClinicRef.value,
      data: {
        ticketLaboratoryGroup,
      },
      printHtml: printHtmlLaboratory,
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
    console.log('🚀 ~ file: TicketClinicLaboratory.vue:137 ~ startPrint ~ error:', error)
  }
}

const reloadIndeterminateCheckbox = () => {
  laboratoryKitOptions.value.forEach((laboratoryKit) => {
    if (!laboratoryKit.laboratoryList) {
      laboratoryKit.laboratoryList = []
    }
    if (!laboratoryKitIdCheckbox.value[laboratoryKit.id]) {
      laboratoryKitIdCheckbox.value[laboratoryKit.id] = {
        checked: false,
        indeterminate: false,
      }
    }

    const checkedAll = laboratoryKit.laboratoryList.every((i) => {
      return laboratoryIdCheckbox.value[i.id]
    })
    const noCheckedAll = laboratoryKit.laboratoryList.every((i) => {
      return !laboratoryIdCheckbox.value[i.id]
    })
    if (checkedAll) {
      laboratoryKitIdCheckbox.value[laboratoryKit.id].checked = true
      laboratoryKitIdCheckbox.value[laboratoryKit.id].indeterminate = false
    } else if (noCheckedAll) {
      laboratoryKitIdCheckbox.value[laboratoryKit.id].checked = false
      laboratoryKitIdCheckbox.value[laboratoryKit.id].indeterminate = false
    } else {
      laboratoryKitIdCheckbox.value[laboratoryKit.id].checked = false
      laboratoryKitIdCheckbox.value[laboratoryKit.id].indeterminate = true
    }
  })
}

const reloadCheckboxLaboratory = async (checked: boolean, laboratory: Laboratory) => {
  laboratoryIdCheckbox.value[laboratory.id] = checked

  if (!laboratorySelects.value[laboratory.laboratoryGroupId]) {
    laboratorySelects.value[laboratory.laboratoryGroupId] = []
  }
  const indexExisted = laboratorySelects.value[laboratory.laboratoryGroupId].findIndex((i) => {
    return i.id === laboratory.id
  })

  if (checked && indexExisted === -1) {
    laboratorySelects.value[laboratory.laboratoryGroupId].push(laboratory)
    laboratorySelects.value[laboratory.laboratoryGroupId].sort((a, b) => {
      return (a?.priority || 0) < (b?.priority || 0) ? -1 : 1
    })
  }
  if (!checked && indexExisted !== -1) {
    laboratorySelects.value[laboratory.laboratoryGroupId].splice(indexExisted, 1)
  }
}

const handleChangeCheckboxLaboratory = async (checked: boolean, laboratory: Laboratory) => {
  registeredAt.value = Date.now()
  reloadCheckboxLaboratory(checked, laboratory)
  reloadIndeterminateCheckbox()
}

const handleChangeCheckboxLaboratoryKit = async (
  checked: boolean,
  laboratoryKit: LaboratoryKit,
) => {
  registeredAt.value = Date.now()
  laboratoryKit.laboratoryList?.forEach((laboratory) => {
    handleChangeCheckboxLaboratory(checked, laboratory)
  })

  if (!laboratoryKitIdCheckbox.value[laboratoryKit.id]) {
    laboratoryKitIdCheckbox.value[laboratoryKit.id] = {
      checked: false,
      indeterminate: false,
    }
  }
  laboratoryKitIdCheckbox.value[laboratoryKit.id].checked = checked
  laboratoryKitIdCheckbox.value[laboratoryKit.id].indeterminate = false
}

const disabledButtonSaveLaboratorySelect = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.status)) {
    return true
  }

  let hasLaboratory = false
  Object.values(laboratorySelects.value).forEach((i) => {
    if (i.length) {
      hasLaboratory = true
    }
  })
  return !hasLaboratory
})

const clear = () => {
  tlgEdit.value = TicketLaboratoryGroup.blank()
  laboratorySelects.value = {}
  laboratoryIdCheckbox.value = {}
  laboratoryKitIdCheckbox.value = {}
  registeredAt.value = null
}

const saveLaboratorySelected = async () => {
  try {
    await TicketClinicLaboratoryApi.upsertLaboratory({
      ticketId: ticketClinicRef.value.id,
      ticketLaboratoryGroupAddList: Object.keys(laboratorySelects.value)
        .filter((key) => {
          if (laboratorySelects.value[key].length == 0) return false
          if (tlgEdit.value.id && tlgEdit.value.laboratoryGroupId == Number(key)) {
            return false
          }
          return true
        })
        .flat()
        .map((i) => {
          return {
            laboratoryGroupId: Number(i),
            registeredAt: registeredAt.value,
            ticketLaboratoryList: laboratorySelects.value[i].map((i, index) => {
              const ins = TicketLaboratory.blank()
              ins.priority = index + 1
              ins.laboratoryId = i.id
              ins.laboratoryGroupId = i.laboratoryGroupId
              ins.costPrice = i.costPrice
              ins.expectedPrice = i.price
              ins.discountMoney = 0
              ins.discountPercent = 0
              ins.discountType = DiscountType.VND
              ins.actualPrice = i.price
              return ins
            }),
          }
        }),
      ticketLaboratoryGroupUpdate: tlgEdit.value.id
        ? {
            id: tlgEdit.value.id,
            registeredAt: registeredAt.value,
            laboratoryGroupId: tlgEdit.value.laboratoryGroupId,
            ticketLaboratoryList: laboratorySelects.value[tlgEdit.value.laboratoryGroupId].map(
              (i, index) => {
                const ins = TicketLaboratory.blank()
                ins.priority = index + 1
                ins.laboratoryId = i.id
                ins.laboratoryGroupId = i.laboratoryGroupId
                ins.costPrice = i.costPrice
                ins.expectedPrice = i.price
                ins.discountMoney = 0
                ins.discountPercent = 0
                ins.discountType = DiscountType.VND
                ins.actualPrice = i.price
                return ins
              },
            ),
          }
        : undefined,
    })
    clear()
  } catch (error) {
    console.log('🚀: TicketClinicLaboratory.vue:148 ~ handleAddTicketLaboratoryList :', error)
  }
}

const clickChangeLaboratoryGroup = (tlgEditId: number) => {
  const tlgFind = ticketClinicRef.value.ticketLaboratoryGroupList?.find((i) => i.id === tlgEditId)
  if (!tlgFind) return

  tlgEdit.value = tlgFind

  registeredAt.value = tlgFind.registeredAt
  const ticketLaboratoryList = (tlgFind.ticketLaboratoryList || []).map((tl) => {
    return tl.laboratory || Laboratory.blank()
  })

  laboratorySelects.value = { [tlgFind.laboratoryGroupId]: ticketLaboratoryList }

  laboratoryIdCheckbox.value = {}
  laboratoryKitIdCheckbox.value = {}
  ticketLaboratoryList.forEach((i) => {
    laboratoryIdCheckbox.value[i.id] = true
  })
  reloadIndeterminateCheckbox()
}
</script>
<template>
  <ModalTicketLaboratoryResult ref="modalTicketLaboratoryResult" />
  <ModalTicketLaboratoryUpdateMoney ref="modalTicketLaboratoryUpdateMoney" />
  <div class="mt-4 flex flex-wrap gap-4">
    <div
      style="
        flex-basis: 300px;
        flex-grow: 1;
        max-width: 100%;
        border-right: 1px solid #eee;
        max-height: 500px;
      "
      class="flex flex-col"
    >
      <div class="flex-0">
        <InputText
          v-model:value="searchText"
          prepend="🔎"
          placeholder="Tìm kiếm theo tên xét nghiệm"
          @update:value="startFilterLaboratory"
        />
      </div>
      <div class="table-wrapper flex-1" style="overflow-y: scroll">
        <table>
          <tbody>
            <template v-for="laboratoryKit in laboratoryKitOptions" :key="laboratoryKit.id">
              <tr>
                <td>
                  <input
                    type="checkbox"
                    :checked="!!laboratoryKitIdCheckbox[laboratoryKit.id]?.checked"
                    :indeterminate="!!laboratoryKitIdCheckbox[laboratoryKit.id]?.indeterminate"
                    style="cursor: pointer"
                    @change="
                      (e) =>
                        handleChangeCheckboxLaboratoryKit(
                          (e.target as HTMLInputElement).checked,
                          laboratoryKit,
                        )
                    "
                  />
                </td>
                <td
                  colspan="2"
                  style="user-select: none; cursor: pointer"
                  class="font-bold"
                  @click="
                    handleChangeCheckboxLaboratoryKit(
                      !laboratoryKitIdCheckbox[laboratoryKit.id]?.checked,
                      laboratoryKit,
                    )
                  "
                >
                  {{ laboratoryKit.name }}
                </td>
              </tr>
              <tr
                v-for="laboratory in laboratoryKit.laboratoryList || []"
                :key="laboratory.id"
                style=""
              >
                <td style="user-select: none">
                  <input
                    type="checkbox"
                    :checked="!!laboratoryIdCheckbox[laboratory.id]"
                    style="cursor: pointer"
                    @change="
                      (e) =>
                        handleChangeCheckboxLaboratory(
                          (e.target as HTMLInputElement).checked,
                          laboratory,
                        )
                    "
                  />
                </td>
                <td
                  style="user-select: none; cursor: pointer"
                  @click="
                    handleChangeCheckboxLaboratory(!laboratoryIdCheckbox[laboratory.id], laboratory)
                  "
                >
                  {{ laboratory.name }}
                </td>
                <td class="text-right">{{ formatMoney(laboratory.price) }}</td>
              </tr>
            </template>
            <template v-for="(lo, i) in laboratoryOptions" :key="i">
              <tr>
                <td colspan="3" class="font-bold">
                  <span>{{ lo.laboratoryGroup.name }}</span>
                </td>
              </tr>
              <tr v-for="laboratory in lo.laboratoryList" :key="laboratory.id" style="">
                <td style="user-select: none">
                  <input
                    type="checkbox"
                    :checked="!!laboratoryIdCheckbox[laboratory.id]"
                    style="cursor: pointer"
                    @change="
                      (e) =>
                        handleChangeCheckboxLaboratory(
                          (e.target as HTMLInputElement).checked,
                          laboratory,
                        )
                    "
                  />
                </td>
                <td
                  style="user-select: none; cursor: pointer"
                  @click="
                    handleChangeCheckboxLaboratory(!laboratoryIdCheckbox[laboratory.id], laboratory)
                  "
                >
                  {{ laboratory.name }}
                </td>
                <td class="text-right">{{ formatMoney(laboratory.price) }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <div
      style="flex-basis: 300px; flex-grow: 5; max-width: 100%; max-height: 500px"
      class="flex flex-col"
    >
      <div
        class="table-wrapper flex-1"
        style="overflow-y: scroll; border-bottom: 1px solid #eee; border-left: 1px solid #eee"
      >
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tên xét nghiệm</th>
              <th>Giá tiền</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(laboratoryList, key) in laboratorySelects" :key="key">
              <template v-if="laboratoryList.length">
                <tr>
                  <td colspan="4" class="font-bold">
                    <span v-if="laboratoryGroupMap[key]">{{ laboratoryGroupMap[key]?.name }}</span>
                    <span v-else-if="Number(key) === 0">Chưa phân nhóm phiếu</span>
                    <span v-else>(ID{{ key }}) Nhóm bị xóa</span>
                  </td>
                </tr>
                <tr v-for="(laboratory, j) in laboratoryList" :key="j">
                  <td class="text-center">{{ j + 1 }}</td>
                  <td>{{ laboratory?.name }}</td>
                  <td class="text-right">
                    {{ formatMoney(laboratory?.price) }}
                  </td>
                  <td class="text-center">
                    <a
                      class="text-red-500"
                      @click="handleChangeCheckboxLaboratory(false, laboratory!)"
                    >
                      <IconDelete width="20" height="20" />
                    </a>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex-0">
        <div>Thời gian chỉ định</div>
        <div><InputDate v-model:value="registeredAt" show-time /></div>
      </div>
      <div class="mt-4 flex justify-center flex-0 gap-4">
        <VueButton v-if="tlgEdit.id" @click="clear">Hủy bỏ</VueButton>
        <VueButton
          color="blue"
          :disabled="disabledButtonSaveLaboratorySelect"
          @click="saveLaboratorySelected"
        >
          <span v-if="tlgEdit.id">Cập nhật chỉ định xét nghiệm</span>
          <span v-else>Tạo chỉ định xét nghiệm mới</span>
        </VueButton>
      </div>
    </div>
  </div>
  <div class="mt-8">
    <div class="italic">Danh sách các phiếu xét nghiệm đã chỉ định</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th style="width: 32px"></th>
            <th>Tên</th>
            <th>Kết quả</th>
            <th>Tham chiếu</th>
            <th>Đơn vị</th>
            <th>Giá</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketClinicRef.ticketLaboratoryGroupList!.length === 0">
            <td colspan="20" class="text-center">Chưa có phiếu xét nghiệm nào</td>
          </tr>
          <template v-for="tlg in ticketClinicRef.ticketLaboratoryGroupList" :key="tlg.id">
            <tr>
              <td colspan="3" class="">
                <div class="flex items-center gap-2">
                  <span class="font-bold">{{ tlg.laboratoryGroup?.name }}</span>
                  <a @click="startPrint(tlg)">
                    <IconPrint width="18px" height="18px" />
                  </a>
                  <span
                    v-if="tlgEdit.id !== 0 && tlg.id === tlgEdit.id"
                    style="color: var(--text-red); font-style: italic"
                  >
                    (Đang sửa)
                  </span>
                </div>
              </td>
              <td colspan="5">
                <div class="flex justify-end items-center gap-4">
                  <VueButton
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(
                        ticketClinicRef.status,
                      ) && permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_LABORATORY_LIST]
                    "
                    size="small"
                    @click="clickChangeLaboratoryGroup(tlg.id)"
                  >
                    Sửa chỉ định
                  </VueButton>
                  <VueButton
                    v-if="permissionIdMap[PermissionId.TICKET_LABORATORY_RESULT]"
                    size="small"
                    @click="modalTicketLaboratoryResult?.openModal(tlg.id)"
                  >
                    Trả kết quả
                  </VueButton>
                </div>
              </td>
            </tr>
            <template v-for="(tlItem, index) in tlg.ticketLaboratoryList || []" :key="tlItem.id">
              <tr :style="tlItem?.ticketLaboratoryResult?.attention ? 'color: red' : ''">
                <td class="text-center">
                  <span>{{ index + 1 }}</span>
                  <span v-if="CONFIG.MODE === 'development'">- {{ tlItem.id }}</span>
                </td>
                <td class="text-center">
                  <VueTooltip v-if="tlItem.status === TicketLaboratoryStatus.Pending">
                    <template #trigger>
                      <IconClockCircle
                        style="font-size: 18px; color: orange; cursor: not-allowed"
                      />
                    </template>
                    <div>Chưa có kết quả</div>
                  </VueTooltip>

                  <VueTooltip v-else>
                    <template #trigger>
                      <IconCheckSquare
                        style="color: #52c41a; font-size: 18px; cursor: not-allowed"
                      />
                    </template>
                    <div>Đã hoàn thành</div>
                  </VueTooltip>
                </td>
                <td>{{ tlItem.laboratory?.name }}</td>
                <td class="text-center">
                  <div>{{ tlItem?.ticketLaboratoryResult?.result }}</div>
                </td>
                <td class="text-center">
                  <span v-if="tlItem.laboratory?.valueType === LaboratoryValueType.Number">
                    {{ tlItem.laboratory?.lowValue }} -
                    {{ tlItem.laboratory?.highValue }}
                  </span>
                </td>
                <td class="text-center">
                  <span v-if="tlItem.laboratory?.valueType === LaboratoryValueType.Number">
                    {{ tlItem.laboratory?.unit }}
                  </span>
                </td>
                <td class="text-right whitespace-nowrap">
                  <div v-if="tlItem.discountMoney" class="text-xs italic text-red-500">
                    <del>{{ formatMoney(tlItem.expectedPrice) }}</del>
                  </div>
                  <div>{{ formatMoney(tlItem.actualPrice) }}</div>
                </td>
                <td class="text-center">
                  <a v-if="!tlItem.id">
                    <IconSpin width="20" height="20" />
                  </a>
                  <a
                    v-else-if="
                      permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_LABORATORY_LIST]
                    "
                    class="text-orange-500"
                    @click="modalTicketLaboratoryUpdateMoney?.openModal(tlItem)"
                  >
                    <IconEditSquare width="20" height="20" />
                  </a>
                </td>
              </tr>
              <tr
                v-for="(tlChild, i) in tlItem.children"
                :key="i"
                :style="tlChild.ticketLaboratoryResult?.attention ? 'color: red' : ''"
              >
                <td></td>
                <td></td>
                <td>{{ tlChild.laboratory?.name }}</td>
                <td class="text-center">
                  <div>{{ tlChild.ticketLaboratoryResult?.result }}</div>
                </td>
                <td class="text-center">
                  <span v-if="tlChild.laboratory?.valueType === LaboratoryValueType.Number">
                    {{ tlChild.laboratory?.lowValue }} -
                    {{ tlChild.laboratory?.highValue }}
                  </span>
                </td>
                <td class="text-center">{{ tlChild.laboratory?.unit }}</td>
                <td class="text-right"></td>
                <td class="text-center"></td>
              </tr>
            </template>
          </template>

          <tr>
            <td colspan="6" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{ formatMoney(ticketClinicRef.laboratoryMoney) }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<style lang="scss" scope></style>
