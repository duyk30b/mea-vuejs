<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputOptions } from '@/common/vue-form'
import { Distributor, DistributorService } from '@/modules/distributor'
import { DiscountType, PaymentStatus } from '@/modules/enum'
import type { Product } from '@/modules/product'
import { PurchaseReceiptService } from '@/modules/purchase'
import { Receipt, ReceiptItem, ReceiptService } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import { DeleteOutlined, FileSearchOutlined, SaveOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onBeforeMount, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalDistributorUpsert from '../../distributor/components/ModalDistributorUpsert.vue'
import ModalProductDetails from '../../product/details/ModalProductDetails.vue'
import ModalPurchaseReceiptUpsertSettingScreen from './ModalPurchaseReceiptUpsertSettingScreen.vue'
import PurchaseReceiptItemCreate from './PurchaseReceiptItemCreate.vue'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()
const modalProductDetails = ref<InstanceType<typeof ModalProductDetails>>()
const modalPurchaseReceiptUpsertSettingScreen = ref<InstanceType<typeof ModalPurchaseReceiptUpsertSettingScreen>>()

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()
const inputSearchDistributor = ref<InstanceType<typeof InputOptions>>()

const mode = ref<'CREATE' | 'UPDATE' | 'CREATE_AFTER_REFUND'>('CREATE')

const router = useRouter()
const route = useRoute()
const organizationStore = useOrganizationStore()

const receipt = ref<Receipt>(Receipt.blank())

const distributor = ref<Distributor>(Distributor.blank())
const distributors = ref<Distributor[]>([])

const saveLoading = ref(false)

onBeforeMount(async () => {
  const receiptId = Number(route.params.id)
  const distributorId = Number(route.query.distributor_id)
  if (receiptId) {
    const receiptResponse = await ReceiptService.getOne(receiptId, {
      distributor: true,
      receiptItems: true,
    })

    receipt.value = receiptResponse
    distributor.value = Distributor.fromInstance(receiptResponse.distributor || Distributor.blank())

    if (receiptResponse.paymentStatus === PaymentStatus.Unpaid) {
      mode.value = 'UPDATE'
    }
    if (receiptResponse.paymentStatus === PaymentStatus.Refund) {
      mode.value = 'CREATE_AFTER_REFUND'
    }
  }
  else if (distributorId) {
    const distributorRes = await DistributorService.getOne(distributorId)
    distributor.value = distributorRes
    receipt.value.distributor = distributorRes
    receipt.value.distributorId = distributorId
  }
})

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    inputSearchProduct.value?.focus()
  }
  if (e.key === 'F4') {
    e.preventDefault()
    inputSearchDistributor.value?.focus()
  }
}
onMounted(() => {
  window.addEventListener('keydown', handleDocumentKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

watchEffect(() => {
  const totalItemMoney = receipt.value.receiptItems.reduce((acc, item) => acc + (item.productBatch?.costPrice || 0) * item.quantity, 0)

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (receipt.value.discountType === DiscountType.VND) {
    discountMoney = receipt.value.discountMoney || 0
    discountPercent = totalItemMoney == 0 ? 0 : Math.floor(discountMoney * 100 / totalItemMoney)
    discountType = DiscountType.VND
  }
  if (receipt.value.discountType === DiscountType.Percent) {
    discountPercent = receipt.value.discountPercent || 0
    discountMoney = Math.floor(totalItemMoney * discountPercent / 100)
    discountType = DiscountType.Percent
  }
  const surcharge = receipt.value.surcharge || 0
  const debt = receipt.value.debt || 0
  const totalMoney = totalItemMoney - discountMoney + surcharge

  receipt.value.totalItemMoney = totalItemMoney
  receipt.value.discountMoney = discountMoney
  receipt.value.discountPercent = discountPercent
  receipt.value.discountType = discountType
  receipt.value.surcharge = surcharge
  receipt.value.totalMoney = totalMoney
  receipt.value.debt = debt
})

const searchingDistributor = async (text: string) => {
  distributors.value = []
  const data = await DistributorService.search(text)
  if (data && text) {
    distributors.value = data
  }
}

const selectDistributor = (p: Distributor) => {
  distributor.value = p
  receipt.value.distributorId = p.id!
  receipt.value.distributor = p
}

const saveReceipt = async () => {
  if (!distributor.value.id) {
    message.error('Lỗi: chưa chọn nhà cung cấp')
    inputSearchDistributor.value?.focus()
    return
  }
  if (receipt.value.receiptItems.length == 0) {
    return message.error('Lỗi: cần có ít nhất 1 thuốc trong phiếu')
  }
  const invalidReceiptItem = receipt.value.receiptItems.find((ri) => ri.quantity === 0)
  if (invalidReceiptItem) {
    return message.error(`Lỗi: sản phẩm ${invalidReceiptItem.productBatch.product?.brandName} có số lượng 0`)
  }

  try {
    saveLoading.value = true
    let response: { success: boolean, message: string, data: { receiptId: number, purchaseId: number }, }
    if (mode.value === 'CREATE') {
      response = await PurchaseReceiptService.createReceiptDraft(receipt.value)
    } else if (mode.value === 'UPDATE') {
      response = await PurchaseReceiptService.updateReceiptDraft(receipt.value.id, receipt.value)
    } else {
      response = await PurchaseReceiptService.createReceiptDraftAfterRefund(receipt.value.purchaseId, receipt.value)
    }

    if (response.success) {
      router.push({ name: 'PurchaseReceiptDetails', params: { id: response.data.purchaseId } })
    } else {
      AlertStore.add({ type: 'error', message: response.message })
    }
  } catch (error) {
    console.log('🚀 ~ file: PurchaseOrderNew.vue:123 ~ saveReceipt ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleAddReceiptItem = (ri: ReceiptItem) => {
  const receiptItem = ReceiptItem.fromObject(ri)
  receipt.value.receiptItems.push(receiptItem)
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalPurchaseReceiptUpsertSettingScreen.value?.openModal()
  }
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetails.value?.openModal(product)
}

</script>

<template>
  <ModalDistributorUpsert ref="modalDistributorUpsert" @success="selectDistributor" />
  <ModalPurchaseReceiptUpsertSettingScreen ref="modalPurchaseReceiptUpsertSettingScreen" />
  <ModalProductDetails ref="modalProductDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <ShopOutlined style="margin-right: 10px" />
        {{ receipt.id ? 'Cập nhật phiếu nhập hàng' : 'Tạo phiếu nhập hàng mới' }}
      </div>
      <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
            <SettingOutlined />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting">
                Cài đặt hiển thị
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>

  <div class="mt-4 mx-4">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="md:w-2/3 ">
        <div class="bg-white p-4">
          <PurchaseReceiptItemCreate @add_receipt_item="handleAddReceiptItem" />
        </div>

        <div class="mt-4 bg-white p-4">
          <div>Danh sách hàng trong phiếu</div>
          <div class="table-wrapper mt-2">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên hàng</th>
                  <th v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.batch">Lô</th>
                  <th v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.expiryDate">HSD</th>
                  <th>Số lượng</th>
                  <th v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.unit">Đơn vị</th>
                  <th>Giá nhập</th>
                  <th>Tổng tiền</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="receipt.receiptItems.length === 0">
                  <td colspan="20" class="text-center">No data</td>
                </tr>
                <tr v-for="(ri, index) in receipt.receiptItems" :key="index">
                  <td class="index"></td>
                  <td style="min-width: 150px;">
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="font-bold"> {{ ri.productBatch?.product?.brandName }} </div>
                        <div v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.substance">
                          {{ ri.productBatch?.product?.substance }}
                        </div>
                      </div>
                      <a v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.detail"
                        class="text-xl ml-2" @click="openModalProductDetail(ri.productBatch?.product)">
                        <FileSearchOutlined />
                      </a>
                    </div>
                  </td>
                  <td v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.batch">
                    {{ ri.productBatch?.batch }}
                  </td>
                  <td v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.expiryDate"
                    class="text-center">
                    {{ timeToText(ri.productBatch?.expiryDate) }}
                  </td>
                  <td class="text-center" style="min-width: 100px;">
                    <a-input-number :value="receipt.receiptItems[index].quantity / receipt.receiptItems[index].unit.rate"
                      @update:value="(e: any) => receipt.receiptItems[index].quantity = e * receipt.receiptItems[index].unit.rate"
                      class="w-full" :min="0" />
                  </td>
                  <td v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemsTable.unit" class="text-center">
                    {{ ri.unit.name }}
                  </td>
                  <td class="text-right"> {{ formatNumber(ri.productBatch?.costPrice * ri.unit.rate) }} </td>
                  <td class="text-right">{{ formatNumber(ri.productBatch?.costPrice * ri.quantity) }}</td>
                  <td class="text-center">
                    <a @click="receipt.receiptItems.splice(index, 1)" class="text-red-500 text-xl">
                      <DeleteOutlined />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colspan="100" class="text-right">
                    <span class="mr-10">Tổng tiền hàng:</span>
                    <span class="mr-20"> {{ formatNumber(receipt.totalItemMoney) }} </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="md:w-1/3">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>Tên nhà cung cấp (nợ cũ: <b>{{ formatNumber(distributor.debt) }}</b>)</span>
            <a @click="modalDistributorUpsert?.openModal()">Thêm NCC mới</a>
          </div>
          <InputOptions ref="inputSearchDistributor" :options="distributors" v-model:searchText="distributor.fullNameVi"
            @selectItem="selectDistributor" :maxHeight="260" @update:searchText="searchingDistributor"
            placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại" :disabled="mode !== 'CREATE'">
            <template v-slot:each="{ item: { fullNameVi, phone, address } }">
              <div> <b>{{ fullNameVi }}</b> - {{ phone }} </div>
              <div> {{ address }} </div>
            </template>
          </InputOptions>
        </div>

        <div class="mt-4   p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd;">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr>
                  <td class="font-bold" style="width: 120px;">Tiền hàng</td>
                  <td class="text-right" style="padding-right: 11px;">
                    {{ formatNumber(receipt.totalItemMoney, 0) }}
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.paymentInfo.discount">
                  <td>Giảm giá</td>
                  <td style="padding-right: 11px;">
                    <div class="flex gap-2">
                      <a-input-group compact>
                        <a-input-number v-if="receipt.discountType == '%'" style="width: 100px;"
                          v-model:value="receipt.discountPercent" :min="0" :max="100" />
                        <a-input-number v-if="receipt.discountType == 'VNĐ'" v-model:value="receipt.discountMoney"
                          step="1000" style="width: 100px;" :min="0"
                          :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                          :parser="(value: any) => value.replace(/(,*)/g, '')" />
                        <a-select v-model:value="receipt.discountType" style="min-width: 70px;">
                          <a-select-option value="%">%</a-select-option>
                          <a-select-option value="VNĐ">VNĐ</a-select-option>
                        </a-select>
                      </a-input-group>
                      {{ formatNumber(receipt.discountMoney, 0) }}
                    </div>
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.paymentInfo.surcharge">
                  <td>Phụ phí</td>
                  <td>
                    <a-input-number v-model:value="receipt.surcharge" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
                  </td>
                </tr>
                <tr>
                  <td class="font-bold">Tổng tiền</td>
                  <td class="text-right font-bold" style="padding-right: 11px;">
                    {{ formatNumber(receipt.totalMoney, 0) }}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Thanh toán</td>
                  <td>
                    <a-input-number :value="receipt.totalMoney - receipt.debt"
                      @change="(e: number) => receipt.debt = receipt.totalMoney - e" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
                  </td>
                </tr>
                <tr>
                  <td>Ghi nợ</td>
                  <td>
                    <a-input-number v-model:value="receipt.debt" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4">
          <a-button @click="saveReceipt" type="primary" :loading="saveLoading" size="large" block>
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.table-payment {
  td {
    padding: 6px 0;
  }
}

.input-payment {
  text-align: right;
  width: 100%;
  border-top: none;
  border-left: none;
  border-right: none;
  box-shadow: none;

  .ant-input-number-handler-wrap {
    display: none !important;
  }

  & input {
    text-align: right !important;
  }
}
</style>
