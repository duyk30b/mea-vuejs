<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose, IconDelete } from '../../../../common/icon-antd'
import {
  InputFilter,
  InputMoney,
  InputNumber,
  InputText,
  VueSelect,
} from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { Commission, CommissionCalculatorType, InteractType } from '../../../../modules/commission'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, ProcedureService, ProcedureType } from '../../../../modules/procedure'
import { ProcedureGroup, ProcedureGroupService } from '../../../../modules/procedure-group'
import { Product, ProductService } from '../../../../modules/product'
import { Role, RoleService } from '../../../../modules/role'

const TABS_KEY = {
  BASIC: 'BASIC',
  ROLE_AND_COMMISSION: 'ROLE_AND_COMMISSION',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedureOrigin = ref<Procedure>(Procedure.blank())
const procedure = ref(Procedure.blank())
const procedureGroupOptions = ref<{ text: string; value: number; data: ProcedureGroup }[]>([])
const consumableOptions = ref<{ value: number; text: string; data: Product }[]>([])
const consumableList = ref<{ product?: Product; quantity: number }[]>([])

const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const gapHoursType = ref(24)
const activeTab = ref(TABS_KEY.BASIC)

const showModal = ref(false)
const saveLoading = ref(false)

const hasChangeData = computed(() => {
  if (!Procedure.equal(procedure.value, procedureOrigin.value)) {
    return true
  }
  if (
    !Commission.equalList(
      (procedure.value.commissionList || []).filter((i) => !!i.roleId),
      procedureOrigin.value.commissionList || [],
    )
  ) {
    return true
  }
  return false
})

const handleAddCommission = () => {
  const commissionBlank = Commission.blank()
  commissionBlank.interactType = InteractType.Procedure
  commissionBlank.interactId = procedure.value.id

  if (!procedure.value.commissionList) {
    procedure.value.commissionList = []
  }
  procedure.value.commissionList!.push(commissionBlank)
}

const openModal = async (procedureId?: number) => {
  showModal.value = true

  if (procedureId) {
    const procedureResponse = await ProcedureService.detail(procedureId, {
      relation: { commissionList: true },
    })
    procedureOrigin.value = Procedure.from(procedureResponse)
    procedure.value = Procedure.from(procedureResponse)
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
  if (procedure.value.commissionList?.length == 0) {
    handleAddCommission()
  }

  ProcedureGroupService.list({})
    .then((result) => {
      procedureGroupOptions.value = result.map((i) => ({ value: i.id, text: i.name, data: i }))
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalProcedureUpsert.vue:105 ~ ProcedureGroupService ~ e:', e)
    })

  RoleService.list({})
    .then((result) => {
      roleOptions.value = result.map((i) => ({ value: i.id, text: i.name, data: i }))
    })
    .catch((e) => {
      console.log('🚀: ModalProcedureUpsert.vue:51 ~ RoleService.list ~ e:', e)
    })
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
  procedureOrigin.value = Procedure.blank()

  consumableList.value = []
  consumableOptions.value = []
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
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám, hóa đơn liên quan trước',
              `Các phiếu liên quan ${response.data.ticketProcedureList
                .map((i) => i.ticketId)
                .join(', ')} `,
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
            <VueTabMenu :tabKey="TABS_KEY.ROLE_AND_COMMISSION">Vai trò và hoa hồng</VueTabMenu>
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
                      :options="procedureGroupOptions"
                    />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 90%">
                  <div>Giá dịch vụ</div>
                  <div>
                    <InputMoney
                      v-model:value="procedure.price"
                      :min="0"
                      style="width: 100%"
                      append="VNĐ"
                    />
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
                                <IconDelete />
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
                </div> -->
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_COMMISSION">
              <div class="mt-4">
                <!-- <div class="font-bold" style="flex-grow: 1; flex-basis: 90%">
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
                </div> -->

                <!-- <div class="mt-10 font-bold" style="flex-grow: 1; flex-basis: 90%">
                  <DoubleRightOutlined />
                  <span class="ml-2">Hoa hồng</span>
                </div> -->

                <div
                  v-for="(commission, index) in procedure.commissionList"
                  :key="index"
                  class="mt-4 flex flex-wrap gap-2"
                >
                  <div style="flex-grow: 1; flex-basis: 250px">
                    <div>Vai trò</div>
                    <div>
                      <InputFilter
                        v-model:value="procedure.commissionList![index].roleId"
                        :options="roleOptions"
                        :maxHeight="120"
                      >
                        <template #option="{ item: { data } }">{{ data.name }}</template>
                      </InputFilter>
                    </div>
                  </div>
                  <div style="flex-grow: 1; flex-basis: 100px">
                    <div>Hoa hồng</div>
                    <div>
                      <InputNumber
                        :value="commission.commissionValue"
                        @update:value="
                          (v: number) => (procedure.commissionList![index].commissionValue = v)
                        "
                      />
                    </div>
                  </div>
                  <div style="flex-grow: 1; flex-basis: 150px">
                    <div>Công thức</div>
                    <div>
                      <VueSelect
                        :value="commission.commissionCalculatorType"
                        :options="[
                          { value: CommissionCalculatorType.VND, text: 'VNĐ' },
                          {
                            value: CommissionCalculatorType.PercentExpected,
                            text: '% Giá niêm yết',
                          },
                          {
                            value: CommissionCalculatorType.PercentActual,
                            text: '% Giá sau chiết khấu',
                          },
                        ]"
                        @update:value="
                          (v: number) =>
                            (procedure.commissionList![index].commissionCalculatorType = v)
                        "
                      />
                    </div>
                  </div>
                  <div style="width: 30px">
                    <div>&nbsp;</div>
                    <div class="pt-2 flex justify-center">
                      <a
                        style="color: var(--text-red)"
                        @click="procedure.commissionList!.splice(index, 1)"
                      >
                        <IconDelete width="18" height="18" />
                      </a>
                    </div>
                  </div>
                </div>

                <div class="mt-2">
                  <a @click="handleAddCommission">✚ Thêm vai trò</a>
                </div>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE] && procedure.id"
            color="red"
            icon="trash"
            @click="clickDestroy"
          >
            Xóa
          </VueButton>
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            :disabled="!hasChangeData"
            icon="save"
          >
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
