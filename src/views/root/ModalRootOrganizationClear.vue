<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../common/vue-modal/vue-modal.store'
import { Organization } from '../../modules/organization'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const saveLoading = ref(false)

const tableNameMap: Record<string, any> = {
  Appointment: 1,
  Batch: 1,
  BatchMovement: 1,
  Customer: 1,
  CustomerPayment: 1,
  CustomerSource: 1,
  Distributor: 1,
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
  TicketAttribute: 1,
  TicketDiagnosis: 1,
  TicketExpense: 1,
  TicketLaboratory: 1,
  TicketProcedure: 1,
  TicketProduct: 1,
  TicketRadiology: 1,
  TicketSurcharge: 1,
  TicketUser: 1,
  Ticket: 1,
  UserRole: 0,
  Warehouse: 0,
}

const tableNameAll = Object.keys(tableNameMap)

const tableNameListClear = ref<string[]>(
  Object.keys(tableNameMap).filter((i) => {
    return tableNameMap[i] === 1
  })
)

const openModal = async (organizationProp: Organization) => {
  showModal.value = true
  organization.value = organizationProp
}

const closeModal = () => {
  organization.value = Organization.blank()
  showModal.value = false
}

const startClear = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa DATA của cơ sở: ' + organization.value.name,
    content: 'Bạn đã cân nhắc lại một lần nữa trước khi xóa chưa ?',
    async onOk() {
      try {
        await RootOrganizationApi.clearOne(organization.value.id, {
          tableNameList: tableNameListClear.value,
        })
        emit('success')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ startClear ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="startClear">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Clear Data: {{ organization.name }}</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div>Chọn bảng Database cần xóa</div>
        <div class="mt-4">
          <a-checkbox-group v-model:value="tableNameListClear">
            <div>
              <a-checkbox value="Organization">
                <span style="font-weight: bold; color: red">ORGANIZATION</span>
              </a-checkbox>
            </div>
            <div>
              <a-checkbox value="User">
                <span style="font-weight: bold; color: red">USER</span>
              </a-checkbox>
            </div>
            <div v-for="tableName in tableNameAll" :key="tableName" class="mb-3">
              <a-checkbox :value="tableName">{{ tableName }}</a-checkbox>
            </div>
          </a-checkbox-group>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <VueButton class="ml-auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
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
