<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { InvoiceItem, InvoiceItemType } from '../../../../modules/invoice-item/invoice-item.model'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, useProcedureStore } from '../../../../modules/procedure'
import ModalProcedureUpsert from '../../../procedure/components/ModalProcedureUpsert.vue'
import { invoiceItem } from './invoice-item.ref'

const inputOptionsProcedure = ref<InstanceType<typeof InputOptions>>()
const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()

const props = withDefaults(defineProps<{ tabsKey: 'product' | 'procedure' }>(), {
  tabsKey: 'product',
})

const emit = defineEmits<{ (e: 'createInvoiceItemProcedure'): void }>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const procedureStore = useProcedureStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedureList = ref<Procedure[]>([])

onMounted(async () => {
  try {
    await procedureStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingProcedure = async (text: string) => {
  procedureList.value = await procedureStore.search(text)
}

const selectProcedure = (procedure: Procedure) => {
  createInvoiceItemProcedure(procedure)
}

const createInvoiceItemProcedure = (procedure?: Procedure) => {
  const ii = InvoiceItem.blank()
  if (procedure) {
    ii.procedureId = procedure.id
    ii.batchId = 0
    ii.productId = 0
    ii.type = InvoiceItemType.Procedure
    ii.procedure = procedure

    ii.unitRate = 1
    ii.expectedPrice = procedure.price
    ii.actualPrice = procedure.price
    ii.quantity = 1
  }
  invoiceItem.value = ii
  emit('createInvoiceItemProcedure')
}

const focus = () => {
  procedureList.value = []
  inputOptionsProcedure.value?.focus()
}
const clear = () => {
  procedureList.value = []
  inputOptionsProcedure.value?.clear()
}

const clearAndFocus = () => {
  procedureList.value = []
  inputOptionsProcedure.value?.clear()
  inputOptionsProcedure.value?.focus()
}

defineExpose({ focus, clear, clearAndFocus })
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="selectProcedure" />
  <div>
    <div class="flex justify-between">
      <span>Tên dịch vụ</span>
      <span>
        <a
          v-if="permissionIdMap[PermissionId.PROCEDURE_CREATE]"
          @click="modalProcedureUpsert?.openModal()"
        >
          Thêm dịch vụ mới
        </a>
      </span>
    </div>
    <div style="height: 40px">
      <InputOptions
        ref="inputOptionsProcedure"
        :options="procedureList.map((i) => ({ value: i.id, text: i.name, data: i }))"
        :required="tabsKey === 'procedure'"
        :maxHeight="320"
        placeholder="(F3) Tìm kiếm tên dịch vụ"
        @selectItem="({ data }) => selectProcedure(data)"
        @update:text="searchingProcedure"
      >
        <template #option="{ item: { data } }">
          <div>
            <b>{{ data.name }}</b> - {{ formatMoney(data.price) }}
          </div>
        </template>
      </InputOptions>
    </div>
  </div>
</template>

<style lang="scss"></style>
