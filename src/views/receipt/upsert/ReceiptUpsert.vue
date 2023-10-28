<script setup lang="ts">
import { SaveOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Distributor, DistributorApi, useDistributorStore } from '../../../modules/distributor'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { useProductStore } from '../../../modules/product'
import { Receipt, ReceiptApi, ReceiptStatus, useReceiptStore } from '../../../modules/receipt'
import { ReceiptItem } from '../../../modules/receipt-item/receipt-item.model'
import ModalDistributorUpsert from '../../distributor/upsert/ModalDistributorUpsert.vue'
import ModalReceiptUpsertSettingScreen from './ModalReceiptUpsertSettingScreen.vue'
import ReceiptItemCreate from './ReceiptItemCreate.vue'
import ReceiptItemTable from './ReceiptItemTable.vue'
import { EReceiptSave, EReceiptUpsertMode, receipt } from './receipt-upsert.store'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()

const modalReceiptUpsertSettingScreen = ref<InstanceType<typeof ModalReceiptUpsertSettingScreen>>()
const receiptUpsertForm = ref<InstanceType<typeof HTMLFormElement>>()

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

const productStore = useProductStore()
const receiptStore = useReceiptStore()
const distributorStore = useDistributorStore()
const screenStore = useScreenStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney } = screenStore

const mode = ref<EReceiptUpsertMode>(EReceiptUpsertMode.CREATE)

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
    const receiptResponse = await ReceiptApi.detail(receiptId, {
      relation: {
        distributor: true,
        receiptItems: true,
      },
    })

    receipt.value = receiptResponse
    distributor.value = Distributor.fromInstance(receiptResponse.distributor!)
    if (mode.value === EReceiptUpsertMode.CREATE || mode.value === EReceiptUpsertMode.COPY) {
      time.value = dayjs(new Date())
    } else if (mode.value === EReceiptUpsertMode.UPDATE) {
      time.value = dayjs(new Date(receipt.value.startedAt))
    }
  } else if (distributorId) {
    const distributorRes = await DistributorApi.detail(distributorId)
    distributor.value = distributorRes
    receipt.value.distributor = distributorRes
    receipt.value.distributorId = distributorRes.id
  } else {
    const distributorRes = Distributor.fromPlain(meStore.distributorDefault || Distributor.blank())
    distributor.value = distributorRes
    receipt.value.distributor = distributorRes
    receipt.value.distributorId = distributorRes.id
  }
})

onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
    await distributorStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  receipt.value = Receipt.blank()
})

const searchingDistributor = async (text: string) => {
  distributor.value.id = 0
  if (text) {
    distributorList.value = await distributorStore.search(text)
  } else {
    distributorList.value = []
  }
}

const selectDistributor = (data?: Distributor) => {
  const snapDistributor = data ? Distributor.fromInstance(data) : Distributor.blank()
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

const saveReceipt = async (type: EReceiptSave) => {
  const validForm = receiptUpsertForm.value?.checkValidity()
  if (!validForm) {
    return receiptUpsertForm.value?.reportValidity()
  }
  if (receipt.value.receiptItems!.length == 0) {
    return message.error('Lỗi: cần có ít nhất 1 sản phẩm trong phiếu')
  }
  const invalidReceiptItem = receipt.value.receiptItems!.find((ri) => ri.quantity === 0)
  if (invalidReceiptItem) {
    return message.error(
      `Lỗi: sản phẩm ${invalidReceiptItem!.product!.brandName} có số lượng 0`
    )
  }

  try {
    saveLoading.value = true
    receipt.value.startedAt = time.value.valueOf()

    switch (type) {
      case EReceiptSave.CREATE_DRAFT: {
        const response = await ReceiptApi.createDraft(receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      case EReceiptSave.CREATE_BASIC_AND_DETAIL: {
        const response = await ReceiptApi.createBasic(receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      case EReceiptSave.CREATE_BASIC_AND_NEW: {
        const response = await ReceiptApi.createBasic(receipt.value)

        receipt.value = Receipt.blank()
        const distributorRes = Distributor.fromPlain(meStore.distributorDefault)
        distributor.value = distributorRes
        receipt.value.distributor = distributorRes
        receipt.value.distributorId = distributorRes.id

        AlertStore.add({ type: 'success', message: 'Tạo phiếu thành công', time: 500 })
        await productStore.refreshDB() //update product mới nhất luôn
        break
      }
      case EReceiptSave.UPDATE_DRAFT: {
        const response = await ReceiptApi.updateDraft(receipt.value.id, receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      case EReceiptSave.UPDATE_BASIC: {
        const response = await ReceiptApi.updateBasic(receipt.value.id, receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      default:
        break
    }
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  } finally {
    saveLoading.value = false
  }
}

const handleAddReceiptItem = (ri: ReceiptItem) => {
  const receiptItem = ReceiptItem.clone(ri)
  if (screenStore.SCREEN_RECEIPT_UPSERT.receiptItemsTable.allowDuplicateItem) {
    receipt.value.receiptItems!.unshift(receiptItem)
  } else {
    const exist = receipt.value.receiptItems?.find((i) => {
      return i.batchId === receiptItem.batchId
    })
    if (exist) {
      exist.quantity += ri.quantity
    } else {
      receipt.value.receiptItems!.unshift(receiptItem)
    }
  }
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalReceiptUpsertSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalDistributorUpsert ref="modalDistributorUpsert" @success="selectDistributor" />
  <ModalReceiptUpsertSettingScreen ref="modalReceiptUpsertSettingScreen" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ShopOutlined class="mr-2" />
        <span v-if="mode == EReceiptUpsertMode.CREATE">Tạo phiếu nhập hàng mới</span>
        <span v-if="mode == EReceiptUpsertMode.UPDATE">Cập nhật phiếu nhập hàng</span>
        <span v-if="mode == EReceiptUpsertMode.COPY">Copy phiếu nhập hàng</span>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="mt-4 md:mx-4">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="md:w-2/3">
        <div class="bg-white p-4">
          <ReceiptItemCreate @addReceiptItem="handleAddReceiptItem" />
        </div>
        <div class="mt-4 bg-white p-4">
          <ReceiptItemTable />
        </div>
      </div>
      <form ref="receiptUpsertForm" class="md:w-1/3">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>
              Tên NCC (nợ cũ:
              <b> {{ formatMoney(distributor.debt) }} </b>
              )
            </span>
            <span>
              <a
                v-if="permissionIdMap[PermissionId.DISTRIBUTOR_CREATE]"
                @click="modalDistributorUpsert?.openModal()"
              >
                Thêm NCC mới
              </a>
            </span>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputSearchDistributor"
              v-model:searchText="distributor.fullName"
              :options="distributorList"
              :max-height="260"
              placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              :disabled="mode === EReceiptUpsertMode.UPDATE"
              required
              @select-item="selectDistributor"
              @update:search-text="searchingDistributor"
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
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
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
                <tr v-if="screenStore.SCREEN_RECEIPT_UPSERT.paymentInfo.itemsActualMoney">
                  <td class="font-bold" style="width: 120px">Tiền hàng</td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(receipt.itemsActualMoney) }}
                  </td>
                </tr>
                <tr v-if="screenStore.SCREEN_RECEIPT_UPSERT.paymentInfo.discount">
                  <td>Chiết khấu</td>
                  <td class="cursor-pointer" style="font-size: 16px">
                    <a-popconfirm>
                      <template #cancelButton>
                        <div></div>
                      </template>
                      <template #okButton>
                        <div></div>
                      </template>
                      <template #title>
                        <div>
                          Chiết khấu (Tiền hàng: <b>{{ formatMoney(receipt.itemsActualMoney) }}</b
                          >)
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
                          <a-tag color="success"> {{ receipt.discountPercent || 0 }}% </a-tag>
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
                <tr v-if="screenStore.SCREEN_RECEIPT_UPSERT.paymentInfo.surcharge">
                  <td>Phụ phí</td>
                  <td>
                    <InputMoney v-model:value="receipt.surcharge" class="input-payment" />
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td class="font-bold">Tổng tiền</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(receipt.revenue) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="[EReceiptUpsertMode.CREATE, EReceiptUpsertMode.COPY].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT] &&
              screenStore.SCREEN_RECEIPT_UPSERT.save.createBasicAndNew
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveReceipt(EReceiptSave.CREATE_BASIC_AND_NEW)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu và Tạo phiếu mới
            </a-button>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT] &&
              screenStore.SCREEN_RECEIPT_UPSERT.save.createBasicAndDetail
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveReceipt(EReceiptSave.CREATE_BASIC_AND_DETAIL)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu và Xem chi tiết
            </a-button>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT] &&
              screenStore.SCREEN_RECEIPT_UPSERT.save.createDraft
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveReceipt(EReceiptSave.CREATE_DRAFT)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu nháp
            </a-button>
          </div>
        </template>

        <template v-if="[EReceiptUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_UPDATE_DRAFT] &&
              [ReceiptStatus.Draft].includes(receipt.status)
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveReceipt(EReceiptSave.UPDATE_DRAFT)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Cập nhật phiếu nháp
            </a-button>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT] &&
              [ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status)
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveReceipt(EReceiptSave.UPDATE_BASIC)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Cập nhật phiếu
            </a-button>
          </div>
        </template>
      </form>
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
