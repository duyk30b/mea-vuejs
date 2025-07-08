<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import VueButton from '../../../common/VueButton.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { compiledTemplatePrintHtml, PrintHtml, PrintHtmlService } from '../../../modules/print-html'
import {
  TicketAttributeKeyOptometryList,
  type TicketAttributeKeyOptometryType,
} from '../../../modules/ticket-attribute'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { ESDom } from '../../../utils'
import { MeService } from '../../../modules/_me/me.service'

const { userPermission, organization } = MeService

const ticketAttributeOriginMap: { [P in TicketAttributeKeyOptometryType]?: any } = {}
const ticketAttributeMap = ref<{ [P in TicketAttributeKeyOptometryType]?: any }>({})

const saveLoading = ref(false)

onMounted(async () => {})

watch(
  () => ticketClinicRef.value.ticketAttributeList,
  (newValue, oldValue) => {
    if (!newValue) {
      return (ticketAttributeMap.value = {})
    }
    newValue.forEach((i) => {
      if (!TicketAttributeKeyOptometryList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyOptometryType
      if (i.value === ticketAttributeOriginMap[k]) return
      ticketAttributeOriginMap[k] = i.value
      ticketAttributeMap.value[k] = i.value
    })
  },
  { immediate: true, deep: true },
)

const hasChangeAttribute = computed(() => {
  let hasChange = false
  Object.entries(ticketAttributeMap.value).forEach(([key, value]) => {
    const k = key as unknown as TicketAttributeKeyOptometryType
    const rootValue = ticketClinicRef.value.ticketAttributeMap[k] || ''
    if (rootValue != value) {
      hasChange = true
    }
  })
  return hasChange
})

const hasChangeData = computed(() => {
  if (hasChangeAttribute.value) return true

  return false
})

const saveTicketDiagnosis = async () => {
  try {
    saveLoading.value = true

    let ticketAttributeChangeList = undefined
    if (hasChangeAttribute.value) {
      ticketAttributeChangeList = Object.entries(ticketAttributeMap.value)
        .map(([key, value]) => ({ key, value }))
        .filter((i) => !!i.value)
    }

    await TicketClinicApi.updateDiagnosis({
      note: ticketClinicRef.value.note,
      ticketId: ticketClinicRef.value.id,
      files: [],
      ticketAttributeChangeList,
      ticketAttributeKeyList: TicketAttributeKeyOptometryList as any,
    })
  } catch (error) {
    console.log('🚀 TicketClinicDiagnosisEyeSpecial.vue:82 ~ saveTicketDiagnosis ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const startPrint = async () => {
  try {
    const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
    const printHtmlOptometry = await PrintHtmlService.getPrintHtmlOptometry()

    if (!printHtmlHeader || !printHtmlOptometry || !printHtmlOptometry.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const compiledHeader = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlHeader,
    })
    const compiledContent = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlOptometry,
      _LAYOUT: {
        HEADER: compiledHeader.html,
      },
    })

    if (!compiledContent.html) {
      AlertStore.addError('Mẫu in không hợp lệ')
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: compiledContent.html,
      cssList: [compiledHeader.css, compiledContent.css],
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketEyePrescription.vue:191 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <div class="mt-4">
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div class="italic">Khúc xạ máy</div>
      <div class="w-full" style="min-width: 600px">
        <table>
          <thead>
            <tr>
              <th style="width: 100px"></th>
              <th>Cầu</th>
              <th>Loạn</th>
              <th>Trục Loạn</th>
              <th>KCDT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="title">MP</td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaMay_MP_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaMay_MP_Loan"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaMay_MP_TrucLoan"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td rowspan="2"><input v-model="ticketAttributeMap.KhucXaMay_KhoangCachDongTu" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaMay_MT_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaMay_MT_Loan"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaMay_MT_TrucLoan"
                  type="text"
                  style="text-align: left"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div class="italic">Khúc xạ kính cũ</div>
      <div class="w-full" style="min-width: 600px">
        <table>
          <thead>
            <tr>
              <th style="width: 100px"></th>
              <th>Không kính</th>
              <th>Cầu</th>
              <th>Trụ</th>
              <th>Trục</th>
              <th>Có kính</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="title">MP</td>
              <td><input v-model="ticketAttributeMap.KhucXaKinhCu_MP_KhongKinh" /></td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaKinhCu_MP_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaKinhCu_MP_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaKinhCu_MP_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.KhucXaKinhCu_MP_CoKinh" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td><input v-model="ticketAttributeMap.KhucXaKinhCu_MT_KhongKinh" /></td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaKinhCu_MT_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaKinhCu_MT_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaKinhCu_MT_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.KhucXaKinhCu_MT_CoKinh" /></td>
            </tr>
            <tr>
              <td style="text-align: center">Ghi chú</td>
              <td colspan="5">
                <input v-model="ticketAttributeMap.KhucXaKinhCu_Note" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div class="italic">Khúc xạ nhìn xa</div>
      <div class="w-full" style="min-width: 600px">
        <table>
          <thead>
            <tr>
              <th style="width: 100px"></th>
              <th>Không kính</th>
              <th>Cầu</th>
              <th>Trụ</th>
              <th>Trục</th>
              <th>Có kính</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="title">MP</td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinXa_MP_KhongKinh" /></td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinXa_MP_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinXa_MP_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinXa_MP_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinXa_MP_CoKinh" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinXa_MT_KhongKinh" /></td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinXa_MT_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinXa_MT_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinXa_MT_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinXa_MT_CoKinh" /></td>
            </tr>
            <tr>
              <td style="text-align: center">Ghi chú</td>
              <td colspan="5"><input v-model="ticketAttributeMap.KhucXaNhinXa_Note" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div class="italic">Khúc xạ nhìn gần</div>
      <div class="w-full" style="min-width: 600px">
        <table>
          <thead>
            <tr>
              <th style="width: 100px"></th>
              <th>Không kính</th>
              <th>Cầu</th>
              <th>Trụ</th>
              <th>Trục</th>
              <th>Có kính</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="title">MP</td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinGan_MP_KhongKinh" /></td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinGan_MP_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinGan_MP_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinGan_MP_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinGan_MP_CoKinh" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinGan_MT_KhongKinh" /></td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinGan_MT_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinGan_MT_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.KhucXaNhinGan_MT_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.KhucXaNhinGan_MT_CoKinh" /></td>
            </tr>
            <tr>
              <td style="text-align: center">Ghi chú</td>
              <td colspan="5"><input v-model="ticketAttributeMap.KhucXaNhinGan_Note" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div class="italic">Khác</div>
      <div class="w-full" style="min-width: 600px">
        <table>
          <thead>
            <tr>
              <th style="width: 200px"></th>
              <th>Mắt Phải</th>
              <th>Mắt Trái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 0 6px">Nhãn áp (mmHg)</td>
              <td><input v-model="ticketAttributeMap.NhanAp_MP_mmHg" /></td>
              <td><input v-model="ticketAttributeMap.NhanAp_MT_mmHg" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Bề dày giác mạc (μm)</td>
              <td><input v-model="ticketAttributeMap.BeDayGiacMac_MP_micrometer" /></td>
              <td><input v-model="ticketAttributeMap.BeDayGiacMac_MT_micrometer" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Đường kính đồng tử (mm)</td>
              <td><input v-model="ticketAttributeMap.DuongKinhDongTu_MP_millimeter" /></td>
              <td><input v-model="ticketAttributeMap.DuongKinhDongTu_MT_millimeter" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Chiều dài trục nhãn cầu</td>
              <td><input v-model="ticketAttributeMap.ChieuDaiTrucNhanCau_MP" /></td>
              <td><input v-model="ticketAttributeMap.ChieuDaiTrucNhanCau_MT" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Biên độ điều tiết</td>
              <td><input v-model="ticketAttributeMap.BienDoDieuTiet_MP" /></td>
              <td><input v-model="ticketAttributeMap.BienDoDieuTiet_MT" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div class="italic">Số kính chỉ định</div>
      <div class="w-full" style="min-width: 600px">
        <table class="special">
          <thead>
            <tr>
              <th style="width: 100px"></th>
              <th>Cầu</th>
              <th>Trụ</th>
              <th>Trục</th>
              <th>Add</th>
              <th>KCDT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="title">MP</td>
              <td>
                <input
                  v-model="ticketAttributeMap.SoKinhChiDinh_MP_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.SoKinhChiDinh_MP_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.SoKinhChiDinh_MP_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.SoKinhChiDinh_MP_ADD" /></td>
              <td rowspan="2">
                <input v-model="ticketAttributeMap.SoKinhChiDinh_KhoangCachDongTu" />
              </td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td>
                <input
                  v-model="ticketAttributeMap.SoKinhChiDinh_MT_Cau"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.SoKinhChiDinh_MT_Tru"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td>
                <input
                  v-model="ticketAttributeMap.SoKinhChiDinh_MT_Truc"
                  type="text"
                  style="text-align: left"
                />
              </td>
              <td><input v-model="ticketAttributeMap.SoKinhChiDinh_MT_ADD" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4 flex justify-between gap-4">
      <VueButton color="blue" icon="print" @click="startPrint">In phiếu</VueButton>
      <VueButton
        v-if="
          ticketClinicRef.id && userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_ATTRIBUTE]
        "
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketDiagnosis"
      >
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>
<style lang="scss" scoped>
table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;

  th {
    white-space: normal;
    padding: 6px;
    border: 1px solid #cdcdcd;
  }

  td {
    &.title {
      padding: 0 6px;
      font-weight: 500;
      text-align: center;
    }
    border: 1px solid #cdcdcd;
    input {
      width: 100%;
      height: 100%;
      border: none;
      padding: 6px;
      border-radius: 2px;
      &:focus {
        outline: 2px solid #40a9ff;
      }
    }
  }
}
</style>
