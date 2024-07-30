<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { IconDelete } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputHint, InputOptions, InputText } from '../../../../common/vue-form'
import InputNumber from '../../../../common/vue-form/InputNumber.vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import {
  type MedicineType,
  PrescriptionSample,
  PrescriptionSampleApi,
  PrescriptionSampleService,
} from '../../../../modules/prescription-sample'
import { Product, ProductService } from '../../../../modules/product'
import { arrayToKeyValue, DString } from '../../../../utils'

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const prescriptionSampleRoot = ref<PrescriptionSample>(PrescriptionSample.blank())
const prescriptionSample = ref<PrescriptionSample>(PrescriptionSample.blank())
const medicineItem = ref<MedicineType>({
  productId: 0,
  quantity: 0,
  hintUsage: '',
})
const productAll = ref<Product[]>([])
const productOptions = ref<{ value: number; text: string; data: Product }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const productMap = computed(() => {
  return arrayToKeyValue(productAll.value, 'id')
})

let productAllLoaded = false

const openModal = async (prescriptionSampleId?: number) => {
  showModal.value = true

  if (!prescriptionSampleId) {
    prescriptionSample.value = PrescriptionSample.blank()
    prescriptionSampleRoot.value = PrescriptionSample.blank()
    const prescriptionSampleAll = await PrescriptionSampleService.list({})
    prescriptionSample.value.priority = prescriptionSampleAll.length + 1
    if (!productAllLoaded) {
      productAll.value = await ProductService.list({})
      productAllLoaded = true
    }
  } else {
    const prescriptionSampleResponse = await PrescriptionSampleApi.detail(prescriptionSampleId, {})
    prescriptionSampleRoot.value = prescriptionSampleResponse
    prescriptionSample.value = PrescriptionSample.from(prescriptionSampleResponse)
    prescriptionSample.value.medicineList = []
    // load product trước để gắn vào medicines
    if (!productAllLoaded) {
      productAll.value = await ProductService.list({})
      productAllLoaded = true
    }
    searchingProduct('')

    try {
      const medicineList: MedicineType[] = JSON.parse(prescriptionSampleResponse.medicines)
      if (Array.isArray(medicineList)) {
        prescriptionSample.value.medicineList = medicineList
          .filter((m) => !!productMap.value[m.productId])
          .map((m) => ({ ...m, product: productMap.value[m.productId] }))
      } else {
        prescriptionSample.value.medicineList = []
      }
    } catch (error) {
      prescriptionSample.value.medicineList = []
      console.log('🚀 ~ file: ModalPrescriptionSampleUpsert.vue:84 ~ openModal ~ error:', error)
    }
  }
}

const closeModal = () => {
  showModal.value = false
  prescriptionSampleRoot.value = PrescriptionSample.blank()
  prescriptionSample.value = PrescriptionSample.blank()
  productOptions.value = []
}

const disabledButtonSave = computed(() => {
  if (!prescriptionSample.value.name) return true
  return PrescriptionSample.equal(prescriptionSample.value, prescriptionSampleRoot.value)
})

const searchingProduct = async (text: string) => {
  const productList = productAll.value.filter((i) => {
    return DString.customFilter(i.brandName, text) || DString.customFilter(i.substance, text)
  })
  productOptions.value = productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))
  medicineItem.value = { hintUsage: '', productId: 0, quantity: 0, product: undefined }
}

const selectProduct = (productSelected?: Product) => {
  if (productSelected) {
    medicineItem.value = {
      hintUsage: '',
      productId: productSelected.id,
      quantity: 0,
      product: Product.from(productSelected),
    }
  }
}

const reCalculatorMedicines = () => {
  prescriptionSample.value.medicines = JSON.stringify(
    prescriptionSample.value.medicineList.map((i) => {
      return {
        productId: i.productId,
        quantity: i.quantity,
        hintUsage: i.hintUsage,
      }
    })
  )
}

const addPrescriptionSampleItem = () => {
  prescriptionSample.value.medicineList.push(medicineItem.value!)
  reCalculatorMedicines()
  medicineItem.value = {
    hintUsage: '',
    productId: 0,
    quantity: 0,
    product: undefined,
  }

  inputSearchProduct.value?.clear()
  searchingProduct('')
}

const removePrescriptionSampleItem = (index: number) => {
  prescriptionSample.value.medicineList
  prescriptionSample.value.medicineList
  prescriptionSample.value.medicineList.splice(index, 1)
  reCalculatorMedicines()
}

const changeQuantityTable = (index: number, quantity: number) => {
  prescriptionSample.value.medicineList
  prescriptionSample.value.medicineList
  prescriptionSample.value.medicineList[index].quantity = quantity
  reCalculatorMedicines()
}

const handleSave = async () => {
  saveLoading.value = true

  try {
    if (!prescriptionSample.value.id) {
      await PrescriptionSampleService.createOne(prescriptionSample.value)
      AlertStore.addSuccess('Tạo mới thành công', 1000)
    } else {
      await PrescriptionSampleService.updateOne(
        prescriptionSample.value.id,
        prescriptionSample.value
      )
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalPrescriptionSampleUpsert.vue:175 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa đơn thuốc này',
    content: ['Đơn thuốc mẫu đã xóa không thể khôi phục lại được.', 'Bạn chắc chắn vẫn muốn xóa ?'],
    async onOk() {
      try {
        await PrescriptionSampleService.destroyOne(prescriptionSample.value.id)
        emit('success')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: ModalPrescriptionSampleUpsert.vue:191 ~ onOk ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 1000px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ prescriptionSample.id ? 'Cập nhật đơn thuốc mẫu' : 'Tạo đơn thuốc mẫu mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="p-4 pb-20">
        <div class="flex flex-wrap gap-4">
          <div style="flex-basis: 60%; min-width: 400px; flex-grow: 3">
            <div class="flex gap-4 justify-start">
              <span>Tên đơn thuốc mẫu</span>
            </div>
            <div>
              <InputText v-model:value="prescriptionSample.name" required />
            </div>
          </div>

          <div style="flex-basis: 200px; flex-grow: 1">
            <div class="">STT</div>
            <div>
              <InputNumber v-model:value="prescriptionSample.priority" />
            </div>
          </div>
        </div>

        <form
          class="mt-4 flex flex-wrap gap-4"
          @submit.prevent="(e) => addPrescriptionSampleItem()">
          <div class="" style="flex-basis: 60%; min-width: 400px; flex-grow: 3">
            <div>Chọn thuốc</div>
            <div>
              <InputOptions
                ref="inputSearchProduct"
                :options="productOptions"
                :maxHeight="260"
                placeholder="Tìm kiếm bằng tên hoặc hoạt chất của thuốc"
                required
                @selectItem="({ data }: any) => selectProduct(data)"
                @update:text="searchingProduct">
                <template #option="{ item: { data } }">
                  <div>
                    <b>{{ data.brandName }}</b>
                    - Tồn
                    <span
                      style="font-weight: 700"
                      :class="data.quantity <= 0 ? 'text-red-500' : ''">
                      {{ data.quantity }}
                    </span>
                    - Giá
                    <span style="font-weight: 600">{{ formatMoney(data.unitRetailPrice) }}</span>
                    /{{ data.unitDefaultName }}
                  </div>
                  <div>{{ data.substance }}</div>
                </template>
              </InputOptions>
            </div>
          </div>

          <div class="" style="flex-basis: 200px; flex-grow: 1">
            <div>Số lượng</div>
            <div>
              <InputNumber
                v-model:value="medicineItem.quantity"
                :prepend="medicineItem.product?.unitBasicName"
                :validate="{ gte: 0 }" />
            </div>
          </div>

          <div class="" style="flex-basis: 60%; min-width: 400px; flex-grow: 1">
            <div>Hướng dẫn sử dụng</div>
            <div>
              <InputHint
                v-model:value="medicineItem.hintUsage"
                :options="[
                  ...(medicineItem.product?.hintUsage ? [medicineItem.product?.hintUsage] : []),
                  ...settingStore.PRODUCT_HINT_USAGE,
                ]"
                :maxHeight="220"
                :logic-filter="
                  (item: any, text: string) => {
                    return DString.customFilter(item, text)
                  }
                "></InputHint>
            </div>
          </div>

          <div class="flex justify-center" style="flex-basis: 90%; flex-grow: 1">
            <VueButton :disabled="!medicineItem.productId" icon="plus" color="blue" type="submit">
              Thêm vào đơn
            </VueButton>
          </div>
        </form>

        <div class="mt-4">
          <div>Danh sách thuốc trong đơn</div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên thuốc</th>
                  <th style="width: 200px">Số lượng</th>
                  <th>Giá</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="prescriptionSample.medicineList.length === 0">
                  <td colspan="20" class="text-center">Không có dữ liệu</td>
                </tr>

                <tr v-for="(item, index) in prescriptionSample.medicineList" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <div>{{ item.product?.brandName }}</div>
                    <div style="font-size: 13px; font-style: italic">{{ item.hintUsage }}</div>
                  </td>
                  <td class="text-center">
                    <div class="flex items-center justify-between">
                      <button
                        style="
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          border: 1px solid #cdcdcd;
                        "
                        class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                        :disabled="item.quantity <= 0"
                        type="button"
                        @click="changeQuantityTable(index, item.quantity - 1)">
                        <font-awesome-icon :icon="['fas', 'minus']" />
                      </button>
                      <div style="width: calc(100% - 60px); min-width: 50px">
                        <InputNumber
                          :value="item.quantity"
                          @update:value="(value) => changeQuantityTable(index, value)" />
                      </div>
                      <button
                        style="
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          border: 1px solid #cdcdcd;
                        "
                        type="button"
                        class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                        @click="changeQuantityTable(index, item.quantity + 1)">
                        <font-awesome-icon :icon="['fas', 'plus']" />
                      </button>
                    </div>
                  </td>
                  <td class="text-right">{{ formatMoney(item.product?.retailPrice) }}</td>
                  <td class="text-center">
                    <a class="text-red-500" @click="removePrescriptionSampleItem(index)">
                      <IconDelete width="20" height="20" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="3" class="text-right">
                    <b>Tổng tiền</b>
                  </td>
                  <td class="text-right font-bold">
                    {{
                      formatMoney(
                        prescriptionSample.medicineList.reduce((acc, i) => {
                          return acc + (i.product?.retailPrice || 0) * i.quantity
                        }, 0)
                      )
                    }}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton v-if="prescriptionSample.id" color="red" icon="trash" @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton type="reset" class="ml-auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="disabledButtonSave">
            {{ prescriptionSample.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
