<script lang="ts" setup>
import { InputSelect, type InputSelectOption } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { Room, RoomInteractType, RoomService, RoomTicketStyle } from '@/modules/room'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectRoom', value: Room | undefined): void
  (e: 'update:roomId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    roomId: number
    roomInteractType?: RoomInteractType
    roomTicketStyle?: RoomTicketStyle
    disabled?: boolean
    required?: boolean
    label?: string
    removeLabelWrapper?: boolean
    autoSelectFirstValue?: boolean
  }>(),
  {
    roomId: 0,
    disabled: false,
    required: false,
    label: 'Chọn phòng',
    removeLabelWrapper: false,
    autoSelectFirstValue: false,
  },
)

const roomOptions = ref<InputSelectOption<Room>[]>([])

onMounted(async () => {
  const roomList = await RoomService.list({
    filter: {
      roomInteractType: props.roomInteractType ? props.roomInteractType : undefined,
      roomStyle: props.roomTicketStyle ? props.roomTicketStyle : undefined,
    },
  })
  roomOptions.value = roomList.map((i) => {
    return { value: i.id, label: i.name, data: i }
  })

  if (props.roomId == 0 && props.autoSelectFirstValue && roomList.length) {
    const firstValue = roomList[0]
    handleUpdateValue(firstValue.id)
    handleSelectItem(firstValue)
  }
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
    <InputSelect
      :value="roomId"
      :options="roomOptions"
      :required="required"
      @update:value="handleUpdateValue"
      @selectItem="(item: any) => handleSelectItem(item.data)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
