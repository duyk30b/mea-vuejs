<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '@/modules/laboratory'
import { onMounted, ref, watch } from 'vue'
import ModalLaboratoryDetail from '../master-data/laboratory/detail/ModalLaboratoryDetail.vue'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { ESString } from '@/utils'
import { CONFIG } from '@/config'

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

onMounted(async () => {
  const laboratoryAll = await LaboratoryService.getTree()
  laboratoryOptions.value = laboratoryAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:laboratoryId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectLaboratory', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  const laboratory = item.data as Laboratory
  return (
    ESString.customFilter(laboratory.name, text) ||
    ESString.customFilter(laboratory.laboratoryCode, text)
  )
}
</script>
<template>
  <ModalLaboratoryDetail ref="modalLaboratoryDetail" />

  <div class="flex gap-1 flex-wrap">
    <span>Tên xét nghiệm</span>
    <a v-if="laboratoryId" @click="modalLaboratoryDetail?.openModal(laboratoryId)">
      <IconFileSearch />
    </a>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ laboratoryId }})</span>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsLaboratory"
      :value="laboratoryId"
      :disabled="disabled"
      :maxHeight="320"
      :options="laboratoryOptions"
      placeholder="Tìm kiếm bằng mã, tên xét nghiệm"
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
