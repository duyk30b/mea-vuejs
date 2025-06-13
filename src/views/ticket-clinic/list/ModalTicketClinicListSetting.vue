<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { PositionService, PositionType } from '../../../modules/position'
import { OrganizationService } from '../../../modules/organization'
import { RoleService } from '../../../modules/role'
import { TicketType } from '../../../modules/ticket'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.TICKET_CLINIC_LIST>(
  JSON.parse(JSON.stringify(store.TICKET_CLINIC_LIST))
)
const roleOptions = ref<{ value: number; label: string }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.TICKET_CLINIC_LIST))

  const fetchData = await Promise.all([
    RoleService.getMap(),
    PositionService.list({ filter: { positionType: PositionType.Ticket } }),
  ])
  const roleMap = fetchData[0]
  roleOptions.value = fetchData[1].map((i) => ({ value: i.roleId, label: roleMap[i.roleId]?.name }))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.TICKET_CLINIC_LIST, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 500)
    store.TICKET_CLINIC_LIST = JSON.parse(settingData)

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
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt phòng khám</div>
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
              <td>Loại phòng khám</td>
              <td>
                <div>
                  <VueSelect
                    v-model:value="settingDisplay.ticketType"
                    :options="[
                      { value: TicketType.Clinic, text: 'Phòng khám cơ bản' },
                      { value: TicketType.Eye, text: 'Phòng khám mắt' },
                      {
                        value: TicketType.Obstetric,
                        text: 'Phòng khám sản phụ khoa',
                      },
                    ]" />
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.showCustomType">
                  Hiển thị phân loại tùy chỉnh
                </InputCheckbox>
              </td>
              <td>
                <table class="w-full">
                  <tr v-for="(text, i) in settingDisplay.customTypeText" :key="i">
                    <td style="padding: 5px">
                      <InputText
                        v-model:value="settingDisplay.customTypeText[i]"
                        :prepend="i.toString()"
                        style="flex: 1" />
                    </td>
                    <td style="vertical-align: middle">
                      <a
                        v-if="i === settingDisplay.customTypeText.length - 1"
                        style="color: var(--text-red)"
                        @click="settingDisplay.customTypeText.splice(i, 1)">
                        Xóa
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="padding: 5px">
                  <VueButton
                    icon="plus"
                    color="blue"
                    @click="settingDisplay.customTypeText.push('')"></VueButton>
                </div>
              </td>
            </tr>
            <tr>
              <td style="width: 30%">Hiển thị vai trò</td>
              <td>
                <div>
                  <a-select
                    v-model:value="settingDisplay.roleIdList"
                    mode="multiple"
                    style="width: 100%"
                    placeholder="Please select"
                    :options="roleOptions"></a-select>
                </div>
              </td>
            </tr>

            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.buttonShowModalCreate">
                  Hiển thị nút Tiếp đón
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.buttonShowTicketDetailBlank">
                  Hiển thị nút khám mới
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.birthday">
                  Hiển thị ngày sinh
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.phone">
                  Hiển thị số điện thoại
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <InputCheckbox v-model:checked="settingDisplay.address">
                  Hiển thị địa chỉ
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
