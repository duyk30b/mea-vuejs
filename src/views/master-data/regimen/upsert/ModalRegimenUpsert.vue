<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDelete, IconDoubleRight } from '@/common/icon-antd'
import { InputMoney, InputNumber, InputSelect, InputText, VueSwitch } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Discount, DiscountInteractType, DiscountService } from '@/modules/discount'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Position, PositionService, PositionType } from '@/modules/position'
import type { Procedure } from '@/modules/procedure'
import {
  Regimen,
  RegimenGapHoursType,
  RegimenGapHoursTypeText,
  RegimenItem,
  RegimenService,
} from '@/modules/regimen'
import { ESTypescript } from '@/utils'
import PositionTableAction from '@/views/master-data/position/common/PositionTableAction.vue'
import { computed, ref, watchEffect } from 'vue'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'
import ModalSelectProcedureList from './ModalSelectProcedureList.vue'
import { VueTag } from '@/common'
import { DiscountType } from '@/modules/enum'

const TABS_KEY = {
  BASIC: 'BASIC',
  DISCOUNT: 'DISCOUNT',
  ROLE_AND_POSITION: 'ROLE_AND_POSITION',
}

const modalSelectProcedureList = ref<InstanceType<typeof ModalSelectProcedureList>>()

const emit = defineEmits<{ (e: 'success'): void }>()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const activeTab = ref(TABS_KEY.BASIC)
const showModal = ref(false)
const saveLoading = ref(false)

let regimenOrigin = Regimen.blank()
const regimen = ref(Regimen.blank())

const gapHoursTypeOptions = ESTypescript.keysEnum(RegimenGapHoursType).map((key) => ({
  value: RegimenGapHoursType[key],
  label: RegimenGapHoursTypeText[RegimenGapHoursType[key]],
}))

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(regimen.value.discountList || [], regimenOrigin.discountList || [])
})

const hasChangePositionRequestList = computed(() => {
  return !Position.equalList(
    (regimen.value.positionRequestList || []).filter((i) => !!i.roleId),
    regimenOrigin.positionRequestList || [],
  )
})

const hasChangeData = computed(() => {
  if (!Regimen.equal(regimen.value, regimenOrigin)) {
    return true
  }
  if (
    !RegimenItem.equalList(regimen.value.regimenItemList || [], regimenOrigin.regimenItemList || [])
  ) {
    return true
  }
  if (hasChangePositionRequestList.value) {
    return true
  }

  if (hasChangeDiscountList.value) {
    return true
  }
  return false
})

const openModal = async (regimenId?: number) => {
  showModal.value = true

  if (regimenId) {
    regimenOrigin = await RegimenService.detail(
      regimenId,
      {
        relation: {
          regimenItemList: { procedure: true },
          positionList: true,
          discountList: true,
        },
      },
      { query: true },
    )
    regimen.value = Regimen.from(regimenOrigin)
  } else {
    regimen.value = Regimen.blank()
    regimen.value.discountListExtra = await DiscountService.list({
      filter: { discountInteractId: 0, discountInteractType: DiscountInteractType.Regimen },
    })
    regimen.value.positionRequestListCommon = await PositionService.list({
      filter: { positionType: PositionType.RegimenRequest, positionInteractId: 0 },
    })
  }
}

const closeModal = () => {
  showModal.value = false

  regimen.value = Regimen.blank()
  regimenOrigin = Regimen.blank()
}

const clickDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa liệu trình này',
    content: 'Liệu trình đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await RegimenService.destroyOne(regimen.value.id)
        if (response.success) {
          emit('success')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa liệu trình khi đã được chỉ định',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám, hóa đơn liên quan trước',
              `Các phiếu liên quan ${response.ticketRegimenList
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

const handleSave = async () => {
  saveLoading.value = true

  try {
    if (!regimen.value.id) {
      await RegimenService.createOne({
        regimen: regimen.value,
        regimenItemList: regimen.value.regimenItemList || [],
        discountList: hasChangeDiscountList.value ? regimen.value.discountList : undefined,
        positionRequestList: hasChangePositionRequestList.value
          ? regimen.value.positionRequestList
          : undefined,
      })
    } else {
      await RegimenService.updateOne(regimen.value.id, {
        regimen: regimen.value,
        regimenItemList: regimen.value.regimenItemList || [],
        discountList: hasChangeDiscountList.value ? regimen.value.discountList : undefined,
        positionRequestList: hasChangePositionRequestList.value
          ? regimen.value.positionRequestList
          : undefined,
      })
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalRegimenUpsert.vue:140 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleModalSelectProcedureList = (data: { procedureList: Procedure[] }) => {
  const rsiList = data.procedureList.map((i) => {
    const rsiBlank = RegimenItem.blank()
    rsiBlank.procedureId = i.id
    rsiBlank.quantity = 1
    rsiBlank.procedure = i
    return rsiBlank
  })
  regimen.value.regimenItemList ||= []
  regimen.value.regimenItemList.push(...rsiList)
}

const removeRegimenSessionItemList = (riLocalId: string) => {
  const indexRsi = (regimen.value.regimenItemList || []).findIndex((i) => {
    return i._localId === riLocalId
  })
  if (indexRsi !== -1) {
    regimen.value.regimenItemList!.splice(indexRsi, 1)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px" @close="closeModal">
    <ModalSelectProcedureList
      ref="modalSelectProcedureList"
      @selectProcedureList="handleModalSelectProcedureList"
    />
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ regimen.id ? 'Cập nhật liệu trình:' : 'Tạo liệu trình mới:' }}
          {{ regimen.name }}
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
                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                  <div class="">Tên liệu trình</div>
                  <div class="">
                    <InputText v-model:value="regimen.name" required />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                  <div class="">Mã liệu trình</div>
                  <div class="">
                    <InputText v-model:value="regimen.code" placeholder="Tạo tự động" />
                  </div>
                </div>
              </div>
              <!-- <div class="mt-4 font-bold flex items-center gap-1">
                <IconDoubleRight />
                <span>Các dịch vụ trong liệu trình</span>
              </div> -->
              <div class="mt-2 table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th v-if="CONFIG.MODE === 'development'">#</th>
                      <th>#</th>
                      <th>Tên</th>
                      <th style="width: 120px">Số lượng</th>
                      <th style="width: 50px">KC ngày</th>
                      <th style="width: 100px">Giá</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(regimenItem, index) in regimen.regimenItemList"
                      :key="regimenItem._localId"
                    >
                      <td
                        v-if="CONFIG.MODE === 'development'"
                        class="text-center"
                        style="color: violet"
                      >
                        {{ regimenItem._localId }}
                      </td>
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ regimenItem.procedure?.name }}</td>
                      <td>
                        <InputNumber
                          v-model:value="regimenItem.quantity"
                          textAlign="right"
                          controlHorizontal
                          :step="1"
                        ></InputNumber>
                      </td>

                      <td>
                        <InputNumber v-model:value="regimenItem.gapDay" />
                      </td>
                      <td class="text-right">
                        {{ formatMoney(regimenItem.procedure?.price) }}
                      </td>
                      <td class="text-center">
                        <div
                          style="color: var(--text-red); cursor: pointer; font-size: 18px"
                          @click="removeRegimenSessionItemList(regimenItem._localId)"
                        >
                          <IconDelete />
                        </div>
                      </td>
                    </tr>
                    <tr style="font-weight: 500">
                      <td v-if="CONFIG.MODE === 'development'"></td>
                      <td colspan="4" class="text-right">TỔNG TIỀN</td>

                      <td class="text-right">
                        {{ formatMoney(regimen.totalMoney) }}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td v-if="CONFIG.MODE === 'development'"></td>
                      <td colspan="4" class="text-right">Khuyến mại</td>
                      <td class="text-right">
                        <VueTag
                          v-if="
                            regimen.discountApply?.discountMoney &&
                            regimen.discountApply?.discountType === DiscountType.VND
                          "
                          color="blue"
                        >
                          {{ formatMoney(regimen.discountApply?.discountMoney) }}
                        </VueTag>
                        <VueTag
                          v-else-if="
                            regimen.discountApply?.discountPercent &&
                            regimen.discountApply?.discountType === DiscountType.Percent
                          "
                          color="blue"
                        >
                          {{ regimen.discountApply?.discountPercent + ' %' }}
                        </VueTag>
                        <span v-else>0</span>
                      </td>
                      <td></td>
                    </tr>
                    <tr style="font-weight: 500">
                      <td v-if="CONFIG.MODE === 'development'"></td>
                      <td colspan="4" class="text-right">THÀNH TIỀN</td>
                      <td class="text-right">
                        {{ formatMoney(regimen.totalMoneyAfterDiscount) }}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colspan="100">
                        <a @click="modalSelectProcedureList?.openModal()">✚ Thêm dịch vụ</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-4 flex flex-wrap gap-4">
                <div style="width: 100px">Trạng thái:</div>
                <div class="w-[60px] flex-none">
                  <VueSwitch v-model="regimen.isActive" type-parser="number" />
                </div>
                <div>
                  <span v-if="regimen.isActive">Hoạt động</span>
                  <span v-else>Inactive (Ngừng sử dụng)</span>
                </div>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="regimen.discountList!"
                  :discountListExtra="regimen.discountListExtra || []"
                  :discountInteractId="regimen.id"
                  :discountInteractType="DiscountInteractType.Regimen"
                  :editable="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_POSITION">
              <div class="mt-4">
                <div style="font-weight: bold">1. Vai trò chỉ định liệu trình</div>
                <PositionTableAction
                  v-model:positionList="regimen.positionRequestList!"
                  :positionListCommon="regimen.positionRequestListCommon || []"
                  :positionType="PositionType.RegimenRequest"
                  :positionInteractId="regimen.id"
                  :editable="userPermission[PermissionId.MASTER_DATA_POSITION]"
                />
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>
      <div class="p-4">
        <div class="flex gap-4">
          <VueButton v-if="regimen.id" color="red" icon="trash" @click="clickDestroy">
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
