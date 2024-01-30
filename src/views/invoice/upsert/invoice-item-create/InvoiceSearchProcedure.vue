<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { InputOptions } from '../../../../common/vue-form'
import { Procedure, useProcedureStore } from '../../../../modules/procedure'
import { useOrganizationStore } from '../../../../store/organization.store'
import ModalProcedureUpsert from '../../../procedure/components/ModalProcedureUpsert.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'

const emit = defineEmits<{ (e: 'selectProcedure', value: Procedure): void }>()

const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()
const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore
const procedureStore = useProcedureStore()

const searchText = ref('')
const procedure = ref(Procedure.blank())
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

const selectProcedure = (instance?: Procedure) => {
  if (instance) {
    searchText.value = instance.name
    procedure.value = instance

    const dataEmit = Procedure.fromInstance(instance)
    emit('selectProcedure', dataEmit)
  } else {
    procedure.value = Procedure.blank()
    searchText.value = ''
    // emit('selectProcedure', Procedure.blank())
  }
}

const focus = () => {
  clear()
  inputSearchProcedure.value?.focus()
}
const clear = () => {
  searchText.value = ''
  procedureList.value = []
  procedure.value = Procedure.blank()
}

defineExpose({ focus, clear })
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="selectProcedure" />
  <div>
    <div class="flex justify-between">
      <span>Tên dịch vụ</span>
      <a @click="modalProcedureUpsert?.openModal()">Thêm dịch vụ mới</a>
    </div>
    <div style="height: 40px">
      <InputOptions
        ref="inputSearchProcedure"
        v-model:searchText="searchText"
        :options="procedureList"
        :maxHeight="320"
        placeholder="(F3) Tìm kiếm tên dịch vụ"
        @selectItem="selectProcedure"
        @update:searchText="searchingProcedure"
      >
        <template #each="{ item: { name, price } }">
          <div>
            <b>{{ name }}</b> - {{ formatMoney(price) }}
          </div>
        </template>
      </InputOptions>
    </div>
  </div>
</template>

<style lang="scss"></style>
