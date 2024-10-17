<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconPrint } from '../../../common/icon'
import { IconDelete, IconEditSquare, IconVisibility } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../common/vue-form'
import { Handlebars } from '../../../core/handlebars'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Radiology, RadiologyApi } from '../../../modules/radiology'
import { TicketStatus, ticketRef } from '../../../modules/ticket'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { TicketRadiology } from '../../../modules/ticket-radiology'
import { customFilter } from '../../../utils'
import ModalTicketRadiologyResult from './modal/ModalTicketSpaRadiologyResult.vue'
import { ticketSpaRadiologyHtmlContent } from './print-content/ticket-spa-radiology-html-print-content'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()
const inputSearchRadiology = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const radiology = ref(Radiology.blank())
let radiologyAll: Radiology[] = []
const radiologyList = ref<Radiology[]>([])
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketRadiologyList = ref<TicketRadiology[]>([])
watch(
  () => ticketRef.value.ticketRadiologyList!,
  (newValue: TicketRadiology[]) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

const disabledButton = computed(() => {
  return (
    TicketRadiology.equalList(
      ticketRadiologyList.value,
      ticketRef.value.ticketRadiologyList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicRadiology.vue:54 ~ onMounted ~ onMounted:')
  try {
    const response = await RadiologyApi.list({})
    radiologyAll = response.data
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
    ticketRadiology.ticketId = ticketRef.value.id
    ticketRadiology.customerId = ticketRef.value.customerId
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
  await TicketClinicApi.changeTicketRadiologyList({
    ticketId: ticketRef.value.id,
    customerId: ticketRef.value.customerId || 0,
    ticketRadiologyList: ticketRadiologyList.value.filter((i) => i.startedAt == null),
  })
}

const startPrint = async (tr: TicketRadiology) => {
  try {
    // const response = await fetch('/template/visit-radiology.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketRef.value,
    //   ticketRadiology: vr,
    //   imageList: vr.imageList.slice(0, 4),
    // })
    const content = ticketSpaRadiologyHtmlContent(ticketRef.value, tr)
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
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRef.ticketStatus)"
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
            <th>BS thực hiện</th>
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
            <td>{{ ticketRadiology.doctor?.fullName }}</td>
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
                  {{ ticketRadiology.result }}
                </div>
                <a
                  v-if="
                    [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.ticketStatus)
                  "
                  @click="modalTicketRadiologyResult?.openModal(ticketRadiology, false)">
                  <IconVisibility width="22" height="22" />
                </a>
                <a
                  v-else
                  class="text-orange-500"
                  @click="modalTicketRadiologyResult?.openModal(ticketRadiology, true)">
                  <IconEditSquare width="22" height="22" />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(ticketRadiology.expectedPrice) }}</td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.ticketStatus) &&
                  ticketRadiology.startedAt == null
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
            <td colspan="4" class="text-right">
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
    <VueButton color="blue" :disabled="disabledButton" icon="save" @click="saveTicketRadiologyList">
      Lưu lại
    </VueButton>
  </div>
</template>
<script lang="scss" scope></script>
