<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { IconMinus, IconPlus } from '../../../../common/icon-font-awesome'
import { IconDelete } from '../../../../common/icon-google'
import InputNumber from '../../../../common/vue-form/InputNumber.vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PrescriptionSample, type MedicineType } from '../../../../modules/prescription-sample'

const emit = defineEmits<{
  (e: 'success', medicineList: MedicineType[]): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const prescriptionSample = ref<PrescriptionSample>(PrescriptionSample.blank())

const showModal = ref(false)

const openModal = async (psProp: PrescriptionSample) => {
  showModal.value = true
  prescriptionSample.value = PrescriptionSample.from(psProp)
}

const closeModal = () => {
  showModal.value = false
  prescriptionSample.value = PrescriptionSample.blank()
}

const removePrescriptionSampleItem = (index: number) => {
  prescriptionSample.value.medicineList.splice(index, 1)
}

const changeQuantityTable = (index: number, quantity: number) => {
  prescriptionSample.value.medicineList[index].quantity = quantity
}

const handleSave = async () => {
  try {
    emit('success', prescriptionSample.value.medicineList)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalSelectPrescriptionSample.vue:89 ~ handleSave ~ error:', error)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 1000px">
    <form class="bg-white" @submit.prevent="handleSave">
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
                  <th style="width: 50px">#</th>
                  <th>Tên thuốc</th>
                  <th>Đơn vị</th>
                  <th style="width: 200px">Số lượng</th>
                  <th>Giá</th>
                  <th style="width: 50px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="prescriptionSample.medicineList.length === 0">
                  <td colspan="20" class="text-center">Không có dữ liệu</td>
                </tr>

                <tr v-for="(item, index) in prescriptionSample.medicineList" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <div class="font-bold">{{ item.product?.brandName }}</div>
                    <div style="font-size: 13px; font-style: italic">{{ item.hintUsage }}</div>
                  </td>
                  <td class="text-center">{{ item.product?.unitDefaultName }}</td>
                  <td class="text-center">
                    <div class="flex items-center justify-between">
                      <button
                        style="
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          border: 1px solid #cdcdcd;
                        "
                        class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                        :disabled="item.quantity <= 0"
                        type="button"
                        @click="
                          changeQuantityTable(
                            index,
                            item.quantity - (item.product?.unitDefaultRate || 1),
                          )
                        "
                      >
                        <IconMinus />
                      </button>
                      <div style="width: calc(100% - 60px); min-width: 50px">
                        <InputNumber
                          :value="item.quantity / (item.product?.unitDefaultRate || 1)"
                          @update:value="
                            (value) =>
                              changeQuantityTable(
                                index,
                                value * (item.product?.unitDefaultRate || 1),
                              )
                          "
                        />
                      </div>
                      <button
                        style="
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          border: 1px solid #cdcdcd;
                        "
                        type="button"
                        class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                        @click="
                          changeQuantityTable(
                            index,
                            item.quantity + (item.product?.unitDefaultRate || 1),
                          )
                        "
                      >
                        <IconPlus />
                      </button>
                    </div>
                  </td>
                  <td class="text-right">
                    {{
                      formatMoney(
                        (item.product?.retailPrice || 0) * (item.product?.unitDefaultRate || 1),
                      )
                    }}
                  </td>
                  <td class="text-center">
                    <a class="text-red-500" @click="removePrescriptionSampleItem(index)">
                      <IconDelete width="20" height="20" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="4" class="text-right">
                    <b>Tổng tiền</b>
                  </td>
                  <td class="text-right font-bold">
                    {{
                      formatMoney(
                        prescriptionSample.medicineList.reduce((acc, i) => {
                          return acc + (i.product?.retailPrice || 0) * i.quantity
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
