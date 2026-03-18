<script lang="ts" setup>
import { ticketRoomRef } from '@/modules/room'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '@/common/VueButton.vue'
import { MeService } from '@/modules/_me/me.service'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html'
import {
  TicketAttributeKeyEyeList,
  type TicketAttributeKeyEyeType,
} from '@/modules/ticket-attribute'
import { TicketChangeAttributeApi } from '@/modules/ticket'

const { userPermission, organization } = MeService

const ticketAttributeOriginMap: { [P in TicketAttributeKeyEyeType]?: any } = {}
const ticketAttributeMap = ref<{ [P in TicketAttributeKeyEyeType]?: any }>({})

const saveLoading = ref(false)

onMounted(async () => {})

watch(
  () => ticketRoomRef.value.ticketAttributeList,
  (newValue, oldValue) => {
    if (!newValue) {
      return (ticketAttributeMap.value = {})
    }
    newValue.forEach((i) => {
      if (!TicketAttributeKeyEyeList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyEyeType
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
    const k = key as unknown as TicketAttributeKeyEyeType
    const rootValue = ticketRoomRef.value.ticketAttributeMap[k] || ''
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

    await TicketChangeAttributeApi.updateDiagnosis({
      note: ticketRoomRef.value.note,
      ticketId: ticketRoomRef.value.id,
      ticketAttributeChangeList,
      ticketAttributeKeyList: TicketAttributeKeyEyeList as any,
    })
  } catch (error) {
    console.log('🚀 TicketClinicDiagnosisEyeSpecial.vue:82 ~ saveTicketDiagnosis ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const startPrint = async () => {
  await PrintHtmlAction.startPrintRequestOptometry({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}
</script>
<template>
  <div class="mt-4">
    <div class="mt-4 w-full flex gap-4 flex-wrap">
      <div style="min-width: 600px; flex-basis: 45%; flex-grow: 1; overflow-x: scroll">
        <div class="italic">Khúc xạ máy</div>
        <div class="w-full" style="min-width: 600px">
          <table>
            <thead>
              <tr>
                <th style="width: 100px"></th>
                <th>Cầu</th>
                <th>Loạn</th>
                <th>Trục Loạn</th>
                <th>KCĐT</th>
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
                <td rowspan="2">
                  <input v-model="ticketAttributeMap.KhucXaMay_KhoangCachDongTu" />
                </td>
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
      <div style="min-width: 600px; flex-basis: 45%; flex-grow: 1; overflow-x: scroll">
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
      <div style="min-width: 600px; flex-basis: 45%; flex-grow: 1; overflow-x: scroll">
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
      <div style="min-width: 600px; flex-basis: 45%; flex-grow: 1; overflow-x: scroll">
        <div class="italic">Kính nhìn gần</div>
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
      <div style="min-width: 600px; flex-basis: 45%; flex-grow: 1; overflow-x: scroll">
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
                <td style="padding: 0 6px">Đường kính giác mạc (mm)</td>
                <td><input v-model="ticketAttributeMap.DuongKinhGiacMac_MP_millimeter" /></td>
                <td><input v-model="ticketAttributeMap.DuongKinhGiacMac_MT_millimeter" /></td>
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
              <tr>
                <td style="padding: 0 6px">K1 & K2 (diopter)</td>
                <td><input v-model="ticketAttributeMap.K1AndK2_MP_diopter" /></td>
                <td><input v-model="ticketAttributeMap.K1AndK2_MT_diopter" /></td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 3px 6px 8px 6px">
                  <div class="flex gap-x-4 gap-y-3 flex-wrap">
                    <div style="flex-basis: 40%; min-width: 150px; flex-grow: 1" class="flex gap-1">
                      <div style="width: 90px">Sắc giác:</div>
                      <input class="input-basic-line" v-model="ticketAttributeMap.SacGiac" />
                    </div>
                    <div style="flex-basis: 40%; min-width: 150px; flex-grow: 1" class="flex gap-1">
                      <div style="width: 90px">Hình nổi:</div>
                      <input class="input-basic-line" v-model="ticketAttributeMap.HinhNoi" />
                    </div>
                    <div style="flex-basis: 40%; min-width: 150px; flex-grow: 1" class="flex gap-1">
                      <div style="width: 90px">Cover test:</div>
                      <input class="input-basic-line" v-model="ticketAttributeMap.CoverTest" />
                    </div>
                    <div style="flex-basis: 40%; min-width: 150px; flex-grow: 1" class="flex gap-1">
                      <div style="width: 90px">Đáy mắt:</div>
                      <input class="input-basic-line" v-model="ticketAttributeMap.DayMat" />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="min-width: 600px; flex-basis: 45%; flex-grow: 1; overflow-x: scroll">
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
                <th>KCĐT</th>
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
    </div>
    <div class="mt-4 flex justify-between gap-4">
      <VueButton color="blue" icon="print" @click="startPrint">In phiếu</VueButton>
      <VueButton
        v-if="ticketRoomRef.id && userPermission[PermissionId.TICKET_CHANGE_ATTRIBUTE]"
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

input.input-basic-line {
  border: none;
  border-bottom: 1px dashed #cdcdcd;
  padding: 2px 0;
  &:focus {
    outline: none;
    border-bottom: 1px dashed #40a9ff;
  }
}
</style>
