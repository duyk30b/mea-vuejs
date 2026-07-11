<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import { InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store.ts'
import { Attribute, AttributeApi } from '@/modules/attribute'
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', value: Attribute): void
}>()

const attributeOrigin = ref(Attribute.blank())
const attribute = ref(Attribute.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (attributeProp?: Attribute) => {
  showModal.value = true
  if (attributeProp) {
    attributeOrigin.value = Attribute.from(attributeProp)
  } else {
    attributeOrigin.value = Attribute.blank()
  }
  attribute.value = Attribute.from(attributeOrigin.value)
}

const closeModal = () => {
  attribute.value = Attribute.blank()
  showModal.value = false
}

const hasChangeData = computed(() => {
  if (!Attribute.equal(attributeOrigin.value, attribute.value)) {
    return true
  }

  return false
})

const handleSave = async () => {
  if (!attribute.value.key) {
    return AlertStore.addError('Lỗi: Chưa chọn key')
  }
  try {
    saveLoading.value = true
    const response = await AttributeApi.upsertOne({
      attribute: attribute.value,
    })
    emit('success', response)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: AttributeUpsert.vue:46 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa kho hàng này',
    content: 'Phòng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await AttributeApi.destroyOne({ key: attribute.value.key })
        emit('success', response)
        closeModal()
      } catch (error) {
        console.log('🚀 ~ ModalAttributeUpsert.vue:137 ~ clickDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" @close="closeModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Cài đặt thuôc tính:</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4 flex flex-wrap gap-4">
        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Key</div>
          <div>
            <InputText v-model:value="attribute.key" required />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div class="">Mô tả</div>
          <div class="">
            <InputText v-model:value="attribute.description" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div class="">Ví dụ</div>
          <div class="">
            <InputText v-model:value="attribute.valueExample" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <VueButton color="red" @click="clickDelete">Xóa</VueButton>
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="!hasChangeData"
          >
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
