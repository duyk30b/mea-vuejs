<script setup lang="ts">
import InputSearchLaboratory from '@/views/component/InputSearchLaboratory.vue'
import InputSearchLaboratoryGroup from '@/views/component/InputSearchLaboratoryGroup.vue'
import InputSearchProcedure from '@/views/component/InputSearchProcedure.vue'
import InputSearchProduct from '@/views/component/InputSearchProduct.vue'
import InputSearchRadiology from '@/views/component/InputSearchRadiology.vue'
import InputSearchRole from '@/views/component/InputSearchRole.vue'
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { InputMoney, InputNumber, InputRadio, InputSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import {
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  Position,
  PositionService,
  PositionType,
  PositionTypeText,
} from '../../../../modules/position'
import { ESTypescript } from '../../../../utils'
import InputSearchRegimen from '@/views/component/InputSearchRegimen.vue'

const emit = defineEmits<{
  (e: 'success', type: 'CREATE' | 'UPDATE' | 'DESTROY', value: Position): void
}>()

const mode = ref<'UPDATE' | 'CREATE' | 'UPDATE_API' | 'CREATE_API'>('CREATE_API')

const positionTypeOptions = ESTypescript.keysEnum(PositionType).map((key) => ({
  value: PositionType[key],
  label: PositionTypeText[PositionType[key]],
}))
const commissionCalculatorTypeOptions = ESTypescript.keysEnum(CommissionCalculatorType).map(
  (key) => ({
    value: CommissionCalculatorType[key],
    label: CommissionCalculatorTypeText[CommissionCalculatorType[key]],
  }),
)

let positionOrigin = Position.blank()
const position = ref(Position.blank())

const checkAllInteract = ref(false)
const requiredInteract = ref<{
  positionType: PositionType
  positionInteractId: number
} | null>(null)

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (options: {
  position?: Position
  requiredInteract?: {
    positionType: PositionType
    positionInteractId: number
  }
  mode: 'UPDATE' | 'CREATE' | 'UPDATE_API' | 'CREATE_API'
}) => {
  showModal.value = true
  mode.value = options.mode
  position.value = options.position ? Position.from(options.position) : Position.blank()

  if (options.requiredInteract) {
    position.value.positionType = options.requiredInteract.positionType
    position.value.positionInteractId = options.requiredInteract.positionInteractId
    requiredInteract.value = options.requiredInteract
  } else {
    requiredInteract.value = null
  }
  checkAllInteract.value = !position.value.positionInteractId
}

const closeModal = () => {
  showModal.value = false
  positionOrigin = Position.blank()
  position.value = Position.blank()

  requiredInteract.value = null
  checkAllInteract.value = false
}

const hasChangeData = computed(() => {
  return !Position.equal(positionOrigin, position.value)
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (mode.value === 'CREATE_API') {
      const response = await PositionService.createOne(position.value)
      emit('success', 'CREATE', response)
    }
    if (mode.value === 'UPDATE_API') {
      const response = await PositionService.updateOne(position.value.id, position.value)
      emit('success', 'UPDATE', response)
    }
    if (mode.value === 'CREATE') {
      emit('success', 'CREATE', position.value)
    }
    if (mode.value === 'UPDATE') {
      emit('success', 'UPDATE', position.value)
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
          emit('success', 'DESTROY', position.value)
          closeModal()
        }
      } catch (error) {
        console.log('🚀 ~ ModalPositionUpsert.vue:101 ~ onOk ~ error:', error)
      }
    },
  })
}

const changeCheckboxAll = (v: any) => {
  if (v) {
    position.value.positionInteractId = 0
  }
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
        <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Loại vị trí</div>
          <div>
            <InputSelect
              v-model:value="position.positionType"
              :options="positionTypeOptions"
              :disabled="!!position.id || !!requiredInteract"
            ></InputSelect>
          </div>
        </div>

        <div v-if="!requiredInteract" style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Loại áp dụng</div>
          <div class="flex items-center">
            <InputRadio
              v-model:value="checkAllInteract"
              :disabled="!!position.id || !!requiredInteract"
              @update:value="changeCheckboxAll"
              :options="[
                { key: true, label: 'Tất cả ' },
                { key: false, label: 'Chọn lẻ' },
              ]"
            />
          </div>
        </div>

        <div style="flex-basis: 95%; flex-grow: 1; min-width: 300px">
          <template v-if="checkAllInteract">
            <!-- <div><InputText :value="''" disabled /></div> -->
          </template>
          <template v-else>
            <template v-if="position.positionType === PositionType.ProductRequest">
              <InputSearchProduct
                v-model:productId="position.positionInteractId"
                required
                :disabled="!!position.id || !!requiredInteract"
                :showQuantity="false"
                :showEditProduct="false"
              />
            </template>
            <template v-if="[PositionType.RegimenRequest].includes(position.positionType)">
              <InputSearchRegimen
                v-model:regimenId="position.positionInteractId"
                required
                :disabled="!!position.id || !!requiredInteract"
              />
            </template>
            <template
              v-if="
                [PositionType.ProcedureRequest, PositionType.ProcedureResult].includes(
                  position.positionType,
                )
              "
            >
              <InputSearchProcedure
                v-model:procedureId="position.positionInteractId"
                required
                :disabled="!!position.id || !!requiredInteract"
              />
            </template>
            <template v-if="[PositionType.LaboratoryRequest].includes(position.positionType)">
              <InputSearchLaboratory
                v-model:laboratoryId="position.positionInteractId"
                required
                :disabled="!!position.id || !!requiredInteract"
              />
            </template>
            <template
              v-if="
                [PositionType.LaboratoryGroupRequest, PositionType.LaboratoryGroupResult].includes(
                  position.positionType,
                )
              "
            >
              <InputSearchLaboratoryGroup
                v-model:laboratoryGroupId="position.positionInteractId"
                required
                :disabled="!!position.id || !!requiredInteract"
              />
            </template>
            <template
              v-if="
                [PositionType.RadiologyRequest, PositionType.RadiologyResult].includes(
                  position.positionType,
                )
              "
            >
              <InputSearchRadiology
                v-model:radiologyId="position.positionInteractId"
                required
                :disabled="!!position.id || !!requiredInteract"
              />
            </template>
          </template>
        </div>

        <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <InputSearchRole
            v-model:roleId="position.roleId"
            :disabled="!!position.id"
          ></InputSearchRole>
        </div>

        <div style="flex-grow: 1; flex-basis: 45%; min-width: 300px">
          <div>Độ ưu tiên</div>
          <div>
            <InputNumber v-model:value="position.priority" />
          </div>
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
          <div>
            <VueButton v-if="mode === 'UPDATE_API'" color="red" type="button" @click="clickDelete">
              Xóa
            </VueButton>
          </div>
          <VueButton style="margin-left: auto" type="reset" @click="closeModal">
            <template #icon>
              <IconClose />
            </template>
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
