<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { InputMoney, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Role, RoleService } from '../../../../modules/role'
import {
  CommissionCalculatorType,
  RoleCommission,
  RoleCommissionApi,
  RoleCommissionService,
  RoleInteractType,
  RoleInteractTypeText,
  RoleScreenType,
  RoleScreenTypeText,
} from '../../../../modules/role-commission'
import { keysEnum, objectEnum } from '../../../../utils'

const emit = defineEmits<{
  (e: 'success', value: RoleCommission, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const roleCommission = ref(RoleCommission.blank())
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])
const saveLoading = ref(false)

const openModal = async (roleCommissionId?: number) => {
  showModal.value = true
  if (!roleCommissionId) {
    roleCommission.value = RoleCommission.blank()
  } else {
    roleCommission.value = await RoleCommissionApi.detail(roleCommissionId)
  }
  const roleList = await RoleService.list({})
  roleOptions.value = roleList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const closeModal = () => {
  showModal.value = false
  roleCommission.value = RoleCommission.blank()
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!roleCommission.value.id) {
      const response = await RoleCommissionService.createOne(roleCommission.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await RoleCommissionService.updateOne(
        roleCommission.value.id,
        roleCommission.value
      )
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalRoleCommissionUpsert.vue:80 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa nhà cung cấp này',
    content: 'Nhà cung cấp đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await RoleCommissionService.destroyOne(roleCommission.value.id)
        if (response.success) {
          emit('success', roleCommission.value, 'DESTROY')
          closeModal()
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalRoleCommissionUpsert.vue:109 ~ clickDelete ~ error:', error)
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
          {{ roleCommission.id ? 'Cập nhật thông tin vị trí' : 'Tạo vị trí mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 90%; flex-grow: 1">
          <div class="">Loại tương tác</div>
          <div>
            <VueSelect
              v-model:value="roleCommission.roleInteractType"
              :options="
                keysEnum(RoleInteractType).map((i) => ({
                  value: RoleInteractType[i],
                  text: RoleInteractTypeText[i],
                }))
              " />
          </div>
        </div>
        <div style="flex-basis: 90%; flex-grow: 1">
          <div class="">Vai trò</div>
          <div>
            <VueSelect v-model:value="roleCommission.roleId" :options="roleOptions" />
          </div>
        </div>

        <div
          v-if="roleCommission.roleInteractType === RoleInteractType.Ticket"
          style="flex-basis: 90%; flex-grow: 1">
          <div class="">Màn hình</div>
          <div>
            <VueSelect
              v-model:value="roleCommission.itemId"
              :options="
                keysEnum(RoleScreenType).map((i) => ({
                  value: RoleScreenType[i],
                  text: RoleScreenTypeText[i],
                }))
              " />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Công thức tính hoa hồng</div>
          <div class="flex">
            <VueSelect
              v-model:value="roleCommission.commissionCalculatorType"
              style="width: 200px"
              :options="[
                { value: CommissionCalculatorType.VND, text: 'VNĐ' },
                { value: CommissionCalculatorType.PercentTotal, text: '% Doanh Thu' },
                { value: CommissionCalculatorType.PercentProfit, text: '% Lãi' },
              ]" />
            <div style="width: calc(100% - 200px)">
              <InputMoney v-model:value="roleCommission.commissionValue" />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 mt-20">
        <div class="flex gap-4">
          <VueButton color="red" type="button" @click="clickDelete">Xóa</VueButton>
          <VueButton class="ml-auto" type="reset" @click="closeModal">
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
