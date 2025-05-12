<script setup lang="ts">
import { nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import VueTag from '../../../common/VueTag.vue'
import { IconFileSearch, IconGroup, IconRight, IconSetting } from '../../../common/icon-antd'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import VuePopConfirm from '../../../common/popover/VuePopConfirm.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
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
import ModalUploadReceipt from './ModalUploadReceipt.vue'
import ReceiptItemCreate from './ReceiptItemCreate.vue'
import ReceiptItemTable from './ReceiptItemTable.vue'
import { EReceiptSave, EReceiptUpsertMode, receipt } from './receipt-upsert.store'
import Breadcrumb from '../../component/Breadcrumb.vue'

const modalUploadReceipt = ref<InstanceType<typeof ModalUploadReceipt>>()
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

const saveLoading = ref(false)

watch(
  () => [route.params.id, route.query.mode, route.query.distributor_id],
  async ([paramId, queryMode, queryDistributorId]) => {
    const receiptId = Number(paramId)
    const distributorId = Number(queryDistributorId)
    let distributorDefault = Distributor.blank()
    if (queryMode) {
      mode.value = queryMode as any
    }
    if (receiptId) {
      const receiptResponse = await ReceiptApi.detail(receiptId, {
        relation: {
          distributor: true,
          receiptItemList: { product: true, batch: true },
        },
      })

      receipt.value = receiptResponse
      distributorDefault = receiptResponse.distributor || Distributor.blank()
    } else if (distributorId) {
      distributorDefault = await DistributorApi.detail(distributorId)
    } else {
      distributorDefault = await DistributorService.getDistributorDefault()
    }

    distributor.value = distributorDefault
    receipt.value.distributor = distributorDefault
    receipt.value.distributorId = distributorDefault.id
    if (mode.value === EReceiptUpsertMode.CREATE || mode.value === EReceiptUpsertMode.COPY) {
      receipt.value.startedAt = Date.now()
      receipt.value.status = ReceiptStatus.Draft
    } else if (mode.value === EReceiptUpsertMode.UPDATE) {
      receipt.value.startedAt ||= Date.now()
    }
    nextTick(() => {
      inputOptionsDistributor.value?.setItem({
        text: distributorDefault.fullName,
        data: distributorDefault,
        value: distributorDefault.id,
      })
    })
  },
  { immediate: true },
)

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
    text: instance?.fullName || '',
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
      `Lỗi: sản phẩm ${invalidReceiptItem!.product!.brandName} có số lượng 0`,
    )
  }

  try {
    saveLoading.value = true
    switch (type) {
      case EReceiptSave.CREATE_DRAFT: {
        const response = await ReceiptApi.createDraft(receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      case EReceiptSave.UPDATE_DRAFT: {
        const response = await ReceiptApi.updateDraft(receipt.value.id, receipt.value)
        router.push({ name: 'ReceiptDetail', params: { id: response!.receiptId } })
        break
      }
      case EReceiptSave.UPDATE_PREPAYMENT: {
        const response = await ReceiptApi.depositedUpdate(receipt.value.id, receipt.value)
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

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetail.value?.openModal(data.id)
}
</script>

<template>
  <ModalDistributorUpsert ref="modalDistributorUpsert" @success="handleUpsertDistributorSuccess" />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalUploadReceipt ref="modalUploadReceipt" />
  <ModalReceiptUpsertSettingScreen ref="modalReceiptUpsertSettingScreen" />
  <div class="mx-4 mt-4 gap-2 flex items-center justify-between">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
      <IconRight style="font-size: 0.7em; opacity: 0.5" />
      <span v-if="mode == EReceiptUpsertMode.CREATE">Tạo phiếu nhập hàng mới</span>
      <span v-if="mode == EReceiptUpsertMode.UPDATE">Cập nhật phiếu nhập hàng</span>
      <span v-if="mode == EReceiptUpsertMode.COPY">Copy phiếu nhập hàng</span>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.FILE_RECEIPT_UPLOAD_EXCEL]"
          icon="upload"
          @click="modalUploadReceipt?.openModal()"
        >
          Thêm sản phẩm nhập hàng bằng Excel
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalReceiptUpsertSettingScreen?.openModal()"
          >
            Cài đặt hiển thị
          </a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="mt-4 md:mx-4">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 600px; flex-grow: 2">
        <div class="bg-white p-4">
          <ReceiptItemCreate @addReceiptItem="handleAddReceiptItem" />
        </div>
        <div class="mt-4 bg-white p-4">
          <ReceiptItemTable />
        </div>
      </div>
      <form ref="receiptUpsertForm" style="flex-basis: 300px; flex-grow: 1">
        <div class="bg-white p-4">
          <div class="flex gap-1 flex-wrap">
            <span>Tên NCC</span>
            <a v-if="!!distributor.id" @click="openModalDistributorDetail(receipt.distributor)">
              <IconFileSearch />
            </a>
            <span>
              (nợ cũ:
              <b>{{ formatMoney(distributor.debt) }}</b>
              )
            </span>
            <a
              v-if="permissionIdMap[PermissionId.DISTRIBUTOR_UPDATE] && distributor.id"
              @click="modalDistributorUpsert?.openModal(distributor.id)"
            >
              Sửa thông tin NCC
            </a>
            <div style="margin-left: auto">
              <a
                v-if="permissionIdMap[PermissionId.DISTRIBUTOR_CREATE] && !distributor.id"
                @click="modalDistributorUpsert?.openModal()"
              >
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
              :disabled="receipt.status === ReceiptStatus.Deposited"
              required
              @onFocusinFirst="handleFocusFirstSearchDistributor"
              @onFocusin="handleFocusSearchDistributor"
              @selectItem="({ data }) => selectDistributor(data)"
              @update:text="searchingDistributor"
            >
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b>
                  - {{ data.phone }}
                </div>
                <div>{{ data.address }}</div>
              </template>
            </InputOptions>
          </div>

          <div class="mt-3">Thời gian tạo đơn</div>
          <div>
            <InputDate v-model:value="receipt.startedAt" typeParser="number" show-time />
          </div>
        </div>

        <div class="p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full mt-2 table-payment">
              <tbody>
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
                    <VuePopConfirm>
                      <template #trigger>
                        <div class="flex">
                          <div>
                            <VueTag color="green">{{ receipt.discountPercent || 0 }}%</VueTag>
                          </div>
                          <div
                            class="flex-1 text-right"
                            style="padding-right: 11px; border-bottom: 1px solid #cdcdcd"
                          >
                            {{ formatMoney(receipt.discountMoney) }}
                          </div>
                        </div>
                      </template>
                      <div class="p-4">
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
                      </div>
                    </VuePopConfirm>
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
          <div class="p-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full table-payment">
              <tbody>
                <tr>
                  <td class="whitespace-nowrap">Ghi chú</td>
                  <td>
                    <input v-model="receipt.note" class="input-basic" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="[EReceiptUpsertMode.CREATE, EReceiptUpsertMode.COPY].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_DRAFT_CRUD] &&
              settingStore.SCREEN_RECEIPT_UPSERT.save.createDraft
            "
            class="mt-4 w-full flex flex-col px-1"
          >
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              icon="save"
              type="button"
              @click="saveReceipt(EReceiptSave.CREATE_DRAFT)"
            >
              Lưu nháp
            </VueButton>
          </div>
        </template>

        <template v-if="[EReceiptUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_DRAFT_CRUD] &&
              [ReceiptStatus.Draft].includes(receipt.status)
            "
            class="mt-4 w-full flex flex-col px-1"
          >
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              icon="save"
              type="button"
              @click="saveReceipt(EReceiptSave.UPDATE_DRAFT)"
            >
              Cập nhật phiếu nháp
            </VueButton>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.RECEIPT_DEPOSITED_UPDATE] &&
              [ReceiptStatus.Deposited].includes(receipt.status)
            "
            class="mt-4 w-full flex flex-col px-1"
          >
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              icon="save"
              @click="saveReceipt(EReceiptSave.UPDATE_PREPAYMENT)"
            >
              Cập nhật phiếu tạm ứng
            </VueButton>
          </div>
        </template>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-payment {
  td {
    padding: 6px 0;
  }
}
</style>
