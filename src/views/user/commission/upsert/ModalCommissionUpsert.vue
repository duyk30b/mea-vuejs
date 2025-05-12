<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { InputMoney, InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import {
  Commission,
  CommissionApi,
  CommissionCalculatorType,
  InteractType,
  InteractTypeText,
  CommissionService,
} from '../../../../modules/commission'
import { Role, RoleService } from '../../../../modules/role'
import { keysEnum } from '../../../../utils'

const emit = defineEmits<{
  (e: 'success', value: Commission, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const commission = ref(Commission.blank())
const saveLoading = ref(false)

const openModal = async (commissionId: number) => {
  showModal.value = true
  commission.value = await CommissionService.detail(commissionId, {
    relation: {
      role: true,
      procedure: true,
      product: true,
      laboratory: true,
      radiology: true,
    },
  })
}

const closeModal = () => {
  showModal.value = false
  commission.value = Commission.blank()
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const response = await CommissionService.updateOne(commission.value.id, commission.value)
    emit('success', response, 'UPDATE')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCommissionUpsert.vue:80 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa loại tiền hoa hồng này',
    content: 'Tiền hoa hồng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await CommissionService.destroyOne(commission.value.id)
        if (response.success) {
          emit('success', commission.value, 'DESTROY')
          closeModal()
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalCommissionUpsert.vue:109 ~ clickDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ commission.id ? 'Cập nhật thông tin tiền hoa hồng' : 'Tạo tiền hoa hồng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 90%; flex-grow: 1">
          <div class="">Vai trò</div>
          <div>
            <InputText :value="commission.role?.name || ''" disabled />
          </div>
        </div>

        <div
          v-if="commission.interactType === InteractType.Ticket"
          style="flex-basis: 90%; flex-grow: 1">
          <div class="">Phiếu</div>
          <div>
            <InputText value="Phiếu khám" disabled />
          </div>
        </div>

        <div
          v-if="commission.interactType === InteractType.Product"
          style="flex-basis: 90%; flex-grow: 1">
          <div class="">Sản phẩm</div>
          <div>
            <InputText :value="commission.product?.brandName || ''" disabled />
          </div>
        </div>

        <div
          v-if="commission.interactType === InteractType.Procedure"
          style="flex-basis: 90%; flex-grow: 1">
          <div class="">Dịch vụ</div>
          <div>
            <InputText :value="commission.procedure?.name || ''" disabled />
          </div>
        </div>

        <div
          v-if="commission.interactType === InteractType.Radiology"
          style="flex-basis: 90%; flex-grow: 1">
          <div class="">Phiếu CĐHA</div>
          <div>
            <InputText :value="commission.radiology?.name || ''" disabled />
          </div>
        </div>

        <div
          v-if="commission.interactType === InteractType.Laboratory"
          style="flex-basis: 90%; flex-grow: 1">
          <div class="">Xét nghiệm</div>
          <div>
            <InputText :value="commission.laboratory?.name || ''" disabled />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Công thức tính hoa hồng</div>
          <div class="flex">
            <VueSelect
              v-model:value="commission.commissionCalculatorType"
              style="width: 200px"
              :options="[
                { value: CommissionCalculatorType.VND, text: 'VNĐ' },
                { value: CommissionCalculatorType.PercentExpected, text: '% Giá niêm yết' },
                { value: CommissionCalculatorType.PercentActual, text: '% Giá sau chiết khấu' },
              ]" />
            <div style="width: calc(100% - 200px)">
              <InputMoney v-model:value="commission.commissionValue" />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 mt-10">
        <div class="flex gap-4">
          <VueButton color="red" type="button" @click="clickDelete">Xóa</VueButton>
          <VueButton style="margin-left: auto" type="reset" @click="closeModal">
            <template #icon>
              <CloseOutlined />
            </template>
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
