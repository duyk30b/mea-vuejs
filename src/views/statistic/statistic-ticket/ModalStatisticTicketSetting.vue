<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.TICKET_STATISTIC>(
  JSON.parse(JSON.stringify(store.TICKET_STATISTIC))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.TICKET_STATISTIC))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.TICKET_STATISTIC, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.TICKET_STATISTIC = JSON.parse(settingData)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt báo cáo phiếu thu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="mt-4 pb-20 px-4 table-wrapper">
        <table>
          <thead>
            <tr>
              <th colspan="2">Cài đặt chung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.countTicket">
                  Hiển thị tổng phiếu
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumTotalMoney">
                  Hiển thị tổng tiền
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumTotalCostAmount">
                  Hiển thị tổng vốn
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumProcedureMoney">
                  Hiển thị tổng tiền dịch vụ
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumProductMoney">
                  Hiển thị tổng tiền hàng hóa
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumRadiologyMoney">
                  Hiển thị tổng tiền CĐHA
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumLaboratoryMoney">
                  Hiển thị tổng tiền xét nghiệm
                </InputCheckbox>
              </td>
            </tr>

            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumSurcharge">
                  Hiển thị tổng phụ phí
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumExpense">
                  Hiển thị tổng chi phí
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumDiscountMoney">
                  Hiển thị tổng khuyến mại
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumProfit">
                  Hiển thị tổng lãi
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.sumDebt">
                  Hiển thị tổng nợ
                </InputCheckbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left:auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
