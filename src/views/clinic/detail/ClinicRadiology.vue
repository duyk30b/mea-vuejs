<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconPrint } from '../../../common/icon'
import { IconDelete, IconEditSquare } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../common/vue-form'
import { Handlebars } from '../../../core/handlebars'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Radiology, RadiologyApi } from '../../../modules/radiology'
import { VisitActionApi, VisitStatus } from '../../../modules/visit'
import { VisitRadiology } from '../../../modules/visit-radiology'
import { customFilter } from '../../../utils'
import ModalRadiologyUpsert from '../../radiology/upsert/ModalRadiologyUpsert.vue'
import ModalVisitRadiologyResult from './modal/ModalClinicRadiologyResult.vue'
import { visit } from './visit.ref'

const modalRadiologyUpsert = ref<InstanceType<typeof ModalRadiologyUpsert>>()
const modalVisitRadiologyResult = ref<InstanceType<typeof ModalVisitRadiologyResult>>()
const inputSearchRadiology = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const radiology = ref(Radiology.blank())
let radiologyAll: Radiology[] = []
const radiologyList = ref<Radiology[]>([])
const settingStore = useSettingStore()
const { formatMoney } = settingStore

const visitRadiologyList = ref<VisitRadiology[]>([])
watch(
  () => visit.value.visitRadiologyList!,
  (newValue: VisitRadiology[]) => {
    visitRadiologyList.value = VisitRadiology.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

const disabledButton = computed(() => {
  return (
    JSON.stringify(visitRadiologyList.value) === JSON.stringify(visit.value.visitRadiologyList) ||
    [VisitStatus.Debt, VisitStatus.Completed].includes(visit.value.visitStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: ClinicRadiology.vue ~ onMounted')
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
    const visitRadiology = VisitRadiology.init()
    visitRadiology.visitId = visit.value.id
    visitRadiology.customerId = visit.value.customerId
    visitRadiology.radiologyId = instance.id

    visitRadiology.radiology = instance

    visitRadiology.expectedPrice = instance.price
    visitRadiology.discountMoney = 0
    visitRadiology.discountPercent = 0
    visitRadiology.discountType = DiscountType.VND
    visitRadiology.actualPrice = instance.price

    visitRadiologyList.value.push(visitRadiology)
  }
  radiology.value = Radiology.blank()
}

const changeItemPosition = (index: number, count: number) => {
  const temp = visitRadiologyList.value[index]
  visitRadiologyList.value[index] = visitRadiologyList.value[index + count]
  visitRadiologyList.value[index + count] = temp
}

const saveVisitRadiologyList = async () => {
  await VisitActionApi.replaceVisitRadiologyList({
    visitId: visit.value.id,
    customerId: visit.value.customerId || 0,
    visitRadiologyList: visitRadiologyList.value.filter((i) => i.startedAt == null),
  })
}

const startPrint = async (vr: VisitRadiology) => {
  try {
    const response = await fetch('/template/visit-radiology.hbs')
    const templateHtml = await response.text()

    const templateCompile = Handlebars.compile(templateHtml)
    const content = templateCompile({
      organization: meStore.organization,
      visit: visit.value,
      visitRadiology: vr,
      imageList: vr.imageList.slice(0, 4),
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
  <ModalRadiologyUpsert ref="modalRadiologyUpsert" @success="selectRadiology" />
  <ModalVisitRadiologyResult ref="modalVisitRadiologyResult" />
  <div class="mt-4 flex justify-between">
    <span>Chỉ định CĐHA</span>
    <span>
      <a
        v-if="permissionIdMap[PermissionId.RADIOLOGY_CREATE]"
        @click="modalRadiologyUpsert?.openModal()">
        Thêm CĐHA mới
      </a>
    </span>
  </div>
  <div style="height: 40px">
    <InputOptions
      ref="inputSearchRadiology"
      :options="radiologyList.map((i) => ({ value: i.id, text: i.name, data: i }))"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[VisitStatus.Completed, VisitStatus.Debt].includes(visit.visitStatus)"
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
          <tr v-if="visitRadiologyList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(visitRadiology, index) in visitRadiologyList"
            :key="visitRadiology.radiologyId">
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
                  :disabled="index === visitRadiologyList.length - 1"
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>{{ visitRadiology.radiology?.name }}</td>
            <td>{{ visitRadiology.doctor?.fullName }}</td>
            <td
              class="text-center cursor-pointer"
              style="max-width: 300px"
              @click="modalVisitRadiologyResult?.openModal(visitRadiology)">
              <div class="flex items-center justify-between gap-2">
                <div
                  style="
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2; /* Số dòng tối đa */
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">
                  {{ visitRadiology.result }}
                </div>
                <a
                  v-if="![VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)"
                  class="text-orange-500">
                  <IconEditSquare width="22" height="22" />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(visitRadiology.expectedPrice) }}</td>
            <td class="text-center">
              <a
                v-if="
                  ![VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus) &&
                  visitRadiology.startedAt == null
                "
                class="text-red-500"
                @click="visitRadiologyList.splice(index, 1)">
                <IconDelete width="18px" height="18px" />
              </a>
              <a v-if="visitRadiology.startedAt != null" @click="startPrint(visitRadiology)">
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
                  formatMoney(visitRadiologyList.reduce((acc, item) => acc + item.expectedPrice, 0))
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
    <VueButton color="blue" :disabled="disabledButton" icon="save" @click="saveVisitRadiologyList">
      Lưu lại
    </VueButton>
  </div>
</template>
<script lang="scss" scope></script>
