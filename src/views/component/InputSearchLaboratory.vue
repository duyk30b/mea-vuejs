<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '@/modules/laboratory'
import { ref, watch } from 'vue'
import ModalLaboratoryDetail from '../master-data/laboratory/detail/ModalLaboratoryDetail.vue'

const emit = defineEmits<{
  (e: 'selectLaboratory', value: Laboratory): void
  (e: 'update:laboratoryId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    laboratoryId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    laboratoryId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsLaboratory = ref<InstanceType<typeof InputOptionsValue>>()
const modalLaboratoryDetail = ref<InstanceType<typeof ModalLaboratoryDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const laboratoryOptions = ref<{ value: number; text: string; data: Laboratory }[]>([])
const laboratory = ref(Laboratory.blank())

watch(
  () => props.laboratoryId,
  async (newValue) => {
    if (newValue && newValue != laboratory.value.id) {
      const laboratoryData = await LaboratoryService.detail(newValue)
      if (laboratoryData) {
        setLaboratoryFromParent(laboratoryData)
      }
    }
  },
  { immediate: true },
)

const searchingLaboratory = async (text: string) => {
  if (!text) {
    laboratoryOptions.value = []
    return
  }
  const laboratoryList = await LaboratoryService.list({
    filter: { name: { LIKE: text } },
  })
  laboratoryOptions.value = laboratoryList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const setLaboratoryFromChild = async (laboratoryData: Laboratory) => {
  laboratory.value = Laboratory.from(laboratoryData)
  emit('selectLaboratory', laboratoryData)
  emit('update:laboratoryId', laboratoryData.id)
}

const setLaboratoryFromCurrent = async (laboratoryData: Laboratory) => {
  laboratory.value = Laboratory.from(laboratoryData)
  laboratoryOptions.value = [
    { value: laboratoryData.id, text: laboratoryData.name, data: laboratoryData },
  ]
  emit('selectLaboratory', laboratoryData)
  emit('update:laboratoryId', laboratoryData.id)
}

const setLaboratoryFromParent = async (laboratoryData: Laboratory) => {
  laboratory.value = Laboratory.from(laboratoryData)
  laboratoryOptions.value = [
    { value: laboratoryData.id, text: laboratoryData.name, data: laboratoryData },
  ]
}
</script>
<template>
  <ModalLaboratoryDetail ref="modalLaboratoryDetail" />

  <div class="flex gap-1 flex-wrap">
    <span>Tên xét nghiệm</span>
    <a v-if="laboratory.id" @click="modalLaboratoryDetail?.openModal(laboratory)">
      <IconFileSearch />
    </a>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsLaboratory"
      :value="laboratory.id"
      :disabled="disabled"
      :maxHeight="320"
      :options="laboratoryOptions"
      placeholder="Tìm kiếm bằng mã, tên xét nghiệm"
      :required="required"
      @selectItem="({ data }) => setLaboratoryFromChild(data)"
      @searching="searchingLaboratory"
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
