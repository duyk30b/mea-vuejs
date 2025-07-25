<script lang="ts" setup>
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useSettingStore } from '@/modules/_me/setting.store.ts'
import { SettingKey } from '@/modules/_me/store.variable.ts'
import { OrganizationService } from '@/modules/organization'

const TABS_KEY = {
  ROUTE: 'ROUTE',

  UNIT: 'UNIT',
  HINT_USAGE: 'HINT_USAGE',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const UNIT = ref<typeof store.PRODUCT_UNIT>(JSON.parse(JSON.stringify(store.PRODUCT_UNIT)))
const ROUTE = ref<typeof store.PRODUCT_ROUTE>(JSON.parse(JSON.stringify(store.PRODUCT_ROUTE)))
const HINT_USAGE = ref<typeof store.PRODUCT_HINT_USAGE>(
  JSON.parse(JSON.stringify(store.PRODUCT_HINT_USAGE)),
)

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref(TABS_KEY.UNIT)

const openModal = async () => {
  showModal.value = true
  UNIT.value = JSON.parse(JSON.stringify(store.PRODUCT_UNIT))
  ROUTE.value = JSON.parse(JSON.stringify(store.PRODUCT_ROUTE))
  HINT_USAGE.value = JSON.parse(JSON.stringify(store.PRODUCT_HINT_USAGE))
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === TABS_KEY.UNIT) {
      const data = JSON.stringify(UNIT.value.filter((i) => !!i))
      UNIT.value = JSON.parse(data)
      await OrganizationService.saveSettings(SettingKey.PRODUCT_UNIT, data)
      store.PRODUCT_UNIT = JSON.parse(data)
    } else if (activeTab.value === TABS_KEY.ROUTE) {
      const data = JSON.stringify(ROUTE.value.filter((i) => !!i))
      ROUTE.value = JSON.parse(data)
      await OrganizationService.saveSettings(SettingKey.PRODUCT_ROUTE, data)
      store.PRODUCT_ROUTE = JSON.parse(data)
    } else if (activeTab.value === TABS_KEY.HINT_USAGE) {
      const data = JSON.stringify(HINT_USAGE.value.filter((i) => !!i))
      HINT_USAGE.value = JSON.parse(data)
      await OrganizationService.saveSettings(SettingKey.PRODUCT_HINT_USAGE, data)
      store.PRODUCT_HINT_USAGE = JSON.parse(data)
    } else {
      return AlertStore.addError('Cập nhật thất bại')
    }

    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    emit('success')
  } catch (error) {
    console.log('🚀 ~ file: ModalSettingDataProduct.vue:74 ~ handleSaveRoute ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt dữ liệu</div>
        <div class="px-4 cursor-pointer" style="font-size: 1.2rem" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.UNIT">Đơn vị</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.ROUTE">Đường dùng</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.HINT_USAGE">Cách sử dụng</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.UNIT">
              <div class="mt-4 w-full">
                <div class="text-center font-bold">Danh sách đơn vị hàng hóa</div>
                <div v-for="(u, i) in UNIT" :key="i">
                  <div class="py-2 flex gap-4">
                    <InputText v-model:value="UNIT[i]" :prepend="i.toString()" style="flex: 1" />
                    <a style="color: var(--text-red)" @click="UNIT.splice(i, 1)">Xóa</a>
                  </div>
                </div>
              </div>
              <div class="py-2 flex">
                <VueButton color="blue" icon="plus" @click="UNIT.push('')"></VueButton>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROUTE">
              <div class="mt-4 w-full">
                <div class="text-center font-bold">Danh sách đường dùng</div>
                <div v-for="(r, i) in ROUTE" :key="i">
                  <div class="py-2 flex gap-4">
                    <InputText v-model:value="ROUTE[i]" :prepend="i.toString()" style="flex: 1" />
                    <a style="color: var(--text-red)" @click="ROUTE.splice(i, 1)">Xóa</a>
                  </div>
                </div>
              </div>
              <div class="py-2 flex">
                <VueButton color="blue" icon="plus" @click="ROUTE.push('')"></VueButton>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.HINT_USAGE">
              <div class="mt-4 w-full">
                <div class="text-center font-bold">Danh sách các cách sử dụng cơ bản</div>
                <div v-for="(u, i) in HINT_USAGE" :key="i">
                  <div class="py-2 flex gap-4">
                    <InputText
                      v-model:value="HINT_USAGE[i]"
                      :prepend="i.toString()"
                      style="flex: 1"
                    />
                    <a style="color: var(--text-red)" @click="HINT_USAGE.splice(i, 1)">Xóa</a>
                  </div>
                </div>
              </div>
              <div class="py-2 flex">
                <VueButton color="blue" icon="plus" @click="HINT_USAGE.push('')"></VueButton>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left: auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton :loading="saveLoading" color="blue" icon="save" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss"></style>
