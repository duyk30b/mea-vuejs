<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import {
  InputCheckbox,
  InputDate,
  InputNumber,
  InputText,
  VueSelect,
} from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { TicketClinicLaboratoryApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import type { TicketLaboratory } from '../../../../modules/ticket-laboratory'
import {
  TicketLaboratoryGroup,
  TicketLaboratoryGroupStatus,
} from '../../../../modules/ticket-laboratory-group'
import { TicketLaboratoryResult } from '../../../../modules/ticket-laboratory-result'

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)

const laboratoryMap = ref<Record<string, Laboratory>>({})
const laboratoryGroupMap = ref<Record<string, LaboratoryGroup>>({})
const laboratoryGroup = ref<LaboratoryGroup | null>(null)

const ticketLaboratoryList = ref<TicketLaboratory[]>([])
const ticketLaboratoryResultTree = ref<Record<string, TicketLaboratoryResult>>({})
const ticketLaboratoryResultOriginTree = ref<Record<string, TicketLaboratoryResult>>({})

const ticketLaboratoryGroupId = ref<number>(0)
const ticketLaboratoryGroup = ref<TicketLaboratoryGroup>(TicketLaboratoryGroup.blank())
const startedAt = ref<number>(Date.now())

const saveLoading = ref(false)

const openModal = async (tlgIdProp: number) => {
  showModal.value = true
  ticketLaboratoryGroup.value =
    (ticketClinicRef.value.ticketLaboratoryGroupList || []).find((i) => {
      return i.id === tlgIdProp
    }) || TicketLaboratoryGroup.blank()
  ticketLaboratoryGroupId.value = tlgIdProp

  laboratoryMap.value = await LaboratoryService.getFlatMap()
  laboratoryGroupMap.value = await LaboratoryGroupService.getMap()
  laboratoryGroup.value = laboratoryGroupMap.value[tlgIdProp]

  ticketLaboratoryList.value = (ticketClinicRef.value.ticketLaboratoryList || []).filter((i) => {
    return i.ticketLaboratoryGroupId === tlgIdProp
  })

  ticketLaboratoryList.value.forEach((tl) => {
    const key = `${tl.id}-${tl.laboratoryId}`

    const blank = TicketLaboratoryResult.blank()
    blank.ticketLaboratoryId = tl.id
    blank.ticketLaboratoryGroupId = tl.ticketLaboratoryGroupId
    blank.laboratoryId = tl.laboratoryId

    ticketLaboratoryResultOriginTree.value[key] = blank
    ticketLaboratoryResultTree.value[key] = TicketLaboratoryResult.from(blank)

    const laboratoryParent = laboratoryMap.value[tl.laboratoryId]
    if (laboratoryParent.children) {
      laboratoryParent.children.forEach((laboratoryChild) => {
        const key = `${tl.id}-${laboratoryChild.id}`
        const blank = TicketLaboratoryResult.blank()
        blank.laboratoryId = laboratoryChild.id
        blank.ticketLaboratoryId = tl.id
        blank.ticketLaboratoryGroupId = tl.ticketLaboratoryGroupId

        ticketLaboratoryResultOriginTree.value[key] = blank
        ticketLaboratoryResultTree.value[key] = TicketLaboratoryResult.from(blank)
      })
    }
  })
  ;(ticketClinicRef.value.ticketLaboratoryResultList || [])
    .filter((i) => {
      return i.ticketLaboratoryGroupId === tlgIdProp
    })
    .forEach((tlr) => {
      const key = `${tlr.ticketLaboratoryId}-${tlr.laboratoryId}`
      ticketLaboratoryResultOriginTree.value[key] = tlr
      ticketLaboratoryResultTree.value[key] = TicketLaboratoryResult.from(tlr)
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
      ticketId: ticketClinicRef.value.id,
      ticketLaboratoryGroupId: ticketLaboratoryGroupId.value,
      startedAt: startedAt.value,
      ticketLaboratoryResultUpdateList: Object.values(ticketLaboratoryResultTree.value),
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
  ticketLaboratoryResult: TicketLaboratoryResult
  value: number
}) => {
  const { ticketLaboratoryResult, value } = options
  const laboratory = laboratoryMap.value[ticketLaboratoryResult.laboratoryId]
  const key = `${ticketLaboratoryResult.ticketLaboratoryId}-${ticketLaboratoryResult.laboratoryId}`

  if (value < laboratory.lowValue || value > laboratory.highValue) {
    ticketLaboratoryResultTree.value[key].attention = 1
  } else {
    ticketLaboratoryResultTree.value[key].attention = 0
  }
  ticketLaboratoryResultTree.value[key].result = String(value)
}

const closeModal = () => {
  showModal.value = false
  ticketLaboratoryResultTree.value = {}
  ticketLaboratoryResultOriginTree.value = {}
  ticketLaboratoryList.value = []
  ticketLaboratoryGroupId.value = 0
}

const clickDestroy = async () => {
  ModalStore.confirm({
    title: 'Xác nhận xóa phiếu xét nghiệm?',
    content: [
      '- Hệ thống sẽ xóa tất cả xét nghiệm trên phiếu này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketClinicLaboratoryApi.destroyTicketLaboratoryGroup({
          ticketId: ticketClinicRef.value.id,
          ticketLaboratoryGroupId: ticketLaboratoryGroup.value.id,
        })
        emit('success')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicLaboratory.vue:118 ~ onOk: ~ error:', error)
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
              <template v-for="(tlItem, index) in ticketLaboratoryList" :key="tlItem.id">
                <tr
                  v-for="(laboratoryParent, i) in laboratoryMap[tlItem.laboratoryId]
                    ? [laboratoryMap[tlItem.laboratoryId]]
                    : []"
                  :key="i"
                  :style="
                    ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryParent.id}`].attention
                      ? 'color: red'
                      : ''
                  ">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>{{ laboratoryParent?.name }}</td>
                  <td>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.Number">
                      <InputNumber
                        :value="
                          Number(
                            ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryParent.id}`].result
                          )
                        "
                        @update:value="
                          (v) =>
                            handleChangeResultNumber({
                              ticketLaboratoryResult:
                                ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryParent.id}`],
                              value: v,
                            })
                        " />
                    </div>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.String">
                      <InputText
                        v-model:value="
                          ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryParent.id}`].result
                        " />
                    </div>
                    <div v-if="laboratoryParent.valueType === LaboratoryValueType.Options">
                      <VueSelect
                        v-model:value="
                          ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryParent.id}`].result
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
                    <div class="flex justify-center">
                      <InputCheckbox
                        v-model:value="
                          ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryParent.id}`]
                            .attention
                        "
                        type-parser="number" />
                    </div>
                  </td>
                </tr>
                <tr
                  v-for="(laboratoryChild, i) in laboratoryMap[tlItem.laboratoryId]?.children || []"
                  :key="i"
                  :style="
                    ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryChild.id}`].attention
                      ? 'color: red'
                      : ''
                  ">
                  <td></td>
                  <td>{{ laboratoryChild?.name }}</td>
                  <td>
                    <div v-if="laboratoryChild.valueType === LaboratoryValueType.Number">
                      <InputNumber
                        :value="
                          Number(
                            ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryChild.id}`].result
                          )
                        "
                        @update:value="
                          (v) =>
                            handleChangeResultNumber({
                              ticketLaboratoryResult:
                                ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryChild.id}`],
                              value: v,
                            })
                        " />
                    </div>
                    <div v-if="laboratoryChild.valueType === LaboratoryValueType.String">
                      <InputText
                        v-model:value="
                          ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryChild.id}`].result
                        " />
                    </div>
                    <div v-if="laboratoryChild.valueType === LaboratoryValueType.Options">
                      <VueSelect
                        v-model:value="
                          ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryChild.id}`].result
                        "
                        :options="
                          laboratoryChild.optionsParse.map((i) => ({ text: i, value: i }))
                        " />
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
                        v-model:value="
                          ticketLaboratoryResultTree[`${tlItem.id}-${laboratoryChild.id}`].attention
                        "
                        type-parser="number" />
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
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa phiếu</VueButton>
          <VueButton type="reset" icon="close" style="margin-left: auto;" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            color="blue"
            icon="save"
            type="submit"
            :loading="saveLoading"
            :disabled="disabledButtonSave">
            <span v-if="ticketLaboratoryGroup.status === TicketLaboratoryGroupStatus.Completed">
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
