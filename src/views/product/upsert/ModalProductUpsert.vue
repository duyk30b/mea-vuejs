<script setup lang="ts">
import {
  CloseOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputNumber, InputText } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { useProductStore } from '../../../modules/product'
import { Product } from '../../../modules/product/product.model'
import { convertViToEn } from '../../../utils'
import ModalProductUpsertSettingScreen from './ModalProductUpsertSettingScreen.vue'
import { PermissionId } from '../../../modules/permission/permission.enum'

const modalProductUpsertSettingScreen = ref<InstanceType<typeof ModalProductUpsertSettingScreen>>()

const emit = defineEmits<{ (e: 'success', value: Product, type: 'CREATE' | 'UPDATE'): void }>()
const productStore = useProductStore()
const screenStore = useScreenStore()
const { isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)

const product = ref(Product.blank())
const saveLoading = ref(false)

const openModal = async (instance?: Product) => {
  showModal.value = true
  if (instance) {
    product.value = Product.fromInstance(instance)
  }
}

const handleAddUnit = () => {
  product.value.unit.push({ name: '', rate: Math.pow(10, product.value.unit.length) })
}

const handleChangeUnitDefault = (e: any, index: number) => {
  const value = e.target?.checked as boolean
  product.value.unit.forEach((u, i) => {
    if (i === index && value) u.default = true
    else u.default = false
  })
}

const handleClose = () => {
  product.value = Product.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
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

const filterOption = (input: string, option: any) => {
  const inputText = convertViToEn(input).toLowerCase()
  const optionLabel = convertViToEn(option.label || option.value).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thêm/sửa hàng hóa</div>
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

      <div class="px-6 mt-4">
        <div class="flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div class="w-[100px] flex-none text-left">Tên hàng hóa</div>
          <div class="flex-auto">
            <InputText v-model:value="product.brandName" required />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.substance"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Hoạt chất</div>
          <div class="flex-auto">
            <InputText v-model:value="product.substance" />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.group"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Nhóm</div>
          <div class="flex-auto">
            <a-select
              v-model:value="product.group"
              :filter-option="filterOption"
              style="width: 100%"
              show-search
              :options="
                Object.entries(screenStore.PRODUCT_GROUP).map(([value, label]) => ({
                  value,
                  label,
                }))
              "
            />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.unit"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Đơn vị</div>
          <div class="flex-auto">
            <div v-if="product.unit.length === 1">
              <a-auto-complete
                v-model:value="product.unit[0].name"
                :filter-option="filterOption"
                class="w-full"
                :options="screenStore.PRODUCT_UNIT.map((i) => ({ value: i }))"
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
                    <a-auto-complete
                      v-model:value="product.unit[0].name"
                      :filter-option="filterOption"
                      class="w-full"
                      :options="screenStore.PRODUCT_UNIT.map((i) => ({ value: i }))"
                    />
                  </td>
                  <td style="padding-left: 12px">
                    <a-checkbox
                      :checked="!!product.unit[0].default"
                      @change="(e: any) => handleChangeUnitDefault(e, 0)"
                    ></a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td><small>Đơn vị phụ</small></td>
                  <td><small>Quy đổi ra đơn vị cơ bản</small></td>
                  <td></td>
                </tr>
                <tr v-for="(item, index) in product.unit" :key="index" class="py-2">
                  <template v-if="index > 0">
                    <td style="width: 30%; padding: 0 10px 8px 0">
                      <a-auto-complete
                        v-model:value="product.unit[index].name"
                        class="w-full"
                        :options="screenStore.PRODUCT_UNIT.map((i) => ({ value: i }))"
                      />
                    </td>
                    <td style="padding: 0 0 8px 0">
                      <InputNumber
                        v-model:value="product.unit[index].rate"
                        :append="product.unit[0].name"
                        :disabled="index == 0"
                      />
                    </td>
                    <td style="padding: 0 0 8px 12px">
                      <div class="flex flex-nowrap justify-between items-center">
                        <a-checkbox
                          :checked="!!product.unit[index].default"
                          @change="(e: any) => handleChangeUnitDefault(e, index)"
                        ></a-checkbox>
                        <a-button
                          type="text"
                          :disabled="index == 0"
                          danger
                          style="margin-left: 5px"
                          @click="product.unit.splice(index, 1)"
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

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.route"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Đường dùng</div>
          <a-auto-complete
            v-model:value="product.route"
            :filter-option="filterOption"
            :options="screenStore.PRODUCT_ROUTE.map((i) => ({ value: i }))"
            class="flex-auto"
          />
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.source"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Nguồn gốc</div>
          <div class="flex-auto">
            <InputText v-model:value="product.source" />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_PRODUCT_UPSERT.hintUsage"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Cách sử dụng</div>
          <a-auto-complete
            v-model:value="product.hintUsage"
            :filter-option="filterOption"
            :options="screenStore.PRODUCT_HINT_USAGE.map((i) => ({ value: i }))"
            class="flex-auto"
          />
        </div>

        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(product.isActive)"
            @change="(checked: Boolean) => (product.isActive = checked ? 1 : 0)"
          />
          <div v-if="!product.isActive" class="ml-4">
            Sản phẩm này tạm thời không thể nhập hàng và xuất hàng
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="flex gap-4">
          <a-button
            v-if="permissionIdMap[PermissionId.PRODUCT_DELETE] && product.id"
            danger
            @click="clickDelete"
          >
            Xóa
          </a-button>
          <a-button class="ml-auto" @click="handleClose">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" htmlType="submit" :loading="saveLoading">
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalProductUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalProductUpsertSettingScreen"
  />
</template>
