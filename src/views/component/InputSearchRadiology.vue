<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { ref, watch } from 'vue'
import ModalRadiologyDetail from '../master-data/radiology/detail/ModalRadiologyDetail.vue'

const emit = defineEmits<{
  (e: 'selectRadiology', value: Radiology): void
  (e: 'update:radiologyId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    radiologyId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    radiologyId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsRadiology = ref<InstanceType<typeof InputOptionsValue>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const radiologyOptions = ref<{ value: number; text: string; data: Radiology }[]>([])
const radiology = ref(Radiology.blank())

watch(
  () => props.radiologyId,
  async (newValue) => {
    if (newValue && newValue != radiology.value.id) {
      const radiologyData = await RadiologyService.detail(newValue)
      if (radiologyData) {
        setRadiologyFromParent(radiologyData)
      }
    }
  },
  { immediate: true },
)

const searchingRadiology = async (text: string) => {
  if (!text) {
    radiologyOptions.value = []
    return
  }
  const radiologyList = await RadiologyService.list({
    filter: { name: { LIKE: text } },
  })
  radiologyOptions.value = radiologyList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const setRadiologyFromChild = async (radiologyData: Radiology) => {
  radiology.value = Radiology.from(radiologyData)
  emit('selectRadiology', radiologyData)
  emit('update:radiologyId', radiologyData.id)
}

const setRadiologyFromCurrent = async (radiologyData: Radiology) => {
  radiology.value = Radiology.from(radiologyData)
  radiologyOptions.value = [
    { value: radiologyData.id, text: radiologyData.name, data: radiologyData },
  ]
  emit('selectRadiology', radiologyData)
  emit('update:radiologyId', radiologyData.id)
}

const setRadiologyFromParent = async (radiologyData: Radiology) => {
  radiology.value = Radiology.from(radiologyData)
  radiologyOptions.value = [
    { value: radiologyData.id, text: radiologyData.name, data: radiologyData },
  ]
}
</script>
<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />

  <div class="flex gap-1 flex-wrap">
    <span>Tên phiếu CĐHA</span>
    <a v-if="radiology.id" @click="modalRadiologyDetail?.openModal(radiology.id)">
      <IconFileSearch />
    </a>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsRadiology"
      :value="radiology.id"
      :disabled="disabled"
      :maxHeight="320"
      :options="radiologyOptions"
      placeholder="Tìm kiếm bằng mã, tên xét nghiệm"
      :required="required"
      @selectItem="({ data }) => setRadiologyFromChild(data)"
      @searching="searchingRadiology"
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
