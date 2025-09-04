<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputText, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '@/modules/laboratory'
import { CommissionCalculatorType, PositionType } from '@/modules/position'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { Product, ProductService } from '@/modules/product'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { Role, RoleService } from '@/modules/role'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeUserApi } from '@/modules/ticket'
import { TicketUser } from '@/modules/ticket-user'
import { User, UserService } from '@/modules/user'
import { computed, onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', value: TicketUser, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const { userPermission, organizationPermission } = MeService

let ticketUserOrigin = TicketUser.blank()
const ticketUser = ref<TicketUser>(TicketUser.blank())

const userMap = ref<Record<string, User>>({})
const roleMap = ref<Record<string, Role>>({})

const product = ref<Product>(Product.blank())
const procedureMap = ref<Record<string, Procedure>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

const showModal = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  try {
    const fetchData = await Promise.all([
      UserService.getMap(),
      RoleService.getMap(),
      ProcedureService.getMap(),
      LaboratoryService.getMap(),
      RadiologyService.getMap(),
    ])
    userMap.value = fetchData[0]
    roleMap.value = fetchData[1]
    procedureMap.value = fetchData[2]
    laboratoryMap.value = fetchData[3]
    radiologyMap.value = fetchData[4]
  } catch (error: any) {
    console.log('🚀 ~ ModalTicketUserUpdate ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const openModal = async (ticketUserProp: TicketUser) => {
  showModal.value = true
  ticketUserOrigin = TicketUser.from(ticketUserProp)
  ticketUser.value = TicketUser.from(ticketUserProp)

  if (ticketUserProp.positionType === PositionType.ProductRequest) {
    const productLocal = await ProductService.getOne(ticketUser.value.positionInteractId)
    if (productLocal) {
      product.value = productLocal
    }
  }
}

const hasChangeData = computed(() => {
  const result = !TicketUser.equal(ticketUserOrigin, ticketUser.value)
  return result
})

const handleChangeCommissionMoney = (data: number) => {
  const commissionMoney = data
  const expectedPrice = ticketUser.value.ticketItemExpectedPrice || 0
  const actualPrice = ticketUser.value.ticketItemActualPrice || 0

  const commissionPercentExpected =
    expectedPrice == 0 ? 0 : Math.round((commissionMoney * 100) / expectedPrice)
  const commissionPercentActual =
    actualPrice == 0 ? 0 : Math.round((commissionMoney * 100) / actualPrice)

  ticketUser.value.commissionMoney = commissionMoney
  ticketUser.value.commissionPercentExpected = commissionPercentExpected
  ticketUser.value.commissionPercentActual = commissionPercentActual
}

const handleChangeCommissionPercentExpected = (data: number) => {
  const commissionPercentExpected = data || 0
  const expectedPrice = ticketUser.value.ticketItemExpectedPrice || 0
  const actualPrice = ticketUser.value.ticketItemActualPrice || 0

  const commissionMoney = Math.round((expectedPrice * commissionPercentExpected) / 100)
  const commissionPercentActual =
    actualPrice == 0 ? 0 : Math.round((commissionMoney * 100) / actualPrice)

  ticketUser.value.commissionMoney = commissionMoney
  ticketUser.value.commissionPercentExpected = commissionPercentExpected
  ticketUser.value.commissionPercentActual = commissionPercentActual
}

const handleChangeCommissionPercentActual = (data: number) => {
  const commissionPercentActual = data || 0
  const expectedPrice = ticketUser.value.ticketItemExpectedPrice || 0
  const actualPrice = ticketUser.value.ticketItemActualPrice || 0

  const commissionMoney = Math.round((actualPrice * commissionPercentActual) / 100)
  const commissionPercentExpected =
    expectedPrice == 0 ? 0 : Math.round((commissionMoney * 100) / expectedPrice)

  ticketUser.value.commissionMoney = commissionMoney
  ticketUser.value.commissionPercentExpected = commissionPercentExpected
  ticketUser.value.commissionPercentActual = commissionPercentActual
}

const handleChangeTotalCommissionMoney = (data: number) => {
  handleChangeCommissionMoney(data / ticketUser.value.quantity || 1)
}

const closeModal = () => {
  showModal.value = false
  ticketUser.value = TicketUser.blank()
  ticketUserOrigin = TicketUser.blank()
}

const clickDestroy = async () => {
  ModalStore.confirm({
    title: 'Xác nhận xóa bản ghi này ?',
    content: [
      '- Hệ thống sẽ xóa bản ghi này này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeUserApi.destroyTicketUser({
          ticketId: ticketRoomRef.value.id,
          ticketUserId: ticketUser.value.id,
        })
        emit('success', ticketUser.value, 'DESTROY')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ ModalTicketUserUpdateCommission.vue:153 ~ clickDestroy ~ error:', error)
      }
    },
  })
}

const updateTicketUser = async () => {
  saveLoading.value = true
  try {
    await TicketChangeUserApi.updateTicketUserCommission({
      ticketId: ticketRoomRef.value.id,
      ticketUserId: ticketUser.value.id,
      ticketUser: ticketUser.value,
    })
    emit('success', ticketUser.value, 'UPDATE')
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProcedureUpdate.vue:205 ~ updateTicketUser ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Nhân viên và hoa hồng</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketUser()">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>{{ ticketUser.role?.name || '' }}</div>
          <div>
            <InputText :value="ticketUser.user?.fullName" disabled />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <template v-if="ticketUser.positionType === PositionType.TicketReception">
            <div>Phiếu</div>
            <div>
              <InputText :value="'Phiếu khám'" disabled />
            </div>
          </template>
          <template v-if="ticketUser.positionType === PositionType.ProductRequest">
            <div>Sản phẩm</div>
            <div>
              <InputText :value="product?.brandName" disabled />
            </div>
          </template>
          <template v-if="ticketUser.positionType === PositionType.ProcedureRequest">
            <div>Dịch vụ</div>
            <div>
              <InputText :value="procedureMap[ticketUser.positionInteractId]?.name" disabled />
            </div>
          </template>
          <template v-if="ticketUser.positionType === PositionType.ProcedureResult">
            <div>Dịch vụ</div>
            <div>
              <InputText :value="procedureMap[ticketUser.positionInteractId]?.name" disabled />
            </div>
          </template>
          <template v-if="ticketUser.positionType === PositionType.LaboratoryRequest">
            <div>Xét nghiệm</div>
            <div>
              <InputText :value="laboratoryMap[ticketUser.positionInteractId]?.name" disabled />
            </div>
            {{ laboratoryMap[ticketUser.positionInteractId]?.name }}
          </template>
          <template v-if="ticketUser.positionType === PositionType.RadiologyRequest">
            <div>Phiếu CĐHA</div>
            <div>
              <InputText :value="radiologyMap[ticketUser.positionInteractId]?.name" disabled />
            </div>
          </template>
          <template v-if="ticketUser.positionType === PositionType.RadiologyResult">
            <div>Phiếu CĐHA</div>
            <div>
              <InputText :value="radiologyMap[ticketUser.positionInteractId]?.name" disabled />
            </div>
          </template>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Số lượng</div>
          <div>
            <InputNumber :value="ticketUser.quantity" disabled />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>
            <span>Giá</span>
            <span
              v-if="ticketUser.ticketItemExpectedPrice !== ticketUser.ticketItemActualPrice"
              class="ml-1"
              style="font-size: 0.9em"
            >
              <del>
                <i>({{ formatMoney(ticketUser.ticketItemExpectedPrice) }})</i>
              </del>
            </span>
          </div>
          <div>
            <InputMoney :value="ticketUser.ticketItemActualPrice" disabled />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 500px">
          <div>
            Công thức tính
            <span
              v-if="
                ticketUser.commissionCalculatorType !== CommissionCalculatorType.VND &&
                ticketUser.commissionMoney !== 0
              "
            >
              (
              <b>{{ formatMoney(ticketUser.commissionMoney) }}</b>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketUser.commissionCalculatorType"
              style="width: 250px"
              :options="[
                { value: CommissionCalculatorType.PercentExpected, text: '% Giá niêm yết' },
                { value: CommissionCalculatorType.PercentActual, text: '% Giá sau chiết khấu' },
                { value: CommissionCalculatorType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 250px)">
              <InputMoney
                v-if="
                  ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentExpected
                "
                :value="ticketUser.commissionPercentExpected"
                @update:value="handleChangeCommissionPercentExpected"
              />
              <InputMoney
                v-if="
                  ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentActual
                "
                :value="ticketUser.commissionPercentActual"
                @update:value="handleChangeCommissionPercentActual"
              />
              <InputMoney
                v-if="ticketUser.commissionCalculatorType === CommissionCalculatorType.VND"
                :value="ticketUser.commissionMoney"
                @update:value="handleChangeCommissionMoney"
              />
            </div>
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 500px">
          <div>Tổng tiền hoa hồng</div>
          <div style="width: 100%">
            <InputMoney
              :value="ticketUser.commissionMoney * ticketUser.quantity"
              @update:value="handleChangeTotalCommissionMoney"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa</VueButton>
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save"
          >
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
