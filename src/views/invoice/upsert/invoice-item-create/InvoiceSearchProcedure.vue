<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { InputOptions } from '../../../../common/vue-form'
import { Procedure, useProcedureStore } from '../../../../modules/procedure'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import ModalProcedureUpsert from '../../../procedure/components/ModalProcedureUpsert.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'

const emit = defineEmits<{ (e: 'selectProcedure', value: Procedure | null): void }>()

const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()
const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const procedureStore = useProcedureStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

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
    emit('selectProcedure', null)
  }
}

const focus = () => {
  procedureList.value = []
  inputSearchProcedure.value?.focus()
}
const clear = () => {
  searchText.value = ''
  procedureList.value = []
  procedure.value = Procedure.blank()
}

const clearAndFocus = () => {
  clear()
  inputSearchProcedure.value?.focus()
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
