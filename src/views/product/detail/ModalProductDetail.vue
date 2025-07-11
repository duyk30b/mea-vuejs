<script setup lang="ts">
import { DiscountInteractType } from '@/modules/discount'
import DiscountTableAction from '@/views/master-data/discount/common/DiscountTableAction.vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconDiff, IconDollar, IconInfoCircle } from '../../../common/icon-antd'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { MeService } from '../../../modules/_me/me.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import ProductInfoAndBatchList from './ProductInfoAndBatchList.vue'
import ProductAndBatchMovement from './ProductMovementList.vue'

const emit = defineEmits<{ (e: 'close'): void }>()

const TABS_KEY = {
  INFO: 'INFO',
  DISCOUNT: 'DISCOUNT',
  MOVEMENT: 'MOVEMENT',
}

const { userPermission } = MeService

const showModal = ref(false)
const tabShow = ref(TABS_KEY.INFO)

const product = ref<Product>(Product.blank())

const openModal = async (productProp: Product) => {
  showModal.value = true
  product.value = Product.from(productProp)
}

const closeModal = () => {
  showModal.value = false
  product.value = Product.blank()
  emit('close')
}

const handleChangeProduct = (p: Product) => {
  product.value = Product.from(p)
}

const selectTabDiscount = async () => {
  try {
    const productData = await ProductService.detail(
      product.value.id,
      { relation: { discountList: true } },
      { query: true },
    )
    product.value = productData
  } catch (error) {}
}

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="width: 1200px; margin-top: 50px; max-height: calc(100vh - 100px)"
  >
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Hàng hóa: {{ product.brandName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="tabShow">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.INFO">
              <IconInfoCircle />
              Thông tin
            </VueTabMenu>
            <VueTabMenu @active="selectTabDiscount" :tabKey="TABS_KEY.DISCOUNT">
              <IconDollar />
              Khuyến mãi
            </VueTabMenu>
            <VueTabMenu
              v-if="userPermission[PermissionId.PRODUCT_READ_MOVEMENT]"
              :tabKey="TABS_KEY.MOVEMENT"
            >
              <IconDiff />
              Nhập/Xuất
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <ProductInfoAndBatchList
                :productId="product.id"
                @change-product="handleChangeProduct"
              />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="product.discountList!"
                  :discountInteractId="product.id"
                  :discountInteractType="DiscountInteractType.Product"
                  :discountListExtra="product.discountListExtra || []"
                  :editable="false"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.MOVEMENT">
              <ProductAndBatchMovement :product="product" />
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <VueButton icon="close" @click="closeModal">Đóng</VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss"></style>
