<script setup lang="ts">
import {
  CloseOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  SaveOutlined,
  SettingOutlined,
  SisternodeOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputHint,
  InputMoney,
  InputNumber,
  InputOptions,
  InputText,
} from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import type { UnitType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { useProductStore } from '../../../modules/product'
import { Product } from '../../../modules/product/product.model'
import { customFilter } from '../../../utils'
import ModalDataProduct from '../list/ModalDataProduct.vue'
import ModalProductUpsertSettingScreen from './ModalProductUpsertSettingScreen.vue'

const modalProductUpsertSettingScreen = ref<InstanceType<typeof ModalProductUpsertSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()

const emit = defineEmits<{ (e: 'success', value: Product, type: 'CREATE' | 'UPDATE'): void }>()
const productStore = useProductStore()
const screenStore = useScreenStore()
const { isMobile, formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)

const product = ref(Product.blank())
const unit = ref<UnitType[]>([])
const saveLoading = ref(false)

const openModal = async (instance?: Product) => {
  showModal.value = true
  if (instance) {
    product.value = Product.toBasic(instance)
    unit.value = JSON.parse(instance.unit || JSON.stringify([{ name: '', rate: 1, default: true }]))
  } else {
    product.value = Product.blank()
    unit.value = [{ name: '', rate: 1, default: true }]
  }
}

const openModalFromInvoice = () => {
  showModal.value = true
  product.value = Product.blank()
  unit.value = [{ name: '', rate: 1, default: true }]
  product.value.hasManageBatches = 0
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

const handleClose = () => {
  product.value = Product.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  product.value.unit = JSON.stringify(unit.value)
  try {
    if (!product.value.id) {
      const data = await productStore.createOne(product.value)
      emit('success', data, 'CREATE')
    } else {
      const data = await productStore.updateOne(product.value.id, product.value)
      emit('success', data, 'UPDATE')
    }
    product.value = Product.blank()
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:66 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await productStore.deleteOne(product.value.id)
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  if (product.value.quantity != 0) {
    return AlertStore.add({
      type: 'error',
      message: 'Không thể xóa sản phẩm có số lượng > 0',
      time: 2000,
    })
  }
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa sản phẩm này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Sản phẩm đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await handleDelete()
    },
    onCancel() {},
  })
}

defineExpose({ openModal, openModalFromInvoice })
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
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDataProduct?.openModal()"
        >
          <SisternodeOutlined />
        </div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalProductUpsertSettingScreen?.openModal()"
        >
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="my-4 flex flex-wrap gap-4" :class="isMobile ? 'px-4' : 'px-6'">
        <div class="grow basis-[600px]">
          <div class="">Tên hàng hóa</div>
          <div class="">
            <InputText v-model:value="product.brandName" required />
          </div>
        </div>

        <div v-if="screenStore.SCREEN_PRODUCT_UPSERT.substance" class="grow basis-[600px]">
          <div class="">Hoạt chất</div>
          <div class="">
            <InputText v-model:value="product.substance" />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.unit"
          :class="unit.length === 1 ? 'basis-[300px]' : 'basis-[600px]'"
          class="grow"
        >
          <div class="">Đơn vị</div>
          <div class="">
            <div v-if="unit.length === 1">
              <InputHint
                v-model:value="unit[0].name"
                :options="screenStore.PRODUCT_UNIT"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
              />
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
                      :options="screenStore.PRODUCT_UNIT"
                      :logic-filter="(item: string, text: string) => customFilter(item, text)"
                    />
                  </td>
                  <td style="padding-left: 12px">
                    <a-checkbox
                      :checked="!!unit[0].default"
                      @change="(e: any) => handleChangeUnitDefault(e, 0)"
                    ></a-checkbox>
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
                        :options="screenStore.PRODUCT_UNIT"
                        :logic-filter="(item: string, text: string) => customFilter(item, text)"
                      />
                    </td>
                    <td style="padding: 0 0 8px 0">
                      <InputNumber
                        v-model:value="unit[index].rate"
                        :append="unit[0].name"
                        :disabled="index == 0"
                      />
                    </td>
                    <td style="padding: 0 0 8px 12px">
                      <div class="flex flex-nowrap justify-between items-center">
                        <a-checkbox
                          :checked="!!unit[index].default"
                          @change="(e: any) => handleChangeUnitDefault(e, index)"
                        ></a-checkbox>
                        <a-button
                          type="text"
                          :disabled="index == 0"
                          danger
                          style="margin-left: 5px"
                          @click="unit.splice(index, 1)"
                        >
                          Xóa
                        </a-button>
                      </div>
                    </td>
                  </template>
                </tr>
              </table>
            </div>
            <div><a @click="handleAddUnit">Thêm đơn vị</a></div>
          </div>
        </div>

        <div v-if="screenStore.SCREEN_PRODUCT_UPSERT.group" class="grow basis-[300px]">
          <div class="">Nhóm</div>
          <div>
            <InputOptions
              v-model:value="product.group"
              :options="
                Object.entries(screenStore.PRODUCT_GROUP).map(([value, text]) => ({
                  value,
                  text,
                }))
              "
              :logic-filter="(item: any, text: string) => customFilter(item?.text, text)"
            ></InputOptions>
          </div>
        </div>

        <div v-if="screenStore.SCREEN_PRODUCT_UPSERT.route" class="grow basis-[40%]">
          <div class="">Đường dùng {{ product.route }}</div>
          <div>
            <InputHint
              v-model:value="product.route"
              :options="screenStore.PRODUCT_ROUTE"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
            />
          </div>
        </div>

        <div v-if="screenStore.SCREEN_PRODUCT_UPSERT.source" class="grow basis-[40%]">
          <div class="">Nguồn gốc</div>
          <div class="">
            <InputText v-model:value="product.source" />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.hintUsage"
          style="flex-basis: 600px; flex-grow: 1"
          class=""
        >
          <div class="">Cách sử dụng</div>
          <div>
            <InputHint
              v-model:value="product.hintUsage"
              :options="screenStore.PRODUCT_HINT_USAGE"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
            />
          </div>
        </div>

        <div class="grow basis-[40%]">
          <div class="">
            <span>Giá nhập</span>
            <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
              ({{ formatMoney(product.costPrice) }}/{{ unit.find((i) => i.default)?.name }})</span
            >
          </div>
          <div class="">
            <InputMoney
              :value="product.costPrice * (unit.find((i) => i.default)?.rate || 1)"
              :prepend="product.unitDefaultName"
              @update:value="
                (value) => (product.costPrice = value / (unit.find((i) => i.default)?.rate || 1))
              "
            />
          </div>
        </div>

        <div v-if="screenStore.SYSTEM_SETTING.wholesalePrice" class="grow basis-[40%]">
          <div class="">
            <span>Giá bán sỉ</span>
            <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
              ({{ formatMoney(product.wholesalePrice) }}/{{
                unit.find((i) => i.default)?.name
              }})</span
            >
          </div>
          <div class="">
            <InputMoney
              :value="product.wholesalePrice * (unit.find((i) => i.default)?.rate || 1)"
              :prepend="product.unitDefaultName"
              @update:value="
                (value) =>
                  (product.wholesalePrice = value / (unit.find((i) => i.default)?.rate || 1))
              "
            />
          </div>
        </div>

        <div v-if="screenStore.SYSTEM_SETTING.retailPrice" class="grow basis-[40%]">
          <div class="">
            <span>Giá bán lẻ</span>
            <span v-if="unit.find((i) => i.default)?.rate != 1" class="italic">
              ({{ formatMoney(product.retailPrice) }}/{{ unit.find((i) => i.default)?.name }})</span
            >
          </div>
          <div class="">
            <InputMoney
              :value="product.retailPrice * (unit.find((i) => i.default)?.rate || 1)"
              :prepend="product.unitDefaultName"
              @update:value="
                (value) => (product.retailPrice = value / (unit.find((i) => i.default)?.rate || 1))
              "
            />
          </div>
        </div>

        <div class="mt-2 grow basis-[600px] flex items-stretch">
          <div class="w-[60px] flex-none">
            <a-switch
              :checked="Boolean(product.hasManageQuantity)"
              :disabled="!!product.quantity"
              @change="(checked: Boolean) => (product.hasManageQuantity = checked ? 1 : 0)"
            />
          </div>
          <div>
            <span>Quản lý tồn kho</span>
            <span v-if="product.hasManageQuantity">
              ( Số lượng trong kho sẽ được cập nhật khi nhập hoặc xuất )
            </span>
            <span v-if="!product.hasManageQuantity"> ( Sản phẩm này không có số lượng ) </span>
          </div>
        </div>

        <div class="mt-2 grow basis-[600px] flex items-stretch">
          <div class="w-[60px] flex-none">
            <a-switch
              :checked="Boolean(product.hasManageBatches)"
              :disabled="!!product.quantity"
              @change="(checked: Boolean) => (product.hasManageBatches = checked ? 1 : 0)"
            />
          </div>
          <div>
            <span>Quản lý lô hàng và hạn sử dụng</span>
          </div>
        </div>

        <div class="mt-2 grow basis-[600px] flex items-stretch">
          <div class="w-[60px] flex-none">
            <a-switch
              :checked="Boolean(product.isActive)"
              @change="(checked: Boolean) => (product.isActive = checked ? 1 : 0)"
            />
          </div>
          <div>
            <span>Active</span>
            <span v-if="!product.isActive">
              ( Sản phẩm này tạm thời không thể nhập hàng và xuất hàng )
            </span>
          </div>
        </div>
      </div>

      <div class="pb-6 pt-8" :class="isMobile ? 'px-4' : 'px-6'">
        <div class="flex gap-4">
          <a-button
            v-if="permissionIdMap[PermissionId.PRODUCT_DELETE] && product.id"
            danger
            @click="clickDelete"
          >
            Xóa
          </a-button>
          <button class="btn ml-auto" type="reset" @click="handleClose">
            <CloseOutlined /> Hủy bỏ
          </button>
          <button class="btn btn-blue">
            <LoadingOutlined v-if="saveLoading" />
            <SaveOutlined v-if="!saveLoading" /> Lưu lại
          </button>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalProductUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalProductUpsertSettingScreen"
  />
  <ModalDataProduct
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalDataProduct"
  />
</template>
