<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { InputMoney, InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  Procedure,
  ProcedureApi,
  ProcedureService,
  ProcedureType,
} from '../../../../modules/procedure'
import { ProcedureGroup, ProcedureGroupService } from '../../../../modules/procedure-group'
import { Product, ProductService } from '../../../../modules/product'

const TABS_KEY = {
  BASIC: 'BASIC',
  DISCOUNT_AND_BOLUS: 'DISCOUNT_AND_BOLUS',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedure = ref(Procedure.blank())
const procedureGroupOptions = ref<{ text: string; value: number; data: ProcedureGroup }[]>([])
const consumableOptions = ref<{ value: number; text: string; data: Product }[]>([])
const consumableList = ref<{ product?: Product; quantity: number }[]>([])

const gapHoursType = ref(24)
const activeTab = ref(TABS_KEY.BASIC)

const showModal = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  try {
    // const { hasChange } = await productStore.refreshDB()
  } catch (error: any) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:57 ~ onMounted ~ error:', error)
  }
})

const openModal = async (procedureId?: number) => {
  showModal.value = true

  if (!procedureId) {
    procedure.value = Procedure.blank()
  } else {
    procedure.value = await ProcedureApi.detail(procedureId, {})

    if (procedure.value?.consumablesHint) {
      // const consumableHint = JSON.parse(procedure.value.consumablesHint) as {
      //   productId: number
      //   quantity: number
      // }[]
      // if (Array.isArray(consumableHint)) {
      //   if (!consumableHint.length) {
      //     consumableList.value = []
      //   }
      //   if (consumableHint.length) {
      //     const productIdList = consumableHint.map((i) => i.productId)
      //     const productListResponse = await productStore.list({
      //       filter: { id: { IN: productIdList } },
      //     })
      //     consumableList.value = consumableHint.map((i) => {
      //       const productFind = productListResponse.find((j) => j.id === i.productId)
      //       return {
      //         product: productFind,
      //         quantity: i.quantity,
      //       }
      //     })
      //   }
      // }
    }
  }

  const procedureGroupAll = await ProcedureGroupService.list({})
  procedureGroupOptions.value = procedureGroupAll.map((i) => ({
    value: i.id,
    text: i.name,
    data: i,
  }))
}

const searchingProduct = async (text: string) => {
  if (!text) {
    consumableOptions.value = []
    return
  }

  const productList = await ProductService.search(text)
  consumableOptions.value = productList.map((i) => ({
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
  consumableOptions.value = []
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
      await ProcedureService.createOne(procedure.value)
    } else {
      await ProcedureService.updateOne(procedure.value.id, procedure.value)
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:140 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa dịch vụ này',
    content: 'Dịch vụ đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await ProcedureService.destroyOne(procedure.value.id)
        if (response.success) {
          emit('success')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa dịch vụ khi đã được chỉ định',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám, hóa đơn trước',
              `Hiện tại đang có ${response.data.countTicketProcedure} phiếu khám sử dụng dịch vụ này`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalCustomerUpsert.vue:147 ~ handleDelete ~ error:', error)
      }
    },
  })
}

const handleChangeProcedureType = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    procedure.value.procedureType = ProcedureType.Regimen
  } else {
    procedure.value.procedureType = ProcedureType.Basic
    procedure.value.quantityDefault = 1
    procedure.value.gapHours = 0
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ procedure.id ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
            <!-- <VueTabMenu :tabKey="TABS_KEY.DISCOUNT_AND_BOLUS">Khuyến mãi và Hoa hồng</VueTabMenu> -->
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.BASIC">
              <div class="mt-4 flex flex-wrap gap-4">
                <div style="flex-grow: 1; flex-basis: 90%">
                  <div class="">Tên dịch vụ</div>
                  <div class="">
                    <InputText v-model:value="procedure.name" required />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 90%">
                  <div class="">Nhóm</div>
                  <div>
                    <VueSelect
                      v-model:value="procedure.procedureGroupId"
                      :options="procedureGroupOptions" />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 90%">
                  <div>Giá dịch vụ</div>
                  <div>
                    <InputMoney
                      v-model:value="procedure.price"
                      :min="0"
                      style="width: 100%"
                      append="VNĐ" />
                  </div>
                </div>

                <!-- <div style="flex-grow: 1; flex-basis: 90%">
                  <div class="mt-10 font-bold">
                    <DoubleRightOutlined />
                    Vật tư tiêu hao khi sử dụng dịch vụ
                  </div>
                  <div class="mt-4">
                    <div class="flex items-center">
                      <div class="flex-auto">
                        <InputOptions
                          ref="inputOptionsProduct"
                          :options="consumableOptions"
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
                            <td class="text-center">
                              {{ consumableList[i].product?.unitDefaultName }}
                            </td>
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
                </div>

                <div style="flex-grow: 1; flex-basis: 90%">
                  <div class="mt-10 font-bold">
                    <DoubleRightOutlined />
                    <label class="mx-2 cursor-pointer" for="isRegimen">
                      Là liệu trình ? Dịch vụ này có nhiều buổi không ?
                    </label>
                    <input
                      id="isRegimen"
                      :checked="procedure.procedureType === ProcedureType.Regimen"
                      type="checkbox"
                      name="isRegimen"
                      @change="handleChangeProcedureType" />
                    <br />
                  </div>
                  <div v-if="procedure.procedureType === ProcedureType.Regimen">
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
                    <div v-if="!procedure.isActive" class="ml-4">
                      Dịch vụ này tạm thời ngừng kinh doanh
                    </div>
                  </div>
                </div> -->
              </div>
            </VueTabPanel>
            <!-- <VueTabPanel :tabKey="TABS_KEY.DISCOUNT_AND_BOLUS">
              <div class="mt-4 flex flex-wrap gap-4">
                <div class="font-bold" style="flex-grow: 1; flex-basis: 90%">
                  <DoubleRightOutlined />
                  <span class="ml-2">Khuyến mãi</span>
                </div>
                <div style="flex-grow: 1; flex-basis: 90%">
                  <div>
                    Khuyến mại (Giá dịch vụ:
                    <b>{{ formatMoney(procedure.price) }}</b>
                    )
                  </div>
                  <div class="flex">
                    <VueSelect
                      v-model:value="procedure.discountType"
                      style="width: 120px"
                      :options="[
                        { value: DiscountType.Percent, text: '%' },
                        { value: DiscountType.VND, text: 'VNĐ' },
                      ]" />
                    <div style="width: calc(100% - 120px)">
                      <InputMoney
                        v-if="procedure.discountType === DiscountType.VND"
                        v-model:value="procedure.discountMoney"
                        @update:value="
                          (v) =>
                            (procedure.discountType = DiscountType.VND) &&
                            (procedure.discountPercent =
                              procedure.price == 0 ? 0 : Math.round((v * 100) / procedure.price))
                        " />
                      <InputNumber
                        v-else
                        v-model:value="procedure.discountPercent"
                        @update:value="
                          (v) =>
                            (procedure.discountType = DiscountType.VND) &&
                            (procedure.discountMoney = Math.round(
                              ((procedure.price || 0) * (v || 0)) / 100
                            ))
                        " />
                    </div>
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 300px">
                  <div>Từ ngày</div>
                  <div>
                    <InputDate
                      v-model:value="procedure.discountStart"
                      defaultType="date"
                      showTime
                      typeParser="number" />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 300px">
                  <div>Đến ngày</div>
                  <div>
                    <InputDate
                      v-model:value="procedure.discountEnd"
                      defaultType="date"
                      showTime
                      typeParser="number" />
                  </div>
                </div>

                <div class="mt-10 font-bold" style="flex-grow: 1; flex-basis: 90%">
                  <DoubleRightOutlined />
                  <span class="ml-2">Hoa hồng</span>
                </div>
                <div style="flex-grow: 1; flex-basis: 90%">
                  <div>Hoa hồng nhân viên chốt sale</div>
                  <div class="flex">
                    <VueSelect
                      v-model:value="procedure.saleBolusType"
                      style="width: 120px"
                      :options="[
                        { value: DiscountType.Percent, text: '%' },
                        { value: DiscountType.VND, text: 'VNĐ' },
                      ]" />
                    <div style="width: calc(100% - 120px)">
                      <InputMoney
                        v-if="procedure.saleBolusType === DiscountType.VND"
                        v-model:value="procedure.saleBolusMoney"
                        @update:value="
                          (v) =>
                            (procedure.saleBolusType = DiscountType.VND) &&
                            (procedure.saleBolusPercent =
                              procedure.price == 0 ? 0 : Math.round((v * 100) / procedure.price))
                        " />
                      <InputNumber
                        v-else
                        v-model:value="procedure.saleBolusPercent"
                        @update:value="
                          (v) =>
                            (procedure.saleBolusType = DiscountType.Percent) &&
                            (procedure.saleBolusMoney = Math.round(
                              ((procedure.price || 0) * (v || 0)) / 100
                            ))
                        " />
                    </div>
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 90%">
                  <div>Hoa hồng kỹ thuật viên chính</div>
                  <div class="flex">
                    <VueSelect
                      v-model:value="procedure.primaryBolusType"
                      style="width: 120px"
                      :options="[
                        { value: DiscountType.Percent, text: '%' },
                        { value: DiscountType.VND, text: 'VNĐ' },
                      ]" />
                    <div style="width: calc(100% - 120px)">
                      <InputMoney
                        v-if="procedure.primaryBolusType === DiscountType.VND"
                        v-model:value="procedure.primaryBolusMoney"
                        @update:value="
                          (v) =>
                            (procedure.primaryBolusType = DiscountType.VND) &&
                            (procedure.primaryBolusPercent =
                              procedure.price == 0 ? 0 : Math.round((v * 100) / procedure.price))
                        " />
                      <InputNumber
                        v-else
                        v-model:value="procedure.primaryBolusPercent"
                        @update:value="
                          (v) =>
                            (procedure.primaryBolusType = DiscountType.Percent) &&
                            (procedure.primaryBolusMoney = Math.round(
                              ((procedure.price || 0) * (v || 0)) / 100
                            ))
                        " />
                    </div>
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 90%">
                  <div>Hoa hồng kỹ thuật viên phụ</div>
                  <div class="flex">
                    <VueSelect
                      v-model:value="procedure.secondaryBolusType"
                      style="width: 120px"
                      :options="[
                        { value: DiscountType.Percent, text: '%' },
                        { value: DiscountType.VND, text: 'VNĐ' },
                      ]" />
                    <div style="width: calc(100% - 120px)">
                      <InputMoney
                        v-if="procedure.secondaryBolusType === DiscountType.VND"
                        v-model:value="procedure.secondaryBolusMoney"
                        @update:value="
                          (v) =>
                            (procedure.secondaryBolusType = DiscountType.VND) &&
                            (procedure.secondaryBolusPercent =
                              procedure.price == 0 ? 0 : Math.round((v * 100) / procedure.price))
                        " />
                      <InputNumber
                        v-else
                        v-model:value="procedure.secondaryBolusPercent"
                        @update:value="
                          (v) =>
                            (procedure.secondaryBolusType = DiscountType.Percent) &&
                            (procedure.secondaryBolusMoney = Math.round(
                              ((procedure.price || 0) * (v || 0)) / 100
                            ))
                        " />
                    </div>
                  </div>
                </div>
              </div>
            </VueTabPanel> -->
          </template>
        </VueTabs>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE] && procedure.id"
            color="red"
            icon="trash"
            @click="clickDestroy">
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
