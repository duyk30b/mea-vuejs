<script setup lang="ts">
import { ref } from 'vue'
import { IconClose } from '../../../../common/icon-antd'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import { InputNumber, InputText } from '../../../../common/vue-form'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import {
  PrescriptionSample,
  PrescriptionSampleService,
} from '../../../../modules/prescription-sample'
import { MeService } from '@/modules/_me/me.service'

const psList = ref<PrescriptionSample[]>([])

const showModal = ref(false)
const psInsert = ref(PrescriptionSample.blank())
const psUpdate = ref(PrescriptionSample.blank())

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await PrescriptionSampleService.pagination({
      filter: { userId: { IN: [0, MeService.user.value?.id || 0] } },
      page: page.value,
      limit: limit.value,
      sort: { priority: 'ASC' },
    })
    psList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ ModalSelectPrescriptionSample.vue:36 ~ startFetchData ~ error:', error)
  }
}

const openModal = async (psProp: PrescriptionSample) => {
  showModal.value = true
  await startFetchData()
  psInsert.value = PrescriptionSample.from(psProp)
  psInsert.value.priority = total.value + 1
  psInsert.value.userId = MeService.user.value?.id || 0
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

const clear = () => {
  psInsert.value = PrescriptionSample.blank()
  psUpdate.value = PrescriptionSample.blank()
}

const closeModal = () => {
  showModal.value = false
  clear()
}

const clickDestroyPrescriptionSample = async (prescriptionSampleId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa đơn mẫu ?',
    content: [
      '- Đơn mẫu này sẽ bị xóa khỏi hệ thống',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        const indexDestroy = psList.value.findIndex((i) => {
          return i.id === prescriptionSampleId
        })
        if (indexDestroy !== -1) {
          psList.value.splice(indexDestroy, 1)
        }
        await PrescriptionSampleService.destroyOne(prescriptionSampleId)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ clickDestroyPrescriptionSample: ~ error:', error)
      }
    },
  })
}

const clickEditPrescriptionSample = (psProp: PrescriptionSample) => {
  psUpdate.value = PrescriptionSample.from(psProp)
}

const startCreatePrescriptionSample = async () => {
  try {
    await PrescriptionSampleService.createOne(psInsert.value)
    closeModal()
    await PrescriptionSampleService.getAll()
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

const startReplaceMedicines = async (psId: number) => {
  try {
    const result = await PrescriptionSampleService.updateOne(psId, {
      medicines: psInsert.value.medicines,
    })
    const findIndex = psList.value.findIndex((i) => i.id === psId)
    if (findIndex !== -1) {
      psList.value[findIndex] = result
    }
    closeModal()
    await PrescriptionSampleService.getAll()
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

const startUpdatePrescriptionSample = async () => {
  try {
    const result = await PrescriptionSampleService.updateOne(psUpdate.value.id, psUpdate.value)
    const findIndex = psList.value.findIndex((i) => i.id === psUpdate.value.id)
    if (findIndex !== -1) {
      psList.value[findIndex] = result
    }
    psUpdate.value = PrescriptionSample.blank()
    await PrescriptionSampleService.getAll()
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Lưu đơn thuốc mẫu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div>Danh sách đơn mẫu hiện có</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width: 60px">#</th>
                <th style="width: 30px">STT</th>
                <th>Tên</th>
                <th style="width: 40px"></th>
                <th style="width: 40px"></th>
                <th style="width: 40px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="index in limit" :key="index">
                <template v-if="psList[index - 1]">
                  <template v-if="psList[index - 1].id !== psUpdate.id">
                    <td>
                      <div v-if="!psUpdate.id">
                        <VueButton
                          size="small"
                          @click="startReplaceMedicines(psList[index - 1].id)"
                        >
                          Ghi đè
                        </VueButton>
                      </div>
                    </td>
                    <td class="text-center">{{ psList[index - 1].priority }}</td>
                    <td colspan="2" class="text-left">
                      {{ psList[index - 1].name }}
                    </td>
                    <td class="text-center">
                      <a
                        class="text-orange-600"
                        @click="clickEditPrescriptionSample(psList[index - 1])"
                      >
                        <IconEditSquare width="20" height="20" />
                      </a>
                    </td>
                    <td class="text-center">
                      <a
                        v-if="!psUpdate.id"
                        class="text-red-500"
                        @click="clickDestroyPrescriptionSample(psList[index - 1].id)"
                      >
                        <IconDelete width="20" height="20" />
                      </a>
                    </td>
                  </template>
                  <template v-else>
                    <td></td>
                    <td>
                      <input v-model="psUpdate.priority" type="number" style="width: 60px" />
                    </td>
                    <td>
                      <div>
                        <input v-model="psUpdate.name" style="width: 100%" />
                      </div>
                    </td>
                    <td>
                      <div>
                        <VueButton size="small" @click="psUpdate = PrescriptionSample.blank()">
                          Hủy
                        </VueButton>
                      </div>
                    </td>
                    <td colspan="2">
                      <div>
                        <VueButton size="small" color="blue" @click="startUpdatePrescriptionSample">
                          Lưu lại
                        </VueButton>
                      </div>
                    </td>
                  </template>
                </template>
                <template v-else>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td colspan="2">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </template>
              </tr>
            </tbody>
          </table>
          <div class="mt-2 flex justify-end">
            <VuePagination
              v-model:limit="limit"
              v-model:page="page"
              :delta="1"
              :total="total"
              @change="changePagination"
            />
          </div>
        </div>

        <div class="mt-4">
          <form class="flex gap-2" @submit.prevent="startCreatePrescriptionSample">
            <div style="flex-grow: 1">
              <div>Tên đơn mẫu mới</div>
              <div>
                <InputText
                  v-model:value="psInsert.name"
                  required
                  placeholder="Điền tên đơn mẫu tại đây"
                />
              </div>
            </div>
            <div style="width: 150px">
              <div>STT</div>
              <div>
                <InputNumber v-model:value="psInsert.priority" required placeholder="STT" />
              </div>
            </div>
            <div>
              <div>&nbsp;</div>
              <div>
                <VueButton color="blue" icon="save" type="submit">Tạo mới</VueButton>
              </div>
            </div>
          </form>
        </div>

        <div class="mt-6 flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
input {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid #ccc;
  padding: 0 6px;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
