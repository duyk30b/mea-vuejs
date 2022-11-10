
<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const GROUP = ref<typeof store.PRODUCT_GROUP>(JSON.parse(JSON.stringify(store.PRODUCT_GROUP)))
const UNIT = ref<typeof store.PRODUCT_UNIT>(JSON.parse(JSON.stringify(store.PRODUCT_UNIT)))
const ROUTE = ref<typeof store.PRODUCT_ROUTE>(JSON.parse(JSON.stringify(store.PRODUCT_ROUTE)))

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('1')

const openModal = async () => {
  showModal.value = true
  GROUP.value = JSON.parse(JSON.stringify(store.PRODUCT_GROUP))
  UNIT.value = JSON.parse(JSON.stringify(store.PRODUCT_UNIT))
  ROUTE.value = JSON.parse(JSON.stringify(store.PRODUCT_ROUTE))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === '1') {
      Object.keys(GROUP.value).forEach((key) => {
        if (!GROUP.value[key]) delete GROUP.value[key]
      })
      const data = JSON.stringify(GROUP.value)
      await OrganizationService.saveSettings(OrganizationSettingsType.PRODUCT_GROUP, data)
      store.PRODUCT_GROUP = JSON.parse(data)
    }
    if (activeTab.value === '2') {
      const data = JSON.stringify(UNIT.value.filter((i) => !!i))
      await OrganizationService.saveSettings(OrganizationSettingsType.PRODUCT_UNIT, data)
      store.PRODUCT_UNIT = JSON.parse(data)
      UNIT.value = JSON.parse(data)
    }
    if (activeTab.value === '3') {
      const data = JSON.stringify(ROUTE.value.filter((i) => !!i))
      await OrganizationService.saveSettings(OrganizationSettingsType.PRODUCT_ROUTE, data)
      store.PRODUCT_ROUTE = JSON.parse(data)
      ROUTE.value = JSON.parse(data)
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

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="900px" title="Cài đặt dữ liệu" :confirm-loading="saveLoading"
    :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-between px-2">
        <div>
          <a-button @click="handleReload">Tải lại</a-button>
        </div>
        <div>
          <a-button @click="showModal = false">Hủy</a-button>
          <a-button type="primary" @click="handleSave" :loading="saveLoading">Lưu lại</a-button>
        </div>
      </div>
    </template>
    <div class="modal-data-product-tabs">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10">
        <a-tab-pane key="1" tab="Nhóm thuốc">
          <div class="w-full">
            <div class="text-center font-bold">Danh sách nhóm hàng hóa</div>
            <div v-for="(r, key, i) in GROUP" :key="key">
              <div class="py-2 flex">
                <a-input :addon-before="i + 1" v-model:value="GROUP[key]" style="flex: 1" />
                <a-button type="text" @click="delete GROUP[key]" danger>Xóa</a-button>
              </div>
            </div>
          </div>
          <div class="py-2 flex justify-center">
            <a-button type="primary" @click="GROUP[Date.now().toString(36)] = ''"
              style="background-color: #28a745; border-color: #28a745;">Thêm mới</a-button>
          </div>
        </a-tab-pane>
        <a-tab-pane key="2" tab="Đơn vị">
          <div class="w-full">
            <div class="text-center font-bold">Danh sách đơn vị hàng hóa</div>
            <div v-for="(u, i) in UNIT" :key="i">
              <div class="py-2 flex">
                <a-input :addon-before="i + 1" v-model:value="UNIT[i]" style="flex: 1" />
                <a-button type="text" @click="UNIT.splice(i, 1)" danger>Xóa</a-button>
              </div>
            </div>
          </div>
          <div class="py-2 flex justify-center">
            <a-button type="primary" @click="UNIT.push('')" style="background-color: #28a745; border-color: #28a745;">Thêm
              mới</a-button>
          </div>
        </a-tab-pane>
        <a-tab-pane key="3" tab="Đường dùng">
          <div class="w-full">
            <div class="text-center font-bold">Danh sách đường dùng</div>
            <div v-for="(r, i) in ROUTE" :key="i">
              <div class="py-2 flex">
                <a-input :addon-before="i + 1" v-model:value="ROUTE[i]" style="flex: 1" />
                <a-button type="text" @click="ROUTE.splice(i, 1)" danger>Xóa</a-button>
              </div>
            </div>
          </div>
          <div class="py-2 flex justify-center">
            <a-button type="primary" @click="ROUTE.push('')"
              style="background-color: #28a745; border-color: #28a745;">Thêm mới</a-button>
          </div>
        </a-tab-pane>
      </a-tabs>

    </div>
  </a-modal>
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
