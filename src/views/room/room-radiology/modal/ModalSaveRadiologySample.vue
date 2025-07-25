<script setup lang="ts">
import { ref } from 'vue'
import { IconClose } from '@/common/icon-antd'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { InputNumber, InputText } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueModal from '@/common/vue-modal/VueModal.vue'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { RadiologySample, RadiologySampleService } from '@/modules/radiology-sample'
import { MeService } from '@/modules/_me/me.service'

const radiologySampleList = ref<RadiologySample[]>([])

const showModal = ref(false)
const radiologySampleInsert = ref(RadiologySample.blank())
const radiologySampleUpdate = ref(RadiologySample.blank())

const radiologyId = ref(0)
const userId = ref(0)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await RadiologySampleService.pagination({
      filter: {
        radiologyId: radiologyId.value ? { IN: [radiologyId.value, 0] } : undefined,
        userId: userId.value ? { IN: [userId.value, 0] } : undefined,
      },
      page: page.value,
      limit: limit.value,
      sort: { id: 'ASC' },
    })
    radiologySampleList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ ModalSelectRadiologySample.vue:36 ~ startFetchData ~ error:', error)
  }
}

const openModal = async (options: { radiologyId: number; radiologySample: RadiologySample }) => {
  showModal.value = true
  radiologyId.value = options.radiologyId
  userId.value = MeService.user.value?.id || 0
  radiologySampleInsert.value = RadiologySample.from(options.radiologySample)
  radiologySampleInsert.value.userId = userId.value
  await startFetchData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

const clear = () => {
  radiologySampleInsert.value = RadiologySample.blank()
  radiologySampleUpdate.value = RadiologySample.blank()
}

const closeModal = () => {
  showModal.value = false
  clear()
}

const clickDestroyRadiologySample = async (radiologySampleId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa phiếu kết quả mẫu ?',
    content: [
      '- kết quả mẫu này sẽ bị xóa khỏi hệ thống',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        const indexDestroy = radiologySampleList.value.findIndex((i) => {
          return i.id === radiologySampleId
        })
        if (indexDestroy !== -1) {
          radiologySampleList.value.splice(indexDestroy, 1)
        }
        await RadiologySampleService.destroyOne(radiologySampleId)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ clickDestroyRadiologySample: ~ error:', error)
      }
    },
  })
}

const clickEditRadiologySample = (radiologySampleProp: RadiologySample) => {
  radiologySampleUpdate.value = RadiologySample.from(radiologySampleProp)
}

const startCreateRadiologySample = async () => {
  try {
    await RadiologySampleService.createOne({ radiologySample: radiologySampleInsert.value })
    startFetchData()
    closeModal()
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

const startReplaceRadiologySample = async (radiologySampleItem: RadiologySample) => {
  try {
    radiologySampleInsert.value.name = radiologySampleItem.name

    const result = await RadiologySampleService.updateOne(radiologySampleItem.id, {
      radiologySample: radiologySampleInsert.value,
    })
    const findIndex = radiologySampleList.value.findIndex((i) => i.id === radiologySampleItem.id)
    if (findIndex !== -1) {
      radiologySampleList.value[findIndex] = result
    }
    startFetchData()
    closeModal()
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

const startUpdateRadiologySample = async () => {
  try {
    const result = await RadiologySampleService.updateOne(radiologySampleUpdate.value.id, {
      radiologySample: radiologySampleUpdate.value,
    })
    const findIndex = radiologySampleList.value.findIndex((i) => {
      return i.id === radiologySampleUpdate.value.id
    })
    if (findIndex !== -1) {
      radiologySampleList.value[findIndex] = result
    }
    radiologySampleUpdate.value = RadiologySample.blank()
  } catch (error) {
    console.log('🚀 TicketClinicPrescription.vue:90 ~ error:', error)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Lưu kết quả CĐHA mẫu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div>Danh sách kết quả mẫu hiện có</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width: 60px">#</th>
                <th style="width: 30px">ID</th>
                <th>Tên</th>
                <th style="width: 40px"></th>
                <th style="width: 40px"></th>
                <th style="width: 40px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="index in limit" :key="index">
                <template v-if="radiologySampleList[index - 1]">
                  <template v-if="radiologySampleList[index - 1].id !== radiologySampleUpdate.id">
                    <td>
                      <div v-if="!radiologySampleUpdate.id">
                        <VueButton
                          size="small"
                          @click="startReplaceRadiologySample(radiologySampleList[index - 1])"
                        >
                          Ghi đè
                        </VueButton>
                      </div>
                    </td>
                    <td class="text-center">{{ radiologySampleList[index - 1].id }}</td>
                    <td colspan="2" class="text-left">
                      {{ radiologySampleList[index - 1].name }}
                    </td>
                    <td class="text-center">
                      <a
                        class="text-orange-600"
                        @click="clickEditRadiologySample(radiologySampleList[index - 1])"
                      >
                        <IconEditSquare width="20" height="20" />
                      </a>
                    </td>
                    <td class="text-center">
                      <a
                        v-if="!radiologySampleUpdate.id"
                        class="text-red-500"
                        @click="clickDestroyRadiologySample(radiologySampleList[index - 1].id)"
                      >
                        <IconDelete width="20" height="20" />
                      </a>
                    </td>
                  </template>
                  <template v-else>
                    <td></td>
                    <td>
                      <div>
                        <input v-model="radiologySampleUpdate.name" style="width: 100%" />
                      </div>
                    </td>
                    <td>
                      <div>
                        <VueButton
                          size="small"
                          @click="radiologySampleUpdate = RadiologySample.blank()"
                        >
                          Hủy
                        </VueButton>
                      </div>
                    </td>
                    <td colspan="2">
                      <div>
                        <VueButton size="small" color="blue" @click="startUpdateRadiologySample">
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
          <form class="flex gap-2" @submit.prevent="startCreateRadiologySample">
            <div style="width: 100px">
              <div>STT</div>
              <div>
                <InputNumber v-model:value="radiologySampleInsert.priority" required />
              </div>
            </div>
            <div style="flex-grow: 1">
              <div>Tên kết quả mẫu mới</div>
              <div>
                <InputText
                  v-model:value="radiologySampleInsert.name"
                  required
                  placeholder="Điền tên kết quả mẫu tại đây"
                />
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
