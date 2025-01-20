<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../../common/vue-form'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DiscountType } from '../../../../modules/enum'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { LaboratoryKit, LaboratoryKitService } from '../../../../modules/laboratory-kit'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketLaboratory } from '../../../../modules/ticket-laboratory'
import { DString } from '../../../../utils'

const inputSearchLaboratory = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{ (e: 'success', value: TicketLaboratory[]): void }>()

let laboratoryAll: Laboratory[] = []
let laboratoryKitAll: LaboratoryKit[] = []
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

onMounted(async () => {
  try {
    const promiseResult = await Promise.all([
      LaboratoryService.list({}),
      LaboratoryKitService.list({}),
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
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
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

const selectLaboratoryList = (laboratorySelectList: Laboratory[]) => {
  const priorityList = (ticketClinicRef.value.ticketLaboratoryList || []).map((i) => i.priority)
  priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
  let priorityMax = Math.max(...priorityList)

  const ticketLaboratoryEmitList = laboratorySelectList.map((i, index) => {
    const temp = TicketLaboratory.blank()
    temp.priority = priorityMax + 1 + index
    temp.ticketId = ticketClinicRef.value.id
    temp.customerId = ticketClinicRef.value.customerId
    temp.laboratoryId = i.id

    temp.expectedPrice = i.price
    temp.discountMoney = 0
    temp.discountPercent = 0
    temp.discountType = DiscountType.VND
    temp.actualPrice = i.price
    return temp
  })

  if (ticketLaboratoryEmitList.length) {
    emit('success', ticketLaboratoryEmitList)
  }
}

const selectItemOptions = (dataSelected?: {
  type: 'laboratory' | 'laboratoryKit'
  laboratory: Laboratory
  laboratoryKit: LaboratoryKit
}) => {
  if (!dataSelected) return
  if (dataSelected.type === 'laboratory') {
    selectLaboratoryList([dataSelected.laboratory])
  }
  if (dataSelected.type === 'laboratoryKit') {
    selectLaboratoryList(dataSelected.laboratoryKit.laboratoryList || [])
  }
}
</script>
<template>
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
</template>
<style lang="scss" scope></style>
