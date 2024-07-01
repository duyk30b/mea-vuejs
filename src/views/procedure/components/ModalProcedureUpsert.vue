<script setup lang="ts">
import { ExclamationCircleOutlined, SisternodeOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { IconClose } from '../../../common/icon'
import { InputMoney, InputOptions, InputText } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Procedure, useProcedureStore } from '../../../modules/procedure'
import { customFilter } from '../../../utils'
import ModalDataProcedure from './ModalDataProcedure.vue'

const emit = defineEmits<{
  (e: 'success', value: Procedure, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()
const modalDataProcedure = ref<InstanceType<typeof ModalDataProcedure>>()

const procedureStore = useProcedureStore()
const settingStore = useSettingStore()
const { isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const procedure = ref(Procedure.blank())
const saveLoading = ref(false)

const openModal = async (instance?: Procedure) => {
  showModal.value = true
  procedure.value = instance ? Procedure.from(instance) : Procedure.blank()
}

const closeModal = () => {
  procedure.value = Procedure.blank()
  // consumableList.value = []
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!procedure.value.id) {
      const response = await procedureStore.createOne(procedure.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await procedureStore.updateOne(procedure.value.id, procedure.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:73 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await procedureStore.deleteOne(procedure.value.id)
    emit('success', Procedure.from(procedure.value), 'DELETE')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa dịch vụ này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Dịch vụ đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await handleDelete()
    },
    onCancel() {},
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ procedure.id ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới' }}
        </div>
        <div
          v-if="permissionIdMap[PermissionId.SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDataProcedure?.openModal()">
          <SisternodeOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div class="">Tên dịch vụ</div>
          <div class="">
            <InputText v-model:value="procedure.name" required />
          </div>
        </div>
        <div class="mt-3">
          <div class="">Nhóm</div>
          <div>
            <InputOptions
              v-model:value="procedure.group"
              :options="
                Object.entries(settingStore.PROCEDURE_GROUP).map(([value, text]) => ({
                  value,
                  text,
                }))
              "
              :logic-filter="(item: any, text: string) => customFilter(item?.text, text)" />
          </div>
        </div>
        <div class="mt-3">
          <div>Giá dịch vụ</div>
          <div>
            <InputMoney v-model:value="procedure.price" :min="0" style="width: 100%" />
          </div>
        </div>
        <div class="mt-4 flex items-center">
          <div class="">Active</div>
          <div class="ml-4">
            <a-switch
              :checked="Boolean(procedure.isActive)"
              @change="(checked: Boolean) => (procedure.isActive = checked ? 1 : 0)" />
          </div>
          <div v-if="!procedure.isActive" class="ml-4">Dịch vụ này tạm thời không thể sử dụng</div>
        </div>

        <!-- <div class="mt-10 font-bold">
        <DoubleRightOutlined /> Vật tư tiêu hao khi sử dụng dịch vụ
      </div>
      <div class="mt-4">
        <div class="flex items-center">
          <div style="width: 100px; flex: none;">Tên hàng</div>
          <div class="flex-auto">
          </div>
        </div>
        <div class="table-wrapper mt-4">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên hàng hóa</th>
                <th>Số lượng</th>
                <th>Giá bán</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="consumableList.length === 0">
                <td colspan="20" class="text-center">No data</td>
              </tr>
              <tr v-for="(p, i) in consumableList" :key="i">
                <td class="index"></td>
                <td>{{ p.product!.brandName }}</td>
                <td> <InputNumber v-model:value="consumableList[i].quantity" class="w-full" :min="0" /></td>
                <td>{{ }}</td>
                <td class="text-center">
                  <a @click="consumableList.splice(i, 1)" class="text-red-500 text-xl">
                    <DeleteOutlined />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div> -->
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.PROCEDURE_DELETE] && procedure.id"
            color="red"
            icon="trash"
            @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton type="reset" class="ml-auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalDataProcedure
    v-if="permissionIdMap[PermissionId.SETTING_UPSERT]"
    ref="modalDataProcedure" />
</template>
