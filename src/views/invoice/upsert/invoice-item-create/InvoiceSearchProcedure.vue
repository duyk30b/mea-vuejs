<script setup lang="ts">
import { InputOptions } from '@/common/vue-form'
import { Procedure, useProcedureStore } from '@/modules/procedure'
import { useOrganizationStore } from '@/store/organization.store'
import { onMounted, ref } from 'vue'
import ModalProcedureUpsert from '../../../procedure/components/ModalProcedureUpsert.vue'

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
  await procedureStore.fetchAll()
})

const searchingProcedure = async (text: string) => {
  if (text) {
    procedureList.value = procedureStore.search(text)
  } else {
    procedureList.value = []
  }
}

const selectProcedure = (data?: Procedure) => {
  if (data) {
    searchText.value = data.name
    procedure.value = data

    const dataEmit = Procedure.fromInstance(data)
    emit('selectProcedure', dataEmit)
  } else {
    procedure.value = Procedure.blank()
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
