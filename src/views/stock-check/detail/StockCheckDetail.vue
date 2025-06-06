<script setup lang="ts">
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import {
  IconCloseCircle,
  IconCopy,
  IconDelete,
  IconDollar,
  IconEdit,
  IconFileDone,
  IconFileSearch,
  IconGroup,
  IconMore,
  IconQuestionCircle,
  IconSend,
  IconSetting,
} from '../../../common/icon-antd'

import { StockCheckStatus, StockCheck, StockCheckApi } from '../../../modules/stock-check'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { Breadcrumb } from '../../component'
import { ESTimer } from '../../../utils'
import StockCheckStatusTag from '../StockCheckStatusTag.vue'
import { AlertStore } from '../../../common/vue-alert'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import VueTooltip from '../../../common/popover/VueTooltip.vue'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const router = useRouter()
const route = useRoute()

const meStore = useMeStore()
const { permissionIdMap } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const stockCheck = ref(StockCheck.blank())

const saveLoading = ref(false)

const loadingProcess = ref(false)

const startFetchData = async (stockCheckId: number) => {
  try {
    stockCheck.value = await StockCheckApi.detail(stockCheckId, {
      relation: {
        createdByUser: true,
        updatedByUser: true,
        stockCheckItemList: { product: true, batch: true },
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: ReceiptDetail.vue:58 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  const stockCheckId = Number(route.params.id)
  if (stockCheckId) {
    await startFetchData(stockCheckId)
  }
})

onUnmounted(() => {
  stockCheck.value = StockCheck.blank()
})

const startEdit = () => {
  router.push({
    name: 'StockCheckUpsert',
    params: { id: stockCheck.value.id },
  })
}

const startCopy = () => {
  router.push({
    name: 'StockCheckUpsert',
    params: { id: stockCheck.value.id },
  })
}

const startDraftSubmit = async () => {
  try {
    loadingProcess.value = true
    const stockCheckResult = await StockCheckApi.draftSubmit(stockCheck.value.id!)
    Object.assign(stockCheck.value, stockCheckResult)
    AlertStore.add({ type: 'success', message: 'Đề nghị duyệt thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ StockCheckDetail.vue:92 ~ startDraftSubmit ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const pendingApprove = async () => {
  try {
    loadingProcess.value = true
    const stockCheckResult = await StockCheckApi.pendingApprove(stockCheck.value.id!)
    Object.assign(stockCheck.value, stockCheckResult)
    AlertStore.add({ type: 'success', message: 'Duyệt phiếu kiểm hàng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ StockCheckDetail.vue:105 ~ pendingApprove ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const confirmReconcile = async () => {
  try {
    loadingProcess.value = true
    const stockCheckResult = await StockCheckApi.confirmReconcile(stockCheck.value.id!)
    Object.assign(stockCheck.value, stockCheckResult)
    AlertStore.add({ type: 'success', message: 'Cân bằng kho thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ StockCheckDetail.vue:105 ~ confirmReconcile ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickCancel = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn hủy phiếu kiểm hàng này ?',
    content: [
      '- Thao tác này không thể hoàn lại',
      '- Phiếu kiểm hàng sẽ chuyển sang trạng thái "HỦY"',
    ],
    okText: 'Xác nhận HỦY PHIẾU',
    async onOk() {
      try {
        loadingProcess.value = true
        const stockCheckResult = await StockCheckApi.void(stockCheck.value.id!)
        Object.assign(stockCheck.value, stockCheckResult)
        AlertStore.add({ type: 'success', message: 'Hủy phiếu kiểm hàng thành công', time: 1000 })
      } catch (error) {
        console.log('🚀 ~ StockCheckDetail.vue:142 ~ onOk ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}

const clickDraftDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu kiểm hàng này ?',
    content: 'Phiếu kiểm hàng đã xóa vĩnh viễn khỏi hệ thống. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        loadingProcess.value = true
        await StockCheckApi.draftDestroy(stockCheck.value.id!)
        AlertStore.add({ type: 'success', message: 'Xóa phiếu thành công', time: 1000 })
        router.push({ name: 'StockCheckList' })
      } catch (error) {
        console.log('🚀 ~ StockCheckDetail.vue:139 ~ onOk ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}

const clickCancelledDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu kiểm hàng này ?',
    content: 'Phiếu kiểm hàng đã xóa vĩnh viễn khỏi hệ thống. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        loadingProcess.value = true
        await StockCheckApi.cancelledDestroy(stockCheck.value.id!)
        AlertStore.add({ type: 'success', message: 'Xóa phiếu thành công', time: 1000 })
        router.push({ name: 'StockCheckList' })
      } catch (error) {
        console.log('🚀 ~ StockCheckDetail.vue:158 ~ onOk ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />

  <div class="mx-4 mt-4 gap-2 flex items-center">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="permissionIdMap[PermissionId.STOCK_CHECK_DRAFT_CRUD]"
        color="blue"
        icon="plus"
        @click="$router.push({ name: 'StockCheckUpsert' })"
      >
        Tạo phiếu kiểm hàng mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-4 flex-wrap"></div>
  </div>

  <div class="md:mx-4 mt-4 p-4 bg-white">
    <table>
      <tbody>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap" style="width: 120px">NV tạo phiếu</td>
          <td class="font-medium px-2 py-1">
            {{ stockCheck.createdByUser?.fullName }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Mã phiếu</td>
          <td class="px-2 py-1">SC{{ stockCheck.id }}</td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">T.Gian tạo</td>
          <td class="px-2 py-1">
            {{ ESTimer.timeToText(stockCheck.createdAt, 'hh:mm DD/MM/YY') }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap align-top">Trạng thái</td>
          <td class="px-2 py-1">
            <StockCheckStatusTag :stockCheck="stockCheck" />
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Ghi chú</td>
          <td class="px-2 py-1">
            {{ stockCheck.note }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-4 flex flex-wrap justify-between items-center">
      <div>
        <VueButton
          v-if="
            permissionIdMap[PermissionId.STOCK_CHECK_DRAFT_SUBMIT] &&
            [StockCheckStatus.Draft].includes(stockCheck.status)
          "
          color="green"
          :loading="loadingProcess"
          @click="startDraftSubmit"
        >
          <template #icon>
            <IconSend />
          </template>
          Đề nghị duyệt
        </VueButton>

        <VueButton
          v-if="
            permissionIdMap[PermissionId.STOCK_CHECK_PENDING_APPROVE] &&
            [StockCheckStatus.Pending].includes(stockCheck.status)
          "
          color="blue"
          :loading="loadingProcess"
          @click="pendingApprove"
        >
          <template #icon>
            <IconFileDone />
          </template>
          Xác nhận duyệt
        </VueButton>
      </div>
      <div class="flex gap-2">
        <VueButton
          v-if="
            permissionIdMap[PermissionId.STOCK_CHECK_DRAFT_CRUD] &&
            [StockCheckStatus.Draft].includes(stockCheck.status)
          "
          color="blue"
          @click="startEdit"
        >
          <IconEdit />
          Sửa phiếu
        </VueButton>
        <VueDropdown>
          <template #trigger>
            <div class="vue-circle">
              <IconMore style="font-size: 1.5rem; font-weight: bold" />
            </div>
          </template>
          <div class="vue-menu">
            <a
              style="color: red"
              v-if="
                permissionIdMap[PermissionId.STOCK_CHECK_VOID] &&
                [StockCheckStatus.Pending, StockCheckStatus.Confirmed].includes(stockCheck.status)
              "
              @click="clickCancel()"
            >
              <IconCloseCircle width="16" height="16" />
              Hủy phiếu
            </a>
            <a
              style="color: red"
              v-if="
                permissionIdMap[PermissionId.STOCK_CHECK_DRAFT_CRUD] &&
                stockCheck.status === StockCheckStatus.Draft
              "
              @click="clickDraftDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>
            <a
              style="color: red"
              v-if="
                permissionIdMap[PermissionId.STOCK_CHECK_CANCELLED_DESTROY] &&
                stockCheck.status === StockCheckStatus.Cancelled
              "
              @click="clickCancelledDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>
          </div>
        </VueDropdown>
      </div>
    </div>

    <div class="mt-2 table-wrapper" :class="!isMobile ? 'px-4 w-full' : ''">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Mã SP</th>
            <th>Tên Sản phẩm</th>
            <th>Đơn vị</th>
            <th>Tồn</th>
            <th>Tồn thực tế</th>
            <th>Lệch</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(scItem, index) in stockCheck.stockCheckItemList || []" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center">{{ scItem.product?.productCode }}</td>
            <td>
              <div>
                <div class="font-medium">
                  {{ scItem?.product?.brandName }}
                  <a class="ml-1" @click="modalProductDetail?.openModal(scItem?.product!)">
                    <IconFileSearch />
                  </a>
                </div>
                <div style="font-size: 0.8rem">
                  {{ scItem?.product?.substance }}
                </div>
                <div style="font-size: 0.8rem" class="flex flex-wrap">
                  <div v-if="scItem.systemQuantity !== scItem.product?.quantity">
                    ID {{ scItem.batchId }} -&nbsp;
                  </div>
                  <div v-if="scItem.batch?.batchCode">Lô {{ scItem.batch?.batchCode }}</div>
                  <div v-if="scItem.batch?.expiryDate">
                    - HSD {{ ESTimer.timeToText(scItem.batch?.expiryDate) }}
                  </div>
                </div>
              </div>
            </td>
            <td class="text-center">
              {{ scItem.product?.unitBasicName }}
            </td>
            <td class="text-center">
              <div class="flex flex-wrap items-center gap-2 justify-center">
                <span>{{ scItem.systemQuantity }}</span>
                <span
                  v-if="
                    scItem.systemQuantity !== scItem.product?.quantity &&
                    stockCheck.status !== StockCheckStatus.Balanced
                  "
                >
                  / {{ scItem.product?.quantity }}
                </span>
                <VueTooltip
                  v-if="
                    scItem.systemQuantity !== scItem.product?.quantity &&
                    stockCheck.status !== StockCheckStatus.Balanced
                  "
                  class="flex"
                >
                  <template #trigger>
                    <IconQuestionCircle style="font-size: 16px; color: orange" />
                  </template>
                  <div>
                    Sản phẩm này có nhiều lô hàng khác nhau, với tổng số lượng là:
                    {{ scItem.product?.quantity }}
                  </div>
                  <div>Lô hàng này có số lượng là: {{ scItem.systemQuantity }}</div>
                </VueTooltip>
              </div>
            </td>
            <td class="text-center">
              {{ scItem.actualQuantity }}
            </td>
            <td class="text-right">
              {{
                (scItem.actualQuantity > scItem.systemQuantity ? '+' : '') +
                (scItem.actualQuantity - scItem.systemQuantity)
              }}
            </td>
            <td class="text-right">
              {{ scItem.note }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-center gap-4 my-4">
      <VueButton
        v-if="
          permissionIdMap[PermissionId.STOCK_CHECK_CONFIRMED_RECONCILE] &&
          [StockCheckStatus.Confirmed].includes(stockCheck.status)
        "
        color="blue"
        :loading="loadingProcess"
        @click="confirmReconcile"
      >
        <IconSend />
        Tiến hành cân bằng kho
      </VueButton>
    </div>
  </div>
</template>
