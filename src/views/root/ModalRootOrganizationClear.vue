<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputCheckbox } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../common/vue-modal/vue-modal.store'
import { Organization } from '../../modules/organization'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const saveLoading = ref(false)

const tableNameClearMapDefault = {
  Customer: 0,
  Distributor: 0,
  Image: 0,
  Product: 0,
}
const tableNameDeleteMapDefault = {
  Organization: 0,
  User: 0,
  Appointment: 1,
  Batch: 1,
  Commission: 1,
  Customer: 0,
  CustomerPayment: 1,
  CustomerSource: 0,
  Distributor: 0,
  DistributorPayment: 1,
  Image: 0,
  Laboratory: 0,
  LaboratoryGroup: 0,
  LaboratoryKit: 0,
  PrescriptionSample: 0,
  PrintHtml: 0,
  Procedure: 0,
  ProcedureGroup: 0,
  Product: 0,
  ProductGroup: 0,
  ProductMovement: 1,
  Radiology: 0,
  RadiologyGroup: 0,
  Receipt: 1,
  ReceiptItem: 1,
  Role: 0,
  Setting: 0,
  Ticket: 1,
  TicketAttribute: 1,
  TicketBatch: 1,
  TicketExpense: 1,
  TicketLaboratory: 1,
  TicketLaboratoryGroup: 1,
  TicketLaboratoryResult: 1,
  TicketProcedure: 1,
  TicketProduct: 1,
  TicketRadiology: 1,
  TicketSurcharge: 1,
  TicketUser: 1,
  UserRole: 0,
  PaymentMethod: 0,
  Warehouse: 0,
}
const tableNameClearMap = ref({
  ...tableNameClearMapDefault,
})
const tableNameDeleteMap = ref({
  ...tableNameDeleteMapDefault,
})

const openModal = async (organizationProp: Organization) => {
  showModal.value = true
  organization.value = organizationProp
}

const closeModal = () => {
  showModal.value = false
  organization.value = Organization.blank()
  tableNameClearMap.value = { ...tableNameClearMapDefault }
  tableNameDeleteMap.value = { ...tableNameDeleteMapDefault }
  saveLoading.value = false
}

const startClear = async () => {
  const tableNameDeleteList = Object.keys(tableNameDeleteMap.value).filter((i) => {
    const key = i as keyof typeof tableNameDeleteMap.value
    return tableNameDeleteMap.value[key] === 1
  })
  const tableNameClearList = Object.keys(tableNameClearMap.value).filter((i) => {
    const key = i as keyof typeof tableNameClearMap.value
    return tableNameClearMap.value[key] === 1
  })
  if (tableNameDeleteList.length === 0 && tableNameClearList.length === 0) {
    AlertStore.addError('Bạn chưa chọn bảng nào để xóa hoặc làm sạch')
    return
  }

  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa DATA của cơ sở: ' + organization.value.name,
    content: 'Bạn đã cân nhắc lại một lần nữa trước khi xóa chưa ?',
    async onOk() {
      try {
        saveLoading.value = true
        await RootOrganizationApi.clearOne(organization.value.id, {
          tableNameDeleteList,
          tableNameClearList,
        })
        emit('success')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ startClear ~ error:', error)
      } finally {
        saveLoading.value = false
      }
    },
  })
}

const removeAllSelected = () => {
  for (const key in tableNameClearMap.value) {
    tableNameClearMap.value[key as keyof typeof tableNameClearMap.value] = 0
  }
  for (const key in tableNameDeleteMap.value) {
    tableNameDeleteMap.value[key as keyof typeof tableNameDeleteMap.value] = 0
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1200px">
    <form class="bg-white" @submit.prevent="startClear">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Clear Data: {{ organization.name }}</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div>
          <VueButton icon="close" @click="removeAllSelected">Bỏ chọn tất cả</VueButton>
        </div>

        <div class="mt-4">
          <h2 class="italic">
            1. Chọn bảng Database cần update sạch (quantity = 0 hoặc deb = 0,...)
          </h2>
          <div class="mt-4 flex flex-wrap gap-4">
            <div v-for="(v, key) in tableNameClearMap" :key="key" style="width: 22%">
              <InputCheckbox v-model:value="tableNameClearMap[key]" type-parser="number">
                <span>{{ key }}</span>
              </InputCheckbox>
            </div>
          </div>
        </div>

        <div class="mt-10">
          <h2 class="italic">2. Chọn bảng Database cần xóa</h2>
          <div class="mt-4 flex flex-wrap gap-4">
            <div v-for="(v, key) in tableNameDeleteMap" :key="key" style="width: 22%">
              <InputCheckbox v-model:value="tableNameDeleteMap[key]" type-parser="number">
                <span
                  :style="
                    ['Organization', 'User'].includes(key)
                      ? { fontWeight: 'bold', color: 'red', textTransform: 'uppercase' }
                      : {}
                  "
                >
                  {{ key }}
                </span>
              </InputCheckbox>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <VueButton style="margin-left: auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="red" type="submit" :loading="saveLoading" icon="save">
            Bắt đầu xóa
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped>
:deep(.ant-checkbox-group) {
  width: 100%;
  display: flex;
  flex-wrap: wrap;

  & > div {
    width: 30%;
  }
}
</style>
