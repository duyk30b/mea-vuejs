<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputMoney, InputText, VueSelect, VueSwitch } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Discount, DiscountInteractType, DiscountService } from '@/modules/discount'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Position, PositionInteractType } from '@/modules/position'
import { Procedure, ProcedureService, ProcedureType } from '@/modules/procedure'
import { ProcedureGroup, ProcedureGroupService } from '@/modules/procedure-group'
import { Product } from '@/modules/product'
import { Role, RoleService } from '@/modules/role'
import PositionTableAction from '@/views/user/position/common/PositionTableAction.vue'
import { computed, ref } from 'vue'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'
import ModalDiscountUpsert from '../../discount/upsert/ModalDiscountUpsert.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  DISCOUNT: 'DISCOUNT',
  ROLE_AND_POSITION: 'ROLE_AND_POSITION',
}

const modalDiscountUpsert = ref<InstanceType<typeof ModalDiscountUpsert>>()

const emit = defineEmits<{ (e: 'success'): void }>()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

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

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(
    procedure.value.discountList || [],
    procedureOrigin.value.discountList || [],
  )
})

const hasChangePositionList = computed(() => {
  return !Position.equalList(
    (procedure.value.positionList || []).filter((i) => !!i.roleId),
    procedureOrigin.value.positionList || [],
  )
})

const hasChangeData = computed(() => {
  if (!Procedure.equal(procedure.value, procedureOrigin.value)) {
    return true
  }
  if (hasChangePositionList.value) {
    return true
  }
  if (hasChangeDiscountList.value) {
    return true
  }
  return false
})

const handleAddPosition = () => {
  const commissionBlank = Position.blank()
  commissionBlank.positionType = PositionInteractType.Procedure
  commissionBlank.positionInteractId = procedure.value.id

  if (!procedure.value.positionList) {
    procedure.value.positionList = []
  }
  procedure.value.positionList!.push(commissionBlank)
}

const openModal = async (procedureId?: number) => {
  showModal.value = true

  if (procedureId) {
    const procedureResponse = await ProcedureService.detail(
      procedureId,
      { relation: { positionList: true, discountList: true } },
      { query: true },
    )
    procedureOrigin.value = procedureResponse
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
  } else {
    procedure.value = Procedure.blank()
    procedure.value.discountListExtra = await DiscountService.list({
      filter: { discountInteractId: 0, discountInteractType: DiscountInteractType.Procedure },
    })
  }
  if (procedure.value.positionList?.length == 0) {
    handleAddPosition()
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
      await ProcedureService.createOne({
        procedure: procedure.value,
        discountList: hasChangeDiscountList.value ? procedure.value.discountList : undefined,
        positionList: hasChangePositionList.value ? procedure.value.positionList : undefined,
      })
    } else {
      await ProcedureService.updateOne(procedure.value.id, {
        procedure: procedure.value,
        discountList: hasChangeDiscountList.value ? procedure.value.discountList : undefined,
        positionList: hasChangePositionList.value ? procedure.value.positionList : undefined,
      })
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProcedureUpsert.vue:140 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleModalDiscountUpsertSuccess = async (
  discountData: Discount,
  mode: 'CREATE' | 'UPDATE',
) => {
  if (mode === 'CREATE') {
    procedure.value.discountList?.push(discountData)
  }
  if (mode === 'UPDATE') {
    const findIndex = procedure.value.discountList!.findIndex((i) => {
      return i._localId === discountData._localId
    })
    procedure.value.discountList![findIndex] = discountData
  }
}

const clickUpsertDiscount = (options: { discount?: Discount; mode: 'CREATE' | 'UPDATE' }) => {
  const discount = options.discount || Discount.blank()
  modalDiscountUpsert.value?.openModal({
    discount,
    requiredInteract: {
      discountInteractType: DiscountInteractType.Procedure,
      discountInteractId: procedure.value.id,
    },
    mode: options.mode,
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px" @close="closeModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ procedure.id ? 'Cập nhật dịch vụ:' : 'Tạo dịch vụ mới:' }}
          {{ procedure.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.DISCOUNT">Khuyến mại</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.ROLE_AND_POSITION">Vai trò và hoa hồng</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.BASIC">
              <div class="mt-4 flex flex-wrap gap-4">
                <div style="flex-grow: 1; flex-basis: 400px">
                  <div class="">Tên dịch vụ</div>
                  <div class="">
                    <InputText v-model:value="procedure.name" required />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 150px">
                  <div class="">Mã dịch vụ</div>
                  <div class="">
                    <InputText v-model:value="procedure.procedureCode" placeholder="Tạo tự động" />
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

                <div style="flex-grow: 1; flex-basis: 90%" class="flex flex-wrap gap-4 mb-4">
                  <div style="width: 100px">Trạng thái:</div>
                  <div class="w-[60px] flex-none">
                    <VueSwitch v-model="procedure.isActive" type-parser="number" />
                  </div>
                  <div>
                    <span v-if="procedure.isActive">Hoạt động</span>
                    <span v-else>Inactive (Ngừng sử dụng)</span>
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
                              <span v-if="data.pickupStrategy">
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
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="procedure.discountList!"
                  :discountInteractId="procedure.id"
                  :discountInteractType="DiscountInteractType.Procedure"
                  :discountListExtra="procedure.discountListExtra || []"
                  :editable="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_POSITION">
              <div class="mt-4">
                <PositionTableAction
                  v-model:positionList="procedure.positionList!"
                  :positionType="PositionInteractType.Procedure"
                  :positionInteractId="procedure.id"
                  :editable="userPermission[PermissionId.POSITION]"
                />
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.PROCEDURE_DELETE] && procedure.id"
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
  <ModalDiscountUpsert ref="modalDiscountUpsert" @success="handleModalDiscountUpsertSuccess" />
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
