<script setup lang="ts">
import { InputMoney, InputNumber, InputOptions } from '@/common/vue-form'
import { Distributor, DistributorService, useDistributorStore } from '@/modules/distributor'
import { Receipt, ReceiptItem, ReceiptService } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { SaveOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalDistributorUpsert from '../../distributor/upsert/ModalDistributorUpsert.vue'
import ModalReceiptUpsertSettingScreen from './ModalReceiptUpsertSettingScreen.vue'
import ReceiptItemCreate from './ReceiptItemCreate.vue'
import ReceiptItemTable from './ReceiptItemTable.vue'
import { receipt } from './receipt-upsert.store'
import { DiscountType } from '@/modules/enum'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()

const modalReceiptUpsertSettingScreen = ref<InstanceType<typeof ModalReceiptUpsertSettingScreen>>()

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()
const inputSearchDistributor = ref<InstanceType<typeof InputOptions>>()

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

const router = useRouter()
const route = useRoute()

const distributorStore = useDistributorStore()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const mode = ref<'CREATE' | 'UPDATE' | 'COPY'>('CREATE')

const distributor = ref<Distributor>(Distributor.blank())
const distributorList = ref<Distributor[]>([])

const time = ref<Dayjs>(dayjs())

const saveLoading = ref(false)

onBeforeMount(async () => {
  const receiptId = Number(route.params.id)
  const distributorId = Number(route.query.distributor_id)
  if (route.query.mode) {
    mode.value = route.query.mode as any
  }
  if (receiptId) {
    const receiptResponse = await ReceiptService.detail(receiptId, {
      relation: {
        distributor: true,
        receiptItems: true,
      },
    })

    receipt.value = receiptResponse
    distributor.value = Distributor.fromInstance(receiptResponse.distributor)
    if (mode.value === 'CREATE' || mode.value === 'COPY') {
      time.value = dayjs(new Date())
    } else if (mode.value === 'UPDATE') {
      time.value = dayjs(new Date(receipt.value.time))
    }
  } else if (distributorId) {
    const distributorRes = await DistributorService.getOne(distributorId)
    distributor.value = distributorRes
    receipt.value.distributor = distributorRes
    receipt.value.distributorId = distributorId
  }
})

onMounted(async () => {
  window.addEventListener('keydown', handleDocumentKeyup)
  await distributorStore.fetchAll()
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  receipt.value = Receipt.blank()
})

const searchingDistributor = async (text: string) => {
  distributor.value.id = 0
  if (text) {
    distributorList.value = distributorStore.search(text)
  } else {
    distributorList.value = []
  }
}

const selectDistributor = (data?: Distributor) => {
  const snapDistributor = Distributor.fromInstance(data || Distributor.blank())
  distributor.value = snapDistributor
  receipt.value.distributorId = snapDistributor.id!
  receipt.value.distributor = snapDistributor
}

const handleChangeReceiptDiscountMoney = (data: number) => {
  receipt.value.discountMoney = data
  receipt.value.discountType = DiscountType.VND
}
const handleChangeReceiptDiscountPercent = (data: number) => {
  receipt.value.discountPercent = data
  receipt.value.discountType = DiscountType.Percent
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
    receipt.value.time = time.value.valueOf()
    let response: { receiptId: number }
    if (mode.value === 'CREATE') {
      response = await ReceiptService.createDraft(receipt.value)
    } else if (mode.value === 'UPDATE') {
      response = await ReceiptService.updateDraft(receipt.value.id, receipt.value)
    } else if (mode.value === 'COPY') {
      response = await ReceiptService.createDraft(receipt.value)
    }
    router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
  } catch (error) {
    console.log('🚀 ~ saveReceipt ~ error:', error)
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
    modalReceiptUpsertSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalDistributorUpsert
    ref="modalDistributorUpsert"
    @success="selectDistributor"
  />
  <ModalReceiptUpsertSettingScreen ref="modalReceiptUpsertSettingScreen" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ShopOutlined />
        <span>
          {{ mode == 'UPDATE' ? ' Cập nhật phiếu nhập hàng' : ' Tạo phiếu nhập hàng mới' }}
        </span>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span>
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

  <div class="mt-4 md:mx-4">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="md:w-2/3">
        <div class="bg-white p-4">
          <ReceiptItemCreate @add_receipt_item="handleAddReceiptItem" />
        </div>
        <div class="mt-4 bg-white p-4">
          <ReceiptItemTable />
        </div>
      </div>
      <div class="md:w-1/3">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>Tên NCC (nợ cũ: <b>{{ formatMoney(distributor.debt) }}</b>)</span>
            <a @click="modalDistributorUpsert?.openModal()">Thêm NCC mới</a>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputSearchDistributor"
              v-model:searchText="distributor.fullName"
              :options="distributorList"
              :maxHeight="260"
              placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              :disabled="mode !== 'CREATE'"
              @selectItem="selectDistributor"
              @update:searchText="searchingDistributor"
            >
              <template #each="{ item: { fullName, phone, address } }">
                <div>
                  <b>{{ fullName }}</b> - {{ phone }}
                </div>
                <div>{{ address }}</div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div class="mt-4 p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div
            class="px-4 pb-4"
            style="border: 1px solid #cdcdcd"
          >
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr>
                  <td>Thời gian</td>
                  <td>
                    <a-date-picker
                      v-model:value="time"
                      show-time
                      placeholder="Select Time"
                      :format="'DD/MM/YYYY HH:mm:ss'"
                      style="width: 100%"
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    class="font-bold"
                    style="width: 120px"
                  >
                    Tiền hàng
                  </td>
                  <td
                    class="text-right"
                    style="padding-right: 11px"
                  >
                    {{ formatMoney(receipt.itemsActualMoney) }}
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_RECEIPT_UPSERT.paymentInfo.discount">
                  <td>Chiết khấu</td>
                  <td
                    class="cursor-pointer"
                    style="font-size: 16px"
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
                          Chiết khấu (Tiền hàng: <b>{{ formatMoney(receipt.itemsActualMoney) }}</b>)
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney
                              :value="receipt.discountMoney"
                              append="VNĐ"
                              style="width: 100%"
                              @update:value="handleChangeReceiptDiscountMoney"
                            />
                          </div>
                          <div class="mt-2">
                            <InputNumber
                              :value="receipt.discountPercent"
                              append="%"
                              @update:value="handleChangeReceiptDiscountPercent"
                            />
                          </div>
                        </div>
                      </template>
                      <div class="flex">
                        <div>
                          <a-tag color="success">
                            {{ receipt.discountPercent || 0 }}%
                          </a-tag>
                        </div>
                        <div
                          class="flex-1 text-right"
                          style="padding-right: 11px; border-bottom: 1px solid #cdcdcd"
                        >
                          {{ formatMoney(receipt.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_RECEIPT_UPSERT.paymentInfo.surcharge">
                  <td>Phụ phí</td>
                  <td>
                    <InputMoney
                      v-model:value="receipt.surcharge"
                      class="input-payment"
                    />
                  </td>
                </tr>
                <tr>
                  <td />
                  <td />
                </tr>
                <tr>
                  <td class="font-bold">
                    Tổng tiền
                  </td>
                  <td
                    class="text-right font-bold"
                    style="padding-right: 11px; font-size: 16px"
                  >
                    {{ formatMoney(receipt.revenue) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4">
          <a-button
            type="primary"
            :loading="saveLoading"
            size="large"
            block
            @click="saveReceipt"
          >
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

<style lang="scss" scoped>
:deep(.ant-tabs-tab) {
  border-top: 5px solid #d6d6d6 !important;

  &.ant-tabs-tab-active {
    border-top-color: #1890ff !important;
  }
}

.table-payment {
  td {
    padding: 6px 0;
  }
}

:deep(.input-payment) {
  width: 100%;
  border-top: none;
  border-left: none;
  border-right: none;
  box-shadow: none !important;

  .ant-input-number-handler-wrap {
    display: none !important;
  }

  & input {
    text-align: right !important;
  }
}
</style>
