<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { ref, watch } from 'vue'
import ModalProcedureDetail from '../master-data/procedure/detail/ModalProcedureDetail.vue'

const emit = defineEmits<{
  (e: 'selectProcedure', value: Procedure): void
  (e: 'update:procedureId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    procedureId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    procedureId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsProcedure = ref<InstanceType<typeof InputOptionsValue>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const procedureOptions = ref<{ value: number; text: string; data: Procedure }[]>([])
const procedure = ref(Procedure.blank())

watch(
  () => props.procedureId,
  async (newValue) => {
    if (newValue && newValue != procedure.value.id) {
      const procedureData = await ProcedureService.detail(newValue)
      if (procedureData) {
        setProcedureFromParent(procedureData)
      }
    }
  },
  { immediate: true },
)

const searchingProcedure = async (text: string) => {
  if (!text) {
    procedureOptions.value = []
    return
  }
  const procedureList = await ProcedureService.list({
    filter: { isActive: 1, name: { LIKE: text } },
  })
  procedureOptions.value = procedureList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const setProcedureFromChild = async (procedureData: Procedure) => {
  procedure.value = Procedure.from(procedureData)
  emit('selectProcedure', procedureData)
  emit('update:procedureId', procedureData.id)
}

const setProcedureFromCurrent = async (procedureData: Procedure) => {
  procedure.value = Procedure.from(procedureData)
  procedureOptions.value = [
    { value: procedureData.id, text: procedureData.name, data: procedureData },
  ]
  emit('selectProcedure', procedureData)
  emit('update:procedureId', procedureData.id)
}

const setProcedureFromParent = async (procedureData: Procedure) => {
  procedure.value = Procedure.from(procedureData)
  procedureOptions.value = [
    { value: procedureData.id, text: procedureData.name, data: procedureData },
  ]
}
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />

  <div class="flex gap-1 flex-wrap">
    <span>Tên dịch vụ</span>
    <a v-if="procedure.id" @click="modalProcedureDetail?.openModal(procedure.id)">
      <IconFileSearch />
    </a>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsProcedure"
      :value="procedure.id"
      :disabled="disabled"
      :maxHeight="320"
      :options="procedureOptions"
      placeholder="Tìm kiếm bằng mã, tên dịch vụ"
      :required="required"
      @selectItem="({ data }) => setProcedureFromChild(data)"
      @searching="searchingProcedure"
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
