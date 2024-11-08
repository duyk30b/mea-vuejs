<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  type DiagnosisSpecialEye,
  ticketClinicRef,
  TicketEyeApi,
} from '../../../modules/ticket-clinic'
import { ticketEyePrintOptometry } from '../../../modules/print-html/print-content/ticket-eye-print-optometry'

const meStore = useMeStore()
const { permissionIdMap } = meStore

const optometry = ref<DiagnosisSpecialEye>({})
const saveLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketEyeDiagnosisSpecial.vue:15 ~ onMounted')
})

watch(
  () => ticketClinicRef.value.ticketDiagnosis!.special,
  (newValue, oldValue) => {
    optometry.value = JSON.parse(newValue || '{}')
  },
  { immediate: true }
)

const optometryString = computed(() => {
  const optometryClone = JSON.parse(JSON.stringify(optometry.value))
  Object.keys(optometryClone).forEach((key) => {
    if (!optometryClone[key]) delete optometryClone[key]
  })
  return JSON.stringify(optometryClone)
})

const hasChangeData = computed(() => {
  return ticketClinicRef.value.ticketDiagnosis!.special != optometryString.value
})

const saveTicketEyeOptometry = async () => {
  try {
    saveLoading.value = true

    await TicketEyeApi.updateDiagnosisSpecial({
      ticketId: ticketClinicRef.value.id,
      ticketDiagnosisId: ticketClinicRef.value.ticketDiagnosis!.id,
      special: optometryString.value,
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitDiagnosis.vue:48 ~ saveTicketEyeOptometry ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleFocus = (e: Event) => {
  const target = e.target as HTMLElement
  const range = document.createRange()
  const selection = window.getSelection()
  if (target?.childNodes?.[0]) {
    range.selectNodeContents(target) // Chọn toàn bộ nội dung của div
    range.collapse(false) // focus thì xuống cuối câu
    selection?.removeAllRanges() // Xóa tất cả các range hiện tại
    selection?.addRange(range) // Thêm range mới để bôi đen toàn bộ nội dung
  }
}

const startPrint = async () => {
  try {
    const content = ticketEyePrintOptometry(
      ticketClinicRef.value,
      JSON.parse(ticketClinicRef.value.ticketDiagnosis!.special),
      ''
    )
    const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(content)
    pri.document.close()
    pri.focus()
    pri.print()
  } catch (error) {
    console.log('🚀 ~ file: TicketEyePrescription.vue:191 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <div class="mt-4">
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Khúc xạ máy</div>
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
                  v-model="optometry.KhucXaMay_MP_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaMay_MP_Loan"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaMay_MP_TrucLoan"
                  type="number"
                  style="text-align: left" />
              </td>
              <td rowspan="2"><input v-model="optometry.KhucXaMay_KhoangCachDongTu" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td>
                <input
                  v-model="optometry.KhucXaMay_MT_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaMay_MT_Loan"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaMay_MT_TrucLoan"
                  type="number"
                  style="text-align: left" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Khúc xạ kính cũ</div>
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
              <td><input v-model="optometry.KhucXaKinhCu_MP_KhongKinh" /></td>
              <td>
                <input
                  v-model="optometry.KhucXaKinhCu_MP_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaKinhCu_MP_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaKinhCu_MP_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.KhucXaKinhCu_MP_CoKinh" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td><input v-model="optometry.KhucXaKinhCu_MT_KhongKinh" /></td>
              <td>
                <input
                  v-model="optometry.KhucXaKinhCu_MT_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaKinhCu_MT_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaKinhCu_MT_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.KhucXaKinhCu_MT_CoKinh" /></td>
            </tr>
            <tr>
              <td style="text-align: center">Ghi chú</td>
              <td colspan="5">
                <input v-model="optometry.KhucXaKinhCu_Note" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Khúc xạ nhìn xa</div>
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
              <td><input v-model="optometry.KhucXaNhinXa_MP_KhongKinh" /></td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinXa_MP_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinXa_MP_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinXa_MP_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.KhucXaNhinXa_MP_CoKinh" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td><input v-model="optometry.KhucXaNhinXa_MT_KhongKinh" /></td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinXa_MT_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinXa_MT_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinXa_MT_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.KhucXaNhinXa_MT_CoKinh" /></td>
            </tr>
            <tr>
              <td style="text-align: center">Ghi chú</td>
              <td colspan="5"><input v-model="optometry.KhucXaNhinXa_Note" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Khúc xạ nhìn gần</div>
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
              <td><input v-model="optometry.KhucXaNhinGan_MP_KhongKinh" /></td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinGan_MP_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinGan_MP_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinGan_MP_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.KhucXaNhinGan_MP_CoKinh" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td><input v-model="optometry.KhucXaNhinGan_MT_KhongKinh" /></td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinGan_MT_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinGan_MT_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.KhucXaNhinGan_MT_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.KhucXaNhinGan_MT_CoKinh" /></td>
            </tr>
            <tr>
              <td style="text-align: center">Ghi chú</td>
              <td colspan="5"><input v-model="optometry.KhucXaNhinGan_Note" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Khác</div>
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
              <td><input v-model="optometry.NhanAp_MP_mmHg" /></td>
              <td><input v-model="optometry.NhanAp_MT_mmHg" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Bề dày giác mạc (μm)</td>
              <td><input v-model="optometry.BeDayGiacMac_MP_micrometer" /></td>
              <td><input v-model="optometry.BeDayGiacMac_MT_micrometer" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Đường kính đồng tử (mm)</td>
              <td><input v-model="optometry.DuongKinhDongTu_MP_millimeter" /></td>
              <td><input v-model="optometry.DuongKinhDongTu_MT_millimeter" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Chiều dài trục nhãn cầu</td>
              <td><input v-model="optometry.ChieuDaiTrucNhanCau_MP" /></td>
              <td><input v-model="optometry.ChieuDaiTrucNhanCau_MT" /></td>
            </tr>
            <tr>
              <td style="padding: 0 6px">Biên độ điều tiết</td>
              <td><input v-model="optometry.BienDoDieuTiet_MP" /></td>
              <td><input v-model="optometry.BienDoDieuTiet_MT" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Số kính chỉ định</div>
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
                  v-model="optometry.SoKinhChiDinh_MP_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.SoKinhChiDinh_MP_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.SoKinhChiDinh_MP_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.SoKinhChiDinh_MP_ADD" /></td>
              <td rowspan="2"><input v-model="optometry.SoKinhChiDinh_KhoangCachDongTu" /></td>
            </tr>
            <tr>
              <td class="title">MT</td>
              <td>
                <input
                  v-model="optometry.SoKinhChiDinh_MT_Cau"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.SoKinhChiDinh_MT_Tru"
                  type="number"
                  style="text-align: left" />
              </td>
              <td>
                <input
                  v-model="optometry.SoKinhChiDinh_MT_Truc"
                  type="number"
                  style="text-align: left" />
              </td>
              <td><input v-model="optometry.SoKinhChiDinh_MT_ADD" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4 flex justify-between gap-4">
      <VueButton color="blue" icon="print" @click="startPrint">In phiếu</VueButton>
      <VueButton
        v-if="permissionIdMap[PermissionId.TICKET_CLINIC_EYE_UPDATE_DIAGNOSIS_SPECIAL]"
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketEyeOptometry">
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
