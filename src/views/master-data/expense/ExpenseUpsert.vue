<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputText, VueSwitch } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { Expense, ExpenseService } from '../../../modules/expense'
import { PermissionId } from '../../../modules/permission/permission.enum'

const emit = defineEmits<{
  (e: 'success', value: Expense, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const { userPermission } = MeService

const showModal = ref(false)
const expense = ref(Expense.blank())
const saveLoading = ref(false)

const openModal = async (expenseId?: number) => {
  showModal.value = true
  if (expenseId) {
    expense.value = await ExpenseService.detail(expenseId)
  } else {
    expense.value = Expense.blank()
  }
}

const closeModal = () => {
  expense.value = Expense.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!expense.value.id) {
      const response = await ExpenseService.createOne(expense.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await ExpenseService.updateOne(expense.value.id, expense.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalExpenseUpsert.vue:52 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa chi phí này này',
    content: 'Phụ phí đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await ExpenseService.destroyOne(expense.value.id)
        if (response.success) {
          emit('success', expense.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa phương thích thanh toán này',
            content: ['Có lỗi xảy ra, vui lòng liên hệ admin để được hỗ trợ'],
          })
        }
      } catch (error) {
        console.log('🚀 ~ ModalExpenseUpsert.vue:77 ~ onOk ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ expense.id ? 'Cập nhật chi phí' : 'Tạo chi phí mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Mã chi phí</div>
          <div>
            <InputText v-model:value="expense.code" placeholder="Tạo tự động" />
          </div>
        </div>
        <div class="mt-4">
          <div>Tên chi phí</div>
          <div>
            <InputText v-model:value="expense.name" required />
          </div>
        </div>
        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="expense.isActive" type-parser="number" />
          </div>
          <div v-if="!expense.isActive" class="ml-4">Tạm thời không thể sử dụng chi phí này</div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE] && expense.id"
            color="red"
            @click="clickDelete"
          >
            Xóa
          </VueButton>
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
