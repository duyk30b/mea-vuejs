<script setup lang="ts">
import { SisternodeOutlined, DoubleRightOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconTrash } from '../../../common/icon'
import {
  InputMoney,
  InputNumber,
  InputOptions,
  InputText,
  VueSelect,
} from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Procedure, useProcedureStore } from '../../../modules/procedure'
import { customFilter } from '../../../utils'
import ModalDataProcedure from './ModalDataProcedure.vue'
import { Product, useProductStore } from '../../../modules/product'
import { onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'success', value: Procedure, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()
const modalDataProcedure = ref<InstanceType<typeof ModalDataProcedure>>()

const procedureStore = useProcedureStore()
const productStore = useProductStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedure = ref(Procedure.blank())
const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const consumableList = ref<{ product?: Product; quantity: number }[]>([])

const isRegimen = ref(false)
const gapHoursType = ref(24)

const showModal = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  try {
    const { hasChange } = await productStore.refreshDB()
  } catch (error: any) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:50 ~ onMounted ~ error:', error)
  }
})

const openModal = async (instance?: Procedure) => {
  showModal.value = true
  procedure.value = instance ? Procedure.from(instance) : Procedure.blank()
  isRegimen.value = (instance?.quantityDefault || 0) > 1

  if (instance?.consumablesHint) {
    const consumableHint = JSON.parse(instance.consumablesHint) as {
      productId: number
      quantity: number
    }[]
    if (Array.isArray(consumableHint)) {
      if (!consumableHint.length) {
        consumableList.value = []
      }
      if (consumableHint.length) {
        const productIdList = consumableHint.map((i) => i.productId)
        const productListResponse = await productStore.list({
          filter: { id: { IN: productIdList } },
        })
        consumableList.value = consumableHint.map((i) => {
          const productFind = productListResponse.find((j) => j.id === i.productId)
          return {
            product: productFind,
            quantity: i.quantity,
          }
        })
      }
    }
  }
}

const searchingProduct = async (text: string) => {
  if (!text) return (productOptions.value = [])

  const productList = await productStore.search(text)
  productOptions.value = productList.map((i) => ({
    value: i.id,
    text: i.brandName,
    data: i,
  }))
}

const selectProduct = (p: Product) => {
  consumableList.value.push({ product: p, quantity: 1 })
}

const closeModal = () => {
  showModal.value = false
  procedure.value = Procedure.blank()
  consumableList.value = []
  productOptions.value = []
}

const handleSave = async () => {
  saveLoading.value = true
  const consumablesHint = consumableList.value.map((i) => ({
    productId: i.product!.id,
    quantity: i.quantity,
  }))
  procedure.value.consumablesHint = JSON.stringify(consumablesHint)
  try {
    if (!procedure.value.id) {
      const response = await procedureStore.createOne(procedure.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await procedureStore.updateOne(procedure.value.id, procedure.value)
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:60 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await procedureStore.deleteOne(procedure.value.id)
    emit('success', Procedure.from(procedure.value), 'DELETE')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa dịch vụ này',
    content: 'Dịch vụ đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await handleDelete()
    },
  })
}

const handleChangeIsRegimen = (e: Event) => {
  const target = e.target as HTMLInputElement
  isRegimen.value = target.checked
  if (!target.checked) {
    procedure.value.quantityDefault = 1
    procedure.value.gapHours = 0
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ procedure.id ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới' }}
        </div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDataProcedure?.openModal()">
          <SisternodeOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div class="">Tên dịch vụ</div>
          <div class="">
            <InputText v-model:value="procedure.name" required />
          </div>
        </div>
        <div class="mt-3">
          <div class="">Nhóm</div>
          <div>
            <InputOptions
              v-model:value="procedure.group"
              :options="
                Object.entries(settingStore.PROCEDURE_GROUP).map(([value, text]) => ({
                  value,
                  text,
                }))
              "
              :logic-filter="(item: any, text: string) => customFilter(item?.text, text)" />
          </div>
        </div>
        <div class="mt-3">
          <div>Giá dịch vụ</div>
          <div>
            <InputMoney v-model:value="procedure.price" :min="0" style="width: 100%" />
          </div>
        </div>

        <div class="mt-10 font-bold">
          <DoubleRightOutlined />
          Vật tư tiêu hao khi sử dụng dịch vụ
        </div>
        <div class="mt-4">
          <div class="flex items-center">
            <div class="flex-auto">
              <InputOptions
                ref="inputOptionsProduct"
                :options="productOptions"
                :maxHeight="260"
                placeholder="Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
                clear-after-selected
                @selectItem="({ data }) => selectProduct(data)"
                @update:text="searchingProduct">
                <template #option="{ item: { data } }">
                  <div>
                    <b>{{ data.brandName }}</b>
                    <span v-if="data.hasManageQuantity">
                      - Tồn
                      <span
                        style="font-weight: 700"
                        :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
                        {{ data.unitQuantity }}
                      </span>
                      {{ data.unitDefaultName }}
                    </span>
                    - Giá {{ formatMoney(data.unitRetailPrice) }}
                  </div>
                  <div>{{ data.substance }}</div>
                </template>
              </InputOptions>
            </div>
          </div>
          <div class="table-wrapper mt-4">
            <table class="screen-setting">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên hàng hóa</th>
                  <th>Số lượng</th>
                  <th>ĐV</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="consumableList.length === 0">
                  <td colspan="20" class="text-center">No data</td>
                </tr>
                <tr v-for="(p, i) in consumableList" :key="i">
                  <td class="text-center">{{ i + 1 }}</td>
                  <td>{{ p.product!.brandName }}</td>
                  <td class="text-right">
                    <input
                      v-model="consumableList[i].quantity"
                      style="width: 100px"
                      type="number"
                      min="0" />
                  </td>
                  <td class="text-center">{{ consumableList[i].product?.unitDefaultName }}</td>
                  <td class="text-center">
                    <a class="text-red-500" @click="consumableList.splice(i, 1)">
                      <IconTrash />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-10 font-bold">
          <DoubleRightOutlined />
          <label class="mx-2 cursor-pointer" for="isRegimen">
            Là liệu trình ? Dịch vụ này có nhiều buổi không ?
          </label>
          <input
            id="isRegimen"
            v-model="isRegimen"
            type="checkbox"
            name="isRegimen"
            @change="handleChangeIsRegimen" />
          <br />
        </div>
        <div v-if="isRegimen">
          <div class="mt-3">
            <div>Số buổi làm</div>
            <div>
              <InputNumber v-model:value="procedure.quantityDefault" :min="1" />
            </div>
          </div>
          <div class="mt-3">
            <div>Khoảng cách mỗi buổi</div>
            <div class="flex">
              <VueSelect
                v-model:value="gapHoursType"
                style="width: 120px"
                :options="[
                  { value: 24, text: 'Ngày' },
                  { value: 24 * 7, text: 'Tuần' },
                  { value: 24 * 30, text: 'Tháng' },
                ]" />
              <div style="width: calc(100% - 120px)">
                <InputNumber
                  :value="procedure.gapHours / gapHoursType"
                  @update:value="(v) => (procedure.gapHours = v * gapHoursType)" />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 flex items-center">
          <div class="">Active</div>
          <div class="ml-4">
            <a-switch
              :checked="Boolean(procedure.isActive)"
              @change="(checked: Boolean) => (procedure.isActive = checked ? 1 : 0)" />
          </div>
          <div v-if="!procedure.isActive" class="ml-4">Dịch vụ này tạm thời ngừng kinh doanh</div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.PROCEDURE_DELETE] && procedure.id"
            color="red"
            icon="trash"
            @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton type="reset" class="ml-auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalDataProcedure
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalDataProcedure" />
</template>

<style lang="scss" scoped>
input {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid #ccc;
  text-align: left;
  padding-left: 12px;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
