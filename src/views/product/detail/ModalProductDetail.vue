<script setup lang="ts">
import { CloseOutlined, DeploymentUnitOutlined, DiffOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product } from '../../../modules/product'
import ProductInfo from './ProductInfo.vue'
import ProductMovement from './ProductMovement.vue'

const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('product-batch')

const product = ref<Product>(Product.blank())

const openModal = async (data: Product) => {
  showModal.value = true
  product.value = Product.fromInstance(data)
}

const closeModal = () => {
  showModal.value = false
  product.value = Product.blank()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="width: 900px; margin-top: 50px; max-height: calc(100vh - 100px)"
  >
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Hàng hóa: {{ product.brandName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4 product-detail">
        <a-tabs
          v-model:activeKey="activeTab"
          type="card"
          :tabBarGutter="10"
          :destroyInactiveTabPane="true"
        >
          <a-tab-pane key="product-batch">
            <template #tab>
              <span> <DeploymentUnitOutlined />Thông tin </span>
            </template>
            <ProductInfo :product="product" />
          </a-tab-pane>
          <a-tab-pane
            v-if="permissionIdMap[PermissionId.PRODUCT_MOVEMENT_READ]"
            key="product-movement"
          >
            <template #tab>
              <span> <DiffOutlined />Nhập/Xuất </span>
            </template>
            <ProductMovement :product="product" />
          </a-tab-pane>
        </a-tabs>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="closeModal">
            <template #icon>
              <CloseOutlined />
            </template>
            Đóng
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss">
.product-detail {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}
</style>
