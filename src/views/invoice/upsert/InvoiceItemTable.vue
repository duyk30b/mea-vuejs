<script setup lang="ts">
import { DiscountType } from '@/modules/enum'
import { InvoiceItemType } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { invoice } from './invoice-upsert.store'
import { InputMoney } from '@/common/vue-form'

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const isMobile = window.innerWidth < 768

const handleChangeInvoiceItemDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / invoice.value.invoiceItems[index].unit.rate
  const expectedPrice = invoice.value.invoiceItems[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor(discountMoney * 100 / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems[index].discountMoney = discountMoney
  invoice.value.invoiceItems[index].discountPercent = discountPercent
  invoice.value.invoiceItems[index].actualPrice = actualPrice
  invoice.value.invoiceItems[index].discountType = DiscountType.VND
}

const handleChangeInvoiceItemDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = invoice.value.invoiceItems[index].expectedPrice || 0
  const discountMoney = Math.floor(discountPercent * expectedPrice / 100)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems[index].discountPercent = discountPercent
  invoice.value.invoiceItems[index].discountMoney = discountMoney
  invoice.value.invoiceItems[index].actualPrice = actualPrice
  invoice.value.invoiceItems[index].discountType = DiscountType.Percent
}
</script>

<template>
  <div class="py-2">
    <div class="px-4">Danh sách sản phẩm trong phiếu</div>
    <div v-if="isMobile" class="mt-2">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>TT</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoice.invoiceItems.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(invoiceItem, index) in (invoice.invoiceItems || [])" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem;">{{ index + 1 }}</td>
            <td>
              <div v-if="invoiceItem.type === InvoiceItemType.ProductBatch">
                <div class="font-medium text-justify">
                  {{ invoiceItem.productBatch?.product?.brandName }}
                  <a v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail" class="ml-1">
                    <FileSearchOutlined />
                  </a>
                </div>
                <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance" style="font-size: 0.8rem;"
                  class="text-justify">
                  {{ invoiceItem.productBatch?.product?.substance }}
                </div>
                <div class="flex gap-2 flex-wrap" style="font-size: 0.8rem;">
                  <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch">
                    Lô: {{ invoiceItem.productBatch.batch }}
                  </div>
                  <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expiryDate">
                    HSD: {{ timeToText(invoiceItem.productBatch.expiryDate, 'DD/MM/YY') }}
                  </div>
                </div>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure">
                <div class="font-medium text-justify">
                  {{ invoiceItem.procedure?.name }}
                  <a v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail" class="ml-1">
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem;">
                <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">NY:
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
                      <div></div>
                    </template>
                    <template #okButton>
                      <div></div>
                    </template>
                    <template #title>
                      <div>Chiết khấu (Tiền hàng:
                        <b>{{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}</b>)
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney :value="invoiceItem.discountMoney * invoiceItem.unit.rate"
                            @update:value="(e: number) => handleChangeInvoiceItemDiscountMoney(e, index)"
                            style="width: 100%;" :append="'VNĐ'" />
                        </div>
                        <div class="mt-2">
                          <a-input-number :value="invoiceItem.discountPercent"
                            @change="(e: number) => handleChangeInvoiceItemDiscountPercent(e, index)" addon-after="%"
                            :min="0" :max="100" style="width: 100%;"></a-input-number>
                        </div>
                      </div>
                    </template>
                    <a-tag v-if="invoiceItem.discountType === 'VNĐ'" color="success"
                      style="cursor: pointer; margin-top: -10px;">
                      {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
                    </a-tag>
                    <a-tag v-if="invoiceItem.discountType === '%'" color="success"
                      style="cursor: pointer; margin-top: -10px">
                      {{ invoiceItem.discountPercent || 0 }}%
                    </a-tag>
                  </a-popconfirm>
                </div>
                <div>- ĐG:
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
                <div class="item-quantity-up" @click="invoice.invoiceItems[index].quantity += invoiceItem.unit.rate">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.3;" />
                </div>
                <div class="item-quantity-down" @click="invoice.invoiceItems[index].quantity -= invoiceItem.unit.rate">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.3;" />
                </div>
                {{ invoiceItem.quantity / invoiceItem.unit.rate }}
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
            <td class="text-center">
              <a @click="invoice.invoiceItems.splice(index, 1)" class="text-red-500">
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="2" class="text-right"> Tổng tiền hàng: </td>
            <td colspan="2" class="text-right">
              {{ formatMoney(invoice.totalItemMoney) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="table-wrapper mt-2">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expiryDate">HSD</th>
            <th style="width: 120px;">Số lượng</th>
            <th v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">Đơn vị</th>
            <th v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">Chiết khấu</th>
            <th>Đơn giá</th>
            <th>Tổng tiền</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoice.invoiceItems.length == 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ii, index) in invoice.invoiceItems" :key="index">
            <td class="index"></td>
            <td v-if="ii.type === InvoiceItemType.ProductBatch">
              <div style="font-weight: 500;" class="text-justify">{{ ii.productBatch?.product?.brandName }}</div>
              <div v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance" class="text-justify">
                {{ ii.productBatch?.product?.substance }}
              </div>
            </td>
            <td v-if="ii.type === InvoiceItemType.Procedure">
              <div style="font-weight: 500;">{{ ii.procedure.name }}</div>
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expiryDate" class="text-center">
              {{ timeToText(ii.productBatch?.expiryDate) }}
            </td>
            <td>
              <a-input-number :value="ii.quantity / ii.unit.rate"
                @update:value="(e: number) => invoice.invoiceItems[index].quantity = e * ii.unit.rate" class="w-full"
                :min="0" />
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit" class="text-center">
              {{ ii.unit?.name || 'Lần' }}
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount" class="text-center">
              <a-popconfirm>
                <template #cancelButton>
                  <div></div>
                </template>
                <template #okButton>
                  <div></div>
                </template>
                <template #title>
                  <div>Chiết khấu (Tiền hàng: <b>{{ formatMoney(ii.expectedPrice * ii.unit.rate) }}</b>)</div>
                  <div class="mt-2">
                    <div>
                      <InputMoney :value="ii.discountMoney * ii.unit.rate"
                        @update:value="(e: number) => handleChangeInvoiceItemDiscountMoney(e, index)" addon-after="VNĐ"
                        style="width: 100%;" />
                    </div>
                    <div class="mt-2">
                      <a-input-number :value="ii.discountPercent"
                        @change="(e: number) => handleChangeInvoiceItemDiscountPercent(e, index)" addon-after="%" :min="0"
                        :max="100" style="width: 100%;"></a-input-number>
                    </div>
                  </div>
                </template>
                <a-tag v-if="ii.discountType === 'VNĐ'" color="success" style="cursor: pointer;">
                  {{ formatMoney(ii.discountMoney * ii.unit.rate) }}
                </a-tag>
                <a-tag v-if="ii.discountType === '%'" color="success" style="cursor: pointer;">
                  {{ ii.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right">
              <div v-if="ii.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ii.expectedPrice * ii.unit.rate) }}</del>
              </div>
              <div>{{ formatMoney(ii.actualPrice * ii.unit.rate) }}</div>
            </td>
            <td class="text-right">{{ formatMoney(ii.actualPrice * ii.quantity) }} </td>
            <td class="text-center">
              <a @click="invoice.invoiceItems.splice(index, 1)" class="text-red-500 text-xl">
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="100" class="text-right">
              <span class="mr-10">Tổng tiền hàng:</span>
              <span class="mr-20"> {{ formatMoney(invoice.totalItemMoney) }} </span>
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
