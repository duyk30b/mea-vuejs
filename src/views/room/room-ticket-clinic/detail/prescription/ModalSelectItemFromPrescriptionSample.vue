<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { IconDelete } from '@/common/icon-google'
import InputNumber from '@/common/vue-form/InputNumber.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  PrescriptionSample,
  PrescriptionSampleItem,
  PrescriptionSampleService,
} from '@/modules/prescription-sample'
import { BugDevelopment } from '@/views/component'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', prescriptionSampleItemList: PrescriptionSampleItem[]): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const prescriptionSample = ref<PrescriptionSample>(PrescriptionSample.blank())

const showModal = ref(false)

const openModal = async (psProp: PrescriptionSample) => {
  showModal.value = true
  prescriptionSample.value = PrescriptionSample.from(psProp)
  await PrescriptionSampleService.executeRelation([prescriptionSample.value], {
    prescriptionSampleItemList: { product: true },
  })
}

const closeModal = () => {
  showModal.value = false
  prescriptionSample.value = PrescriptionSample.blank()
}

const removePrescriptionSampleItem = (_localId: string) => {
  const index = prescriptionSample.value.prescriptionSampleItemList.findIndex((i) => {
    return i._localId === _localId
  })
  if (index !== -1) {
    prescriptionSample.value.prescriptionSampleItemList.splice(index, 1)
  }
}

const handleSubmit = async () => {
  try {
    emit('success', prescriptionSample.value.prescriptionSampleItemList)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalSelectItemFromPrescriptionSample.vue:55 ~ handleSubmit ~ error:', error)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 1000px">
    <form class="bg-white" @submit.prevent="handleSubmit">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Đơn thuốc mẫu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="p-4">
        <div class="">
          <div>Danh sách thuốc trong đơn</div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th style="width: 50px">#</th>
                  <th>Tên thuốc</th>
                  <th style="width: 200px">Số lượng</th>
                  <th>Đơn vị</th>
                  <th>T.Tiền</th>
                  <th style="width: 50px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="prescriptionSample.prescriptionSampleItemList.length === 0">
                  <td colspan="20" class="text-center">Không có dữ liệu</td>
                </tr>

                <tr
                  v-for="(psItem, index) in prescriptionSample.prescriptionSampleItemList"
                  :key="index"
                >
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="psItem" />
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <div class="font-bold">{{ psItem.product?.brandName }}</div>
                    <div style="font-size: 13px">{{ psItem.product?.substance }}</div>
                    <div style="font-size: 13px; font-style: italic">{{ psItem.hintUsage }}</div>
                  </td>
                  <td>
                    <div class="flex justify-center">
                      <InputNumber
                        v-model:value="psItem.unitQuantity"
                        controlHorizontal
                        :controlMinusDisable="psItem.unitQuantity <= 0"
                        textAlign="right"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="flex justify-center flex-wrap gap-1">
                      <span>
                        {{ formatMoney((psItem.product?.retailPrice || 0) * psItem.unitRate) }}
                      </span>
                      <span v-if="psItem.unitName">/ {{ psItem.unitName }}</span>
                    </div>
                  </td>
                  <td class="text-right">
                    {{
                      formatMoney(
                        (psItem.product?.retailPrice || 0) * psItem.unitRate * psItem.unitQuantity,
                      )
                    }}
                  </td>
                  <td class="text-center">
                    <a
                      style="color: var(--text-red)"
                      @click="removePrescriptionSampleItem(psItem._localId)"
                    >
                      <IconDelete width="20" height="20" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td colspan="4" class="text-right">
                    <b>Tổng tiền</b>
                  </td>
                  <td class="text-right font-bold">
                    {{
                      formatMoney(
                        prescriptionSample.prescriptionSampleItemList.reduce((acc, i) => {
                          return acc + (i.product?.retailPrice || 0) * i.unitQuantity * i.unitRate
                        }, 0),
                      )
                    }}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="flex gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton style="margin-left: auto" color="blue" type="submit" icon="send">
            Kê theo mẫu
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
