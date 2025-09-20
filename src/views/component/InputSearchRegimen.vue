<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputSearch } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputSearch.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Regimen, RegimenService } from '@/modules/regimen'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'
import ModalRegimenDetail from '../master-data/regimen/detail/ModalRegimenDetail.vue'

const emit = defineEmits<{
  (e: 'selectRegimen', value: Regimen): void
  (e: 'update:regimenId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    regimenId: number
    disabled?: boolean
    required?: boolean
    removeLabelWrapper?: boolean
  }>(),
  {
    regimenId: 0,
    disabled: false,
    required: false,
    removeLabelWrapper: false,
  },
)

const inputSearchRegimen = ref<InstanceType<typeof InputSearch>>()
const modalRegimenDetail = ref<InstanceType<typeof ModalRegimenDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const regimenOptions = ref<{ value: number; text: string; data: Regimen }[]>([])

onMounted(async () => {
  const regimenAll = await RegimenService.getAll()
  regimenOptions.value = regimenAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:regimenId', v)
}

const handleSelectItem = (item?: ItemOption<Regimen>) => {
  if (item?.data) {
    emit('selectRegimen', item?.data)
  }
}

const logicFilter = (item: ItemOption<Regimen>, text: string) => {
  const regimen = item.data as Regimen
  if (!regimen.isActive) return false
  return ESString.customFilter(regimen.name, text) || ESString.customFilter(regimen.code, text)
}
</script>
<template>
  <ModalRegimenDetail ref="modalRegimenDetail" />

  <div v-if="!removeLabelWrapper" class="flex gap-1 flex-wrap">
    <span>Tên liệu trình</span>
    <a v-if="regimenId" @click="modalRegimenDetail?.openModal(regimenId)">
      <IconFileSearch />
    </a>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ regimenId }})</span>
  </div>

  <div>
    <InputSearch
      ref="inputSearchRegimen"
      :value="regimenId"
      :disabled="disabled"
      :maxHeight="260"
      :options="regimenOptions"
      placeholder="Tìm kiếm bằng mã, tên liệu trình"
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
    </InputSearch>
  </div>
</template>

<style lang="scss" scoped></style>
