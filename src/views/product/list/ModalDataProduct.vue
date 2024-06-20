<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { InputText } from '../../../common/vue-form'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useScreenStore()
const GROUP = ref<typeof store.PRODUCT_GROUP>(JSON.parse(JSON.stringify(store.PRODUCT_GROUP)))
const UNIT = ref<typeof store.PRODUCT_UNIT>(JSON.parse(JSON.stringify(store.PRODUCT_UNIT)))
const ROUTE = ref<typeof store.PRODUCT_ROUTE>(JSON.parse(JSON.stringify(store.PRODUCT_ROUTE)))
const HINT_USAGE = ref<typeof store.PRODUCT_HINT_USAGE>(
  JSON.parse(JSON.stringify(store.PRODUCT_HINT_USAGE))
)

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('1')

const openModal = async () => {
  showModal.value = true
  GROUP.value = JSON.parse(JSON.stringify(store.PRODUCT_GROUP))
  UNIT.value = JSON.parse(JSON.stringify(store.PRODUCT_UNIT))
  ROUTE.value = JSON.parse(JSON.stringify(store.PRODUCT_ROUTE))
  HINT_USAGE.value = JSON.parse(JSON.stringify(store.PRODUCT_HINT_USAGE))
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === '1') {
      Object.keys(GROUP.value).forEach((key) => {
        if (!GROUP.value[key]) delete GROUP.value[key]
      })
      const data = JSON.stringify(GROUP.value)
      await OrganizationService.saveSettings(ScreenSettingKey.PRODUCT_GROUP, data)
      store.PRODUCT_GROUP = JSON.parse(data)
    }
    if (activeTab.value === '2') {
      const data = JSON.stringify(UNIT.value.filter((i) => !!i))
      UNIT.value = JSON.parse(data)
      await OrganizationService.saveSettings(ScreenSettingKey.PRODUCT_UNIT, data)
      store.PRODUCT_UNIT = JSON.parse(data)
    }
    if (activeTab.value === '3') {
      const data = JSON.stringify(ROUTE.value.filter((i) => !!i))
      ROUTE.value = JSON.parse(data)
      await OrganizationService.saveSettings(ScreenSettingKey.PRODUCT_ROUTE, data)
      store.PRODUCT_ROUTE = JSON.parse(data)
    }
    if (activeTab.value === '4') {
      const data = JSON.stringify(HINT_USAGE.value.filter((i) => !!i))
      HINT_USAGE.value = JSON.parse(data)
      await OrganizationService.saveSettings(ScreenSettingKey.PRODUCT_HINT_USAGE, data)
      store.PRODUCT_HINT_USAGE = JSON.parse(data)
    }

    message.success('Cập nhật cài đặt thành công')
    emit('success')
  } catch (error) {
    console.log('🚀 ~ file: ModalSettingDataProduct.vue:74 ~ handleSaveRoute ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
const handleReload = () => {
  GROUP.value = JSON.parse(JSON.stringify(store.PRODUCT_GROUP))
  UNIT.value = JSON.parse(JSON.stringify(store.PRODUCT_UNIT))
  ROUTE.value = JSON.parse(JSON.stringify(store.PRODUCT_ROUTE))
}

const closeModal = () => {
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt dữ liệu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10">
          <a-tab-pane key="1" tab="Nhóm hàng">
            <div class="w-full">
              <div class="text-center font-bold">Danh sách nhóm hàng hóa</div>
              <div v-for="(r, key) in GROUP" :key="key">
                <div class="py-2 flex items-center gap-4">
                  <InputText v-model:value="GROUP[key]" :prepend="key" style="flex: 1" />
                  <a style="color: var(--text-red)" @click="delete GROUP[key]"> Xóa </a>
                </div>
              </div>
            </div>
            <div class="py-2 flex justify-center">
              <VueButton color="blue" @click="GROUP[Date.now().toString(36)] = ''">
                Thêm mới
              </VueButton>
            </div>
          </a-tab-pane>
          <a-tab-pane key="2" tab="Đơn vị">
            <div class="w-full">
              <div class="text-center font-bold">Danh sách đơn vị hàng hóa</div>
              <div v-for="(u, i) in UNIT" :key="i">
                <div class="py-2 flex gap-4">
                  <InputText v-model:value="UNIT[i]" :prepend="i.toString()" style="flex: 1" />
                  <a style="color: var(--text-red)" @click="UNIT.splice(i, 1)"> Xóa </a>
                </div>
              </div>
            </div>
            <div class="py-2 flex justify-center">
              <VueButton color="blue" @click="UNIT.push('')"> Thêm mới </VueButton>
            </div>
          </a-tab-pane>
          <a-tab-pane key="3" tab="Đường dùng">
            <div class="w-full">
              <div class="text-center font-bold">Danh sách đường dùng</div>
              <div v-for="(r, i) in ROUTE" :key="i">
                <div class="py-2 flex gap-4">
                  <InputText v-model:value="ROUTE[i]" :prepend="i.toString()" style="flex: 1" />
                  <a style="color: var(--text-red)" @click="ROUTE.splice(i, 1)"> Xóa </a>
                </div>
              </div>
            </div>
            <div class="py-2 flex justify-center">
              <VueButton color="blue" @click="ROUTE.push('')"> Thêm mới </VueButton>
            </div>
          </a-tab-pane>
          <a-tab-pane key="4" tab="Cách sử dụng">
            <div class="w-full">
              <div class="text-center font-bold">Danh sách đơn vị hàng hóa</div>
              <div v-for="(u, i) in HINT_USAGE" :key="i">
                <div class="py-2 flex gap-4">
                  <InputText
                    v-model:value="HINT_USAGE[i]"
                    :prepend="i.toString()"
                    style="flex: 1"
                  />
                  <a style="color: var(--text-red)" @click="HINT_USAGE.splice(i, 1)"> Xóa </a>
                </div>
              </div>
            </div>
            <div class="py-2 flex justify-center">
              <VueButton color="blue" @click="HINT_USAGE.push('')"> Thêm mới </VueButton>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton class="ml-auto" @click="closeModal">
            <CloseOutlined />
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" :loading="saveLoading" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss">
.modal-data-product-tabs {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}

.table-payment {
  td {
    padding: 6px 0;
  }
}
</style>
