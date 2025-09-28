<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputMoney, InputSelect, InputText, VueSwitch } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Discount, DiscountInteractType, DiscountService } from '@/modules/discount'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Position, PositionService, PositionType } from '@/modules/position'
import { Procedure, ProcedureService, ProcedureType } from '@/modules/procedure'
import { ProcedureGroup, ProcedureGroupService } from '@/modules/procedure-group'
import PositionTableAction from '@/views/master-data/position/common/PositionTableAction.vue'
import { computed, ref } from 'vue'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  DISCOUNT: 'DISCOUNT',
  ROLE_AND_POSITION: 'ROLE_AND_POSITION',
}

const emit = defineEmits<{ (e: 'success'): void }>()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

let procedureOrigin = Procedure.blank()
const procedure = ref(Procedure.blank())
const procedureGroupOptions = ref<{ value: number; label: string; data: ProcedureGroup }[]>([])

const activeTab = ref(TABS_KEY.BASIC)

const showModal = ref(false)
const saveLoading = ref(false)

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(procedure.value.discountList || [], procedureOrigin.discountList || [])
})

const hasChangePositionRequestList = computed(() => {
  return !Position.equalList(
    (procedure.value.positionRequestList || []).filter((i) => !!i.roleId),
    procedureOrigin.positionRequestList || [],
  )
})

const hasChangePositionResultList = computed(() => {
  return !Position.equalList(
    (procedure.value.positionResultList || []).filter((i) => !!i.roleId),
    procedureOrigin.positionResultList || [],
  )
})

const hasChangeData = computed(() => {
  if (!Procedure.equal(procedure.value, procedureOrigin)) {
    return true
  }
  if (hasChangePositionRequestList.value) {
    return true
  }
  if (hasChangePositionResultList.value) {
    return true
  }
  if (hasChangeDiscountList.value) {
    return true
  }
  return false
})

const openModal = async (procedureId?: number) => {
  showModal.value = true

  if (procedureId) {
    procedureOrigin = await ProcedureService.detail(
      procedureId,
      { relation: { positionList: true, discountList: true } },
      { query: true },
    )
    procedure.value = Procedure.from(procedureOrigin)
  } else {
    procedure.value = Procedure.blank()
    procedure.value.discountListExtra = await DiscountService.list({
      filter: { discountInteractId: 0, discountInteractType: DiscountInteractType.Procedure },
    })
    procedure.value.positionRequestListCommon = await PositionService.list({
      filter: { positionType: PositionType.ProcedureRequest, positionInteractId: 0 },
    })
    procedure.value.positionResultListCommon = await PositionService.list({
      filter: { positionType: PositionType.ProcedureResult, positionInteractId: 0 },
    })
  }

  ProcedureGroupService.list({})
    .then((result) => {
      procedureGroupOptions.value = result.map((i) => ({ value: i.id, label: i.name, data: i }))
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalProcedureUpsert.vue:105 ~ ProcedureGroupService ~ e:', e)
    })
}

const closeModal = () => {
  showModal.value = false

  procedure.value = Procedure.blank()
  procedureOrigin = Procedure.blank()
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
              `Các phiếu liên quan ${response.ticketProcedureList
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
    if (!procedure.value.id) {
      await ProcedureService.createOne({
        procedure: procedure.value,
        discountList: hasChangeDiscountList.value ? procedure.value.discountList : undefined,
        positionRequestList: hasChangePositionRequestList.value
          ? procedure.value.positionRequestList
          : undefined,
        positionResultList: hasChangePositionResultList.value
          ? procedure.value.positionResultList
          : undefined,
      })
    } else {
      await ProcedureService.updateOne(procedure.value.id, {
        procedure: procedure.value,
        discountList: hasChangeDiscountList.value ? procedure.value.discountList : undefined,
        positionRequestList: hasChangePositionRequestList.value
          ? procedure.value.positionRequestList
          : undefined,
        positionResultList: hasChangePositionResultList.value
          ? procedure.value.positionResultList
          : undefined,
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
                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                  <div class="">Tên dịch vụ</div>
                  <div class="">
                    <InputText v-model:value="procedure.name" required />
                  </div>
                </div>
                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                  <div class="">Mã dịch vụ</div>
                  <div class="">
                    <InputText v-model:value="procedure.code" placeholder="Tạo tự động" />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
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

                <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
                  <div class="">Nhóm</div>
                  <div>
                    <InputSelect
                      v-model:value="procedure.procedureGroupId"
                      :options="procedureGroupOptions"
                    />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
                  <div class="flex gap-1">
                    <span>Loại dịch vụ</span>
                  </div>
                  <div>
                    <InputSelect
                      v-model:value="procedure.procedureType"
                      :options="[
                        { value: ProcedureType.Basic, label: 'Cơ bản' },
                        { value: ProcedureType.Process, label: 'Thủ thuật (cần thực hiện)' },
                      ]"
                    />
                  </div>
                </div>

                <div style="flex-grow: 1; flex-basis: 90%" class="flex flex-wrap gap-4">
                  <div style="width: 100px">Trạng thái:</div>
                  <div class="w-[60px] flex-none">
                    <VueSwitch v-model="procedure.isActive" type-parser="number" />
                  </div>
                  <div>
                    <span v-if="procedure.isActive">Hoạt động</span>
                    <span v-else>Inactive (Ngừng sử dụng)</span>
                  </div>
                </div>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="procedure.discountList!"
                  :discountListExtra="procedure.discountListExtra || []"
                  :discountInteractId="procedure.id"
                  :discountInteractType="DiscountInteractType.Procedure"
                  :editable="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_POSITION">
              <div class="mt-4">
                <div style="font-weight: bold">1. Vai trò chỉ định dịch vụ</div>
                <PositionTableAction
                  v-model:positionList="procedure.positionRequestList!"
                  :positionListCommon="procedure.positionRequestListCommon || []"
                  :positionType="PositionType.ProcedureRequest"
                  :positionInteractId="procedure.id"
                  :editable="userPermission[PermissionId.MASTER_DATA_POSITION]"
                />
              </div>
              <div class="mt-10">
                <div style="font-weight: bold">2. Vai trò thực hiện, trả kết quả dịch vụ</div>
                <PositionTableAction
                  v-model:positionList="procedure.positionResultList!"
                  :positionListCommon="procedure.positionResultListCommon || []"
                  :positionType="PositionType.ProcedureResult"
                  :positionInteractId="procedure.id"
                  :editable="userPermission[PermissionId.MASTER_DATA_POSITION]"
                />
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>
      <div class="p-4">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_PROCEDURE] && procedure.id"
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
