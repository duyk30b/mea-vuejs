<!-- eslint-disable vue/no-mutating-props -->
<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts" setup>
import { type TicketAttributeMap } from '@/modules/ticket-attribute'

const props = withDefaults(defineProps<{ ticketAttributeMap: TicketAttributeMap }>(), {
  ticketAttributeMap: () => ({}),
})

const update_ThiLuc_MP = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.ThiLuc_MP = target.value
}
const update_ThiLuc_MT = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.ThiLuc_MT = target.value
}
const update_NhanAp_MP_mmHg = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.NhanAp_MP_mmHg = target.value
}
const update_NhanAp_MT_mmHg = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.NhanAp_MT_mmHg = target.value
}
const update_MiMatKetMac_MP = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.MiMatKetMac_MP = target.value
}
const update_MiMatKetMac_MT = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.MiMatKetMac_MT = target.value
}
const update_GiacMac_MP = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.GiacMac_MP = target.value
}
const update_GiacMac_MT = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.GiacMac_MT = target.value
}
const update_TienPhongMongMat_MP = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.TienPhongMongMat_MP = target.value
}
const update_TienPhongMongMat_MT = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.TienPhongMongMat_MT = target.value
}
const update_ThuyTinhThe_MP = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.ThuyTinhThe_MP = target.value
}
const update_ThuyTinhThe_MT = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.ThuyTinhThe_MT = target.value
}
const update_DayMat_MP = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.DayMat_MP = target.value
}
const update_DayMat_MT = (event: Event) => {
  const target = event.target as HTMLInputElement
  props.ticketAttributeMap.DayMat_MT = target.value
}
</script>
<template>
  <div class="mt-4 w-full" style="overflow-x: scroll">
    <div>Khám mắt</div>
    <div class="w-full" style="min-width: 600px">
      <table>
        <thead>
          <tr>
            <th style="width: 160px"></th>
            <th>Mắt Phải</th>
            <th>Mắt Trái</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="title">Thị lực</td>
            <td>
              <input :value="ticketAttributeMap.ThiLuc_MP" @input="update_ThiLuc_MP" />
            </td>
            <td>
              <input :value="ticketAttributeMap.ThiLuc_MT" @input="update_ThiLuc_MT" />
            </td>
          </tr>
          <tr>
            <td class="title">Nhãn áp</td>
            <td>
              <input :value="ticketAttributeMap.NhanAp_MP_mmHg" @input="update_NhanAp_MP_mmHg" />
            </td>
            <td>
              <input :value="ticketAttributeMap.NhanAp_MT_mmHg" @input="update_NhanAp_MT_mmHg" />
            </td>
          </tr>
          <tr>
            <td class="title">Mi mắt - kết mạc</td>
            <td>
              <input :value="ticketAttributeMap.MiMatKetMac_MP" @input="update_MiMatKetMac_MP" />
            </td>
            <td>
              <input :value="ticketAttributeMap.MiMatKetMac_MT" @input="update_MiMatKetMac_MT" />
            </td>
          </tr>
          <tr>
            <td class="title">Giác mạc</td>
            <td>
              <input :value="ticketAttributeMap.GiacMac_MP" @input="update_GiacMac_MP" />
            </td>
            <td>
              <input :value="ticketAttributeMap.GiacMac_MT" @input="update_GiacMac_MT" />
            </td>
          </tr>
          <tr>
            <td class="title">Tiền phòng, mống mắt</td>
            <td>
              <input
                :value="ticketAttributeMap.TienPhongMongMat_MP"
                @input="update_TienPhongMongMat_MP"
              />
            </td>
            <td>
              <input
                :value="ticketAttributeMap.TienPhongMongMat_MT"
                @input="update_TienPhongMongMat_MT"
              />
            </td>
          </tr>
          <tr>
            <td class="title">Thủy tinh thể</td>
            <td>
              <input :value="ticketAttributeMap.ThuyTinhThe_MP" @input="update_ThuyTinhThe_MP" />
            </td>
            <td>
              <input :value="ticketAttributeMap.ThuyTinhThe_MT" @input="update_ThuyTinhThe_MT" />
            </td>
          </tr>
          <tr>
            <td class="title">Đáy mắt</td>
            <td>
              <input :value="ticketAttributeMap.DayMat_MP" @input="update_DayMat_MP" />
            </td>
            <td>
              <input :value="ticketAttributeMap.DayMat_MT" @input="update_DayMat_MT" />
            </td>
          </tr>
        </tbody>
      </table>
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
