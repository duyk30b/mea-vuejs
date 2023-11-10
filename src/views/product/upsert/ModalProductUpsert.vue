<script setup lang="ts">
import VueModal from '@/common/VueModal.vue'
import { InputNumber } from '@/common/vue-form'
import { useProductBatchStore, useProductStore } from '@/modules/product'
import { Product } from '@/modules/product/product.model'
import { ProductService } from '@/modules/product/product.service'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import {
  CloseOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import ModalProductUpsertSettingScreen from './ModalProductUpsertSettingScreen.vue'

const modalProductUpsertSettingScreen = ref<InstanceType<typeof ModalProductUpsertSettingScreen>>()

const emit = defineEmits<{ (e: 'success', value: Product, type: 'CREATE' | 'UPDATE'): void }>()
const productStore = useProductStore()
const productBatchStore = useProductBatchStore()
const organizationStore = useOrganizationStore()
const { isMobile } = organizationStore

const showModal = ref(false)

const product = ref(Product.blank())
const saveLoading = ref(false)

const openModal = async (p?: Product) => {
  product.value = p ? Product.fromInstance(p) : Product.blank()
  showModal.value = true
}

const handleAddUnit = () => {
  product.value.unit.push({ name: '', rate: Math.pow(10, product.value.unit.length) })
}

const handleClose = () => {
  product.value = Product.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!product.value.id) {
      const productResponse = await ProductService.createOne(product.value)
      productStore.createOne(productResponse)
      emit('success', productResponse, 'CREATE')
    } else {
      const productResponse = await ProductService.updateOne(product.value.id, product.value)
      const { productBatches, ...productSnap } = productResponse // response trả về không có productBatches
      productStore.updateOne(productSnap.id, productSnap) // vì vậy không update productBatches
      productBatchStore.updateProduct(productResponse)
      emit('success', productResponse, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const filterOption = (input: string, option: any) => {
  const inputText = convertViToEn(input).toLowerCase()
  const optionLabel = convertViToEn(option.label || option.value).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede;">
        <div class="flex-1 text-lg font-medium">Thêm/sửa hàng hóa</div>
        <div style="font-size: 1.2rem;" class="px-4 cursor-pointer" @click="modalProductUpsertSettingScreen?.openModal()">
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem;" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-6 mt-4">
        <div class="flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none text-left">Tên hàng hóa</div>
          <a-input v-model:value="product.brandName" class="flex-auto"></a-input>
        </div>

        <div v-if="organizationStore.SCREEN_PRODUCT_UPSERT.substance" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div class="w-[100px] flex-none">Hoạt chất</div>
          <a-input v-model:value="product.substance" class="flex-auto"></a-input>
        </div>

        <div v-if="organizationStore.SCREEN_PRODUCT_UPSERT.group" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none">Nhóm</div>
          <div class="flex-auto">
            <a-select v-model:value="product.group" :filter-option="filterOption" style="width: 100%" show-search
              :options="Object.entries(organizationStore.PRODUCT_GROUP).map(([value, label]) => ({ value, label }))">
            </a-select>
          </div>
        </div>

        <div v-if="organizationStore.SCREEN_PRODUCT_UPSERT.unit" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none">Đơn vị</div>
          <div class="flex-auto">
            <div>
              <div v-if="product.unit.length > 1"><small>Đơn vị cơ bản</small></div>
              <a-auto-complete v-model:value="product.unit[0].name" :filter-option="filterOption" class="w-full"
                :options="organizationStore.PRODUCT_UNIT.map(i => ({ value: i }))" />
            </div>
            <div v-if="product.unit.length > 1" class="mt-2">
              <div class="flex gap-4 items-end">
                <div class="flex-1">
                  <small>Tên đơn vị</small>
                </div>
                <div class="flex-1">
                  <small>Quy đổi ra đơn vị cơ bản</small>
                </div>
                <div style="width: 60px;">
                </div>
              </div>
              <div v-for="(item, index) in product.unit" :key="index" class="flex">
                <div v-if="index > 0" class="flex-auto flex gap-4 mb-2">
                  <div class="flex-1">
                    <a-auto-complete v-model:value="product.unit[index].name" class="w-full"
                      :options="organizationStore.PRODUCT_UNIT.map(i => ({ value: i }))" />
                  </div>
                  <div class="flex-1">
                    <InputNumber v-model:value="product.unit[index].rate" :append="product.unit[0].name"
                      :disabled="index == 0" />
                  </div>
                  <div style="width: 60px;">
                    <a-button :disabled="index == 0" danger @click="product.unit.splice(index, 1)">Xóa</a-button>
                  </div>
                </div>
              </div>
            </div>
            <div><a @click="handleAddUnit">Thêm đơn vị</a></div>
          </div>
        </div>

        <div v-if="organizationStore.SCREEN_PRODUCT_UPSERT.route" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none">Đường dùng</div>
          <a-auto-complete v-model:value="product.route" :filter-option="filterOption"
            :options="organizationStore.PRODUCT_ROUTE.map(i => ({ value: i }))" class="flex-auto" />
        </div>

        <div v-if="organizationStore.SCREEN_PRODUCT_UPSERT.source" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none">Nguồn gốc</div>
          <a-input v-model:value="product.source" class="flex-auto"></a-input>
        </div>

        <div v-if="organizationStore.SCREEN_PRODUCT_UPSERT.hintUsage" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none">Cách sử dụng</div>
          <a-auto-complete v-model:value="product.hintUsage" :filter-option="filterOption"
            :options="organizationStore.PRODUCT_HINT_USAGE.map(i => ({ value: i }))" class="flex-auto" />
        </div>

        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch v-model:checked="product.isActive" />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="handleClose">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
  <ModalProductUpsertSettingScreen ref="modalProductUpsertSettingScreen" />
</template>
