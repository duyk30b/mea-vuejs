<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { User, UserService } from '@/modules/user'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectUser', value: User | undefined): void
  (e: 'update:userId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    userId: number
    disabled?: boolean
    required?: boolean
    label?: string
  }>(),
  {
    userId: 0,
    disabled: false,
    required: false,
    label: 'Nhân viên',
  },
)

const inputOptionsUser = ref<InstanceType<typeof InputOptionsValue>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const userOptions = ref<ItemOption[]>([])

onMounted(async () => {
  const userAll = await UserService.getAll()
  userOptions.value = userAll.map((i) => ({ value: i.id, text: i.fullName, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:userId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectUser', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  return ESString.customFilter(item.text, text)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <span>{{ label }}</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ userId }})</span>
  </div>
  <div>
    <InputOptionsValue
      ref="inputOptionsUser"
      :value="userId"
      :disabled="disabled"
      :maxHeight="320"
      :options="userOptions"
      placeholder="Tìm kiếm bằng tên nhân viên"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.fullName }}</b>
        </div>
      </template>
    </InputOptionsValue>
  </div>
</template>

<style lang="scss" scoped></style>
