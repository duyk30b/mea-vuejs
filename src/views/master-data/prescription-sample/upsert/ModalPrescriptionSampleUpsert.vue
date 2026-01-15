<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { IconDelete } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputHint, InputOptions, InputSelect, InputText } from '@/common/vue-form'
import InputNumber from '@/common/vue-form/InputNumber.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  PrescriptionSample,
  PrescriptionSampleItem,
  PrescriptionSampleService,
} from '@/modules/prescription-sample'
import { Product } from '@/modules/product'
import { ESString } from '@/utils'
import { BugDevelopment } from '@/views/component'
import InputSearchProduct from '@/views/component/InputSearchProduct.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const prescriptionSampleRoot = ref<PrescriptionSample>(PrescriptionSample.blank())
const prescriptionSample = ref<PrescriptionSample>(PrescriptionSample.blank())
const prescriptionSampleItem = ref<PrescriptionSampleItem>(PrescriptionSampleItem.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (prescriptionSampleId?: string) => {
  showModal.value = true

  if (!prescriptionSampleId) {
    prescriptionSampleRoot.value = PrescriptionSample.blank()
    prescriptionSampleRoot.value.userId = MeService.user.value?.id || 0
    const prescriptionSampleAll = await PrescriptionSampleService.getAll()
    prescriptionSample.value.priority = prescriptionSampleAll.length + 1
  } else {
    prescriptionSampleRoot.value = await PrescriptionSampleService.detail(prescriptionSampleId, {
      relation: { prescriptionSampleItemList: { product: true } },
    })
  }
  prescriptionSample.value = PrescriptionSample.from(prescriptionSampleRoot.value)
}

const closeModal = () => {
  showModal.value = false
  prescriptionSampleRoot.value = PrescriptionSample.blank()
  prescriptionSample.value = PrescriptionSample.blank()
}

const disabledButtonSave = computed(() => {
  if (!prescriptionSample.value.name) return true
  if (!prescriptionSample.value.prescriptionSampleItemList.length) return true
  return PrescriptionSample.equal(prescriptionSample.value, prescriptionSampleRoot.value)
})

const selectProduct = (productSelected?: Product) => {
  if (!productSelected) return

  prescriptionSampleItem.value.hintUsage = productSelected.hintUsage
  prescriptionSampleItem.value.unitRate = productSelected.unitDefaultRate
  prescriptionSampleItem.value.unitQuantity = 0
  prescriptionSampleItem.value.product = Product.from(productSelected)
}

const addPrescriptionSampleItem = () => {
  prescriptionSample.value.prescriptionSampleItemList.push(prescriptionSampleItem.value!)
  prescriptionSampleItem.value = PrescriptionSampleItem.blank()
  inputSearchProduct.value?.clear()
}

const removePrescriptionSampleItem = (_localId: string) => {
  const index = prescriptionSample.value.prescriptionSampleItemList.findIndex((i) => {
    return i._localId === _localId
  })
  if (index !== -1) {
    prescriptionSample.value.prescriptionSampleItemList.splice(index, 1)
  }
}

const handleSave = async () => {
  saveLoading.value = true

  try {
    if (!prescriptionSample.value.id) {
      await PrescriptionSampleService.createOne({
        prescriptionSampleBody: prescriptionSample.value,
        prescriptionSampleItemBodyList: prescriptionSample.value.prescriptionSampleItemList,
      })
      AlertStore.addSuccess('Tạo mới thành công', 1000)
    } else {
      await PrescriptionSampleService.updateOne(prescriptionSample.value.id, {
        prescriptionSampleBody: prescriptionSample.value,
        prescriptionSampleItemBodyList: prescriptionSample.value.prescriptionSampleItemList,
      })
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPrescriptionSampleUpsert.vue:116 ~ handleSave ~ error:', error)
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
        console.log('🚀 ~ ModalPrescriptionSampleUpsert.vue:132 ~ clickDelete ~ error:', error)
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
          <div style="flex-basis: 60%; min-width: 400px; flex-grow: 2">
            <div class="flex gap-4 justify-start">
              <span>Tên đơn thuốc mẫu</span>
            </div>
            <div>
              <InputText v-model:value="prescriptionSample.name" required />
            </div>
          </div>

          <div style="flex-basis: 300px; flex-grow: 1">
            <div class="">STT</div>
            <div>
              <InputNumber v-model:value="prescriptionSample.priority" />
            </div>
          </div>
        </div>

        <form
          class="mt-4 flex flex-wrap gap-4"
          @submit.prevent="(e) => addPrescriptionSampleItem()"
        >
          <div class="" style="flex-basis: 60%; min-width: 400px; flex-grow: 2">
            <div>Chọn thuốc</div>
            <div>
              <InputSearchProduct
                v-model:productId="prescriptionSampleItem.productId"
                required
                :showQuantity="false"
                :showEditProduct="false"
                @selectProduct="selectProduct"
                removeLabelWrapper
              />
            </div>
          </div>

          <div class="" style="flex-basis: 300px; flex-grow: 1">
            <div class="flex flex-wrap gap-1">
              <span>Số lượng</span>
              <span v-if="prescriptionSampleItem.unitRate !== 1">
                (
                <b>{{ prescriptionSampleItem.unitQuantity * prescriptionSampleItem.unitRate }}</b>
                {{ prescriptionSampleItem?.product?.unitBasicName }} )
              </span>
            </div>
            <div class="flex">
              <div style="width: 120px">
                <InputSelect
                  v-model:value="prescriptionSampleItem.unitRate"
                  :disabled="(prescriptionSampleItem.product?.unitObject.length || 0) <= 1"
                  :options="
                    (prescriptionSampleItem.product?.unitObject || []).map((i) => ({
                      value: i.rate,
                      label: i.name,
                      data: i,
                    }))
                  "
                  :tabindex="-1"
                />
              </div>
              <div class="flex-1">
                <InputNumber
                  v-model:value="prescriptionSampleItem.unitQuantity"
                  :validate="{ gt: 0 }"
                />
              </div>
            </div>
          </div>

          <div class="" style="flex-basis: 60%; min-width: 400px; flex-grow: 1">
            <div>Hướng dẫn sử dụng</div>
            <div>
              <InputHint
                v-model:value="prescriptionSampleItem.hintUsage"
                :options="[
                  ...(prescriptionSampleItem.product?.hintUsage
                    ? [prescriptionSampleItem.product?.hintUsage]
                    : []),
                  ...settingStore.PRODUCT_HINT_USAGE,
                ]"
                :maxHeight="220"
                :logic-filter="
                  (item: any, text: string) => {
                    return ESString.customFilter(item, text)
                  }
                "
              ></InputHint>
            </div>
          </div>

          <div class="flex justify-center" style="flex-basis: 90%; flex-grow: 1">
            <VueButton
              :disabled="!prescriptionSampleItem.productId"
              icon="plus"
              color="blue"
              type="submit"
            >
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
                  <th v-if="CONFIG.MODE === 'development'"></th>
                  <th>#</th>
                  <th>Tên thuốc</th>
                  <th style="width: 200px">Số lượng</th>
                  <th>Đơn Vị</th>
                  <th>T.Tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="prescriptionSample.prescriptionSampleItemList.length === 0">
                  <td colspan="20" class="text-center">Không có dữ liệu</td>
                </tr>

                <tr
                  v-for="(psItem, index) in prescriptionSample.prescriptionSampleItemList"
                  :key="psItem._localId"
                >
                  <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                    <BugDevelopment :data="psItem" />
                  </td>
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <div>{{ psItem.product?.brandName }}</div>
                    <div style="font-size: 13px; font-style: italic">{{ psItem.hintUsage }}</div>
                  </td>
                  <td class="text-center">
                    <div class="flex items-center justify-center">
                      <InputNumber
                        v-model:value="psItem.unitQuantity"
                        textAlign="right"
                        controlHorizontal
                        :controlMinusDisable="psItem.unitQuantity <= 0"
                      />
                    </div>
                  </td>
                  <td>
                    <div class="flex justify-center flex-wrap gap-1">
                      <span>
                        {{ formatMoney((psItem.product?.retailPrice || 0) * psItem.unitRate) }}
                      </span>
                      <span v-if="psItem.unitName">/ {{ psItem.unitName }}</span>
                    </div>
                  </td>
                  <td class="text-right">
                    {{
                      formatMoney(
                        (psItem.product?.retailPrice || 0) * psItem.unitRate * psItem.unitQuantity,
                      )
                    }}
                  </td>
                  <td class="text-center">
                    <a
                      style="color: var(--text-red)"
                      @click="removePrescriptionSampleItem(psItem._localId)"
                    >
                      <IconDelete width="20" height="20" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td v-if="CONFIG.MODE === 'development'"></td>
                  <td colspan="4" class="text-right">
                    <b>Tổng tiền</b>
                  </td>
                  <td class="text-right font-bold">
                    {{
                      formatMoney(
                        prescriptionSample.prescriptionSampleItemList.reduce((acc, i) => {
                          return acc + (i.product?.retailPrice || 0) * i.unitQuantity * i.unitRate
                        }, 0),
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
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="disabledButtonSave"
          >
            {{ prescriptionSample.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
