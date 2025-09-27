<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '@/common/VueButton.vue'
import VueTag from '@/common/VueTag.vue'
import { IconFileSearch, IconRight, IconSetting } from '@/common/icon-antd'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import VuePopConfirm from '@/common/popover/VuePopConfirm.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputDate, InputMoney, InputNumber, InputOptions } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Distributor, DistributorApi, DistributorService } from '@/modules/distributor'
import { DiscountType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import {
  PurchaseOrder,
  PurchaseOrderQueryApi,
  PurchaseOrderReceptionApi,
  PurchaseOrderStatus,
} from '@/modules/purchase-order'
import { PurchaseOrderItem } from '@/modules/purchase-order-item'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import ModalDistributorUpsert from '../../distributor/upsert/ModalDistributorUpsert.vue'
import ModalPurchaseOrderUpsertSettingScreen from './ModalPurchaseOrderUpsertSettingScreen.vue'
import ModalUploadPurchaseOrder from './ModalUploadPurchaseOrder.vue'
import PurchaseOrderItemCreate from './PurchaseOrderItemCreate.vue'
import PurchaseOrderItemTable from './PurchaseOrderItemTable.vue'
import {
  EPurchaseOrderSave,
  EPurchaseOrderUpsertMode,
  purchaseOrder,
  warehouseId,
} from './purchase-order-upsert.store'
import { ProductService } from '@/modules/product'
import { ESArray } from '@/utils'

const modalUploadPurchaseOrder = ref<InstanceType<typeof ModalUploadPurchaseOrder>>()
const modalDistributorUpsert = ref<InstanceType<typeof ModalDistributorUpsert>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalPurchaseOrderUpsertSettingScreen =
  ref<InstanceType<typeof ModalPurchaseOrderUpsertSettingScreen>>()
const purchaseOrderUpsertForm = ref<InstanceType<typeof HTMLFormElement>>()

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
const { userPermission } = MeService
const { formatMoney, isMobile } = settingStore

const mode = ref<EPurchaseOrderUpsertMode>(EPurchaseOrderUpsertMode.CREATE)

const distributor = ref<Distributor>(Distributor.blank())
const distributorOptions = ref<{ value: number; text: string; data: Distributor }[]>([])

const saveLoading = ref(false)

watch(
  () => [route.params.id, route.query.mode, route.query.distributor_id],
  async ([paramId, queryMode, queryDistributorId]) => {
    const purchaseOrderId = paramId as string
    const distributorId = Number(queryDistributorId)
    let distributorDefault = Distributor.blank()
    if (queryMode) {
      mode.value = queryMode as any
    }
    if (purchaseOrderId) {
      const purchaseOrderResponse = await PurchaseOrderQueryApi.detail(purchaseOrderId, {
        relation: {
          distributor: true,
          purchaseOrderItemList: { product: true, batch: true },
        },
      })

      purchaseOrder.value = purchaseOrderResponse
      distributorDefault = purchaseOrderResponse.distributor || Distributor.blank()
    } else if (distributorId) {
      distributorDefault = await DistributorApi.detail(distributorId)
    } else {
      distributorDefault = await DistributorService.getDistributorDefault()
    }

    distributor.value = distributorDefault
    purchaseOrder.value.distributor = distributorDefault
    purchaseOrder.value.distributorId = distributorDefault.id
    if (
      mode.value === EPurchaseOrderUpsertMode.CREATE ||
      mode.value === EPurchaseOrderUpsertMode.COPY
    ) {
      purchaseOrder.value.startedAt = Date.now()
      purchaseOrder.value.status = PurchaseOrderStatus.Draft
    } else if (mode.value === EPurchaseOrderUpsertMode.UPDATE) {
      purchaseOrder.value.startedAt ||= Date.now()
    }
    await nextTick(() => {
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
  purchaseOrder.value = PurchaseOrder.blank()
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
  purchaseOrder.value.distributorId = snapDistributor.id!
  purchaseOrder.value.distributor = snapDistributor
}

const handleChangePurchaseOrderDiscountMoney = (data: number) => {
  purchaseOrder.value.discountMoney = data
  purchaseOrder.value.discountType = DiscountType.VND
}
const handleChangePurchaseOrderDiscountPercent = (data: number) => {
  purchaseOrder.value.discountPercent = data
  purchaseOrder.value.discountType = DiscountType.Percent
}

const savePurchaseOrder = async (type: EPurchaseOrderSave) => {
  const validForm = purchaseOrderUpsertForm.value?.checkValidity()
  if (!validForm) {
    return purchaseOrderUpsertForm.value?.reportValidity()
  }
  if (purchaseOrder.value.purchaseOrderItemList!.length == 0) {
    return AlertStore.addError('Lỗi: cần có ít nhất 1 sản phẩm trong phiếu')
  }
  const invalidPurchaseOrderItem = purchaseOrder.value.purchaseOrderItemList!.find(
    (ri) => ri.quantity === 0,
  )
  if (invalidPurchaseOrderItem) {
    return AlertStore.addError(
      `Lỗi: sản phẩm ${invalidPurchaseOrderItem!.product!.brandName} có số lượng 0`,
    )
  }

  try {
    saveLoading.value = true
    switch (type) {
      case EPurchaseOrderSave.CREATE_DRAFT: {
        const response = await PurchaseOrderReceptionApi.createDraft(purchaseOrder.value)
        await router.push({
          name: 'PurchaseOrderDetailContainer',
          params: { id: response!.purchaseOrderId },
        })
        break
      }
      case EPurchaseOrderSave.UPDATE_DRAFT: {
        const response = await PurchaseOrderReceptionApi.updateDraft(
          purchaseOrder.value.id,
          purchaseOrder.value,
        )
        await router.push({
          name: 'PurchaseOrderDetailContainer',
          params: { id: response!.purchaseOrderId },
        })
        break
      }
      case EPurchaseOrderSave.UPDATE_PREPAYMENT: {
        const response = await PurchaseOrderReceptionApi.depositedUpdate(
          purchaseOrder.value.id,
          purchaseOrder.value,
        )
        await router.push({
          name: 'PurchaseOrderDetailContainer',
          params: { id: response!.purchaseOrderId },
        })
        break
      }
      default:
        break
    }
  } catch (error: any) {
    console.log('🚀 ~ file: PurchaseOrderUpsert.vue:187 ~ savePurchaseOrder ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleAddPurchaseOrderItem = (ri: PurchaseOrderItem) => {
  const purchaseOrderItem = PurchaseOrderItem.from(ri)
  purchaseOrder.value.purchaseOrderItemList!.unshift(purchaseOrderItem)
}

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetail.value?.openModal(data.id)
}

const handleModalUploadPurchaseOrderSuccess = async (
  purchaseOrderItemInsertList: PurchaseOrderItem[],
) => {
  const productIdList = purchaseOrderItemInsertList.map((ri) => ri.productId)
  const productList = await ProductService.list({
    filter: { id: { IN: productIdList } },
  })
  const productMap = ESArray.arrayToKeyValue(productList, 'id')
  purchaseOrderItemInsertList.forEach((ri) => {
    ri.product = productMap[ri.productId]
    ri.warehouseId = warehouseId.value
  })
  purchaseOrder.value.purchaseOrderItemList!.push(...purchaseOrderItemInsertList)
}
</script>

<template>
  <ModalDistributorUpsert ref="modalDistributorUpsert" @success="handleUpsertDistributorSuccess" />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalUploadPurchaseOrder
    ref="modalUploadPurchaseOrder"
    @success="handleModalUploadPurchaseOrderSuccess"
  />
  <ModalPurchaseOrderUpsertSettingScreen ref="modalPurchaseOrderUpsertSettingScreen" />
  <div class="mx-4 mt-4 gap-2 flex items-center justify-between">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
      <IconRight style="font-size: 0.7em; opacity: 0.5" />
      <span v-if="mode == EPurchaseOrderUpsertMode.CREATE">Tạo phiếu nhập hàng mới</span>
      <span v-if="mode == EPurchaseOrderUpsertMode.UPDATE">Cập nhật phiếu nhập hàng</span>
      <span v-if="mode == EPurchaseOrderUpsertMode.COPY">Copy phiếu nhập hàng</span>
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
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalPurchaseOrderUpsertSettingScreen?.openModal()"
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
          <PurchaseOrderItemCreate @addPurchaseOrderItem="handleAddPurchaseOrderItem" />
        </div>
        <div class="mt-4 bg-white p-4">
          <div class="flex flex-wrap justify-between items-baseline">
            <span>Giỏ hàng ({{ purchaseOrder.purchaseOrderItemList?.length || 0 }})</span>
            <div>
              <VueButton
                v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_PURCHASE_ORDER]"
                icon="upload"
                size="small"
                @click="modalUploadPurchaseOrder?.openModal()"
              >
                Thêm sản phẩm bằng Excel
              </VueButton>
            </div>
          </div>
          <PurchaseOrderItemTable />
        </div>
      </div>
      <form ref="purchaseOrderUpsertForm" style="flex-basis: 300px; flex-grow: 1">
        <div class="bg-white p-4">
          <div class="flex gap-1 flex-wrap">
            <span>Tên NCC</span>
            <a
              v-if="!!distributor.id"
              @click="openModalDistributorDetail(purchaseOrder.distributor)"
            >
              <IconFileSearch />
            </a>
            <span>
              (nợ cũ:
              <b>{{ formatMoney(distributor.debt) }}</b>
              )
            </span>
            <a
              v-if="userPermission[PermissionId.DISTRIBUTOR_UPDATE] && distributor.id"
              @click="modalDistributorUpsert?.openModal(distributor.id)"
            >
              Sửa thông tin NCC
            </a>
            <div style="margin-left: auto">
              <a
                v-if="userPermission[PermissionId.DISTRIBUTOR_CREATE] && !distributor.id"
                @click="modalDistributorUpsert?.openModal()"
              >
                Thêm NCC mới
              </a>
            </div>
          </div>

          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsDistributor"
              :disabled="purchaseOrder.status === PurchaseOrderStatus.Deposited"
              :max-height="260"
              :options="distributorOptions"
              placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              required
              @onFocusin="handleFocusSearchDistributor"
              @onFocusinFirst="handleFocusFirstSearchDistributor"
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
            <InputDate v-model:value="purchaseOrder.startedAt" show-time typeParser="number" />
          </div>
        </div>

        <div class="p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.paymentInfo.itemsActualMoney">
                  <td class="font-bold" style="white-space: nowrap; padding-right: 10px">
                    Tiền hàng
                  </td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(purchaseOrder.itemsActualMoney) }}
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.paymentInfo.discount">
                  <td style="white-space: nowrap; padding-right: 10px">Chiết khấu</td>
                  <td class="cursor-pointer" style="font-size: 16px">
                    <VuePopConfirm>
                      <template #trigger>
                        <div class="flex">
                          <div>
                            <VueTag color="green">{{ purchaseOrder.discountPercent || 0 }}%</VueTag>
                          </div>
                          <div
                            class="flex-1 text-right"
                            style="padding-right: 11px; border-bottom: 1px solid #cdcdcd"
                          >
                            {{ formatMoney(purchaseOrder.discountMoney) }}
                          </div>
                        </div>
                      </template>
                      <div class="p-4">
                        <div>
                          Chiết khấu (Tiền hàng:
                          <b>{{ formatMoney(purchaseOrder.itemsActualMoney) }}</b>
                          )
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney
                              :value="purchaseOrder.discountMoney"
                              append="VNĐ"
                              style="width: 100%"
                              @update:value="handleChangePurchaseOrderDiscountMoney"
                            />
                          </div>
                          <div class="mt-2">
                            <InputNumber
                              :value="purchaseOrder.discountPercent"
                              append="%"
                              @update:value="handleChangePurchaseOrderDiscountPercent"
                            />
                          </div>
                        </div>
                      </div>
                    </VuePopConfirm>
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.paymentInfo.surcharge">
                  <td style="white-space: nowrap; padding-right: 10px">Phụ phí</td>
                  <td>
                    <InputMoney v-model:value="purchaseOrder.surcharge" class="input-payment" />
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td class="font-bold" style="white-space: nowrap; padding-right: 10px">
                    Tổng tiền
                  </td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(purchaseOrder.totalMoney) }}
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
                    <input v-model="purchaseOrder.note" class="input-basic" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template
          v-if="[EPurchaseOrderUpsertMode.CREATE, EPurchaseOrderUpsertMode.COPY].includes(mode)"
        >
          <div
            v-if="
              userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
              settingStore.SCREEN_PURCHASE_ORDER_UPSERT.save.createDraft
            "
            class="mt-4 w-full flex flex-col px-1"
          >
            <VueButton
              :loading="saveLoading"
              color="blue"
              icon="save"
              size="large"
              type="button"
              @click="savePurchaseOrder(EPurchaseOrderSave.CREATE_DRAFT)"
            >
              Lưu nháp
            </VueButton>
          </div>
        </template>

        <template v-if="[EPurchaseOrderUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="
              userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
              [PurchaseOrderStatus.Draft].includes(purchaseOrder.status)
            "
            class="mt-4 w-full flex flex-col px-1"
          >
            <VueButton
              :loading="saveLoading"
              color="blue"
              icon="save"
              size="large"
              type="button"
              @click="savePurchaseOrder(EPurchaseOrderSave.UPDATE_DRAFT)"
            >
              Cập nhật phiếu nháp
            </VueButton>
          </div>

          <div
            v-if="
              userPermission[PermissionId.PURCHASE_ORDER_DEPOSITED_UPDATE] &&
              [PurchaseOrderStatus.Deposited].includes(purchaseOrder.status)
            "
            class="mt-4 w-full flex flex-col px-1"
          >
            <VueButton
              :loading="saveLoading"
              color="blue"
              icon="save"
              size="large"
              type="button"
              @click="savePurchaseOrder(EPurchaseOrderSave.UPDATE_PREPAYMENT)"
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
