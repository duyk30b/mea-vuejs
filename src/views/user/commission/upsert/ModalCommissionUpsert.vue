<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import {
  InputFilter,
  InputMoney,
  InputSelect,
  InputText,
  VueSelect,
} from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import {
  Commission,
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  CommissionService,
  InteractType,
  InteractTypeText,
} from '../../../../modules/commission'
import { RoleService, type Role } from '../../../../modules/role'
import { keysEnum } from '../../../../utils'

const emit = defineEmits<{
  (e: 'success', value: Commission, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])
const interactTypeOptions = keysEnum(InteractType).map((key) => ({
  value: InteractType[key],
  label: InteractTypeText[InteractType[key]],
}))
const commissionCalculatorTypeOptions = keysEnum(CommissionCalculatorType).map((key) => ({
  value: CommissionCalculatorType[key],
  label: CommissionCalculatorTypeText[CommissionCalculatorType[key]],
}))

const commission = ref(Commission.blank())

const showModal = ref(false)
const saveLoading = ref(false)

onBeforeMount(async () => {
  try {
    const fetchData = await Promise.all([RoleService.list({})])
    const roleList = fetchData[0]

    roleOptions.value = roleList.map((i) => ({ value: i.id, text: i.name, data: i }))
  } catch (error) {
    console.log('🚀 ~ ModalCommissionUpsert.vue:38 ~ onBeforeMount ~ error:', error)
  }
})

const openModal = async (commissionId?: number) => {
  showModal.value = true
  if (!commissionId) {
    commission.value = Commission.blank()
  } else {
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
}

const closeModal = () => {
  showModal.value = false
  commission.value = Commission.blank()
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!commission.value.id) {
      const response = await CommissionService.createOne(commission.value)
      emit('success', response, 'UPDATE')
    } else {
      const response = await CommissionService.updateOne(commission.value.id, commission.value)
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCommissionUpsert.vue:80 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa loại vị trí này',
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
          {{ commission.id ? 'Cập nhật thông tin vị trí' : 'Tạo vị trí mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 90%; flex-grow: 1">
          <div class="">Vai trò</div>
          <div>
            <InputFilter
              v-model:value="commission.roleId"
              :options="roleOptions"
              :disabled="!!commission.id"
              :maxHeight="120"
            >
              <template #option="{ item: { data } }">{{ data.name }}</template>
            </InputFilter>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 45%; min-width: 200px">
          <div>Loại tương tác</div>
          <div>
            <InputSelect
              v-model:value="commission.interactType"
              :options="[
                { value: InteractType.Ticket, label: InteractTypeText[InteractType.Ticket] },
                {
                  value: InteractType.ConsumableList,
                  label: InteractTypeText[InteractType.ConsumableList],
                },
                {
                  value: InteractType.PrescriptionList,
                  label: InteractTypeText[InteractType.PrescriptionList],
                },
              ]"
              :disabled="!!commission.id"
            ></InputSelect>
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 200px">
          <template v-if="commission.interactType === InteractType.Product">
            <div class="">Sản phẩm</div>
            <div>
              <InputText :value="commission.product?.brandName || ''" disabled />
            </div>
          </template>

          <template v-else-if="commission.interactType === InteractType.Procedure">
            <div class="">Dịch vụ</div>
            <div>
              <InputText :value="commission.procedure?.name || ''" disabled />
            </div>
          </template>

          <template v-else-if="commission.interactType === InteractType.Radiology">
            <div class="">Phiếu CĐHA</div>
            <div>
              <InputText :value="commission.radiology?.name || ''" disabled />
            </div>
          </template>

          <template v-else-if="commission.interactType === InteractType.Laboratory">
            <div class="">Xét nghiệm</div>
            <div>
              <InputText :value="commission.laboratory?.name || ''" disabled />
            </div>
          </template>
          <template v-else>
            <div class="">&nbsp;</div>
            <div>
              <InputText :value="commission.laboratory?.name || ''" disabled />
            </div>
          </template>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Công thức tính hoa hồng</div>
          <div class="flex">
            <InputSelect
              v-model:value="commission.commissionCalculatorType"
              style="width: 200px"
              :options="commissionCalculatorTypeOptions"
            />
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
              <IconClose />
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
