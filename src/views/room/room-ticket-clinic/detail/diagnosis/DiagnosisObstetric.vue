<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { InputDate, InputNumber, InputText } from '@/common/vue-form'
import type { TicketAttributeMap } from '@/modules/ticket-attribute'

const props = withDefaults(defineProps<{ ticketAttributeMap: TicketAttributeMap }>(), {
  ticketAttributeMap: () => ({}),
})

const updateDuKienSinh = (DuKienSinhAny: any) => {
  if (!DuKienSinhAny) {
    props.ticketAttributeMap.TuoiThai_Tuan = undefined
    props.ticketAttributeMap.TuoiThai_Ngay = undefined
    return
  }
  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const DuKienSinh = new Date(DuKienSinhAny)
  DuKienSinh.setHours(0, 0, 0, 0)
  props.ticketAttributeMap.NgayDuKienSinh = DuKienSinh.toISOString()

  const timeDuKienSinh = DuKienSinh.getTime()
  const timeNgayThuThai = timeDuKienSinh - 40 * 7 * 24 * 60 * 60 * 1000

  const timeDistance = toDay.getTime() - timeNgayThuThai
  if (timeDistance < 0) {
    props.ticketAttributeMap.TuoiThai_Tuan = 0
    props.ticketAttributeMap.TuoiThai_Ngay = 0
    return
  }
  const dayTime = 24 * 60 * 60 * 1000
  const weekTime = 7 * dayTime
  props.ticketAttributeMap.TuoiThai_Tuan = Math.floor(timeDistance / weekTime)
  props.ticketAttributeMap.TuoiThai_Ngay = Math.floor(Math.floor(timeDistance % weekTime) / dayTime)
}

const updateTuoiThaiTuan = (value: number) => {
  props.ticketAttributeMap.TuoiThai_Tuan = value
  const Tuan = value || 0
  const Ngay = props.ticketAttributeMap.TuoiThai_Ngay || 0
  const timeDistance = (Tuan * 7 + Ngay) * 24 * 60 * 60 * 1000

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const timeNgayThuThai = toDay.getTime() - timeDistance
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  props.ticketAttributeMap.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
}
const updateTuoiThaiNgay = (value: number) => {
  props.ticketAttributeMap.TuoiThai_Ngay = value
  const Tuan = props.ticketAttributeMap.TuoiThai_Tuan || 0
  const Ngay = value || 0
  const timeDistance = (Tuan * 7 + Ngay) * 24 * 60 * 60 * 1000

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const timeNgayThuThai = toDay.getTime() - timeDistance
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  props.ticketAttributeMap.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
}

const updateTuoiPhoi = (TuoiPhoi: number) => {
  props.ticketAttributeMap.TuoiPhoi = TuoiPhoi
  if (!TuoiPhoi) return
  const NgayChuyenPhoiString = props.ticketAttributeMap.NgayChuyenPhoi
  if (!NgayChuyenPhoiString) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  updateDuKienSinh(timeDuKienSinh)
}

const updateNgayChuyenPhoi = (NgayChuyenPhoiString: any) => {
  props.ticketAttributeMap.NgayChuyenPhoi = NgayChuyenPhoiString
  if (!NgayChuyenPhoiString) return
  const TuoiPhoi = Number(props.ticketAttributeMap.TuoiPhoi)
  if (!TuoiPhoi) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  updateDuKienSinh(timeDuKienSinh)
}

const updatePARA = (v: string) => {
  props.ticketAttributeMap.PARA = v
}
const updateNgayDauKyKinhCuoi = (v: any) => {
  props.ticketAttributeMap.NgayDauKyKinhCuoi = v
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 justify-end">
      <div style="flex-basis: 60px">Cơ bản:</div>
      <div style="flex-grow: 2">
        <div style="">PARA</div>
        <div>
          <InputText :value="ticketAttributeMap.PARA" @update:value="updatePARA" />
        </div>
      </div>
      <div style="flex-basis: 35%; flex-grow: 1">
        <div style="">Ngày đầu - KKC:</div>
        <div>
          <InputDate
            :value="ticketAttributeMap.NgayDauKyKinhCuoi"
            @update:value="updateNgayDauKyKinhCuoi"
            typeParser="string"
          />
        </div>
      </div>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2 justify-end">
      <div style="flex-basis: 60px">IVF:</div>
      <div style="flex-grow: 2">
        <div style="">Tuổi phôi (ngày)</div>
        <div>
          <InputNumber :value="ticketAttributeMap.TuoiPhoi" @update:value="updateTuoiPhoi" />
        </div>
      </div>
      <div style="flex-basis: 35%; flex-grow: 1">
        <div style="">Ngày chuyển phôi</div>
        <div>
          <InputDate
            :value="ticketAttributeMap.NgayChuyenPhoi"
            typeParser="string"
            @update:value="updateNgayChuyenPhoi"
          />
        </div>
      </div>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2 justify-end">
      <div style="flex-basis: 60px">Tuổi thai:</div>
      <div style="flex-basis: 100px; flex-grow: 1">
        <div style="">Tuần</div>
        <div>
          <InputNumber
            :value="ticketAttributeMap.TuoiThai_Tuan"
            @update:value="updateTuoiThaiTuan"
          />
        </div>
      </div>
      <div style="flex-basis: 100px; flex-grow: 1">
        <div style="">Ngày</div>
        <div>
          <InputNumber
            :value="ticketAttributeMap.TuoiThai_Ngay || ''"
            @update:value="updateTuoiThaiNgay"
          />
        </div>
      </div>
      <div style="flex-basis: 35%; flex-grow: 1">
        <div style="">Dự kiến sinh</div>
        <div>
          <InputDate
            :value="ticketAttributeMap.NgayDuKienSinh || ''"
            typeParser="string"
            @update:value="updateDuKienSinh"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-vital-signs {
  td.title-vital-signs {
    // font-size: 13px;
    padding: 4px 4px 4px 8px;
    white-space: nowrap;
  }
  td.unit-vital-signs {
    // font-size: 13px;
    padding: 4px 8px 4px 8px;
    white-space: nowrap;
  }
  td.input-vital-signs {
    padding-left: 8px;
  }
  input {
    padding-left: 0.5rem;
    text-align: left;
    font-style: italic;
    width: 100%;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid #cdcdcd;
    &:focus {
      outline: none;
    }
  }
}
</style>
