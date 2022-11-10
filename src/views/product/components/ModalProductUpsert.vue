
<script setup lang="ts">
import { Product } from '@/modules/product/product.model'
import { ProductService } from '@/modules/product/product.service'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success', value: Product, type: 'CREATE' | 'UPDATE'): void }>()
const organizationStore = useOrganizationStore()

const showModal = ref(false)
const showUnitForm = ref(false)

const product = ref(Product.blank())
const saveLoading = ref(false)

const openModal = async (p?: Product) => {
  product.value = p ? Product.fromInstance(p) : Product.blank()
  showModal.value = true
}

const refreshModal = () => {
  product.value = Product.blank()
  showModal.value = false
}

const handleAddUnit = () => {
  if (!showUnitForm.value) showUnitForm.value = true
  product.value.unit.push({ name: '', rate: 1 })
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!product.value.id) {
      const response = await ProductService.createOne(product.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await ProductService.updateOne(product.value.id, product.value)
      emit('success', response, 'UPDATE')
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
  const optionLabel = convertViToEn(option.label).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="900px" :title="product.id ? 'Cập nhật hàng hóa' : 'Tạo hàng hóa mới'"
    :confirm-loading="saveLoading" :afterClose="refreshModal" @ok="handleSave">
    <div>
      <div class="flex items-center">
        <div class="w-[100px] flex-none">Tên hàng hóa</div>
        <a-input v-model:value="product.brandName" class="flex-auto"></a-input>
      </div>
      <div v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.substance" class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Hoạt chất</div>
        <a-input v-model:value="product.substance" class="flex-auto"></a-input>
      </div>
      <div v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.group" class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Nhóm</div>
        <a-select v-model:value="product.group" :filter-option="filterOption" class="flex-auto" show-search
          :options="Object.entries(organizationStore.PRODUCT_GROUP).map(([value, label]) => ({ value, label }))">
        </a-select>
      </div>
      <template v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.unit">
        <div class="flex items-center mt-3">
          <div class="w-[100px] flex-none">Đơn vị</div>
          <div class="flex-auto">
            <a-auto-complete v-model:value="product.unit[0].name" class="w-full"
              :options="organizationStore.PRODUCT_UNIT.map(i => ({ value: i }))" />
          </div>
        </div>
        <div v-if="showUnitForm || product.unit.length > 1">
          <div class="flex items-center mt-2">
            <div class="w-[100px] flex-none"></div>
            <div class="flex-auto flex gap-4 items-end">
              <div class="flex-1">
                <div><small>Tên đơn vị</small></div>
                <a-input :value="product.unit[0].name + ' (Đơn vị cơ bản)'" disabled class="w-full" />
              </div>
              <div class="flex-1">
                <div><small>Quy đổi đơn vị</small></div>
                <a-input :value="product.unit[0].rate" disabled :addon-after="product.unit[0].name" class="w-full" />
              </div>
              <div>
                <a-button disabled danger>Xóa</a-button>
              </div>
            </div>
          </div>
          <template v-for="(item, index) in product.unit" :key="index">
            <div v-if="index >= 1" class="flex mt-2">
              <div class="w-[100px] flex-none"></div>
              <div class="flex-auto flex gap-4">
                <div class="flex-1">
                  <a-auto-complete v-model:value="product.unit[index].name" class="w-full"
                    :options="organizationStore.PRODUCT_UNIT.map(i => ({ value: i }))" />
                </div>
                <div class="flex-1">
                  <a-input-number v-model:value="product.unit[index].rate" :min="1" :addon-after="product.unit[0].name"
                    class="w-full" />
                </div>
                <div>
                  <a-button danger @click="product.unit.splice(index, 1)">Xóa</a-button>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="flex items-center">
          <div class="w-[100px] flex-none"></div>
          <div><a @click="handleAddUnit">Thêm đơn vị</a></div>
        </div>
      </template>

      <div v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.source" class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Nguồn gốc</div>
        <a-input v-model:value="product.source" class="flex-auto"></a-input>
      </div>
      <div v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.route" class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Đường dùng</div>
        <a-auto-complete v-model:value="product.route" :options="organizationStore.PRODUCT_ROUTE.map(i => ({ value: i }))"
          class="flex-auto" />
      </div>
      <div v-if="organizationStore.SCREEN_PRODUCT_LIST.upsert.hintUsage" class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Cách sử dụng</div>
        <a-input v-model:value="product.hintUsage" class="flex-auto"></a-input>
      </div>
      <div class="flex items-center mt-4">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch v-model:checked="product.isActive" />
      </div>
    </div>
  </a-modal>
</template>
