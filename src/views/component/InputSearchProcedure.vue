<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { onMounted, ref, watch } from 'vue'
import ModalProcedureDetail from '../master-data/procedure/detail/ModalProcedureDetail.vue'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { ESString } from '@/utils'
import { CONFIG } from '@/config'

const emit = defineEmits<{
  (e: 'selectProcedure', value: Procedure): void
  (e: 'update:procedureId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    procedureId: number
    disabled?: boolean
    required?: boolean
    removeLabelWrapper?: boolean
  }>(),
  {
    procedureId: 0,
    disabled: false,
    required: false,
    removeLabelWrapper: false,
  },
)

const inputOptionsProcedure = ref<InstanceType<typeof InputOptionsValue>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const procedureOptions = ref<{ value: number; text: string; data: Procedure }[]>([])

onMounted(async () => {
  const procedureAll = await ProcedureService.getAll()
  procedureOptions.value = procedureAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:procedureId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectProcedure', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  const procedure = item.data as Procedure
  if (!procedure.isActive) return false
  return (
    ESString.customFilter(procedure.name, text) ||
    ESString.customFilter(procedure.procedureCode, text)
  )
}
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />

  <div v-if="!removeLabelWrapper" class="flex gap-1 flex-wrap">
    <span>Tên dịch vụ</span>
    <a v-if="procedureId" @click="modalProcedureDetail?.openModal(procedureId)">
      <IconFileSearch />
    </a>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ procedureId }})</span>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsProcedure"
      :value="procedureId"
      :disabled="disabled"
      :maxHeight="320"
      :options="procedureOptions"
      placeholder="Tìm kiếm bằng mã, tên dịch vụ"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
          - {{ formatMoney(data.price) }}
        </div>
      </template>
    </InputOptionsValue>
  </div>
</template>

<style lang="scss" scoped></style>
