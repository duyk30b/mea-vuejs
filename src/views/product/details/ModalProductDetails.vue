
<script setup lang="ts">
import { Product } from '@/modules/product'
import { DeploymentUnitOutlined, DiffOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import ProductBatch from './ProductBatch.vue'
import ProductMovement from './ProductMovement.vue'

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('product-batch')

const product = ref<Product>(Product.blank())

const openModal = async (p: Product) => {
  showModal.value = true
  product.value = Product.fromInstance(p)
}

const refreshModal = () => {
  showModal.value = false
  product.value = Product.blank()
}

defineExpose({ openModal })

</script>

<template>
  <a-modal v-model:visible="showModal" width="1200px" :title="'Hàng hóa: ' + product.brandName"
    :confirm-loading="saveLoading" :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-end px-2">
        <div>
          <a-button @click="showModal = false">Đóng</a-button>
        </div>
      </div>
    </template>
    <div class="product-detail">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10" :destroyInactiveTabPane="true">
        <a-tab-pane key="product-batch">
          <template #tab>
            <span>
              <DeploymentUnitOutlined />Thông tin
            </span>
          </template>
          <ProductBatch :product="product" />
        </a-tab-pane>
        <a-tab-pane key="product-movement">
          <template #tab>
            <span>
              <DiffOutlined />Nhập/Xuất
            </span>
          </template>
          <ProductMovement :product="product" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
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
