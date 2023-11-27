<script setup lang="ts">
import { DiscountType } from '@/modules/enum'
import { InvoiceItemType } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { invoice } from './invoice-upsert.store'
import { InputMoney, InputNumber } from '@/common/vue-form'

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const handleChangeInvoiceItemDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / invoice.value.invoiceItems[index].unit.rate
  const expectedPrice = invoice.value.invoiceItems[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems[index].discountMoney = discountMoney
  invoice.value.invoiceItems[index].discountPercent = discountPercent
  invoice.value.invoiceItems[index].actualPrice = actualPrice
  invoice.value.invoiceItems[index].discountType = DiscountType.VND
}

const handleChangeInvoiceItemDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = invoice.value.invoiceItems[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems[index].discountPercent = discountPercent
  invoice.value.invoiceItems[index].discountMoney = discountMoney
  invoice.value.invoiceItems[index].actualPrice = actualPrice
  invoice.value.invoiceItems[index].discountType = DiscountType.Percent
}

const handleChangeInvoiceItemHintUsage = (data: string, index: number) => {
  invoice.value.invoiceItems[index].hintUsage = data
}
</script>

<template>
  <div class="py-4">
    <div class="px-4">
      Danh sách sản phẩm trong phiếu
    </div>
    <div
      v-if="isMobile"
      class="mt-2"
    >
      <table class="table-mobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>TT</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoice.invoiceItems.length === 0">
            <td
              colspan="20"
              class="text-center"
            >
              Không có dữ liệu
            </td>
          </tr>
          <tr
            v-for="(invoiceItem, index) in invoice.invoiceItems || []"
            :key="index"
          >
            <td
              class="text-center whitespace-nowrap"
              style="padding: 0.5rem 0.2rem"
            >
              {{ index + 1 }}
            </td>
            <td>
              <div v-if="invoiceItem.type === InvoiceItemType.ProductBatch">
                <div class="font-medium text-justify">
                  {{ invoiceItem.productBatch?.product?.brandName }}
                  <a
                    v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
                <div
                  v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                  style="font-size: 0.8rem"
                  class="text-justify"
                >
                  {{ invoiceItem.productBatch?.product?.substance }}
                </div>
                <div
                  class="flex gap-2 flex-wrap"
                  style="font-size: 0.8rem"
                >
                  <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch">
                    Lô: {{ invoiceItem.productBatch.batch }}
                  </div>
                  <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expiryDate">
                    HSD: {{ timeToText(invoiceItem.productBatch.expiryDate, 'DD/MM/YY') }}
                  </div>
                </div>
                <div
                  v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                  style="font-size: 0.8rem"
                  class="flex gap-2"
                  contenteditable="true"
                  @input="(e) => handleChangeInvoiceItemHintUsage((e.target as HTMLElement)?.innerText, index)"
                >
                  {{ invoiceItem.hintUsage }}
                </div>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure">
                <div class="font-medium text-justify">
                  {{ invoiceItem.procedure?.name }}
                  <a
                    v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div
                class="flex gap-2"
                style="font-size: 0.8rem"
              >
                <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}
                  </span>
                  <span v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">
                    /{{ invoiceItem.unit.name }}
                  </span>
                </div>
                <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">
                  - CK:
                  <a-popconfirm>
                    <template #cancelButton>
                      <div />
                    </template>
                    <template #okButton>
                      <div />
                    </template>
                    <template #title>
                      <div>
                        Chiết khấu (Tiền hàng:
                        <b>{{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}</b>)
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney
                            :value="invoiceItem.discountMoney * invoiceItem.unit.rate"
                            :append="'VNĐ'"
                            @update:value="(e: number) => handleChangeInvoiceItemDiscountMoney(e, index)"
                          />
                        </div>
                        <div class="mt-2">
                          <InputNumber
                            :value="invoiceItem.discountPercent"
                            append="%"
                            @update:value="(e: number) => handleChangeInvoiceItemDiscountPercent(e, index)"
                          />
                        </div>
                      </div>
                    </template>
                    <a-tag
                      v-if="invoiceItem.discountType === 'VNĐ'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px"
                    >
                      {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
                    </a-tag>
                    <a-tag
                      v-if="invoiceItem.discountType === '%'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px"
                    >
                      {{ invoiceItem.discountPercent || 0 }}%
                    </a-tag>
                  </a-popconfirm>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.actualPrice * invoiceItem.unit.rate) }}
                  </span>
                  <span v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">
                    /{{ invoiceItem.unit.name }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              <div class="item-quantity">
                <div
                  class="item-quantity-up"
                  @click="invoice.invoiceItems[index].quantity += invoiceItem.unit.rate"
                >
                  <font-awesome-icon
                    :icon="['fas', 'sort-up']"
                    style="opacity: 0.3"
                  />
                </div>
                <div
                  class="item-quantity-down"
                  @click="invoice.invoiceItems[index].quantity -= invoiceItem.unit.rate"
                >
                  <font-awesome-icon
                    :icon="['fas', 'sort-down']"
                    style="opacity: 0.3"
                  />
                </div>
                {{ invoiceItem.quantity / invoiceItem.unit.rate }}
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
            <td class="text-center">
              <a
                class="text-red-500"
                @click="invoice.invoiceItems.splice(index, 1)"
              >
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td
              colspan="2"
              class="text-right"
            >
              Tổng tiền hàng:
            </td>
            <td
              colspan="2"
              class="text-right"
            >
              {{ formatMoney(invoice.itemsActualMoney) }}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-else
      class="table-wrapper mt-2 mx-4"
    >
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th style="width: 120px">
              Số lượng
            </th>
            <th v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">
              Đơn vị
            </th>
            <th v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">
              Chiết khấu
            </th>
            <th>Đơn giá</th>
            <th>Tổng tiền</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoice.invoiceItems.length == 0">
            <td
              colspan="20"
              class="text-center"
            >
              No data
            </td>
          </tr>
          <tr
            v-for="(invoiceItem, index) in invoice.invoiceItems"
            :key="index"
          >
            <td>{{ index + 1 }}</td>
            <td>
              <div v-if="invoiceItem.type === InvoiceItemType.ProductBatch">
                <div
                  style="font-weight: 500"
                  class="text-justify"
                >
                  {{ invoiceItem.productBatch?.product?.brandName }}
                </div>
                <div
                  v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                  class="text-justify"
                  style="font-size: 0.8rem"
                >
                  {{ invoiceItem.productBatch?.product?.substance }}
                </div>
                <div
                  style="font-size: 0.8rem"
                  class="flex gap-2"
                >
                  <span v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch">
                    Lô {{ invoiceItem.productBatch?.batch }}
                  </span>
                  <span v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expiryDate">
                    - HSD {{ timeToText(invoiceItem.productBatch?.expiryDate) }}
                  </span>
                </div>
                <div
                  v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                  contenteditable="true"
                  style="font-size: 0.8rem"
                  @input="(e) => handleChangeInvoiceItemHintUsage((e.target as HTMLElement)?.innerText, index)"
                >
                  {{ invoiceItem.hintUsage }}
                </div>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure">
                <div style="font-weight: 500">
                  {{ invoiceItem.procedure.name }}
                </div>
              </div>
            </td>
            <td>
              <div class="w-full">
                <InputNumber
                  :value="invoiceItem.quantity / invoiceItem.unit.rate"
                  @update:value="(e: number) => (invoice.invoiceItems[index].quantity = e * invoiceItem.unit.rate)"
                />
              </div>
            </td>
            <td
              v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit"
              class="text-center"
            >
              {{ invoiceItem.unit?.name || 'Lần' }}
            </td>
            <td
              v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
              class="text-center"
            >
              <a-popconfirm>
                <template #cancelButton>
                  <div />
                </template>
                <template #okButton>
                  <div />
                </template>
                <template #title>
                  <div>
                    Chiết khấu (Tiền hàng: <b>{{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}</b>)
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputMoney
                        :value="invoiceItem.discountMoney * invoiceItem.unit.rate"
                        append="VNĐ"
                        @update:value="(e: number) => handleChangeInvoiceItemDiscountMoney(e, index)"
                      />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="invoiceItem.discountPercent"
                          append="%"
                          @update:value="(e: number) => handleChangeInvoiceItemDiscountPercent(e, index)"
                        />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="invoiceItem.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer"
                >
                  {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
                </a-tag>
                <a-tag
                  v-if="invoiceItem.discountType === '%'"
                  color="success"
                  style="cursor: pointer"
                >
                  {{ invoiceItem.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right">
              <div
                v-if="invoiceItem.discountMoney"
                class="text-xs italic text-red-500"
              >
                <del>{{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}</del>
              </div>
              <div>{{ formatMoney(invoiceItem.actualPrice * invoiceItem.unit.rate) }}</div>
            </td>
            <td class="text-right">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
            <td class="text-center">
              <a
                class="text-red-500 text-xl"
                @click="invoice.invoiceItems.splice(index, 1)"
              >
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td
              colspan="100"
              class="text-right"
            >
              <span class="mr-10">Tổng tiền hàng:</span>
              <span class="mr-20"> {{ formatMoney(invoice.itemsActualMoney) }} </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-quantity {
  position: relative;
  line-height: 2rem;

  .item-quantity-text {
    width: 2rem;
    padding: 0.5rem 0;
    display: flex;
    justify-content: center;
    font-size: 1.1rem;
    line-height: 2rem;
  }

  .item-quantity-up {
    position: absolute;
    font-size: 1.2rem;
    line-height: 0.1rem;
    top: -15%;
    left: 50%;
    transform: translate(-50%, 0%);
  }

  .item-quantity-down {
    position: absolute;
    font-size: 1.2rem;
    line-height: 0.1rem;
    top: 115%;
    left: 50%;
    transform: translate(-50%, -100%);
  }
}
</style>
