<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { InputDate, InputNumber, InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import {
  TicketLaboratory,
  TicketLaboratoryApi,
  TicketLaboratoryStatus,
} from '../../../../modules/ticket-laboratory'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)

const ticketLaboratoryResultList = ref<TicketLaboratory[]>([])
const laboratoryGroup = ref<LaboratoryGroup | null>(LaboratoryGroup.blank())

const laboratoryMap = ref<Record<string, Laboratory>>({})
const startedAt = ref<number>(Date.now())

const saveLoading = ref(false)

const openModal = async (
  laboratoryGroupId: number,
  ticketLaboratoryPropList: TicketLaboratory[]
) => {
  showModal.value = true
  laboratoryMap.value = await LaboratoryService.getMap()
  const laboratoryGroupMap = await LaboratoryGroupService.getMap()
  laboratoryGroup.value = laboratoryGroupMap[laboratoryGroupId]

  ticketLaboratoryResultList.value = TicketLaboratory.fromList(ticketLaboratoryPropList)
  ticketLaboratoryResultList.value.forEach((i) => {
    try {
      i.resultParse = JSON.parse(i.result)
    } catch (error) {
      i.resultParse = {}
    }
    try {
      i.attentionParse = JSON.parse(i.attention)
    } catch (error) {
      i.attentionParse = {}
    }
  })
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await TicketLaboratoryApi.updateResult({
      ticketId: ticketLaboratoryResultList.value[0].ticketId,
      customerId: ticketLaboratoryResultList.value[0].customerId,
      startedAt: startedAt.value,
      ticketLaboratoryCreateList: ticketLaboratoryResultList.value.filter((i) => !i.id),
      ticketLaboratoryUpdateList: ticketLaboratoryResultList.value.filter((i) => !!i.id),
    })
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleChangeResultNumber = (options: {
  index: number
  laboratoryParentId: number
  laboratoryId: number
  value: number
}) => {
  const { index, laboratoryId, laboratoryParentId, value } = options
  let laboratory: Laboratory | undefined = laboratoryMap.value[laboratoryParentId]
  if (laboratoryId !== laboratoryParentId) {
    laboratory = laboratory.children?.find((i) => i.id === laboratoryId)
  }
  if (!laboratory) return

  if (value < laboratory.lowValue || value > laboratory.highValue) {
    ticketLaboratoryResultList.value[index].attentionParse[laboratoryId] = true
  } else {
    ticketLaboratoryResultList.value[index].attentionParse[laboratoryId] = false
  }
}

const closeModal = () => {
  showModal.value = false
}

const cancelResult = async (id: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn hủy kết quả xét nghiệm này',
    content: [''],
    async onOk() {
      await TicketLaboratoryApi.cancelResult(id)
      const tl = ticketLaboratoryResultList.value.find((i) => i.id === id)
      if (tl) {
        tl.result = JSON.stringify({})
        tl.attention = JSON.stringify({})
        tl.resultParse = {}
        tl.attentionParse = {}
        tl.startedAt = null
        tl.status = TicketLaboratoryStatus.Pending
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Trả kết quả xét nghiệm: {{ laboratoryGroup?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <form class="p-4" @submit.prevent="handleSave">
        <div class="table-wrapper mt-2 pb-20">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th>Kết quả</th>
                <th>Tham chiếu</th>
                <th>Đơn vị</th>
                <th style="width: 40px">Đánh dấu</th>
                <th style="width: 40px"></th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(ticketLaboratory, index) in ticketLaboratoryResultList"
                :key="ticketLaboratory.id">
                <tr
                  v-for="(laboratoryParent, i) in [laboratoryMap[ticketLaboratory.laboratoryId]]"
                  :key="i"
                  :style="ticketLaboratory.attentionParse[laboratoryParent.id] ? 'color: red' : ''">
                  <td class="text-center">
                    {{ index + 1 }}
                  </td>
                  <td>
                    {{ laboratoryParent?.name }}
                  </td>
                  <td>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.Number">
                      <InputNumber
                        v-model:value="
                          ticketLaboratoryResultList[index].resultParse[laboratoryParent.id]
                        "
                        @update:value="
                          (v) =>
                            handleChangeResultNumber({
                              index,
                              laboratoryId: laboratoryParent.id,
                              laboratoryParentId: laboratoryParent.parentId,
                              value: v,
                            })
                        " />
                    </div>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.String">
                      <InputText
                        v-model:value="
                          ticketLaboratoryResultList[index].resultParse[laboratoryParent.id]
                        " />
                    </div>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.Options">
                      <VueSelect
                        v-model:value="
                          ticketLaboratoryResultList[index].resultParse[laboratoryParent.id]
                        "
                        :options="
                          laboratoryParent.optionsParse.map((i) => ({ text: i, value: i }))
                        " />
                    </div>
                  </td>
                  <td class="text-center">
                    <span v-if="laboratoryParent.valueType === LaboratoryValueType.Number">
                      {{ laboratoryParent?.lowValue }} -
                      {{ laboratoryParent?.highValue }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span v-if="laboratoryParent.valueType === LaboratoryValueType.Number">
                      {{ laboratoryParent?.unit }}
                    </span>
                  </td>
                  <td class="text-center">
                    <input
                      v-model="
                        ticketLaboratoryResultList[index].attentionParse[laboratoryParent.id]
                      "
                      tabindex="-1"
                      style="cursor: pointer"
                      type="checkbox"
                      name="isRegimen" />
                  </td>
                  <td class="text-center">
                    <a v-if="ticketLaboratory.startedAt" @click="cancelResult(ticketLaboratory.id)">
                      Hủy
                    </a>
                  </td>
                </tr>
                <tr
                  v-for="(laboratoryItem, i) in laboratoryMap[ticketLaboratory.laboratoryId]
                    ?.children || []"
                  :key="i"
                  :style="ticketLaboratory.attentionParse[laboratoryItem.id] ? 'color: red' : ''">
                  <td></td>
                  <td>{{ laboratoryItem?.name }}</td>
                  <td>
                    <div v-if="laboratoryItem.valueType === LaboratoryValueType.Number">
                      <InputNumber
                        v-model:value="
                          ticketLaboratoryResultList[index].resultParse[laboratoryItem.id]
                        "
                        @update:value="
                          (v) =>
                            handleChangeResultNumber({
                              index,
                              laboratoryId: laboratoryItem.id,
                              laboratoryParentId: laboratoryItem.parentId,
                              value: v,
                            })
                        " />
                    </div>
                    <div v-if="laboratoryItem.valueType === LaboratoryValueType.String">
                      <InputText
                        v-model:value="
                          ticketLaboratoryResultList[index].resultParse[laboratoryItem.id]
                        " />
                    </div>
                    <div v-if="laboratoryItem.valueType === LaboratoryValueType.Options">
                      <VueSelect
                        v-model:value="
                          ticketLaboratoryResultList[index].resultParse[laboratoryItem.id]
                        "
                        :options="
                          laboratoryItem.optionsParse.map((i) => ({ text: i, value: i }))
                        " />
                    </div>
                  </td>
                  <td class="text-center">
                    <span v-if="laboratoryItem.valueType === LaboratoryValueType.Number">
                      {{ laboratoryItem?.lowValue }} - {{ laboratoryItem?.highValue }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span v-if="laboratoryItem.valueType === LaboratoryValueType.Number">
                      {{ laboratoryItem?.unit }}
                    </span>
                  </td>
                  <td class="text-center">
                    <input
                      v-model="ticketLaboratoryResultList[index].attentionParse[laboratoryItem.id]"
                      tabindex="-1"
                      style="cursor: pointer"
                      type="checkbox"
                      name="isRegimen" />
                  </td>
                  <td></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="">
          <div>Thời gian trả kết quả:</div>
          <div><InputDate v-model:value="startedAt" show-time typeParser="number" /></div>
        </div>

        <div class="pb-4 pt-8 flex gap-4">
          <VueButton type="reset" icon="close" class="ml-auto" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            color="blue"
            icon="save"
            type="submit"
            :loading="saveLoading"
            :disabled="ticketLaboratoryResultList.length === 0">
            <span>Trả kết quả</span>
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
input {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid #ccc;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
