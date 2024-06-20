<script lang="ts" setup>
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputNumber, InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Procedure, useProcedureStore } from '../../../modules/procedure'
import { VisitApi, VisitStatus } from '../../../modules/visit'
import { VisitProcedure } from '../../../modules/visit-procedure'
import ModalProcedureUpsert from '../../procedure/components/ModalProcedureUpsert.vue'
import { visit } from './visit.ref'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedure = ref(Procedure.blank())
const procedureList = ref<Procedure[]>([])
const procedureStore = useProcedureStore()
const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const visitProcedureList = ref<VisitProcedure[]>([])
watch(
  () => visit.value.visitProcedureList!,
  (newValue: VisitProcedure[]) => {
    visitProcedureList.value = VisitProcedure.cloneList(newValue || [])
  },
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    JSON.stringify(visitProcedureList.value) === JSON.stringify(visit.value.visitProcedureList) ||
    [VisitStatus.Debt, VisitStatus.Completed].includes(visit.value.visitStatus)
  )
})

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
    const visitProcedure = new VisitProcedure()
    visitProcedure.visitId = visit.value.id
    visitProcedure.procedureId = instance.id
    visitProcedure.procedure = Procedure.clone(instance)
    visitProcedure.expectedPrice = instance.price
    visitProcedure.discountMoney = 0
    visitProcedure.discountPercent = 0
    visitProcedure.discountType = DiscountType.VND
    visitProcedure.actualPrice = instance.price
    visitProcedure.quantity = 1
    visitProcedure.createdAt = Date.now()
    visitProcedureList.value.push(visitProcedure)
  }
  procedure.value = Procedure.blank()

  inputSearchProcedure.value?.focus()
}

const changeItemPosition = (index: number, count: number) => {
  const temp = visitProcedureList.value[index]
  visitProcedureList.value[index] = visitProcedureList.value[index + count]
  visitProcedureList.value[index + count] = temp
}

const saveVisitProcedures = async () => {
  await VisitApi.replaceVisitProcedures({
    visitId: visit.value.id,
    customerId: visit.value.customerId || 0,
    visitProcedureList: visitProcedureList.value,
  })
}

const resetVisitDiagnosis = () => {
  visitProcedureList.value = VisitProcedure.cloneList(visit.value.visitProcedureList! || [])
}
</script>
<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="selectProcedure" />
  <div class="flex justify-between">
    <span>Chỉ định dịch vụ</span>
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
      :options="procedureList.map((i) => ({ value: i.id, text: i.name, data: i }))"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[VisitStatus.Completed, VisitStatus.Debt].includes(visit.visitStatus)"
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
  <div class="mt-4">
    <div>Danh sách các dịch vụ, thủ thuật</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="visitProcedureList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(visitProcedure, index) in visitProcedureList"
            :key="visitProcedure.procedureId"
          >
            <td>
              <div class="flex flex-col items-center">
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0"
                  @click="changeItemPosition(index, -1)"
                >
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <span> {{ index + 1 }} </span>
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === visitProcedureList.length - 1"
                  @click="changeItemPosition(index, 1)"
                >
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>{{ visitProcedure.procedure?.name }}</td>
            <td style="width: 150px">
              <div
                v-if="[VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)"
                class="text-center"
              >
                {{ visitProcedure.quantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="visitProcedure.quantity <= 0"
                  @click="visitProcedureList[index].quantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="visitProcedure.quantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="visitProcedureList[index].quantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(visitProcedure.actualPrice) }}</td>
            <td class="text-right">
              {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="![VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)"
                class="text-red-500"
                @click="visitProcedureList.splice(index, 1)"
              >
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    visitProcedureList.reduce((acc, item) => {
                      return (acc += item.expectedPrice * item.quantity)
                    }, 0)
                  )
                }}</b
              >
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-4 flex justify-between">
    <div>
      <!-- <button class="btn" :disabled="disabledButton" @click="resetVisitDiagnosis">
        <UndoOutlined />
        Tải lại
      </button> -->
    </div>
    <button class="btn btn-blue" :disabled="disabledButton" @click="saveVisitProcedures">
      <SaveOutlined /> Lưu lại
    </button>
  </div>
</template>
<script lang="scss" scope></script>
