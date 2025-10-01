<script lang="ts" setup>
import { VueButton } from '@/common'
import { IconDelete, IconFileSearch } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { InputText } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '@/modules/radiology-group'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeRadiologyApi, TicketStatus } from '@/modules/ticket'
import { TicketRadiology } from '@/modules/ticket-radiology'
import { ESFunction, ESString } from '@/utils'
import ModalRadiologyDetail from '@/views/master-data/radiology/detail/ModalRadiologyDetail.vue'
import { onMounted, ref } from 'vue'
import ModalTicketRadiologyUpdate from './ModalTicketRadiologyUpdate.vue'

const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalTicketRadiologyUpdate = ref<InstanceType<typeof ModalTicketRadiologyUpdate>>()

const emit = defineEmits<{ (e: 'addTicketRadiologyList', value: TicketRadiology[]): void }>()

const radiologyGroupAll = ref<RadiologyGroup[]>([])
const radiologyFilter = ref<Radiology[]>([])
const currentRadiologyGroupId = ref(0)
const radiologyIdCheckbox = ref<Record<string, boolean>>({})
const ticketRadiologyListDraft = ref<TicketRadiology[]>([])

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const searchText = ref('')

const { userPermission } = MeService

const saveLoading = ref(false)

onMounted(async () => {
  await Promise.all([RadiologyGroupService.getAll(), RadiologyService.getAll()])

  const radiologyGroupBlank = RadiologyGroup.blank()
  radiologyGroupBlank.name = 'TẤT CẢ'
  radiologyGroupAll.value = [radiologyGroupBlank, ...RadiologyGroupService.radiologyGroupAll.value]

  radiologyFilter.value = RadiologyService.radiologyAll.value
})

const reset = () => {
  searchText.value = ''
  radiologyIdCheckbox.value = {}
  ticketRadiologyListDraft.value = []
}

const handleSave = async () => {
  emit('addTicketRadiologyList', ticketRadiologyListDraft.value)

  try {
    saveLoading.value = true
    await TicketChangeRadiologyApi.addTicketRadiology({
      ticketId: ticketRoomRef.value.id,
      ticketRadiologyWrapList: ticketRadiologyListDraft.value.map((i) => {
        return {
          ticketRadiology: i,
          ticketUserRequestList: i.ticketUserRequestList,
        }
      }),
    })
    reset()
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicRadiology.vue:76 ~ handleAddTicketRadiology:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickRadiologyGroup = async (radiologyGroupIdData: number) => {
  currentRadiologyGroupId.value = radiologyGroupIdData
  if (radiologyGroupIdData === 0) {
    radiologyFilter.value = await RadiologyService.list({})
  } else {
    radiologyFilter.value = await RadiologyService.list({
      filter: { radiologyGroupId: radiologyGroupIdData },
    })
  }
}

const startFilterRadiology = (text: string) => {
  radiologyFilter.value = RadiologyService.radiologyAll.value.filter((r) => {
    if (currentRadiologyGroupId.value !== 0) {
      if (currentRadiologyGroupId.value !== r.radiologyGroupId) {
        return false
      }
    }
    if (!ESString.customFilter(r.name, text, 2)) return false
    return true
  })
}

const selectRadiology = async (radiologyData: Radiology) => {
  const priorityList = (ticketRoomRef.value.ticketRadiologyList || []).map((i) => i.priority)
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  const priorityMax = Math.max(...priorityList)

  const radiologyGroup = await RadiologyGroupService.detail(radiologyData.radiologyGroupId)

  const temp = TicketRadiology.blank()

  temp.ticketId = ticketRoomRef.value.id
  temp.priority = priorityMax + 1
  temp.customerId = ticketRoomRef.value.customerId
  temp.radiologyId = radiologyData.id
  temp.roomId = radiologyGroup.roomId || 0
  temp.radiology = radiologyData

  temp.printHtmlId = radiologyData.printHtmlId
  temp.description = radiologyData.descriptionDefault
  temp.result = radiologyData.resultDefault
  temp.customStyles = radiologyData.customStyles
  temp.customVariables = radiologyData.customVariables

  temp.createdAt = Date.now()
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

  return temp
}

const handleChangeCheckboxRadiology = async (checked: boolean, radiologyData: Radiology) => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return
  }

  radiologyIdCheckbox.value[radiologyData.id] = checked

  const findIndex = ticketRadiologyListDraft.value.findIndex((i) => {
    return i.radiologyId === radiologyData.id
  })

  if (checked) {
    if (findIndex == -1) {
      const temp = await selectRadiology(radiologyData)
      ticketRadiologyListDraft.value.push(temp)
    }
  }
  if (!checked) {
    if (findIndex != -1) {
      ticketRadiologyListDraft.value.splice(findIndex, 1)
    }
  }
}

const removeTicketRadiology = (ticketRadiologyData: TicketRadiology) => {
  const _localId = ticketRadiologyData._localId
  const indexRemove = ticketRadiologyListDraft.value.findIndex((i) => {
    return i._localId === _localId
  })
  if (indexRemove !== -1) {
    ticketRadiologyListDraft.value.splice(indexRemove, 1)
    radiologyIdCheckbox.value[ticketRadiologyData.radiologyId] = false
  }
}

const handleModalTicketRadiologyUpdateSuccess = (
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
  ticketRadiologyData: TicketRadiology,
) => {
  if (type === 'UPDATE') {
    const findIndex = ticketRadiologyListDraft.value.findIndex((i) => {
      return i._localId === ticketRadiologyData._localId
    })
    if (findIndex !== -1) {
      Object.assign(ticketRadiologyListDraft.value[findIndex], ticketRadiologyData)
    }
  }
}
</script>
<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <ModalTicketRadiologyUpdate
    ref="modalTicketRadiologyUpdate"
    @success="handleModalTicketRadiologyUpdateSuccess"
  />
  <div class="mt-4 flex flex-wrap">
    <div
      style="flex-basis: 100px; flex-grow: 1; position: relative; min-height: 400px"
      class="shadow-sm"
    >
      <div class="table-wrapper" style="overflow-y: scroll">
        <table>
          <thead>
            <tr>
              <th>Nhóm</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="radiologyGroup in radiologyGroupAll" :key="radiologyGroup.id">
              <td
                @click="handleClickRadiologyGroup(radiologyGroup.id)"
                :style="
                  currentRadiologyGroupId === radiologyGroup.id
                    ? 'font-weight: bold; color: var(--text-green)'
                    : ''
                "
                style="cursor: pointer"
              >
                {{ radiologyGroup.name }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div style="flex-basis: 300px; flex-grow: 1; position: relative; min-height: 400px">
      <div
        class="flex flex-col shadow-sm"
        style="
          border-right: 1px solid #eee;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        "
      >
        <div class="table-wrapper flex-1" style="overflow-y: scroll">
          <table>
            <thead>
              <tr>
                <th colspan="100">Chọn phiếu CĐHA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="100" style="padding: 0">
                  <div style="margin: -1px;">
                    <InputText
                      v-model:value="searchText"
                      prepend="🔎"
                      placeholder="Tìm kiếm theo tên phiếu CĐHA"
                      @update:value="startFilterRadiology"
                    />
                  </div>
                </td>
              </tr>
              <tr
                v-for="radiology in radiologyFilter"
                :key="radiology.id"
                @click="
                  handleChangeCheckboxRadiology(!radiologyIdCheckbox[radiology.id], radiology)
                "
                style="cursor: pointer"
              >
                <td style="user-select: none" class="text-center">
                  <input
                    type="checkbox"
                    :checked="!!radiologyIdCheckbox[radiology.id]"
                    style="cursor: pointer"
                    :disabled="
                      [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
                    "
                  />
                </td>
                <td style="user-select: none">{{ radiology.name }}</td>
                <td class="text-right">{{ formatMoney(radiology.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      style="flex-basis: 300px; max-width: 100%; flex-grow: 5; border-bottom: 1px solid #eee"
      class="flex flex-col"
    >
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-if="CONFIG.MODE === 'development'">LocalId-RadiologyID</th>
              <th>#</th>
              <th>Tên</th>
              <th>Giá</th>
              <th v-if="CONFIG.MODE === 'development'">N.Viên</th>
              <th v-if="CONFIG.MODE === 'development'">Description</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ticketRadiologyListDraft.length === 0">
              <td colspan="20" class="text-center">Không có dịch vụ nào</td>
            </tr>
            <tr v-for="(tp, index) in ticketRadiologyListDraft" :key="tp._localId">
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                {{ tp._localId }}-{{ tp.radiologyId }}
              </td>
              <td style="text-align: center">{{ index + 1 }}</td>
              <td>
                <div class="flex items-center gap-1">
                  <span>{{ tp.radiology?.name }}</span>
                  <a
                    style="line-height: 0"
                    @click="modalRadiologyDetail?.openModal(tp.radiologyId)"
                  >
                    <IconFileSearch />
                  </a>
                </div>
              </td>
              <td class="text-right">
                <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(tp.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(tp.actualPrice) }}</div>
              </td>
              <td v-if="CONFIG.MODE === 'development'" style="color: violet">
                <div v-for="tu in tp.ticketUserRequestList" :key="tu._localId">
                  <span>(P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})</span>
                  <span>{{ tu.user?.fullName }}</span>
                </div>
              </td>
              <td v-if="CONFIG.MODE === 'development'" style="width: 300px; color: violet">
                <div class="max-line-2">
                  {{ tp.description }}
                </div>
              </td>
              <td>
                <a
                  class="flex justify-center cursor-pointer"
                  style="font-size: 20px"
                  @click="modalTicketRadiologyUpdate?.openModal({ ticketRadiology: tp })"
                >
                  <IconEditSquare />
                </a>
              </td>
              <td class="text-center">
                <div
                  style="color: var(--text-red); cursor: pointer; font-size: 18px"
                  @click="removeTicketRadiology(tp)"
                >
                  <IconDelete />
                </div>
              </td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td colspan="2" class="text-right font-bold uppercase">Tổng tiền</td>
              <td class="font-bold text-right">
                {{
                  formatMoney(ticketRadiologyListDraft.reduce((acc, i) => acc + i.actualPrice, 0))
                }}
              </td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="my-3 flex justify-center">
        <VueButton
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status) ||
            !userPermission[PermissionId.TICKET_CHANGE_RADIOLOGY_REQUEST] ||
            !ticketRadiologyListDraft.length
          "
          color="blue"
          icon="save"
          @click="handleSave"
          :loading="saveLoading"
        >
          Lưu lại
        </VueButton>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scope></style>
