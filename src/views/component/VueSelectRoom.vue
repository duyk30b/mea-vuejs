<script lang="ts" setup>
import { VueSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { Room, RoomInteractType, RoomService } from '@/modules/room'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectRoom', value: Room | undefined): void
  (e: 'update:roomId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    roomId: number
    roomInteractType?: RoomInteractType
    disabled?: boolean
    required?: boolean
    label?: string
    removeLabelWrapper?: boolean
  }>(),
  {
    roomId: 0,
    disabled: false,
    required: false,
    label: 'Chọn phòng',
    removeLabelWrapper: false,
  },
)

const roomOptions = ref<{ value: number; text: string; data: Room }[]>([])

onMounted(async () => {
  const roomAll = await RoomService.list({
    filter: { roomInteractType: props.roomInteractType ? props.roomInteractType : undefined },
  })
  roomOptions.value = roomAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (roomId: any) => {
  emit('update:roomId', roomId || 0)
}

const handleSelectItem = (item?: Room) => {
  emit('selectRoom', item)
}
</script>
<template>
  <div v-if="!removeLabelWrapper" class="flex flex-wrap gap-1">
    <span>{{ label }}</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ roomId }})</span>
  </div>
  <div>
    <VueSelect
      :value="roomId"
      :options="roomOptions"
      :required="required"
      @update:value="handleUpdateValue"
      @selectItem="({ data }) => handleSelectItem(data)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
