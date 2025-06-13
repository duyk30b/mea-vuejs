<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputOptions, VueSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../modules/procedure'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { ESString } from '../../../utils'
import ModalProcedureUpsert from '../../master-data/procedure/upsert/ModalProcedureUpsert.vue'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const inputOptionsProcedure = ref<InstanceType<typeof InputOptions>>()
const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

let procedureAll: Procedure[] = []
const procedureOptions = ref<{ value: number; text: string; data: Procedure }[]>([])

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const handleFocusFirstSearchProcedure = async () => {
  procedureAll = await ProcedureService.list({})
}

const searchingProcedure = async (text: string) => {
  if (!text) {
    ticketProcedure.value = TicketProcedure.blank()
    procedureOptions.value = []
  }
  procedureOptions.value = procedureAll
    .filter((i) => ESString.customFilter(i.name, text))
    .map((i) => ({ value: i.id, text: i.name, data: i }))
}

const selectProcedure = async (procedure: Procedure) => {
  await createTicketProcedure(procedure)
}

const createTicketProcedure = async (procedureProp?: Procedure) => {
  const tpItem = TicketProcedure.blank()
  if (procedureProp) {
    tpItem.procedureId = procedureProp.id
    tpItem.procedure = Procedure.from(procedureProp)
    tpItem.quantity = 1

    tpItem.expectedPrice = procedureProp.price
    tpItem.discountType = DiscountType.Percent
    tpItem.discountMoney = 0
    tpItem.discountPercent = 0
    tpItem.actualPrice = procedureProp.price

    await ProcedureService.executeRelation([procedureProp], { discountList: true })
    const discountApply = procedureProp?.discountApply
    if (discountApply) {
      let { discountType, discountPercent, discountMoney } = discountApply
      const expectedPrice = tpItem.expectedPrice || 0
      if (discountType === DiscountType.Percent) {
        discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
      }
      if (discountType === DiscountType.VND) {
        discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
      }
      tpItem.discountType = discountType
      tpItem.discountPercent = discountPercent
      tpItem.discountMoney = discountMoney
      tpItem.actualPrice = expectedPrice - discountMoney
    }
  }
  ticketProcedure.value = tpItem
}

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProcedure.value.discountPercent = data
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeUnitActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketProcedure.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.discountType = DiscountType.VND
  ticketProcedure.value.actualPrice = actualPrice
}

const clear = () => {
  procedureOptions.value = []
  ticketProcedure.value = TicketProcedure.blank()
  inputOptionsProcedure.value?.clear()
}

const addTicketProcedure = () => {
  if (ticketProcedure.value.quantity <= 0) {
    return AlertStore.addError('Lỗi: Số lượng không hợp lệ')
  }

  if (settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.allowDuplicateItem) {
    ticketOrderUpsertRef.value.ticketProcedureList?.push(ticketProcedure.value)
  } else {
    const exist = ticketOrderUpsertRef.value.ticketProcedureList?.find((i) => {
      return i.procedureId === ticketProcedure.value.procedureId
    })
    if (exist) {
      exist.quantity += ticketProcedure.value.quantity
    } else {
      ticketOrderUpsertRef.value.ticketProcedureList?.push(ticketProcedure.value)
    }
  }

  clear()
  if (!isMobile) {
    inputOptionsProcedure.value?.focus()
  }
}

const createProcedure = (instance?: Procedure) => {
  inputOptionsProcedure.value?.setItem({
    text: instance?.name || '',
    data: instance,
    value: instance?.id,
  })
  selectProcedure(instance!)
}

const focus = () => {
  inputOptionsProcedure.value?.focus()
}
defineExpose({ focus })
</script>

<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="createProcedure" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addTicketProcedure()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div class="flex justify-between">
        <span>Tên dịch vụ</span>
        <span>
          <a
            v-if="userPermission[PermissionId.PROCEDURE_CREATE]"
            @click="modalProcedureUpsert?.openModal()"
          >
            Thêm dịch vụ mới
          </a>
        </span>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProcedure"
          :options="procedureOptions"
          :maxHeight="320"
          placeholder="(F3) Tìm kiếm tên dịch vụ"
          @selectItem="({ data }) => selectProcedure(data)"
          @onFocusinFirst="handleFocusFirstSearchProcedure"
          @update:text="searchingProcedure"
        >
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.name }}</b>
              - {{ formatMoney(data.price) }}
            </div>
          </template>
        </InputOptions>
      </div>
    </div>
    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.expectedPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>Giá niêm yết</div>
      <div class="flex">
        <InputMoney :value="ticketProcedure.expectedPrice" disabled />
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>Số lượng</div>
      <div>
        <InputNumber v-model:value="ticketProcedure.quantity" :validate="{ gt: 0 }" />
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.discount"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Chiết khấu
        <span
          v-if="
            ticketProcedure.discountType === DiscountType.Percent &&
            ticketProcedure.discountPercent !== 0
          "
        >
          (
          <b>{{ formatMoney(ticketProcedure.discountMoney) }}</b>
          )
        </span>
      </div>
      <div class="flex">
        <VueSelect
          v-model:value="ticketProcedure.discountType"
          style="width: 120px"
          :options="[
            { value: DiscountType.Percent, text: '%' },
            { value: DiscountType.VND, text: 'VNĐ' },
          ]"
        />
        <div style="width: calc(100% - 120px)">
          <InputMoney
            v-if="ticketProcedure.discountType === DiscountType.VND"
            :value="ticketProcedure.discountMoney"
            @update:value="handleChangeUnitDiscountMoney"
            :validate="{ gte: 0 }"
          />
          <InputNumber
            v-else
            :value="ticketProcedure.discountPercent"
            @update:value="handleChangeDiscountPercent"
            :validate="{ gte: 0, lte: 100 }"
          />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.actualPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>Đơn giá</div>
      <div style="width: 100%">
        <InputMoney
          :value="ticketProcedure.actualPrice"
          @update:value="handleChangeUnitActualPrice"
        />
      </div>
    </div>

    <div class="grow basis-[90%] flex justify-center">
      <VueButton color="blue" type="submit" icon="plus">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
