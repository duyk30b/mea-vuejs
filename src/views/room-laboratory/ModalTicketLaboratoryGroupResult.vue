<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputCheckbox, InputDate, InputNumber, InputText, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { LaboratoryService, LaboratoryValueType } from '@/modules/laboratory'
import { LaboratoryGroupService } from '@/modules/laboratory-group'
import { TicketClinicLaboratoryApi } from '@/modules/ticket-clinic'
import { TicketLaboratoryStatus } from '@/modules/ticket-laboratory'
import { TicketLaboratoryGroup, TicketLaboratoryGroupApi } from '@/modules/ticket-laboratory-group'
import { TicketLaboratoryResult } from '@/modules/ticket-laboratory-result'
import { computed, ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)

const laboratoryMap = LaboratoryService.laboratoryMap
const laboratoryGroupMap = LaboratoryGroupService.laboratoryGroupMap

const ticketLaboratoryResultOriginTree = ref<Record<string, TicketLaboratoryResult>>({})
const ticketLaboratoryResultTree = ref<Record<string, TicketLaboratoryResult>>({})

const ticketLaboratoryGroupId = ref<number>(0)
const ticketLaboratoryGroup = ref<TicketLaboratoryGroup>(TicketLaboratoryGroup.blank())
const startedAt = ref<number>(Date.now())

const saveLoading = ref(false)

const openModal = async (tlgIdProp: number, options?: { noEdit: boolean; query?: boolean }) => {
  showModal.value = true
  ticketLaboratoryGroup.value = await TicketLaboratoryGroupApi.detail(tlgIdProp, {
    relation: {
      // customer: true,
      // ticket: true,
      ticketUserList: true,
      ticketLaboratoryList: true,
      ticketLaboratoryResultMap: true,
    },
  })

  ticketLaboratoryGroupId.value = tlgIdProp
  ticketLaboratoryGroup.value.laboratoryGroup = laboratoryGroupMap.value[tlgIdProp]

  const resultMap = ticketLaboratoryGroup.value.ticketLaboratoryResultMap || {}

  ticketLaboratoryGroup.value.ticketLaboratoryList!.forEach((tl) => {
    const laboratoryId = tl.laboratoryId
    if (resultMap[laboratoryId]) {
      ticketLaboratoryResultOriginTree.value[laboratoryId] = resultMap[laboratoryId]
      ticketLaboratoryResultTree.value[laboratoryId] = TicketLaboratoryResult.from(
        resultMap[laboratoryId],
      )
    } else {
      const blank = TicketLaboratoryResult.blank()
      blank.ticketLaboratoryId = tl.id
      blank.ticketLaboratoryGroupId = tl.ticketLaboratoryGroupId
      blank.laboratoryId = laboratoryId

      ticketLaboratoryResultOriginTree.value[laboratoryId] = blank
      ticketLaboratoryResultTree.value[laboratoryId] = TicketLaboratoryResult.from(blank)
    }

    const laboratoryParent = laboratoryMap.value[tl.laboratoryId]
    if (laboratoryParent.children) {
      laboratoryParent.children.forEach((laboratoryChild) => {
        const laboratoryChildId = laboratoryChild.id
        if (resultMap[laboratoryChildId]) {
          ticketLaboratoryResultOriginTree.value[laboratoryChildId] = resultMap[laboratoryChildId]
          ticketLaboratoryResultTree.value[laboratoryChildId] = TicketLaboratoryResult.from(
            resultMap[laboratoryChildId],
          )
        } else {
          const blank = TicketLaboratoryResult.blank()
          blank.ticketLaboratoryId = tl.id
          blank.ticketLaboratoryGroupId = tl.ticketLaboratoryGroupId
          blank.laboratoryId = laboratoryChildId

          ticketLaboratoryResultOriginTree.value[laboratoryChildId] = blank
          ticketLaboratoryResultTree.value[laboratoryChildId] = TicketLaboratoryResult.from(blank)
        }
      })
    }
  })
}

const disabledButtonSave = computed(() => {
  let hasChangeData = false
  Object.keys(ticketLaboratoryResultTree.value).forEach((key) => {
    const lr = ticketLaboratoryResultTree.value[key]
    const lrOrigin = ticketLaboratoryResultOriginTree.value[key]
    if (lr.attention != lrOrigin.attention || lr.result !== lrOrigin.result) {
      hasChangeData = true
    }
  })
  return !hasChangeData
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    await TicketClinicLaboratoryApi.updateResult({
      ticketId: ticketLaboratoryGroup.value.ticketId,
      ticketLaboratoryGroupId: ticketLaboratoryGroupId.value,
      startedAt: startedAt.value,
      ticketLaboratoryResultUpdateList: Object.values(ticketLaboratoryResultTree.value),
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleChangeResultNumber = (options: {
  ticketLaboratoryResult: TicketLaboratoryResult
  value: number
}) => {
  const { ticketLaboratoryResult, value } = options
  const laboratoryId = ticketLaboratoryResult.laboratoryId
  const laboratory = laboratoryMap.value[laboratoryId]

  if (value < laboratory.lowValue || value > laboratory.highValue) {
    ticketLaboratoryResultTree.value[laboratoryId].attention = 1
  } else {
    ticketLaboratoryResultTree.value[laboratoryId].attention = 0
  }
  ticketLaboratoryResultTree.value[laboratoryId].result = String(value)
}

const closeModal = () => {
  showModal.value = false
  ticketLaboratoryResultTree.value = {}
  ticketLaboratoryResultOriginTree.value = {}
  ticketLaboratoryGroupId.value = 0
  ticketLaboratoryGroup.value = TicketLaboratoryGroup.blank()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Trả kết quả xét nghiệm: {{ ticketLaboratoryGroup.laboratoryGroup?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <form class="p-4" @submit.prevent="handleSave">
        <div class="table-wrapper mt-2">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th>Kết quả</th>
                <th>Tham chiếu</th>
                <th>Đơn vị</th>
                <th style="width: 40px">Đánh dấu</th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(tlItem, index) in ticketLaboratoryGroup.ticketLaboratoryList"
                :key="tlItem.id"
              >
                <tr
                  v-for="(laboratoryParent, i) in laboratoryMap[tlItem.laboratoryId]
                    ? [laboratoryMap[tlItem.laboratoryId]]
                    : []"
                  :key="i"
                  :style="
                    ticketLaboratoryResultTree[laboratoryParent.id].attention ? 'color: red' : ''
                  "
                >
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>{{ laboratoryParent?.name }}</td>
                  <td>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.Number">
                      <InputNumber
                        :value="Number(ticketLaboratoryResultTree[laboratoryParent.id].result)"
                        @update:value="
                          (v) =>
                            handleChangeResultNumber({
                              ticketLaboratoryResult:
                                ticketLaboratoryResultTree[laboratoryParent.id],
                              value: v,
                            })
                        "
                      />
                    </div>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.String">
                      <InputText
                        v-model:value="ticketLaboratoryResultTree[laboratoryParent.id].result"
                      />
                    </div>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.Options">
                      <VueSelect
                        v-model:value="ticketLaboratoryResultTree[laboratoryParent.id].result"
                        :options="laboratoryParent.optionsParse.map((i) => ({ text: i, value: i }))"
                      />
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
                    <div class="flex justify-center">
                      <InputCheckbox
                        v-model:value="ticketLaboratoryResultTree[laboratoryParent.id].attention"
                        type-parser="number"
                      />
                    </div>
                  </td>
                </tr>
                <tr
                  v-for="(laboratoryChild, i) in laboratoryMap[tlItem.laboratoryId]?.children || []"
                  :key="i"
                  :style="
                    ticketLaboratoryResultTree[laboratoryChild.id].attention ? 'color: red' : ''
                  "
                >
                  <td></td>
                  <td>{{ laboratoryChild?.name }}</td>
                  <td>
                    <div v-if="laboratoryChild.valueType === LaboratoryValueType.Number">
                      <InputNumber
                        :value="Number(ticketLaboratoryResultTree[laboratoryChild.id].result)"
                        @update:value="
                          (v) =>
                            handleChangeResultNumber({
                              ticketLaboratoryResult:
                                ticketLaboratoryResultTree[laboratoryChild.id],
                              value: v,
                            })
                        "
                      />
                    </div>
                    <div v-if="laboratoryChild.valueType === LaboratoryValueType.String">
                      <InputText
                        v-model:value="ticketLaboratoryResultTree[laboratoryChild.id].result"
                      />
                    </div>
                    <div v-if="laboratoryChild.valueType === LaboratoryValueType.Options">
                      <VueSelect
                        v-model:value="ticketLaboratoryResultTree[laboratoryChild.id].result"
                        :options="laboratoryChild.optionsParse.map((i) => ({ text: i, value: i }))"
                      />
                    </div>
                  </td>
                  <td class="text-center">
                    <span v-if="laboratoryChild.valueType === LaboratoryValueType.Number">
                      {{ laboratoryChild?.lowValue }} - {{ laboratoryChild?.highValue }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span v-if="laboratoryChild.valueType === LaboratoryValueType.Number">
                      {{ laboratoryChild?.unit }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="flex justify-center">
                      <InputCheckbox
                        v-model:value="ticketLaboratoryResultTree[laboratoryChild.id].attention"
                        type-parser="number"
                      />
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="mt-6">
          <div>Thời gian trả kết quả:</div>
          <div><InputDate v-model:value="startedAt" show-time typeParser="number" /></div>
        </div>

        <div class="pb-4 pt-8 flex gap-4">
          <VueButton type="reset" icon="close" style="margin-left: auto" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            color="blue"
            icon="save"
            type="submit"
            :loading="saveLoading"
            :disabled="disabledButtonSave"
          >
            <span v-if="ticketLaboratoryGroup.status === TicketLaboratoryStatus.Completed">
              Cập nhật kết quả
            </span>
            <span v-else>Trả kết quả</span>
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
