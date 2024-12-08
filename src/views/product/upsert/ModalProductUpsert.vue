<script setup lang="ts">
import { SisternodeOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputDate,
  InputHint,
  InputMoney,
  InputNumber,
  InputOptions,
  InputText,
} from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { UnitType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductService } from '../../../modules/product'
import { ProductGroup, ProductGroupService } from '../../../modules/product-group'
import { Product } from '../../../modules/product/product.model'
import { customFilter } from '../../../utils'
import ModalDataProduct from '../list/ModalDataProduct.vue'
import ModalProductUpsertSettingScreen from './ModalProductUpsertSettingScreen.vue'

const modalProductUpsertSettingScreen = ref<InstanceType<typeof ModalProductUpsertSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()

const emit = defineEmits<{
  (e: 'success', value: Product, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { isMobile, formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const product = ref(Product.blank())
const productGroupOptions = ref<{ text: string; value: number; data: ProductGroup }[]>([])
const unit = ref<UnitType[]>([{ name: '', rate: 1, default: true }])

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (productId?: number) => {
  showModal.value = true
  if (!productId) {
    product.value = Product.blank()
    unit.value = [{ name: '', rate: 1, default: true }]
  } else {
    const productFetch = await ProductService.getOne(productId, {})
    product.value = productFetch
    unit.value = JSON.parse(
      productFetch.unit || JSON.stringify([{ name: '', rate: 1, default: true }])
    )
  }

  const productGroupAll = await ProductGroupService.list({})
  productGroupOptions.value = productGroupAll.map((i) => ({
    value: i.id,
    text: i.name,
    data: i,
  }))
}

const openModalFromTicket = () => {
  showModal.value = true
  product.value = Product.blank()
  unit.value = [{ name: '', rate: 1, default: true }]
  product.value.hasManageQuantity = 0
}

const handleAddUnit = () => {
  unit.value.push({ name: '', rate: Math.pow(10, unit.value.length) })
}

const handleChangeUnitDefault = (e: any, index: number) => {
  const value = e.target?.checked as boolean
  unit.value.forEach((u, i) => {
    if (i === index && value) u.default = true
    else delete u.default
  })
}

const closeModal = () => {
  product.value = Product.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  product.value.unit = JSON.stringify(unit.value)
  try {
    if (!product.value.id) {
      const data = await ProductService.createOne(product.value)
      emit('success', data, 'CREATE')
    } else {
      const data = await ProductService.updateOne(product.value.id, product.value)
      emit('success', data, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:66 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  if (product.value.quantity != 0) {
    return ModalStore.alert({
      title: 'Không thể xóa sản phẩm có số lượng > 0',
      content: [
        '- Nếu bắt buộc phải xoá, bạn cần phải hủy bỏ tất cả các phiếu nhập hàng đã từng nhập sản phẩm này',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa sản phẩm này',
    content: 'Sản phẩm đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await ProductService.destroyOne(product.value.id)
        if (response.success) {
          emit('success', product.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa sản phầm khi đã được nhập hàng hoặc bán hàng',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu nhập hàng và phiếu bán hàng trước',
              `Hiện tại đang có ${response.data.countReceiptItem} phiếu nhập hàng và ${response.data.countTicketProduct} phiếu bán hàng`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalProductUpsert.vue:139 ~ handleDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal, openModalFromTicket })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span v-if="!product.id">Thêm sản phẩm</span>
          <span v-if="product.id">Sửa sản phẩm</span>
        </div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDataProduct?.openModal()">
          <SisternodeOutlined />
        </div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalProductUpsertSettingScreen?.openModal()">
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="my-4 flex flex-wrap gap-4" :class="isMobile ? 'px-4' : 'px-6'">
        <div class="grow basis-[600px]">
          <div class="">Tên hàng hóa</div>
          <div class="">
            <InputText v-model:value="product.brandName" required />
          </div>
        </div>

        <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.substance" class="grow basis-[600px]">
          <div class="">Hoạt chất</div>
          <div class="">
            <InputText v-model:value="product.substance" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_PRODUCT_UPSERT.unit"
          :class="unit.length === 1 ? 'basis-[300px]' : 'basis-[600px]'"
          class="grow">
          <div class="">Đơn vị</div>
          <div class="">
            <div v-if="unit.length === 1">
              <InputHint
                v-model:value="unit[0].name"
                :options="settingStore.PRODUCT_UNIT"
                :logic-filter="(item: string, text: string) => customFilter(item, text)" />
            </div>
            <div v-else class="mt-2">
              <table style="width: 100%">
                <tr>
                  <td colspan="2"><small>Đơn vị cơ bản</small></td>
                  <td style="padding-left: 12px"><small>Mặc định</small></td>
                </tr>
                <tr>
                  <td colspan="2">
                    <InputHint
                      v-model:value="unit[0].name"
                      required
                      :options="settingStore.PRODUCT_UNIT"
                      :logic-filter="(item: string, text: string) => customFilter(item, text)" />
                  </td>
                  <td style="padding-left: 12px">
                    <a-checkbox
                      :checked="!!unit[0].default"
                      @change="(e: any) => handleChangeUnitDefault(e, 0)"></a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td><small>Đơn vị phụ</small></td>
                  <td><small>Quy đổi ra đơn vị cơ bản</small></td>
                  <td></td>
                </tr>
                <tr v-for="(item, index) in unit" :key="index" class="py-2">
                  <template v-if="index > 0">
                    <td style="width: 30%; padding: 0 10px 8px 0">
                      <InputHint
                        v-model:value="unit[index].name"
                        required
                        :options="settingStore.PRODUCT_UNIT"
                        :logic-filter="(item: string, text: string) => customFilter(item, text)" />
                    </td>
                    <td style="padding: 0 0 8px 0">
                      <InputNumber
                        v-model:value="unit[index].rate"
                        :append="unit[0].name"
                        :disabled="index == 0" />
                    </td>
                    <td style="padding: 0 12px 8px 12px">
                      <div class="flex flex-nowrap justify-between items-center">
                        <a-checkbox
                          :checked="!!unit[index].default"
                          @change="(e: any) => handleChangeUnitDefault(e, index)"></a-checkbox>
                        <a style="color: var(--text-red)" @click="unit.splice(index, 1)">Xóa</a>
                      </div>
                    </td>
                  </template>
                </tr>
              </table>
            </div>
            <div><a @click="handleAddUnit">Thêm đơn vị</a></div>
          </div>
        </div>

        <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.group" class="grow basis-[300px]">
          <div class="">Nhóm</div>
          <div>
            <InputOptions
              v-model:value="product.productGroupId"
              :options="productGroupOptions"
              :logic-filter="
                (item: any, text: string) => customFilter(item?.text, text)
              "></InputOptions>
          </div>
        </div>

        <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.route" class="grow basis-[40%]">
          <div class="">Đường dùng</div>
          <div>
            <InputHint
              v-model:value="product.route"
              :options="settingStore.PRODUCT_ROUTE"
              :logic-filter="(item: string, text: string) => customFilter(item, text)" />
          </div>
        </div>

        <div v-if="settingStore.SCREEN_PRODUCT_UPSERT.source" class="grow basis-[40%]">
          <div class="">Nguồn gốc</div>
          <div class="">
            <InputText v-model:value="product.source" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_PRODUCT_UPSERT.hintUsage"
          style="flex-basis: 600px; flex-grow: 1"
          class="">
          <div class="">Cách sử dụng</div>
          <div>
            <InputHint
              v-model:value="product.hintUsage"
              :options="settingStore.PRODUCT_HINT_USAGE"
              :logic-filter="(item: string, text: string) => customFilter(item, text)" />
          </div>
        </div>

        <div v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="grow basis-[40%]">
          <div class="">
            <span>Giá bán sỉ</span>
            <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
              ({{ formatMoney(product.wholesalePrice) }}/{{ unit.find((i) => i.default)?.name }})
            </span>
          </div>
          <div class="">
            <InputMoney
              :value="product.wholesalePrice * (unit.find((i) => i.default)?.rate || 1)"
              :prepend="product.unitDefaultName"
              @update:value="
                (value) =>
                  (product.wholesalePrice = value / (unit.find((i) => i.default)?.rate || 1))
              " />
          </div>
        </div>

        <div v-if="settingStore.SYSTEM_SETTING.retailPrice" class="grow basis-[40%]">
          <div class="">
            <span>Giá bán lẻ</span>
            <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
              ({{ formatMoney(product.retailPrice) }}/{{ unit.find((i) => i.default)?.name }})
            </span>
          </div>
          <div class="">
            <InputMoney
              :value="product.retailPrice * (unit.find((i) => i.default)?.rate || 1)"
              :prepend="product.unitDefaultName"
              @update:value="
                (value) => (product.retailPrice = value / (unit.find((i) => i.default)?.rate || 1))
              " />
          </div>
        </div>

        <div class="mt-2 grow basis-[600px] flex items-stretch">
          <div class="w-[60px] flex-none">
            <a-switch
              :checked="Boolean(product.hasManageQuantity)"
              :disabled="!!product.quantity"
              @change="(checked: Boolean) => (product.hasManageQuantity = checked ? 1 : 0)" />
          </div>
          <div>
            <span>Quản lý tồn kho</span>
            <span v-if="product.hasManageQuantity">
              ( Số lượng trong kho sẽ được cập nhật khi nhập hoặc xuất )
            </span>
            <span v-if="!product.hasManageQuantity">( Sản phẩm này không quan tâm số lượng )</span>
          </div>
        </div>

        <div class="mt-2 grow basis-[600px] flex items-stretch">
          <div class="w-[60px] flex-none">
            <a-switch
              :checked="Boolean(product.isActive)"
              @change="(checked: Boolean) => (product.isActive = checked ? 1 : 0)" />
          </div>
          <div>
            <span v-if="product.isActive">Active</span>
            <span v-else>Inactive (Ngừng kinh doanh)</span>
          </div>
        </div>
      </div>

      <div class="pb-6 pt-8" :class="isMobile ? 'px-4' : 'px-6'">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.PRODUCT_DELETE] && product.id"
            color="red"
            @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton class="btn ml-auto" icon="close" type="reset" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalProductUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalProductUpsertSettingScreen" />
  <ModalDataProduct
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalDataProduct" />
</template>
