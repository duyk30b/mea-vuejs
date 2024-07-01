<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import VueButton from '../../../common/VueButton.vue'
import { InputMoney, VueSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { UNKNOWN_KEY } from '../../../modules/enum'
import { VisitSurcharge } from '../../../modules/visit-surcharge/visit-surcharge.model'
import { visit } from './invoice-upsert.ref'

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const handleChangeMoneyInvoiceSurchargeDetail = (money: number, index: number) => {
  visit.value.visitSurchargeList![index].money = money
  visit.value.surcharge = visit.value.visitSurchargeList!.reduce((acc, cur) => {
    return acc + cur.money
  }, 0)
}

const handleDeleteSurchargeDetail = (index: number) => {
  visit.value.visitSurchargeList!.splice(index, 1)
  visit.value.surcharge = visit.value.visitSurchargeList!.reduce((acc, cur) => {
    return acc + cur.money
  }, 0)
}

const handleAddSurchargeDetail = () => {
  const existKey = visit.value.visitSurchargeList!.map((i) => i.key)
  existKey.push(UNKNOWN_KEY)
  const allKey = Object.keys(settingStore.INVOICE_SURCHARGE_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || UNKNOWN_KEY
  const name = settingStore.INVOICE_SURCHARGE_DETAIL[key]
  const newSurcharge = new VisitSurcharge()
  newSurcharge.key = key
  newSurcharge.name = name || ''
  newSurcharge.money = 0
  visit.value.visitSurchargeList!.push(newSurcharge)
}

const handleChangeInvoiceSurcharge = (data: number) => {
  visit.value.surcharge = data

  let totalKnownMoney = 0
  let indexOther = -1
  for (let i = 0; i < visit.value.visitSurchargeList!.length; i++) {
    const item = visit.value.visitSurchargeList![i]
    if (item.key !== UNKNOWN_KEY) totalKnownMoney += item.money
    else indexOther = i
  }

  // nếu có other thì cập nhật money của other
  if (indexOther !== -1) {
    visit.value.visitSurchargeList![indexOther].money = data - totalKnownMoney
  } else {
    // nếu không có other thì thêm mới other
    const other = VisitSurcharge.blank()
    other.key = UNKNOWN_KEY
    other.name = settingStore.INVOICE_SURCHARGE_DETAIL[UNKNOWN_KEY]
    other.money = data - totalKnownMoney
    visit.value.visitSurchargeList!.push(other)
  }
}
</script>

<template>
  <td class="cursor-pointer whitespace-nowrap">
    <a-popconfirm>
      <template #cancelButton>
        <div></div>
      </template>
      <template #okButton>
        <div></div>
      </template>
      <template #title>
        <div style="max-width: 100vw">
          <div class="flex">
            <div style="width: 160px; font-size: 13px">Loại phụ phí</div>
            <div style="flex: 1; font-size: 13px">Số tiền</div>
          </div>
          <div class="flex flex-col gap-2 mt-2">
            <div
              v-for="(surcharge, index) in visit.visitSurchargeList"
              :key="index"
              class="flex items-stretch">
              <VueSelect
                v-model:value="visit.visitSurchargeList![index].key"
                style="width: 160px"
                :options="
                  [
                    ...Object.entries(settingStore.INVOICE_SURCHARGE_DETAIL).map(([key, text]) => ({
                      value: key,
                      text: text,
                    })),
                    ...(settingStore.INVOICE_SURCHARGE_DETAIL[surcharge.key]
                      ? []
                      : [{ value: surcharge.key, text: surcharge.name }]),
                  ].reverse()
                " />
              <div style="flex: 1">
                <InputMoney
                  :value="surcharge.money"
                  @update:value="(data) => handleChangeMoneyInvoiceSurchargeDetail(data, index)" />
              </div>
              <div style="width: 60px">
                <VueButton color="red" danger @click="handleDeleteSurchargeDetail(index)">
                  Xóa
                </VueButton>
              </div>
            </div>
          </div>
          <div class="text-end mt-1" style="font-size: 13px">
            <a @click="handleAddSurchargeDetail">Thêm phụ phí khác</a>
          </div>
          <div class="flex mt-2">
            <div style="width: 160px">Tổng phụ phí:</div>
            <div style="flex: 1">
              <b class="ml-3" style="font-size: 16px">
                {{ formatMoney(visit.surcharge) }}
              </b>
            </div>
          </div>
        </div>
      </template>
      <div>
        <span class="mr-2">Phụ phí</span>
        <ExclamationCircleOutlined />
      </div>
    </a-popconfirm>
  </td>
  <td>
    <InputMoney
      :value="visit.surcharge"
      class="input-payment"
      style="width: 100%"
      @update:value="handleChangeInvoiceSurcharge" />
  </td>
</template>
