<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDelete } from '@/common/icon-antd'
import { InputMoney } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { ticketRoomRef } from '@/modules/room'
import { SurchargeService } from '@/modules/surcharge'
import { TicketActionApi } from '@/modules/ticket'
import { TicketSurcharge } from '@/modules/ticket-surcharge/ticket-surcharge.model'
import InputSelectSurcharge from '@/views/component/InputSelectSurcharge.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketSurchargeList = ref<TicketSurcharge[]>([])
let ticketSurchargeOriginList: TicketSurcharge[] = []

const showModal = ref(false)
const saveLoading = ref(false)

const totalSurchargeMoney = computed(() => {
  return ticketSurchargeList.value.reduce((acc, item) => {
    return acc + item.money
  }, 0)
})

const openModal = async () => {
  showModal.value = true
  await SurchargeService.getAll()

  ticketSurchargeOriginList = TicketSurcharge.fromList(
    ticketRoomRef.value.ticketSurchargeList || [],
  )
  if (!ticketSurchargeOriginList.length) {
    ticketSurchargeOriginList.push(TicketSurcharge.blank())
  }

  ticketSurchargeList.value = TicketSurcharge.fromList(ticketSurchargeOriginList)
}

const hasChangeData = computed(() => {
  return !TicketSurcharge.equalList(ticketSurchargeList.value, ticketSurchargeOriginList)
})

const surchargeAll = SurchargeService.surchargeAll
const openBlankSurchargeList = async () => {
  const route = router.resolve({ name: 'Surcharge' })
  window.open(route.href, '_blank')
}

const closeModal = () => {
  showModal.value = false
  ticketSurchargeOriginList = []
  ticketSurchargeList.value = []
}

const addTicketSurcharge = () => {
  ticketSurchargeList.value.push(TicketSurcharge.blank())
}

const removeTicketSurcharge = (_localId: string) => {
  const index = ticketSurchargeList.value.findIndex((i) => i._localId === _localId)
  ticketSurchargeList.value.splice(index, 1)
}

const changeSurcharge = async () => {
  saveLoading.value = true
  try {
    await TicketActionApi.changeSurchargeList(ticketRoomRef.value.id, {
      ticketSurchargeBodyList: ticketSurchargeList.value,
    })
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProcedureUpdate.vue:205 ~ changeSurcharge ~ error:', error)
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
        <div class="flex-1 text-lg font-medium">Phụ phí</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4" @submit.prevent="(e) => changeSurcharge()">
        <div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th class="px-1">STT</th>
                  <th>Loại phụ phí</th>
                  <th>Số tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ticketSurcharge, index) in ticketSurchargeList"
                  :key="ticketSurcharge._localId"
                >
                  <td class="px-1 py-1" style="text-align: center">{{ index + 1 }}</td>
                  <td class="px-1 py-1">
                    <div>
                      <InputSelectSurcharge v-model:surchargeId="ticketSurcharge.surchargeId" />
                    </div>
                  </td>
                  <td class="px-1 py-1">
                    <div>
                      <InputMoney v-model:value="ticketSurcharge.money" />
                    </div>
                  </td>
                  <td class="text-center">
                    <IconDelete
                      style="cursor: pointer"
                      color="red"
                      width="18px"
                      height="18px"
                      @click="removeTicketSurcharge(ticketSurcharge._localId)"
                    ></IconDelete>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-2">
            <a @click="addTicketSurcharge">✚ Thêm phụ phí</a>
          </div>
          <div v-if="!surchargeAll.length" class="mt-1">
            <a
              style="text-decoration: underline; font-style: italic"
              @click="openBlankSurchargeList"
            >
              Chưa có phụ phí ? Vào trang quản lý phụ phí
            </a>
          </div>
          <div class="text-end mt-2">
            Tổng phụ phí:
            <b>
              {{ formatMoney(totalSurchargeMoney) }}
            </b>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
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
