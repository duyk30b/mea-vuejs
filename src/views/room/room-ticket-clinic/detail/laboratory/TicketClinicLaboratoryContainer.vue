<script lang="ts" setup>
import { IconBug, IconDollar, IconPrint, IconSpin } from '@/common/icon-antd'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputDate, InputText } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueButton from '@/common/VueButton.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '@/modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '@/modules/laboratory-group'
import { LaboratorySample, LaboratorySampleService } from '@/modules/laboratory-sample'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeLaboratoryApi, TicketStatus } from '@/modules/ticket'
import {
  TicketLaboratory,
  TicketLaboratoryGroup,
  TicketLaboratoryService,
  TicketLaboratoryStatus,
} from '@/modules/ticket-laboratory'
import { ESArray, ESString } from '@/utils'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalTicketLaboratoryResult from '@/views/room/room-laboratory/ModalTicketLaboratoryGroupResult.vue'
import TicketLaboratoryStatusTooltip from '@/views/room/room-laboratory/TicketLaboratoryStatusTooltip.vue'
import { computed, onMounted, ref } from 'vue'
import ModalTicketLaboratoryUpdateMoney from './ModalTicketLaboratoryUpdateMoney.vue'
import { VueTooltip } from '@/common/popover'
import { VueTag } from '@/common'

const modalTicketLaboratoryUpdateMoney =
  ref<InstanceType<typeof ModalTicketLaboratoryUpdateMoney>>()
const modalTicketLaboratoryResult = ref<InstanceType<typeof ModalTicketLaboratoryResult>>()

const { userPermission, organization } = MeService
const settingStore = useSettingStore()
const { formatMoney } = settingStore

let laboratorySampleAll: LaboratorySample[] = []

const laboratoryOptions = ref<{ laboratoryGroup: LaboratoryGroup; laboratoryList: Laboratory[] }[]>(
  [],
)
const laboratoryGroupSelects = ref<
  Record<string, { laboratoryList: Laboratory[]; laboratoryGroup: LaboratoryGroup }>
>({})
const laboratorySampleOptions = ref<LaboratorySample[]>([])

const laboratoryIdCheckbox = ref<Record<string, boolean>>({})
const laboratorySampleIdCheckbox = ref<
  Record<string, { checked: boolean; indeterminate: boolean }>
>({})
const createdAt = ref<number | null>(null)

const laboratoryMap = LaboratoryService.laboratoryMap
const laboratoryGroupAll = LaboratoryGroupService.laboratoryGroupAll
const laboratoryGroupMap = LaboratoryGroupService.laboratoryGroupMap

const searchText = ref('')
const tlgEdit = ref<TicketLaboratoryGroup>(TicketLaboratoryGroup.blank())

const startFilterLaboratory = (text: string) => {
  const laboratoryFilter = LaboratoryService.laboratoryTree.filter((l) => {
    if (!ESString.customFilter(l.name, text, 2)) return false
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

  laboratorySampleOptions.value = laboratorySampleAll.filter((l) => {
    return ESString.customFilter(l.name, text, 2)
  })
}

onMounted(async () => {
  try {
    const promiseResult = await Promise.all([
      LaboratorySampleService.list({}),
      LaboratoryGroupService.getMap(),
      LaboratoryService.getMap(),
      TicketLaboratoryService.refreshRelationGroup(ticketRoomRef.value.ticketLaboratoryGroupList),
      TicketLaboratoryService.refreshRelation(ticketRoomRef.value.ticketLaboratoryList),
      TicketLaboratoryService.refreshRelationResult(ticketRoomRef.value.ticketLaboratoryResultList),
    ])
    ticketRoomRef.value.refreshTicketLaboratory()

    laboratoryGroupAll.forEach((g) => {
      laboratoryOptions.value = []
      laboratoryGroupSelects.value[g.id] = {
        laboratoryGroup: g,
        laboratoryList: [],
      }
    })

    laboratorySampleAll = promiseResult[0]
    laboratorySampleAll.forEach((i) => {
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

const reloadIndeterminateCheckbox = () => {
  laboratorySampleOptions.value.forEach((laboratorySample) => {
    if (!laboratorySample.laboratoryList) {
      laboratorySample.laboratoryList = []
    }
    if (!laboratorySampleIdCheckbox.value[laboratorySample.id]) {
      laboratorySampleIdCheckbox.value[laboratorySample.id] = {
        checked: false,
        indeterminate: false,
      }
    }

    const checkedAll = laboratorySample.laboratoryList.every((i) => {
      return laboratoryIdCheckbox.value[i.id]
    })
    const noCheckedAll = laboratorySample.laboratoryList.every((i) => {
      return !laboratoryIdCheckbox.value[i.id]
    })
    if (checkedAll) {
      laboratorySampleIdCheckbox.value[laboratorySample.id].checked = true
      laboratorySampleIdCheckbox.value[laboratorySample.id].indeterminate = false
    } else if (noCheckedAll) {
      laboratorySampleIdCheckbox.value[laboratorySample.id].checked = false
      laboratorySampleIdCheckbox.value[laboratorySample.id].indeterminate = false
    } else {
      laboratorySampleIdCheckbox.value[laboratorySample.id].checked = false
      laboratorySampleIdCheckbox.value[laboratorySample.id].indeterminate = true
    }
  })
}

const reloadCheckboxLaboratory = async (checked: boolean, laboratory: Laboratory) => {
  const laboratoryGroup =
    laboratoryGroupMap.value[laboratory.laboratoryGroupId] || LaboratoryGroup.blank()
  laboratoryIdCheckbox.value[laboratory.id] = checked

  if (!laboratoryGroupSelects.value[laboratory.laboratoryGroupId]) {
    laboratoryGroupSelects.value[laboratory.laboratoryGroupId] = {
      laboratoryGroup,
      laboratoryList: [],
    }
  }
  const indexExisted = laboratoryGroupSelects.value[
    laboratory.laboratoryGroupId
  ].laboratoryList.findIndex((i) => {
    return i.id === laboratory.id
  })

  if (checked && indexExisted === -1) {
    laboratoryGroupSelects.value[laboratory.laboratoryGroupId].laboratoryList.push(laboratory)
    laboratoryGroupSelects.value[laboratory.laboratoryGroupId].laboratoryList.sort((a, b) => {
      return (a?.priority || 0) < (b?.priority || 0) ? -1 : 1
    })
  }
  if (!checked && indexExisted !== -1) {
    laboratoryGroupSelects.value[laboratory.laboratoryGroupId].laboratoryList.splice(
      indexExisted,
      1,
    )
  }
}

const handleChangeCheckboxLaboratory = async (checked: boolean, laboratory: Laboratory) => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return AlertStore.addWarning('Phiếu đã kết thúc không thể chỉ định')
  }
  createdAt.value = Date.now()
  reloadCheckboxLaboratory(checked, laboratory)
  reloadIndeterminateCheckbox()
}

const handleChangeCheckboxLaboratorySample = async (
  checked: boolean,
  laboratorySample: LaboratorySample,
) => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return AlertStore.addWarning('Phiếu đã kết thúc không thể chỉ định')
  }
  createdAt.value = Date.now()
  laboratorySample.laboratoryList?.forEach((laboratory) => {
    handleChangeCheckboxLaboratory(checked, laboratory)
  })

  if (!laboratorySampleIdCheckbox.value[laboratorySample.id]) {
    laboratorySampleIdCheckbox.value[laboratorySample.id] = {
      checked: false,
      indeterminate: false,
    }
  }
  laboratorySampleIdCheckbox.value[laboratorySample.id].checked = checked
  laboratorySampleIdCheckbox.value[laboratorySample.id].indeterminate = false
}

const disabledButtonSaveLaboratorySelect = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return true
  }

  let hasLaboratory = false
  Object.values(laboratoryGroupSelects.value).forEach((i) => {
    if (i.laboratoryList.length) {
      hasLaboratory = true
    }
  })
  return !hasLaboratory
})

const clear = () => {
  tlgEdit.value = TicketLaboratoryGroup.blank()
  laboratoryGroupSelects.value = {}
  laboratoryIdCheckbox.value = {}
  laboratorySampleIdCheckbox.value = {}
  createdAt.value = null
}

const startSaveTicketLaboratoryGroup = async () => {
  if (!tlgEdit.value.id) {
    await startAddTicketLaboratoryGroup()
  } else {
    await startUpdateTicketLaboratoryGroup()
  }
}

const startAddTicketLaboratoryGroup = async () => {
  try {
    const ticketLaboratoryGroupAddList = Object.keys(laboratoryGroupSelects.value)
      .filter((key) => {
        if (laboratoryGroupSelects.value[key].laboratoryList.length == 0) return false
        if (tlgEdit.value.id && tlgEdit.value.laboratoryGroupId == Number(key)) {
          return false
        }
        return true
      })
      .flat()
      .map((i) => {
        return {
          laboratoryGroupId: Number(i),
          createdAt: createdAt.value,
          roomId: laboratoryGroupSelects.value[i].laboratoryGroup.roomId,
          ticketLaboratoryList: laboratoryGroupSelects.value[i].laboratoryList.map((i, index) => {
            const ins = TicketLaboratory.blank()
            ins.laboratory = Laboratory.from(i)
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
      })

    for (let i = 0; i < ticketLaboratoryGroupAddList.length; i++) {
      const group = ticketLaboratoryGroupAddList[i]
      for (let j = 0; j < group.ticketLaboratoryList.length; j++) {
        const tpItem = group.ticketLaboratoryList[j]

        await LaboratoryService.executeRelation([tpItem.laboratory!], { discountList: true })
        const discountApply = tpItem.laboratory?.discountApply
        if (discountApply) {
          let { discountType, discountPercent, discountMoney } = discountApply
          const expectedPrice = tpItem.expectedPrice || 0
          if (discountType === DiscountType.Percent) {
            discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
          }
          if (discountType === DiscountType.VND) {
            discountPercent =
              expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
          }
          tpItem.discountType = discountType
          tpItem.discountPercent = discountPercent
          tpItem.discountMoney = discountMoney
          tpItem.actualPrice = expectedPrice - discountMoney
        }
      }
    }

    await TicketChangeLaboratoryApi.addTicketLaboratoryGroup({
      ticketId: ticketRoomRef.value.id,
      ticketLaboratoryGroupAddList,
    })
    clear()
  } catch (error) {
    console.log('🚀: TicketClinicLaboratory.vue:148 ~ handleAddTicketLaboratoryList :', error)
  }
}

const startUpdateTicketLaboratoryGroup = async () => {
  try {
    const ticketLaboratoryGroupUpdate = {
      id: tlgEdit.value.id,
      createdAt: createdAt.value,
      laboratoryGroupId: tlgEdit.value.laboratoryGroupId,
      roomId: tlgEdit.value.roomId,
      ticketLaboratoryList: laboratoryGroupSelects.value[
        tlgEdit.value.laboratoryGroupId
      ].laboratoryList.map((i, index) => {
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
    if (ticketLaboratoryGroupUpdate?.ticketLaboratoryList?.length) {
      for (let j = 0; j < ticketLaboratoryGroupUpdate.ticketLaboratoryList.length; j++) {
        const tpItem = ticketLaboratoryGroupUpdate.ticketLaboratoryList[j]

        await LaboratoryService.executeRelation([tpItem.laboratory!], { discountList: true })
        const discountApply = tpItem.laboratory?.discountApply
        if (discountApply) {
          let { discountType, discountPercent, discountMoney } = discountApply
          const expectedPrice = tpItem.expectedPrice || 0
          if (discountType === DiscountType.Percent) {
            discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
          }
          if (discountType === DiscountType.VND) {
            discountPercent =
              expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
          }
          tpItem.discountType = discountType
          tpItem.discountPercent = discountPercent
          tpItem.discountMoney = discountMoney
          tpItem.actualPrice = expectedPrice - discountMoney
        }
      }
    }

    await TicketChangeLaboratoryApi.updateTicketLaboratoryGroup({
      ticketId: ticketRoomRef.value.id,
      ticketLaboratoryGroupUpdate,
    })
    clear()
  } catch (error) {
    console.log('🚀: TicketClinicLaboratory.vue:148 ~ handleAddTicketLaboratoryList :', error)
  }
}

const clickEditLaboratoryGroup = (tlgEditId: string) => {
  const tlgFind = ticketRoomRef.value.ticketLaboratoryGroupList?.find((i) => {
    return i.id === tlgEditId
  })
  if (!tlgFind) return

  tlgEdit.value = tlgFind

  createdAt.value = tlgFind.createdAt
  const currentLaboratoryList = (tlgFind.ticketLaboratoryList || []).map((tl) => {
    return tl.laboratory || Laboratory.blank()
  })

  laboratoryGroupSelects.value = {
    [tlgFind.laboratoryGroupId]: {
      laboratoryList: currentLaboratoryList,
      laboratoryGroup: laboratoryGroupMap.value[tlgFind.laboratoryGroupId],
    },
  }

  laboratoryIdCheckbox.value = {}
  laboratorySampleIdCheckbox.value = {}
  currentLaboratoryList.forEach((i) => {
    laboratoryIdCheckbox.value[i.id] = true
  })
  reloadIndeterminateCheckbox()
}

const clickDestroyTlg = async (tlgData: TicketLaboratoryGroup) => {
  if (
    [PaymentMoneyStatus.FullPaid, PaymentMoneyStatus.PartialPaid].includes(
      tlgData.paymentMoneyStatus,
    )
  ) {
    return ModalStore.alert({
      title: `Không thể xóa xét nghiệm : ${tlgData.laboratoryGroup?.name}!`,
      content: ['- Xét nghiệm đã được thanh toán sẽ không thể xóa'],
    })
  }
  if (tlgData.status !== TicketLaboratoryStatus.Pending) {
    return ModalStore.alert({
      title: `Không thể xóa xét nghiệm : ${tlgData.laboratoryGroup?.name}!`,
      content: ['- Xét nghiệm đã được thực hiện sẽ không thể xóa'],
    })
  }

  ModalStore.confirm({
    title: `Xác nhận xóa phiếu: ${tlgData.laboratoryGroup?.name}?`,
    content: [
      '- Hệ thống sẽ xóa tất cả xét nghiệm trên phiếu này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeLaboratoryApi.destroyTicketLaboratoryGroup({
          ticketId: ticketRoomRef.value.id,
          ticketLaboratoryGroupId: tlgData.id,
        })
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicLaboratory.vue:118 ~ onOk: ~ error:', error)
      }
    },
  })
}

const clickDestroyTicketLaboratory = async (ticketLaboratoryData: TicketLaboratory) => {
  if (
    [PaymentMoneyStatus.FullPaid, PaymentMoneyStatus.PartialPaid].includes(
      ticketLaboratoryData.paymentMoneyStatus,
    )
  ) {
    return ModalStore.alert({
      title: `Không thể xóa xét nghiệm : ${ticketLaboratoryData.laboratory?.name}!`,
      content: ['- Xét nghiệm đã được thanh toán sẽ không thể xóa'],
    })
  }
  if (ticketLaboratoryData.status !== TicketLaboratoryStatus.Pending) {
    return ModalStore.alert({
      title: `Không thể xóa xét nghiệm : ${ticketLaboratoryData.laboratory?.name}!`,
      content: ['- Xét nghiệm đã được thực hiện sẽ không thể xóa'],
    })
  }

  ModalStore.confirm({
    title: `Xác nhận xóa xét nghiệm: ${ticketLaboratoryData.laboratory?.name} ?`,
    content: [
      '- Hệ thống sẽ xóa xét nghiệm này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeLaboratoryApi.destroyTicketLaboratory({
          ticketId: ticketRoomRef.value.id,
          ticketLaboratoryId: ticketLaboratoryData.id,
        })
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicRegimen.vue:185 ~ onOk: ~ error:', error)
      }
    },
  })
}

const startPrintResult = async (tlgData: TicketLaboratoryGroup) => {
  await PrintHtmlAction.startPrintResultTicketLaboratory({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
    ticketLaboratoryGroup: tlgData,
  })
}

const startPrintParaClinicalRequest = async () => {
  await ticketRoomRef.value.refreshRelation()
  await PrintHtmlAction.startPrintParaClinicalRequest({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}
</script>
<template>
  <ModalTicketLaboratoryResult ref="modalTicketLaboratoryResult" />
  <ModalTicketLaboratoryUpdateMoney ref="modalTicketLaboratoryUpdateMoney" />
  <div class="mt-4 flex flex-wrap gap-y-4">
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
      <div class="table-wrapper flex-1" style="overflow-y: scroll">
        <table>
          <thead>
            <tr>
              <th colspan="100">Chọn xét nghiệm</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="100" style="padding: 0">
                <div class="flex-0" style="margin: -1px">
                  <InputText
                    v-model:value="searchText"
                    prepend="🔎"
                    placeholder="Tìm kiếm theo tên xét nghiệm"
                    @update:value="startFilterLaboratory"
                  />
                </div>
              </td>
            </tr>
            <template v-if="!tlgEdit.id">
              <template
                v-for="laboratorySample in laboratorySampleOptions"
                :key="laboratorySample.id"
              >
                <tr
                  style="cursor: pointer"
                  @click="
                    handleChangeCheckboxLaboratorySample(
                      !laboratorySampleIdCheckbox[laboratorySample.id]?.checked,
                      laboratorySample,
                    )
                  "
                >
                  <td>
                    <input
                      type="checkbox"
                      :checked="!!laboratorySampleIdCheckbox[laboratorySample.id]?.checked"
                      :indeterminate="
                        !!laboratorySampleIdCheckbox[laboratorySample.id]?.indeterminate
                      "
                      :disabled="
                        [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
                      "
                    />
                  </td>
                  <td colspan="2" style="user-select: none; cursor: pointer" class="font-bold">
                    {{ laboratorySample.name }}
                  </td>
                </tr>
                <tr
                  v-for="laboratory in laboratorySample.laboratoryList || []"
                  :key="laboratory.id"
                  style="user-select: none; cursor: pointer"
                  @click="
                    handleChangeCheckboxLaboratory(!laboratoryIdCheckbox[laboratory.id], laboratory)
                  "
                >
                  <td style="user-select: none">
                    <input
                      type="checkbox"
                      :checked="!!laboratoryIdCheckbox[laboratory.id]"
                      style="cursor: pointer"
                      :disabled="
                        [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
                      "
                    />
                  </td>
                  <td>{{ laboratory.name }}</td>
                  <td class="text-right">{{ formatMoney(laboratory.price) }}</td>
                </tr>
              </template>
            </template>
            <template v-for="(lo, i) in laboratoryOptions" :key="i">
              <template v-if="!tlgEdit.id || tlgEdit.laboratoryGroup?.id === lo.laboratoryGroup.id">
                <tr>
                  <td colspan="3" class="font-bold">
                    <span>{{ lo.laboratoryGroup.name }}</span>
                  </td>
                </tr>
                <tr
                  v-for="laboratory in lo.laboratoryList"
                  :key="laboratory.id"
                  style="user-select: none; cursor: pointer"
                  @click="
                    handleChangeCheckboxLaboratory(!laboratoryIdCheckbox[laboratory.id], laboratory)
                  "
                >
                  <td style="user-select: none">
                    <input
                      type="checkbox"
                      :checked="!!laboratoryIdCheckbox[laboratory.id]"
                      :disabled="
                        [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
                      "
                    />
                  </td>
                  <td>{{ laboratory.name }}</td>
                  <td class="text-right">{{ formatMoney(laboratory.price) }}</td>
                </tr>
              </template>
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
            <template v-for="({ laboratoryList }, key) in laboratoryGroupSelects" :key="key">
              <template v-if="laboratoryList.length">
                <tr>
                  <td colspan="4" class="font-bold">
                    <span v-if="laboratoryGroupMap[key]">{{ laboratoryGroupMap[key]?.name }}</span>
                    <span v-else-if="Number(key) === 0">Chưa phân nhóm phiếu</span>
                    <span v-else>(ID{{ key }}) Nhóm bị xóa</span>
                    <span
                      v-if="
                        tlgEdit.id && laboratoryGroupMap[key].id === tlgEdit.laboratoryGroup?.id
                      "
                      style="color: var(--text-red); font-style: italic"
                    >
                      (Đang sửa)
                    </span>
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
      <div class="mt-4 px-4 flex-0">
        <div>Thời gian chỉ định</div>
        <div><InputDate v-model:value="createdAt" show-time /></div>
      </div>
      <div class="mt-4 flex justify-center flex-0 gap-4">
        <VueButton v-if="tlgEdit.id" @click="clear">Hủy bỏ</VueButton>
        <VueButton
          color="blue"
          :disabled="disabledButtonSaveLaboratorySelect"
          @click="startSaveTicketLaboratoryGroup"
        >
          <span v-if="tlgEdit.id">Cập nhật chỉ định xét nghiệm</span>
          <span v-else>Tạo chỉ định xét nghiệm mới</span>
        </VueButton>
      </div>
    </div>
  </div>
  <div class="mt-8">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các xét nghiệm đã chỉ định</div>
      <VueButton icon="print" @click="startPrintParaClinicalRequest">
        In phiếu chỉ định CLS
      </VueButton>
    </div>
    <div class="mt-2 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th
              v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"
              style="width: 32px"
            ></th>
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
          <tr v-if="ticketRoomRef.ticketLaboratoryGroupList!.length === 0">
            <td colspan="20" class="text-center">Chưa có phiếu xét nghiệm nào</td>
          </tr>
          <template v-for="tlg in ticketRoomRef.ticketLaboratoryGroupList" :key="tlg.id">
            <tr>
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                  <template #trigger>
                    <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                  </template>
                  <pre>{{ JSON.stringify(tlg, null, 4) }}</pre>
                </VueTooltip>
              </td>
              <td
                :colspan="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development' ? 4 : 3"
                class=""
              >
                <div class="flex items-center gap-2">
                  <span class="font-bold">
                    {{ tlg.laboratoryGroup?.name || 'Chưa phân nhóm phiếu xét nghiệm' }}
                  </span>
                  <a @click="startPrintResult(tlg)">
                    <IconPrint width="18px" height="18px" />
                  </a>
                  <span
                    v-if="tlgEdit.id && tlg.id === tlgEdit.id"
                    style="color: var(--text-red); font-style: italic"
                  >
                    (Đang sửa)
                  </span>
                </div>
              </td>
              <td colspan="4">
                <div class="flex justify-end items-center gap-4">
                  <VueButton
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                        tlg.paymentMoneyStatus,
                      ) &&
                      userPermission[PermissionId.TICKET_CHANGE_LABORATORY_REQUEST]
                    "
                    size="small"
                    @click="clickEditLaboratoryGroup(tlg.id)"
                  >
                    Sửa chỉ định
                  </VueButton>
                  <VueButton
                    v-if="userPermission[PermissionId.TICKET_CHANGE_LABORATORY_RESULT]"
                    size="small"
                    @click="modalTicketLaboratoryResult?.openModal(tlg.id)"
                  >
                    Trả kết quả
                  </VueButton>
                </div>
              </td>
              <td class="text-center">
                <a
                  v-if="
                    tlg.id &&
                    tlg.status === TicketLaboratoryStatus.Pending &&
                    [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                      tlg.paymentMoneyStatus,
                    ) &&
                    userPermission[PermissionId.TICKET_CHANGE_LABORATORY_REQUEST]
                  "
                  style="color: var(--text-red)"
                >
                  <IconDelete width="22" height="22" @click="clickDestroyTlg(tlg)" />
                </a>
              </td>
            </tr>
            <template v-for="(tlItem, index) in tlg.ticketLaboratoryList || []" :key="tlItem.id">
              <tr
                :style="
                  tlg.ticketLaboratoryResultMap?.[tlItem.laboratoryId]?.attention
                    ? 'color: red'
                    : ''
                "
              >
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                    <template #trigger>
                      <IconBug
                        style="color: violet; cursor: pointer"
                        width="1.2em"
                        height="1.2em"
                      />
                    </template>
                    <pre>{{ JSON.stringify(tlItem, null, 4) }}</pre>
                  </VueTooltip>
                </td>
                <td class="text-center">{{ index + 1 }}</td>
                <td
                  v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"
                  class="text-center"
                >
                  <PaymentMoneyStatusTooltip :paymentMoneyStatus="tlItem.paymentMoneyStatus" />
                </td>
                <td class="text-center">
                  <TicketLaboratoryStatusTooltip :status="tlItem.status" />
                </td>
                <td>{{ tlItem.laboratory?.name }}</td>
                <td class="text-center">
                  <div>{{ tlg.ticketLaboratoryResultMap?.[tlItem.laboratoryId]?.result }}</div>
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
                  <div class="flex flex-wrap gap-2 items-center">
                    <div>
                      <VueTag v-if="tlItem.discountMoney" color="green">
                        {{ tlItem.discountPercent + ' %' }}
                      </VueTag>
                    </div>
                    <div class="ml-auto">
                      <div v-if="tlItem.discountMoney" class="text-xs italic text-red-500">
                        <del>{{ formatMoney(tlItem.expectedPrice) }}</del>
                      </div>
                      <div>{{ formatMoney(tlItem.actualPrice) }}</div>
                    </div>
                    <a
                      v-if="
                        ![TicketStatus.Debt, TicketStatus.Completed].includes(
                          ticketRoomRef.status,
                        ) &&
                        [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                          tlItem.paymentMoneyStatus,
                        ) &&
                        userPermission[PermissionId.TICKET_CHANGE_LABORATORY_REQUEST]
                      "
                      @click="modalTicketLaboratoryUpdateMoney?.openModal(tlItem)"
                      style="color: var(--text-orange); line-height: 0"
                    >
                      <IconEditSquare width="20" height="20" />
                    </a>
                  </div>
                </td>
                <td class="text-center">
                  <a v-if="!tlItem.id">
                    <IconSpin width="20" height="20" />
                  </a>
                  <a
                    v-else-if="
                      tlItem.status === TicketLaboratoryStatus.Pending &&
                      [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                        tlItem.paymentMoneyStatus,
                      ) &&
                      userPermission[PermissionId.TICKET_CHANGE_LABORATORY_REQUEST]
                    "
                    style="color: var(--text-red)"
                    @click="clickDestroyTicketLaboratory(tlItem)"
                  >
                    <IconDelete width="22" height="22" />
                  </a>
                </td>
              </tr>
              <tr
                v-for="(laboratoryChild, i) in tlItem.laboratory?.children || []"
                :key="i"
                :style="
                  tlg.ticketLaboratoryResultMap?.[laboratoryChild.id]?.attention ? 'color: red' : ''
                "
              >
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                    <template #trigger>
                      <IconBug
                        style="color: violet; cursor: pointer"
                        width="1.2em"
                        height="1.2em"
                      />
                    </template>
                    <pre>{{ JSON.stringify(laboratoryChild, null, 4) }}</pre>
                  </VueTooltip>
                </td>
                <td></td>
                <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                <td></td>
                <td>{{ laboratoryChild?.name }}</td>
                <td class="text-center">
                  <div>{{ tlg.ticketLaboratoryResultMap?.[laboratoryChild.id]?.result }}</div>
                </td>
                <td class="text-center">
                  <span v-if="laboratoryChild?.valueType === LaboratoryValueType.Number">
                    {{ laboratoryChild?.lowValue }} -
                    {{ laboratoryChild?.highValue }}
                  </span>
                </td>
                <td class="text-center">{{ laboratoryChild?.unit }}</td>
                <td class="text-center"></td>
                <td class="text-center"></td>
              </tr>
            </template>
          </template>

          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
            <td :colspan="6" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{ formatMoney(ticketRoomRef.laboratoryMoney) }}
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
