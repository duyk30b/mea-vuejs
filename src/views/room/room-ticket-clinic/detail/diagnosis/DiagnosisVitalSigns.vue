<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { InputDate, InputNumber, InputText } from '@/common/vue-form'
import type { TicketAttributeMap } from '@/modules/ticket-attribute'

const props = withDefaults(defineProps<{ ticketAttributeMap: TicketAttributeMap }>(), {
  ticketAttributeMap: () => ({}),
})

const updatePulse = (v: any) => {
  props.ticketAttributeMap.pulse = v
}
const updateBloodPressure = (v: any) => {
  props.ticketAttributeMap.bloodPressure = v
}
const updateTemperature = (v: any) => {
  props.ticketAttributeMap.temperature = v
}
const updateHeight = (v: any) => {
  props.ticketAttributeMap.height = v
}
const updateWeight = (v: any) => {
  props.ticketAttributeMap.weight = v
}
</script>

<template>
  <div>
    <div>Chỉ số sinh tồn</div>
    <div class="grow pb-4 pt-2" style="border: 1px solid #d1d5db">
      <table class="w-full table-vital-signs">
        <tbody>
          <tr>
            <td class="title-vital-signs">Mạch</td>
            <td>:</td>
            <td class="input-vital-signs">
              <input
                :value="ticketAttributeMap.pulse || ''"
                type="number"
                @input="(e: any) => updatePulse(e.target.value || '')"
              />
            </td>
            <td class="unit-vital-signs">l/p</td>
          </tr>
          <tr>
            <td class="title-vital-signs">Huyết áp</td>
            <td>:</td>
            <td class="input-vital-signs">
              <input
                :value="ticketAttributeMap.bloodPressure || ''"
                @input="(e: any) => updateBloodPressure(e.target.value || '')"
              />
            </td>
            <td class="unit-vital-signs">mmHg</td>
          </tr>
          <tr>
            <td class="title-vital-signs">Nhiệt độ</td>
            <td>:</td>
            <td class="input-vital-signs">
              <input
                :value="ticketAttributeMap.temperature || ''"
                @input="(e: any) => updateTemperature(e.target.value || '')"
              />
            </td>
            <td class="unit-vital-signs">°C</td>
          </tr>
          <tr>
            <td class="title-vital-signs">Chiều cao</td>
            <td>:</td>
            <td class="input-vital-signs">
              <input
                type="number"
                :value="ticketAttributeMap.height || ''"
                @input="(e: any) => updateHeight(e.target.value || '')"
              />
            </td>
            <td class="unit-vital-signs">cm</td>
          </tr>
          <tr>
            <td class="title-vital-signs">Cân nặng</td>
            <td>:</td>
            <td class="input-vital-signs">
              <input
                type="number"
                :value="ticketAttributeMap.weight || ''"
                @input="(e: any) => updateWeight(e.target.value || '')"
              />
            </td>
            <td class="unit-vital-signs">kg</td>
          </tr>
        </tbody>
      </table>
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
