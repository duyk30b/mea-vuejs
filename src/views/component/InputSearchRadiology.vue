<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'
import ModalRadiologyDetail from '../master-data/radiology/detail/ModalRadiologyDetail.vue'

const emit = defineEmits<{
  (e: 'selectRadiology', value: Radiology | undefined): void
  (e: 'update:radiologyId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    radiologyId: number
    disabled?: boolean
    required?: boolean
    label?: string
  }>(),
  {
    radiologyId: 0,
    disabled: false,
    required: false,
    label: 'Phiếu CĐHA',
  },
)

const inputOptionsRadiology = ref<InstanceType<typeof InputOptionsValue>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const radiologyOptions = ref<{ value: number; text: string; data: Radiology }[]>([])

onMounted(async () => {
  const radiologyAll = await RadiologyService.getAll()
  radiologyOptions.value = radiologyAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:radiologyId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectRadiology', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  const radiology = item.data as Radiology
  return (
    ESString.customFilter(radiology.name, text) ||
    ESString.customFilter(radiology.radiologyCode, text)
  )
}
</script>
<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />

  <div class="flex gap-1 flex-wrap">
    <span>{{ label }}</span>
    <a v-if="radiologyId" @click="modalRadiologyDetail?.openModal(radiologyId)">
      <IconFileSearch />
    </a>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ radiologyId }})</span>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsRadiology"
      :value="radiologyId"
      :disabled="disabled"
      :maxHeight="320"
      :options="radiologyOptions"
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
