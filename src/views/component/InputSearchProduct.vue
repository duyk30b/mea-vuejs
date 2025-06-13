<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputOptionsValue } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Product, ProductService } from '@/modules/product'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '@/views/product/upsert/ModalProductUpsert.vue'
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'selectProduct', value: Product): void
  (e: 'update:productId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    productId: number
    quantitySelect?: number
    warehouseId?: number[]
    searchIncludeZeroQuantity?: boolean
    disabled?: boolean
    required?: boolean
    showQuantity?: boolean
    showEditProduct?: boolean
  }>(),
  {
    productId: 0,
    quantitySelect: 0,
    warehouseId: () => [],
    searchIncludeZeroQuantity: true,
    disabled: false,
    required: false,
    showQuantity: true,
    showEditProduct: true,
  },
)

const inputOptionsProduct = ref<InstanceType<typeof InputOptionsValue>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const { userPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const product = ref(Product.blank())

onMounted(async () => {
  await ProductService.refreshDB()
})

watch(
  () => props.productId,
  async (newValue) => {
    if (newValue != product.value.id) {
      const productData = await ProductService.getOne(newValue)
      if (productData) {
        setProductFromParent(productData)
      }
    }
  },
  { immediate: true },
)

const searchingProduct = async (text: string) => {
  if (!text) {
    productOptions.value = []
    return
  }

  const productList = await ProductService.list({
    filter: {
      isActive: 1,
      $AND: [
        {
          $OR: [
            { productCode: { LIKE: text } },
            { brandName: { LIKE: text } },
            { substance: { LIKE: text } },
          ],
        },
        {
          $OR: [
            { quantity: props.searchIncludeZeroQuantity ? undefined : { NOT: 0 } },
            { warehouseIds: '[]' },
          ],
        },
      ],
      warehouseIds: (value) => {
        try {
          const v: number[] = JSON.parse(value)
          if (!props.warehouseId.length || props.warehouseId.includes(0)) return true
          if (!v.length || v.includes(0)) return true

          for (let i = 0; i < v.length; i++) {
            if (props.warehouseId.includes(v[i])) {
              return true
            }
          }
          return false
        } catch (error) {
          return true
        }
      },
    },
  })
  productOptions.value = productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))
}

const setProductFromChild = async (item: any) => {
  const productData = item.data
  product.value = Product.from(productData)
  emit('update:productId', productData.id)
  emit('selectProduct', productData)
}

const setProductFromCurrent = async (productData: Product) => {
  product.value = Product.from(productData)
  productOptions.value = [{ value: productData.id, text: productData.brandName, data: productData }]
  emit('update:productId', productData.id)
  emit('selectProduct', productData)
}

const setProductFromParent = async (productData: Product) => {
  product.value = Product.from(productData)
  productOptions.value = [{ value: productData.id, text: productData.brandName, data: productData }]
}

const handleModalProductUpsertSuccess = (productData?: Product) => {
  if (productData) {
    setProductFromCurrent(productData)
  }
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />

  <div class="flex gap-1 flex-wrap">
    <span>Tên sản phẩm</span>
    <a v-if="product.id" @click="modalProductDetail?.openModal(product)">
      <IconFileSearch />
    </a>
    <div v-if="showQuantity && product.id">
      (
      <span
        v-if="product.warehouseIds !== '[]'"
        :class="quantitySelect > product!.quantity ? 'text-red-500 font-bold' : ''"
      >
        Tồn:
        <b>
          {{ product?.unitQuantity }}
          {{ product?.unitDefaultName }}
        </b>
      </span>
      <span>
        - Giá
        <b>{{ formatMoney(product!.unitRetailPrice) }}</b>
      </span>
      )
    </div>
    <a
      v-if="showEditProduct && userPermission[PermissionId.PRODUCT_UPDATE] && product?.id"
      @click="modalProductUpsert?.openModal(product.id)"
    >
      Sửa thông tin sản phẩm
    </a>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsProduct"
      :value="product.id"
      :disabled="disabled"
      :maxHeight="320"
      :options="productOptions"
      :prepend="product?.productCode"
      placeholder="Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
      :required="required"
      @selectItem="(item) => setProductFromChild(item)"
      @searching="searchingProduct"
    >
      <template #option="{ item: { data } }">
        <div>
          <span>{{ data.productCode }}</span>
          -
          <b>{{ data.brandName }}</b>
          -
          <span :class="data.unitQuantity <= 0 ? 'text-red-500' : ''" style="font-weight: 700">
            {{ data.unitQuantity }}
          </span>
          {{ data.unitDefaultName }}
          - Giá
          <span style="font-weight: 600">{{ formatMoney(data.unitRetailPrice) }}</span>
          /{{ data.unitDefaultName }}
        </div>
        <div>{{ data.substance }}</div>
      </template>
    </InputOptionsValue>
  </div>
</template>

<style lang="scss" scoped></style>
