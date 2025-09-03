<script lang="ts" setup>
import { InputSearch } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Laboratory } from '@/modules/laboratory'
import { LaboratoryGroupService, type LaboratoryGroup } from '@/modules/laboratory-group'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectLaboratoryGroup', value: LaboratoryGroup): void
  (e: 'update:laboratoryGroupId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    laboratoryGroupId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    laboratoryGroupId: 0,
    disabled: false,
    required: false,
  },
)

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const laboratoryGroupOptions = ref<{ value: number; text: string; data: LaboratoryGroup }[]>([])

onMounted(async () => {
  const laboratoryAll = await LaboratoryGroupService.getAll()
  laboratoryGroupOptions.value = laboratoryAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:laboratoryGroupId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectLaboratoryGroup', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  const laboratoryGroup = item.data as Laboratory
  return ESString.customFilter(laboratoryGroup.name, text)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <span>Tên nhóm xét nghiệm</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
      ({{ laboratoryGroupId }})
    </span>
  </div>

  <div>
    <InputSearch
      :value="laboratoryGroupId"
      :disabled="disabled"
      :maxHeight="320"
      :options="laboratoryGroupOptions"
      placeholder="Tìm kiếm bằng mã, tên xét nghiệm"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
        </div>
      </template>
    </InputSearch>
  </div>
</template>

<style lang="scss" scoped></style>
