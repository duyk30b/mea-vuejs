<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { useSettingStore } from '@/modules/_me/setting.store'
import { SettingKey } from '@/modules/_me/store.variable'
import { OrganizationService } from '@/modules/organization'
import { PositionInteractType, PositionService } from '@/modules/position'
import { RoleService } from '@/modules/role'
import { ref } from 'vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  ADVANCE: 'ADVANCE',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.TICKET_CLINIC_CREATE>(
  JSON.parse(JSON.stringify(store.TICKET_CLINIC_CREATE)),
)

const roleOptions = ref<{ value: number; label: string }[]>([])

const activeTab = ref(TABS_KEY.BASIC)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.TICKET_CLINIC_CREATE))
  const fetchData = await Promise.all([
    RoleService.getMap(),
    PositionService.list({ filter: { positionType: PositionInteractType.Ticket } }),
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
    await OrganizationService.saveSettings(SettingKey.TICKET_CLINIC_CREATE, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 500)
    store.TICKET_CLINIC_CREATE = JSON.parse(settingData)

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
  <VueModal v-model:show="showModal" style="margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt tiếp đón</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.BASIC">Cài đặt cơ bản</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.ADVANCE">Cài đặt nâng cao</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.BASIC">
              <div class="mt-4 table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt cơ bản</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="width: 30%">Hiển thị vai trò</td>
                      <td>
                        <div>
                          <a-select
                            v-model:value="settingDisplay.roleIdList"
                            mode="multiple"
                            style="width: 100%"
                            placeholder="Chọn vai trò hiển thị"
                            :options="roleOptions"
                          ></a-select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.facebook">
                          Hiển thị điền link facebook
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.zalo">
                          Hiển thị điền link zalo
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.birthday">
                          Hiển thị điền ngày sinh
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.gender">
                          Hiển thị điền giới tính
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.address">
                          Hiển thị điền địa chỉ
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.relative">
                          Hiển thị điền liên hệ khác
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.note">
                          Hiển thị điền ghi chú
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.customerSource">
                          Hiển thị điền nguồn khách hàng
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.requestProcedure">
                          Hiển thị yêu cầu điền dịch vụ ban đầu
                        </InputCheckbox>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ADVANCE">
              <div class="mt-4 table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt nâng cao</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CSS Modal</td>
                      <td>
                        <div>
                          <InputText v-model:value="settingDisplay.SCREEN.modalStyle" />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>CSS Item</td>
                      <td>
                        <div>
                          <InputText v-model:value="settingDisplay.SCREEN.itemStyle" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left: auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
