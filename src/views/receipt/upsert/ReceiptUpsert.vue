<script setup lang="ts">
import { FileSearchOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { nextTick, onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor, DistributorApi, DistributorService } from '../../../modules/distributor'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Receipt, ReceiptApi, ReceiptStatus } from '../../../modules/receipt'
import { ReceiptItem } from '../../../modules/receipt-item/receipt-item.model'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import ModalDistributorUpsert from '../../distributor/upsert/ModalDistributorUpsert.vue'
import ModalReceiptUpsertSettingScreen from './ModalReceiptUpsertSettingScreen.vue'
import ReceiptItemCreate from './ReceiptItemCreate.vue'
import ReceiptItemTable from './ReceiptItemTable.vue'
import { EReceiptSave, EReceiptUpsertMode, receipt } from './receipt-upsert.store'
import VueTag from '../../../common/VueTag.vue'

const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalReceiptUpsertSettingScreen = ref<InstanceType<typeof ModalReceiptUpsertSettingScreen>>()
const receiptUpsertForm = ref<InstanceType<typeof HTMLFormElement>>()

const inputOptionsDistributor = ref<InstanceType<typeof InputOptions>>()

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F4') {
    e.preventDefault()
    inputOptionsDistributor.value?.focus()
  }
}

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney, isMobile } = settingStore

const mode = ref<EReceiptUpsertMode>(EReceiptUpsertMode.CREATE)

const distributor = ref<Distributor>(Distributor.blank())
const distributorOptions = ref<{ value: number; text: string; data: Distributor }[]>([])

const time = ref<Dayjs>(dayjs())

const saveLoading = ref(false)

onBeforeMount(async () => {
  const receiptId = Number(route.params.id)
  const distributorId = Number(route.query.distributor_id)
  let distributorDefault = Distributor.blank()
  if (route.query.mode) {
    mode.value = route.query.mode as any
  }
  if (receiptId) {
    const receiptResponse = await ReceiptApi.detail(receiptId, {
      relation: {
        distributor: true,
        receiptItemList: { product: true, batch: true },
      },
    })

    receipt.value = receiptResponse
    distributorDefault = receiptResponse.distributor!

    if (mode.value === EReceiptUpsertMode.CREATE || mode.value === EReceiptUpsertMode.COPY) {
      time.value = dayjs(new Date())
    } else if (mode.value === EReceiptUpsertMode.UPDATE) {
      time.value = dayjs(new Date(receipt.value.startedAt))
    }
  } else if (distributorId) {
    distributorDefault = await DistributorApi.detail(distributorId)
  } else {
    distributorDefault = await DistributorService.getDistributorDefault()
  }

  distributor.value = distributorDefault
  receipt.value.distributor = distributorDefault
  receipt.value.distributorId = distributorDefault.id
  nextTick(() => {
    inputOptionsDistributor.value?.setItem({
      text: distributorDefault.fullName,
      data: distributorDefault,
      value: distributorDefault.id,
    })
  })
})

onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  receipt.value = Receipt.blank()
})

const handleFocusFirstSearchDistributor = async () => {
  await DistributorService.getAll()
  await searchingDistributor('')
}
const handleFocusSearchDistributor = async () => {
  // await searchingDistributor('')
}

const searchingDistributor = async (text: string) => {
  distributor.value.id = 0
  if (!text && isMobile) {
    distributorOptions.value = []
  } else {
    const distributorList = await DistributorService.search(text || '')
    distributorOptions.value = distributorList.map((i) => ({
      value: i.id,
      text: i.fullName,
      data: i,
    }))
  }
}

const handleUpsertDistributorSuccess = (instance?: Distributor) => {
  inputOptionsDistributor.value?.setItem({
    text: instance?.fullName,
    data: instance,
    value: instance?.id,
  })
  selectDistributor(instance)
}

const selectDistributor = (data?: Distributor) => {
  const snapDistributor = data ? Distributor.from(data) : Distributor.blank()
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
  if (receipt.value.receiptItemList!.length == 0) {
    return AlertStore.addError('Lỗi: cần có ít nhất 1 sản phẩm trong phiếu')
  }
  const invalidReceiptItem = receipt.value.receiptItemList!.find((ri) => ri.quantity === 0)
  if (invalidReceiptItem) {
    return AlertStore.addError(
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
      case EReceiptSave.UPDATE_DRAFT_PREPAYMENT: {
        const response = await ReceiptApi.updateDraftPrepayment(receipt.value.id, receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      default:
        break
    }
  } catch (error: any) {
    console.log('🚀 ~ file: ReceiptUpsert.vue:187 ~ saveReceipt ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleAddReceiptItem = (ri: ReceiptItem) => {
  const receiptItem = ReceiptItem.from(ri)
  receipt.value.receiptItemList!.unshift(receiptItem)
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalReceiptUpsertSettingScreen.value?.openModal()
  }
}

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetail.value?.openModal(data.id)
}
</script>

<template>
  <ModalDistributorUpsert ref="modalDistributorUpsert" @success="handleUpsertDistributorSuccess" />
  <ModalDistributorDetail ref="modalDistributorDetail" />
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
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="mt-4 md:mx-4">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 600px; flex-grow: 2">
        <div class="bg-white p-4">
          <div class="flex gap-1 flex-wrap">
            <span>Tên NCC</span>
            <a v-if="!!distributor.id" @click="openModalDistributorDetail(receipt.distributor)">
              <FileSearchOutlined />
            </a>
            <span>
              (nợ cũ:
              <b>{{ formatMoney(distributor.debt) }}</b>
              )
            </span>
            <a
              v-if="permissionIdMap[PermissionId.DISTRIBUTOR_UPDATE] && distributor.id"
              @click="modalDistributorUpsert?.openModal(distributor.id)">
              Sửa thông tin NCC
            </a>
            <div class="ml-auto">
              <a
                v-if="permissionIdMap[PermissionId.DISTRIBUTOR_CREATE] && !distributor.id"
                @click="modalDistributorUpsert?.openModal()">
                Thêm NCC mới
              </a>
            </div>
          </div>

          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsDistributor"
              :options="distributorOptions"
              :max-height="260"
              placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              :disabled="mode === EReceiptUpsertMode.UPDATE || !!receipt.receiptItemList?.length"
              required
              @onFocusinFirst="handleFocusFirstSearchDistributor"
              @onFocusin="handleFocusSearchDistributor"
              @selectItem="({ data }) => selectDistributor(data)"
              @update:text="searchingDistributor">
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b>
                  - {{ data.phone }}
                </div>
                <div>{{ data.address }}</div>
              </template>
            </InputOptions>
          </div>
        </div>
        <div class="bg-white px-4 pb-4">
          <ReceiptItemCreate @addReceiptItem="handleAddReceiptItem" />
        </div>
        <div class="mt-4 bg-white p-4">
          <ReceiptItemTable />
        </div>
      </div>
      <form ref="receiptUpsertForm" style="flex-basis: 300px; flex-grow: 1">
        <div class="p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr>
                  <td style="white-space: nowrap; padding-right: 10px">Thời gian</td>
                  <td>
                    <a-date-picker
                      v-model:value="time"
                      show-time
                      placeholder="Select Time"
                      :format="'DD/MM/YYYY HH:mm:ss'" />
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_RECEIPT_UPSERT.paymentInfo.itemsActualMoney">
                  <td class="font-bold" style="white-space: nowrap; padding-right: 10px">
                    Tiền hàng
                  </td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(receipt.itemsActualMoney) }}
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_RECEIPT_UPSERT.paymentInfo.discount">
                  <td style="white-space: nowrap; padding-right: 10px">Chiết khấu</td>
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
                          Chiết khấu (Tiền hàng:
                          <b>{{ formatMoney(receipt.itemsActualMoney) }}</b>
                          )
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney
                              :value="receipt.discountMoney"
                              append="VNĐ"
                              style="width: 100%"
                              @update:value="handleChangeReceiptDiscountMoney" />
                          </div>
                          <div class="mt-2">
                            <InputNumber
                              :value="receipt.discountPercent"
                              append="%"
                              @update:value="handleChangeReceiptDiscountPercent" />
                          </div>
                        </div>
                      </template>
                      <div class="flex">
                        <div>
                          <VueTag color="green">{{ receipt.discountPercent || 0 }}%</VueTag>
                        </div>
                        <div
                          class="flex-1 text-right"
                          style="padding-right: 11px; border-bottom: 1px solid #cdcdcd">
                          {{ formatMoney(receipt.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_RECEIPT_UPSERT.paymentInfo.surcharge">
                  <td style="white-space: nowrap; padding-right: 10px">Phụ phí</td>
                  <td>
                    <InputMoney v-model:value="receipt.surcharge" class="input-payment" />
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td style="white-space: nowrap; padding-right: 10px" class="font-bold">
                    Tổng tiền
                  </td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(receipt.totalMoney) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 p-4 bg-white">
          <div>Thông tin khác</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr>
                  <td class="whitespace-nowrap">Ghi chú</td>
                  <td>
                    <a-input v-model:value="receipt.note" class="input-payment" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="[EReceiptUpsertMode.CREATE, EReceiptUpsertMode.COPY].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT] &&
              settingStore.SCREEN_RECEIPT_UPSERT.save.createDraft
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              icon="save"
              type="button"
              @click="saveReceipt(EReceiptSave.CREATE_DRAFT)">
              Lưu nháp
            </VueButton>
          </div>
        </template>

        <template v-if="[EReceiptUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_UPDATE_DRAFT_PREPAYMENT] &&
              [ReceiptStatus.Draft].includes(receipt.status)
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              icon="save"
              type="button"
              @click="saveReceipt(EReceiptSave.UPDATE_DRAFT_PREPAYMENT)">
              Cập nhật phiếu nháp
            </VueButton>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_UPDATE_DRAFT_PREPAYMENT] &&
              [ReceiptStatus.Prepayment].includes(receipt.status)
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              icon="save"
              @click="saveReceipt(EReceiptSave.UPDATE_DRAFT_PREPAYMENT)">
              Cập nhật phiếu tạm ứng
            </VueButton>
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
