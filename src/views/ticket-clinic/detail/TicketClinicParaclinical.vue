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
import { Paraclinical, ParaclinicalService } from '../../../modules/paraclinical'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtmlService } from '../../../modules/print-html'
import {
  ticketClinicPrintTicketParaclinicalCompiledTemplate,
  ticketClinicPrintTicketParaclinicalDefault,
} from '../../../modules/print-html/print-content/ticket-clinic-print-ticket-paraclinical'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketParaclinical } from '../../../modules/ticket-paraclinical'
import { customFilter } from '../../../utils'
import ModalTicketParaclinicalResult from './modal/ModalTicketParaclinicalResult.vue'

const modalTicketParaclinicalResult = ref<InstanceType<typeof ModalTicketParaclinicalResult>>()
const inputSearchParaclinical = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const paraclinical = ref(Paraclinical.blank())
let paraclinicalAll: Paraclinical[] = []
const paraclinicalList = ref<Paraclinical[]>([])
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketParaclinicalList = ref<TicketParaclinical[]>([])
watch(
  () => ticketClinicRef.value.ticketParaclinicalList!,
  (newValue: TicketParaclinical[]) => {
    ticketParaclinicalList.value = TicketParaclinical.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

const disabledButton = computed(() => {
  return (
    TicketParaclinical.equalList(
      ticketParaclinicalList.value,
      ticketClinicRef.value.ticketParaclinicalList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicParaclinical.vue:54 ~ onMounted ~ onMounted:')
  try {
    paraclinicalAll = await ParaclinicalService.getAll()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingParaclinical = async (text: string) => {
  paraclinicalList.value = paraclinicalAll.filter((i) => customFilter(i.name, text))
}

const selectParaclinical = (instance?: Paraclinical) => {
  if (instance) {
    const ticketParaclinical = TicketParaclinical.init()
    ticketParaclinical.ticketId = ticketClinicRef.value.id
    ticketParaclinical.customerId = ticketClinicRef.value.customerId
    ticketParaclinical.paraclinicalId = instance.id

    ticketParaclinical.paraclinical = instance

    ticketParaclinical.expectedPrice = instance.price
    ticketParaclinical.discountMoney = 0
    ticketParaclinical.discountPercent = 0
    ticketParaclinical.discountType = DiscountType.VND
    ticketParaclinical.actualPrice = instance.price

    ticketParaclinicalList.value.push(ticketParaclinical)
  }
  paraclinical.value = Paraclinical.blank()
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketParaclinicalList.value[index]
  ticketParaclinicalList.value[index] = ticketParaclinicalList.value[index + count]
  ticketParaclinicalList.value[index + count] = temp
}

const saveTicketParaclinicalList = async () => {
  await TicketClinicApi.updateTicketParaclinicalList({
    ticketId: ticketClinicRef.value.id,
    customerId: ticketClinicRef.value.customerId || 0,
    ticketParaclinicalList: ticketParaclinicalList.value.filter((i) => i.startedAt == null),
  })
}

const startPrint = async (ticketParaclinicalData: TicketParaclinical) => {
  try {
    // const response = await fetch('/template/visit-paraclinical.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketClinicRef.value,
    //   ticketParaclinical: vr,
    //   imageList: vr.imageList.slice(0, 4),
    // })
    const printHtml = await PrintHtmlService.findOneBy({
      type: 'PARACLINICAL',
      paraclinicalId: ticketParaclinicalData.paraclinical!.id,
    })

    let htmlString = printHtml?.content
    if (!htmlString) {
      htmlString = await ticketClinicPrintTicketParaclinicalDefault()
    }

    const content = ticketClinicPrintTicketParaclinicalCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      paraclinical: ticketParaclinicalData.paraclinical!,
      customer: ticketClinicRef.value.customer!,
      ticketParaclinical: ticketParaclinicalData,
      data: JSON.parse(ticketParaclinicalData.description || '{}'),
      doctorName: '',
      htmlString,
    })

    const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(content)
    pri.document.close()

    // Đợi tất cả hình ảnh tải xong
    const images = pri.document.images
    const imagePromises = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      if (!img.complete) {
        imagePromises.push(
          new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve() // Xử lý trường hợp tải hình ảnh thất bại
          })
        )
      }
    }
    await Promise.all(imagePromises)
    pri.focus()
    pri.print()
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketParaclinicalResult ref="modalTicketParaclinicalResult" />
  <div class="mt-4 flex justify-between">
    <span>Chỉ định cận lâm sàng</span>
    <span></span>
  </div>
  <div style="height: 40px">
    <InputOptions
      ref="inputSearchParaclinical"
      :options="paraclinicalList.map((i) => ({ value: i.id, text: i.name, data: i }))"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)"
      @selectItem="({ data }) => selectParaclinical(data)"
      @update:text="searchingParaclinical">
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
          - {{ formatMoney(data.price) }}
        </div>
      </template>
    </InputOptions>
  </div>
  <div class="mt-4">
    <div>Danh sách các phiếu cận lâm sàng</div>
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
          <tr v-if="ticketParaclinicalList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(ticketParaclinical, index) in ticketParaclinicalList"
            :key="ticketParaclinical.paraclinicalId">
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
                  :disabled="index === ticketParaclinicalList.length - 1"
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>{{ ticketParaclinical.paraclinical?.name }}</td>
            <!-- <td>{{ ticketParaclinical.doctor?.fullName }}</td> -->
            <td style="max-width: 300px">
              <div class="flex items-center justify-between gap-2">
                <div
                  style="
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2; /* Số dòng tối đa */
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">
                  {{ ticketParaclinical.result }}
                </div>
                <a
                  v-if="
                    [TicketStatus.Debt, TicketStatus.Completed].includes(
                      ticketClinicRef.ticketStatus
                    )
                  "
                  @click="
                    modalTicketParaclinicalResult?.openModalByInstance(ticketParaclinical, false)
                  ">
                  <IconVisibility width="22" height="22" />
                </a>
                <a
                  v-else
                  class="text-orange-500"
                  @click="
                    modalTicketParaclinicalResult?.openModalByInstance(ticketParaclinical, true)
                  ">
                  <IconEditSquare width="22" height="22" />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(ticketParaclinical.expectedPrice) }}</td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  ) && ticketParaclinical.startedAt == null
                "
                class="text-red-500"
                @click="ticketParaclinicalList.splice(index, 1)">
                <IconDelete width="18px" height="18px" />
              </a>
              <a
                v-if="ticketParaclinical.startedAt != null"
                @click="startPrint(ticketParaclinical)">
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
                    ticketParaclinicalList.reduce((acc, item) => acc + item.expectedPrice, 0)
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
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PARACLINICAL_LIST]"
      color="blue"
      :disabled="disabledButton"
      icon="save"
      @click="saveTicketParaclinicalList">
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
