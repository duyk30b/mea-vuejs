<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconPrint } from '../../../common/icon'
import { IconDelete, IconEditSquare, IconVisibility } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { Radiology, RadiologyService } from '../../../modules/radiology'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtml, printHtmlCompiledTemplate, PrintHtmlService } from '../../../modules/print-html'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketRadiology } from '../../../modules/ticket-radiology'
import { customFilter, DDom } from '../../../utils'
import ModalTicketRadiologyResult from './modal/ModalTicketRadiologyResult.vue'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()
const inputSearchRadiology = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const radiology = ref(Radiology.blank())
let radiologyAll: Radiology[] = []
const radiologyList = ref<Radiology[]>([])
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketRadiologyList = ref<TicketRadiology[]>([])
watch(
  () => ticketClinicRef.value.ticketRadiologyList!,
  (newValue: TicketRadiology[]) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

const disabledButton = computed(() => {
  return (
    TicketRadiology.equalList(
      ticketRadiologyList.value,
      ticketClinicRef.value.ticketRadiologyList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicRadiology.vue:54 ~ onMounted ~ onMounted:')
  try {
    radiologyAll = await RadiologyService.list({})
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingRadiology = async (text: string) => {
  radiologyList.value = radiologyAll.filter((i) => customFilter(i.name, text))
}

const selectRadiology = (instance?: Radiology) => {
  if (instance) {
    const ticketRadiology = TicketRadiology.init()
    ticketRadiology.ticketId = ticketClinicRef.value.id
    ticketRadiology.customerId = ticketClinicRef.value.customerId
    ticketRadiology.radiologyId = instance.id

    ticketRadiology.radiology = instance

    ticketRadiology.expectedPrice = instance.price
    ticketRadiology.discountMoney = 0
    ticketRadiology.discountPercent = 0
    ticketRadiology.discountType = DiscountType.VND
    ticketRadiology.actualPrice = instance.price

    ticketRadiologyList.value.push(ticketRadiology)
  }
  radiology.value = Radiology.blank()
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketRadiologyList.value[index]
  ticketRadiologyList.value[index] = ticketRadiologyList.value[index + count]
  ticketRadiologyList.value[index + count] = temp
}

const saveTicketRadiologyList = async () => {
  await TicketClinicApi.updateTicketRadiologyList({
    ticketId: ticketClinicRef.value.id,
    customerId: ticketClinicRef.value.customerId || 0,
    ticketRadiologyList: ticketRadiologyList.value.filter((i) => i.startedAt == null),
  })
}

const startPrint = async (ticketRadiologyData: TicketRadiology) => {
  try {
    let printHtmlId = ticketRadiologyData.radiology?.printHtmlId || 0
    let printHtml: PrintHtml | undefined
    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.radiology
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      data: ticketRadiologyData,
      masterData: {},
      printHtml: printHtml!,
    })

    await DDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
  <div class="mt-4 flex justify-between">
    <span>Chỉ định CĐHA</span>
    <span></span>
  </div>
  <div style="height: 40px">
    <InputOptions
      ref="inputSearchRadiology"
      :options="radiologyList.map((i) => ({ value: i.id, text: i.name, data: i }))"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)"
      @selectItem="({ data }) => selectRadiology(data)"
      @update:text="searchingRadiology">
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
          - {{ formatMoney(data.price) }}
        </div>
      </template>
    </InputOptions>
  </div>
  <div class="mt-4">
    <div>Danh sách các phiếu CĐHA</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Phiếu</th>
            <!-- <th>BS thực hiện</th> -->
            <th>Kết quả</th>
            <th>Giá</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketRadiologyList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(ticketRadiology, index) in ticketRadiologyList"
            :key="ticketRadiology.radiologyId">
            <td>
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0"
                  @click="changeItemPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <span>{{ index + 1 }}</span>
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === ticketRadiologyList.length - 1"
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>{{ ticketRadiology.radiology?.name }}</td>
            <!-- <td>{{ ticketRadiology.doctor?.fullName }}</td> -->
            <td style="max-width: 300px">
              <div class="flex items-center justify-between gap-2">
                <div
                  style="
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2; /* Số dòng tối đa */
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-clamp: 2;
                  ">
                  {{ ticketRadiology.result }}
                </div>
                <a
                v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(
                      ticketClinicRef.ticketStatus
                    ) && permissionIdMap[PermissionId.TICKET_RADIOLOGY_RESULT]
                  "
                  class="text-orange-500"
                  @click="
                    modalTicketRadiologyResult?.openModalByInstance(ticketRadiology, {
                      editable: true,
                    })
                  ">
                  <IconEditSquare width="22" height="22" />
                </a>
                <a
                  v-else
                  @click="
                    modalTicketRadiologyResult?.openModalByInstance(ticketRadiology, {
                      editable: false,
                    })
                  ">
                  <IconVisibility width="22" height="22" />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(ticketRadiology.expectedPrice) }}</td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  ) && ticketRadiology.startedAt == null
                "
                class="text-red-500"
                @click="ticketRadiologyList.splice(index, 1)">
                <IconDelete width="18px" height="18px" />
              </a>
              <a v-if="ticketRadiology.startedAt != null" @click="startPrint(ticketRadiology)">
                <IconPrint width="18px" height="18px" />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="3" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketRadiologyList.reduce((acc, item) => acc + item.expectedPrice, 0)
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-4 flex justify-between">
    <div></div>
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY_LIST]"
      color="blue"
      :disabled="disabledButton"
      icon="save"
      @click="saveTicketRadiologyList">
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
