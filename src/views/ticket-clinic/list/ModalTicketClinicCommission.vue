<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconTrash } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputNumber } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import {
  Commission,
  CommissionCalculatorType,
  CommissionService,
  InteractType,
} from '../../../modules/commission'
import { Role, RoleService } from '../../../modules/role'
import { DArray } from '../../../utils'

const emit = defineEmits<{ (e: 'success'): void }>()

const commissionListOrigin = ref<Commission[]>([])
const commissionList = ref<Commission[]>([])
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const hasChangeData = computed(() => {
  if (
    !Commission.equalList(
      commissionList.value.filter((i) => !!i.roleId),
      commissionListOrigin.value
    )
  ) {
    return true
  }
  return false
})

const openModal = async () => {
  showModal.value = true

  CommissionService.list({ filter: { interactType: InteractType.Ticket } })
    .then((result) => {
      commissionListOrigin.value = Commission.fromList(result)
      commissionList.value = result
      if (commissionList.value?.length == 0) {
        handleAddCommission()
      }
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalTicketClinicCommission.vue:27 ~ CommissionService ~ e:', e)
    })

  RoleService.list({})
    .then((result) => {
      roleOptions.value = result.map((i) => ({ value: i.id, text: i.name, data: i }))
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalTicketClinicCommission.vue:38 ~ RoleService ~ e:', e)
    })
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  if (DArray.checkDuplicate(commissionList.value, 'roleId')) {
    return AlertStore.addError('Không thể có 2 bản ghi trùng vai trò', 2000)
  }

  saveLoading.value = true
  try {
    await CommissionService.replaceList({
      filter: { interactType: InteractType.Ticket },
      commissionData: commissionList.value.filter((i) => !!i.roleId),
    })
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 500)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketClinicCommission.vue:57 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleAddCommission = () => {
  const commissionBlank = Commission.blank()
  commissionBlank.interactId = 0
  commissionBlank.interactType = InteractType.Ticket
  commissionBlank.commissionCalculatorType = CommissionCalculatorType.VND
  commissionList.value!.push(commissionBlank)
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Phòng khám: Vai trò và hoa hồng
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="pb-20 px-4 table-wrapper">
        <div
          v-for="(commission, index) in commissionList"
          :key="index"
          class="mt-4 flex flex-wrap gap-2">
          <div style="flex-grow: 1; flex-basis: 250px">
            <div>Vai trò</div>
            <div>
              <InputFilter
                v-model:value="commissionList![index].roleId"
                :options="roleOptions"
                :maxHeight="120">
                <template #option="{ item: { data } }">{{ data.name }}</template>
              </InputFilter>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 100px">
            <div>Hoa hồng</div>
            <div>
              <InputNumber
                :value="commission.commissionValue"
                append="VNĐ"
                @update:value="(v: number) => (commissionList![index].commissionValue = v)" />
            </div>
          </div>
          <div style="width: 30px">
            <div>&nbsp;</div>
            <div class="pt-2 flex justify-center">
              <a style="color: var(--text-red)" @click="commissionList!.splice(index, 1)">
                <IconTrash width="18" height="18" />
              </a>
            </div>
          </div>
        </div>

        <div class="mt-2">
          <a @click="handleAddCommission">✚ Thêm vai trò</a>
        </div>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" class="ml-auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton
            icon="save"
            color="blue"
            :loading="saveLoading"
            :disabled="!hasChangeData"
            @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
