<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { InputFilter, InputMoney, InputSelect, InputText } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import {
  Position,
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  PositionService,
  PositionType,
  PositionTypeText,
} from '../../../../modules/position'
import { RoleService, type Role } from '../../../../modules/role'
import { keysEnum } from '../../../../utils'

const emit = defineEmits<{
  (e: 'success', value: Position, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])
const positionTypeOptions = keysEnum(PositionType).map((key) => ({
  value: PositionType[key],
  label: PositionTypeText[PositionType[key]],
}))
const commissionCalculatorTypeOptions = keysEnum(CommissionCalculatorType).map((key) => ({
  value: CommissionCalculatorType[key],
  label: CommissionCalculatorTypeText[CommissionCalculatorType[key]],
}))

const position = ref(Position.blank())

const showModal = ref(false)
const saveLoading = ref(false)

onBeforeMount(async () => {
  try {
    const fetchData = await Promise.all([RoleService.list({})])
    const roleList = fetchData[0]

    roleOptions.value = roleList.map((i) => ({ value: i.id, text: i.name, data: i }))
  } catch (error) {
    console.log('🚀 ~ ModalPositionUpsert.vue:45 ~ onBeforeMount ~ error:', error)
  }
})

const openModal = async (positionId?: number) => {
  showModal.value = true
  if (!positionId) {
    position.value = Position.blank()
  } else {
    position.value = await PositionService.detail(positionId, {
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
  position.value = Position.blank()
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!position.value.id) {
      const response = await PositionService.createOne(position.value)
      emit('success', response, 'UPDATE')
    } else {
      const response = await PositionService.updateOne(position.value.id, position.value)
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPositionUpsert.vue:83 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa loại vị trí này',
    content: 'Dữ liệu đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await PositionService.destroyOne(position.value.id)
        if (response.success) {
          emit('success', position.value, 'DESTROY')
          closeModal()
        }
      } catch (error) {
        console.log('🚀 ~ ModalPositionUpsert.vue:101 ~ onOk ~ error:', error)
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
          {{ position.id ? 'Cập nhật thông tin vị trí' : 'Tạo vị trí mới' }}
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
              v-model:value="position.roleId"
              :options="roleOptions"
              :disabled="!!position.id"
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
              v-model:value="position.positionType"
              :options="[
                { value: PositionType.Ticket, label: PositionTypeText[PositionType.Ticket] },
                {
                  value: PositionType.ConsumableList,
                  label: PositionTypeText[PositionType.ConsumableList],
                },
                {
                  value: PositionType.PrescriptionList,
                  label: PositionTypeText[PositionType.PrescriptionList],
                },
              ]"
              :disabled="!!position.id"
            ></InputSelect>
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 200px">
          <template v-if="position.positionType === PositionType.Product">
            <div class="">Sản phẩm</div>
            <div>
              <InputText :value="position.product?.brandName || ''" disabled />
            </div>
          </template>

          <template v-else-if="position.positionType === PositionType.Procedure">
            <div class="">Dịch vụ</div>
            <div>
              <InputText :value="position.procedure?.name || ''" disabled />
            </div>
          </template>

          <template v-else-if="position.positionType === PositionType.Radiology">
            <div class="">Phiếu CĐHA</div>
            <div>
              <InputText :value="position.radiology?.name || ''" disabled />
            </div>
          </template>

          <template v-else-if="position.positionType === PositionType.Laboratory">
            <div class="">Xét nghiệm</div>
            <div>
              <InputText :value="position.laboratory?.name || ''" disabled />
            </div>
          </template>
          <template v-else>
            <div class="">&nbsp;</div>
            <div>
              <InputText :value="position.laboratory?.name || ''" disabled />
            </div>
          </template>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Công thức tính hoa hồng</div>
          <div class="flex">
            <InputSelect
              v-model:value="position.commissionCalculatorType"
              style="width: 200px"
              :options="commissionCalculatorTypeOptions"
            />
            <div style="width: calc(100% - 200px)">
              <InputMoney v-model:value="position.commissionValue" />
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
