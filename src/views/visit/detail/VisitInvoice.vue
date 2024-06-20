<script lang="ts" setup>
import {
  DollarOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  FileSyncOutlined,
  MoreOutlined,
  PrinterOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { computed, createVNode, h, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputNumber } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Batch, BatchApi } from '../../../modules/batch'
import { DiscountType, PaymentViewType } from '../../../modules/enum'
import { VisitApi, VisitStatus } from '../../../modules/visit'
import { VisitBatchApi } from '../../../modules/visit-batch'
import { VisitProcedure } from '../../../modules/visit-procedure'
import { VisitProduct } from '../../../modules/visit-product'
import { arrayToKeyArray, timeToText } from '../../../utils'
import ModalProcedureDetail from '../../procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalVisitPayment from './ModalVisitPayment.vue'
import ModalVisitReturnProduct from './ModalVisitReturnProduct.vue'
import { visit } from './visit.ref'
import { Handlebars } from '../../../core/handlebars'

const modalVisitPayment = ref<InstanceType<typeof ModalVisitPayment>>()
const modalVisitReturnProduct = ref<InstanceType<typeof ModalVisitReturnProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()

const visitProductList = ref<VisitProduct[]>([])
const visitProcedureList = ref<VisitProcedure[]>([])

const saveLoading = ref(false)
const sendProductLoading = ref(false)
const sendProductWaiting = ref(false)

const visitBatchSentListMap = computed(() => {
  return arrayToKeyArray(visit.value.visitBatchList || [], 'visitProductId')
})
const visitBatchUnsentListMap = ref<
  Record<
    string,
    {
      visitProductId: number
      productId: number
      batchId: number
      quantity: number
      batch: Batch
    }[]
  >
>({})

// visitBatchList cần được query khi không có
// Nếu có rồi mà thay đổi thì được update qua socket
onMounted(async () => {
  if (!visit.value.visitBatchList) {
    const hasIsSent = visit.value.visitProductList!.some((i) => i.isSent === 1)
    if (!hasIsSent) return
    const response = await VisitBatchApi.list({
      relation: { batch: true },
      filter: { visitId: visit.value.id },
    })
    visit.value.visitBatchList = response.data
  }
})

// component này cần phải destroy khi không dùng
// mục đích là để mỗi lần thay đổi visitProductList, thì batchList sẽ được query lại
// nếu không destroy thì sẽ bị query liên tục khi có thay đổi dữ liệu bên prescription
watch(
  () => visit.value.visitProductList,
  async (newValue, oldValue) => {
    if (JSON.stringify(newValue) === JSON.stringify(visitProductList.value)) {
      return
    }
    sendProductWaiting.value = true
    visitProductList.value = VisitProduct.cloneList(newValue || [])

    const visitProductUnsentHasBatches = visitProductList.value.filter((i) => {
      return !i.isSent && i.product?.hasManageQuantity && i.product?.hasManageBatches
    })

    visitBatchUnsentListMap.value = {}
    if (visitProductUnsentHasBatches.length) {
      const productIdsHasBatches = visitProductUnsentHasBatches.map((i) => i.productId)
      const batchListResponse = await BatchApi.list({
        filter: { productId: { IN: productIdsHasBatches }, quantity: { GT: 0 } },
        sort: { expiryDate: 'ASC' },
      })

      visitProductUnsentHasBatches.forEach((i) => {
        visitBatchUnsentListMap.value[i.id] = batchListResponse.data
          .filter((j) => j.productId === i.productId)
          .map((j) => {
            return {
              visitProductId: i.id,
              productId: j.productId,
              batchId: j.id,
              quantity: 0,
              batch: j,
            }
          })
        reCalculateQuantityVisitBatchUnsent(i)
      })
    }
    sendProductWaiting.value = false
  },
  { immediate: true, deep: false }
)
watch(
  () => visit.value.visitProcedureList,
  (newValue, oldValue) => {
    visitProcedureList.value = VisitProcedure.cloneList(newValue || [])
  },
  { immediate: true }
)

const productsMoney = computed(() => {
  return visitProductList.value.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const proceduresMoney = computed(() => {
  return visitProcedureList.value.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const disabledSave = computed(() => {
  return (
    (JSON.stringify(visitProductList.value) === JSON.stringify(visit.value.visitProductList) &&
      JSON.stringify(visitProcedureList.value) ===
        JSON.stringify(visit.value.visitProcedureList)) ||
    [VisitStatus.Debt, VisitStatus.Completed].includes(visit.value.visitStatus)
  )
})

const disableSendProduct = computed(() => {
  return (
    JSON.stringify(visitProductList.value) !== JSON.stringify(visit.value.visitProductList) ||
    !visitProductList.value.filter((i) => !i.isSent && i.quantity > 0).length ||
    [VisitStatus.Debt, VisitStatus.Completed].includes(visit.value.visitStatus)
  )
})

const handleChangeProcedureDiscountMoney = (discountMoney: number, index: number) => {
  const expectedPrice = visitProcedureList.value[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  visitProcedureList.value[index].discountMoney = discountMoney
  visitProcedureList.value[index].discountPercent = discountPercent
  visitProcedureList.value[index].actualPrice = actualPrice
  visitProcedureList.value[index].discountType = DiscountType.VND
}

const handleChangeProcedureDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = visitProcedureList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  visitProcedureList.value[index].discountPercent = discountPercent
  visitProcedureList.value[index].discountMoney = discountMoney
  visitProcedureList.value[index].actualPrice = actualPrice
  visitProcedureList.value[index].discountType = DiscountType.Percent
}

const handleChangeProductDiscountMoney = (data: number, index: number) => {
  const expectedPrice = visitProductList.value[index].expectedPrice || 0
  const discountMoney = data / visitProductList.value[index].unitRate
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  visitProductList.value[index].discountMoney = discountMoney
  visitProductList.value[index].discountPercent = discountPercent
  visitProductList.value[index].actualPrice = actualPrice
  visitProductList.value[index].discountType = DiscountType.VND
}

const handleChangeProductDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = visitProductList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  visitProductList.value[index].discountPercent = discountPercent
  visitProductList.value[index].discountMoney = discountMoney
  visitProductList.value[index].actualPrice = actualPrice
  visitProductList.value[index].discountType = DiscountType.Percent
}

const saveVisitItems = async () => {
  saveLoading.value = true

  const visitProductListUpdate: VisitProduct[] = []
  visitProductList.value.forEach((item, index) => {
    if (JSON.stringify(item) == JSON.stringify(visit.value.visitProductList![index])) return
    const visitProduct = new VisitProduct()
    visitProduct.id = item.id
    visitProduct.productId = item.productId
    visitProduct.quantity = item.quantity
    visitProduct.costAmount = item.costAmount
    visitProduct.discountMoney = item.discountMoney
    visitProduct.discountPercent = item.discountPercent
    visitProduct.discountType = item.discountType
    visitProduct.actualPrice = item.actualPrice
    visitProductListUpdate.push(visitProduct)
  })

  const visitProcedureListUpdate: VisitProcedure[] = []
  visitProcedureList.value.forEach((item, index) => {
    if (JSON.stringify(item) == JSON.stringify(visit.value.visitProcedureList![index])) return
    const visitProcedure = new VisitProcedure()
    visitProcedure.id = item.id
    visitProcedure.procedureId = item.procedureId
    visitProcedure.discountMoney = item.discountMoney
    visitProcedure.discountPercent = item.discountPercent
    visitProcedure.discountType = item.discountType
    visitProcedure.actualPrice = item.actualPrice
    visitProcedureListUpdate.push(visitProcedure)
  })

  try {
    await VisitApi.updateVisitItemsMoney({
      visitId: visit.value.id,
      visitProcedureList: visitProcedureListUpdate,
      visitProductList: visitProductListUpdate,
    })
  } catch (e) {
    console.log('🚀 ~ file: VisitPayment.vue:137 ~ saveVisitItems ~ e:', e)
  } finally {
    saveLoading.value = false
  }
}

const validateQuantity = () => {
  const visitProductUnsentList = visitProductList.value.filter((i) => !i.isSent)
  for (let i = 0; i < visitProductUnsentList.length; i++) {
    const visitProductUnsent = visitProductUnsentList[i]
    const { product } = visitProductUnsent

    if (product?.hasManageQuantity) {
      if (visitProductUnsent.quantity > (product?.quantity || 0)) {
        AlertStore.addError(
          `Sản phẩm ${product?.brandName} không đủ ` +
            `(tồn ${product?.quantity || 0} - lấy ${visitProductUnsent.quantity})`
        )
        return false
      }
    }

    if (product?.hasManageBatches) {
      const visitBatchUnsentList = visitBatchUnsentListMap.value[visitProductUnsent.id]
      for (let j = 0; j < visitBatchUnsentList.length; j++) {
        const visitBatchUnsent = visitBatchUnsentList[j]
        if (visitBatchUnsent.quantity > visitBatchUnsent.batch!.quantity) {
          AlertStore.addError(
            `Lô hàng ${timeToText(
              visitBatchUnsent.batch!.expiryDate
            )} của Sản phẩm ${product?.brandName} ` +
              `không đủ (tồn ${visitBatchUnsent.batch!.quantity} - lấy ${
                visitBatchUnsent.quantity
              })`
          )
          return false
        }
      }

      const vbReduceQuantity = visitBatchUnsentList.reduce((acc, item) => {
        return acc + item.quantity
      }, 0)
      if (visitProductUnsent.quantity != vbReduceQuantity) {
        AlertStore.addError(`Số lượng trong lô hàng của sản phẩm ${product?.brandName} không đúng`)
        return false
      }
    }
  }
  return true
}

const sendProductList = async () => {
  sendProductLoading.value = true
  try {
    if (!validateQuantity()) return

    const visitProductSendList = visitProductList.value
      .filter((i) => !i.isSent && i.quantity > 0)
      .map((i) => {
        return {
          visitProductId: i.id,
          productId: i.productId,
          brandName: i.product?.brandName || '',
          quantitySend: i.quantity,
          hasManageQuantity: i.product!.hasManageQuantity,
          hasManageBatches: i.product!.hasManageBatches,
        }
      })
    if (visitProductSendList.length === 0) {
      return AlertStore.addError('Không có hàng chưa gửi')
    }

    await VisitApi.sendProductList({
      visitId: visit.value.id,
      visitProductSendList,
      visitBatchSendList: Object.values(visitBatchUnsentListMap.value)
        .flat()
        .filter((i) => i.quantity > 0)
        .map((i) => {
          return {
            visitProductId: i.visitProductId,
            productId: i.productId,
            batchId: i.batchId,
            quantitySend: i.quantity,
          }
        }),
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPayment.vue:301 ~ sendProductList ~ error:', error)
  } finally {
    sendProductLoading.value = false
  }
}

const updateVisitBatchUnsentQuantity = (
  visitProductIndex: number,
  vbUnsentIndex: number,
  quantity: number
) => {
  const visitProduct = visitProductList.value[visitProductIndex]
  const visitBatchUnsentList = visitBatchUnsentListMap.value[visitProduct.id]
  const visitBatchUnsent = visitBatchUnsentList[vbUnsentIndex]

  visitBatchUnsent.quantity = quantity
  visitProduct.quantity = visitBatchUnsentList.reduce((acc, item) => {
    return acc + item.quantity
  }, 0)
  visitProduct.costAmount = Math.floor(
    ((visitProduct.product?.costAmount || 0) * visitProduct.quantity) /
      (visitProduct.product?.quantity || 1)
  )
}

const updateVisitProductQuantity = (visitProductIndex: number, unitQuantity: number) => {
  const visitProduct = visitProductList.value[visitProductIndex]

  visitProduct.unitQuantity = unitQuantity
  visitProduct.costAmount = Math.floor(
    ((visitProduct.product?.costAmount || 0) * visitProduct.quantity) /
      (visitProduct.product?.quantity || 1)
  )
  if (visitProduct.product?.hasManageBatches) {
    reCalculateQuantityVisitBatchUnsent(visitProduct)
  }
}

const reCalculateQuantityVisitBatchUnsent = (visitProductUnsent: VisitProduct) => {
  const visitBatchUnsentList = visitBatchUnsentListMap.value[visitProductUnsent.id]

  // tính số lượng của product này đã lấy, nếu thiếu thì cộng thêm, lấy thừa thì trừ đi
  const quantitySelected = visitBatchUnsentList.reduce((acc, item) => {
    return acc + item.quantity
  }, 0)

  const quantitySkewed = quantitySelected - visitProductUnsent.quantity
  if (quantitySkewed === 0) return

  // lấy thiếu phải lấy thêm
  if (quantitySkewed < 0) {
    let quantityMissing = -quantitySkewed
    for (let i = 0; i < visitBatchUnsentList.length; i++) {
      const vbUnsent = visitBatchUnsentList[i]
      const quantityBatchOtherKeep = Object.values(visitBatchUnsentListMap.value)
        .flat()
        .filter((j) => {
          return j.visitProductId !== vbUnsent.visitProductId && j.batchId === vbUnsent.batchId
        })
        .reduce((acc, item) => acc + item.quantity, 0)

      const quantityBatchAvailable = vbUnsent.batch.quantity - quantityBatchOtherKeep
      if (vbUnsent.quantity >= quantityBatchAvailable) continue // đã lấy đủ hoặc quá nhiều rồi

      // giờ cộng thêm số lượng thiếu thôi
      const quantityPlus = Math.min(quantityMissing, quantityBatchAvailable - vbUnsent.quantity)
      quantityMissing -= quantityPlus
      vbUnsent.quantity += quantityPlus
    }
  }

  // lấy thừa rồi phải trừ đi thôi
  if (quantitySkewed > 0) {
    let quantityExcess = quantitySkewed
    for (let i = visitBatchUnsentList.length - 1; i >= 0; i--) {
      if (quantityExcess === 0) break
      const vbUnsent = visitBatchUnsentList[i]
      const quantityMinus = Math.min(quantityExcess, vbUnsent.quantity)
      quantityExcess -= quantityMinus
      vbUnsent.quantity -= quantityMinus
    }
  }
}

const startPrint = async () => {
  try {
    const response = await fetch('/template/visit-invoice.hbs')
    const templateHtml = await response.text()

    const templateCompile = Handlebars.compile(templateHtml)
    const content = templateCompile({
      organization: meStore.organization,
      visit: visit.value,
    })

    const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(content)
    pri.document.close()
    pri.focus()
    pri.print()
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:421 ~ startPrint ~ error:', error)
  }
}

const startReopenVisit = async () => {
  await VisitApi.reopen(visit.value.id)
}

const clickReopenVisit = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    icon: createVNode(ExclamationCircleOutlined),
    content: h('div', {}, [
      ...(visit.value.debt > 0
        ? [
            h('div', '- Số tiền nợ sẽ được hoàn trả, khi đóng hồ sơ lại sẽ ghi nợ trở lại'),
            h('div', `- Trừ nợ khách hàng: ${formatMoney(visit.value.debt)}`),
          ]
        : []),
    ]),
    async onOk() {
      await startReopenVisit()
    },
    onCancel() {},
  })
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'RETURN_PRODUCT_LIST') {
    if ([VisitStatus.Debt, VisitStatus.Completed].includes(visit.value.visitStatus)) {
      return Modal.warning({
        title: 'Trạng thái hồ sơ không hợp lệ ?',
        content: h('div', {}, [h('p', 'Cần mở lại hồ sơ trước khi hoàn trả')]),
      })
    } else {
      modalVisitReturnProduct.value?.openModal()
    }
  }
  if (menu.key === 'REOPEN_VISIT') {
    clickReopenVisit()
  }
}
</script>
<template>
  <ModalVisitPayment ref="modalVisitPayment" />
  <ModalVisitReturnProduct ref="modalVisitReturnProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <div class="flex gap-4">
    <VueButton
      class="ml-auto"
      color="green"
      :disabled="
        disableSendProduct ||
        sendProductWaiting ||
        [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
      "
      :loading="sendProductLoading"
      @click="sendProductList"
    >
      <template #icon> <SendOutlined /> </template>
      <span class="font-bold">XUẤT THUỐC</span>
    </VueButton>
    <VueButton
      v-if="
        [VisitStatus.Scheduled, VisitStatus.Waiting, VisitStatus.InProgress].includes(
          visit.visitStatus
        ) && visit.paid > visit.totalMoney
      "
      size="small"
      color="green"
      @click="modalVisitPayment?.openModal(PaymentViewType.RefundOverpaid)"
    >
      <DollarOutlined />
      <span class="font-bold"> HOÀN TIỀN </span>
    </VueButton>
    <!-- <VueButton color="green" @click="modalVisitPayment?.openModal()">
      <DollarOutlined />
      <span v-if="!visit.finishedAt && visit.paid >= visit.totalMoney" class="font-bold">
        TẠM ỨNG
      </span>
      <span v-if="!visit.finishedAt && visit.paid < visit.totalMoney" class="font-bold">
        THANH TOÁN
      </span>
      <span v-if="visit.finishedAt" class="font-bold">TRẢ NỢ</span>
    </VueButton> -->
    <div class="flex items-center">
      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item key="RETURN_PRODUCT_LIST">
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Hoàn trả thuốc</span>
            </a-menu-item>
            <a-menu-item
              v-if="[VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)"
              key="REOPEN_VISIT"
            >
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Mở lại phiếu khám</span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button shape="circle">
          <template #icon>
            <MoreOutlined style="font-size: 1.2rem; font-weight: bold" />
          </template>
        </a-button>
      </a-dropdown>
    </div>
  </div>
  <div class="mt-4 table-wrapper">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th colspan="3">DỊCH VỤ - THỦ THUẬT</th>
          <th>SL</th>
          <th>Giá</th>
          <th>Chiết khấu</th>
          <th>Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(visitProcedure, index) in visitProcedureList || []" :key="index">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td colspan="3">
            {{ visitProcedure.procedure?.name }}
            <a class="ml-1" @click="modalProcedureDetail?.openModal(visitProcedure.procedureId)">
              <FileSearchOutlined />
            </a>
          </td>
          <td class="text-center">{{ visitProcedure.quantity }}</td>
          <td class="text-right whitespace-nowrap">
            <div v-if="visitProcedure.discountMoney" class="text-xs italic text-red-500">
              <del>{{ formatMoney(visitProcedure.expectedPrice) }}</del>
            </div>
            <div>{{ formatMoney(visitProcedure.actualPrice) }}</div>
          </td>

          <td class="text-center" style="width: 40px">
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
                  <b>
                    {{ formatMoney(visitProcedure.expectedPrice) }}
                  </b>
                  )
                </div>
                <div class="mt-2">
                  <div>
                    <InputNumber
                      :value="visitProcedure.discountMoney"
                      append="VNĐ"
                      :disabled="
                        [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
                      "
                      @update:value="(e: number) => handleChangeProcedureDiscountMoney(e, index)"
                    />
                  </div>
                  <div class="mt-2">
                    <div class="w-full">
                      <InputNumber
                        :value="visitProcedure.discountPercent"
                        append="%"
                        :disabled="
                          [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
                        "
                        @update:value="
                          (e: number) => handleChangeProcedureDiscountPercent(e, index)
                        "
                      />
                    </div>
                  </div>
                </div>
              </template>
              <a-tag
                v-if="visitProcedure.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer"
              >
                {{ formatMoney(visitProcedure.discountMoney) }}
              </a-tag>
              <a-tag
                v-if="visitProcedure.discountType === '%'"
                color="success"
                style="cursor: pointer"
              >
                {{ visitProcedure.discountPercent || 0 }}%
              </a-tag>
            </a-popconfirm>
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right" colspan="7">Tiền dịch vụ thủ thuật</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(proceduresMoney) }}
          </td>
        </tr>
      </tbody>

      <thead>
        <tr>
          <th>#</th>
          <th>THUỐC</th>
          <th>Đ.Vị</th>
          <th>SL kê</th>
          <th>SL mua</th>
          <th>Giá</th>
          <th>Chiết khấu</th>
          <th>Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(visitProduct, visitProductIndex) in visitProductList || []"
          :key="visitProduct.id + '_' + visitProductIndex"
        >
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ visitProductIndex + 1 }}
          </td>
          <td>
            <div style="font-weight: 500">
              {{ visitProduct.product?.brandName }}
              <a class="ml-1" @click="modalProductDetail?.openModal(visitProduct.productId)">
                <FileSearchOutlined />
              </a>
            </div>
            <div v-if="visitProduct.product?.substance" class="text-xs italic">
              {{ visitProduct.product.substance }}
            </div>
            <div v-if="visitProduct.product?.hasManageBatches">
              <div v-if="visitProduct.isSent">
                <div v-if="(visitBatchSentListMap[visitProduct.id]?.length || 0) >= 2">
                  <a-popconfirm>
                    <template #cancelButton>
                      <div></div>
                    </template>
                    <template #okButton>
                      <div></div>
                    </template>
                    <template #title>
                      <div>
                        <span>Chi tiết số lượng tính theo từng lô</span>
                      </div>
                      <div class="mt-2" style="max-width: 100vw; overflow: auto">
                        <table class="table-batch-select-quantity">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Số lô</th>
                              <th>HSD</th>
                              <th>Đ.Vị</th>
                              <th>Số lượng</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(vbSent, vbSentIndex) in visitBatchSentListMap[
                                visitProduct.id
                              ]"
                              :key="vbSentIndex"
                            >
                              <td class="text-center">{{ vbSentIndex + 1 }}</td>
                              <td>{{ vbSent.batch!.lotNumber }}</td>
                              <td>{{ timeToText(vbSent.batch!.expiryDate) }}</td>
                              <td class="text-center">
                                {{ visitProduct.product?.getUnitNameByRate(visitProduct.unitRate) }}
                              </td>
                              <td class="text-center">
                                {{ vbSent.quantity / visitProduct.unitRate }}
                              </td>
                            </tr>
                            <tr>
                              <td colspan="4" class="text-center" style="font-weight: 500">Tổng</td>
                              <td class="text-center">
                                {{ visitProductList![visitProductIndex].unitQuantity }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </template>
                    <a class="text-xs italic underline">
                      {{ visitBatchSentListMap[visitProduct.id].length }} lô hàng
                    </a>
                  </a-popconfirm>
                </div>
                <div
                  v-if="(visitBatchSentListMap[visitProduct.id]?.length || 0) === 1"
                  class="text-xs italic"
                >
                  Lô {{ visitBatchSentListMap[visitProduct.id][0].batch?.lotNumber }} - HSD
                  {{ timeToText(visitBatchSentListMap[visitProduct.id][0].batch?.expiryDate) }}
                </div>
              </div>
              <div v-if="!visitProduct.isSent">
                <div v-if="(visitBatchUnsentListMap[visitProduct.id]?.length || 0) >= 2">
                  <a-popconfirm>
                    <template #cancelButton>
                      <div></div>
                    </template>
                    <template #okButton>
                      <div></div>
                    </template>
                    <template #title>
                      <div>
                        <span>Chi tiết số lượng tính theo từng lô</span>
                      </div>
                      <div class="mt-2" style="max-width: 80vw; overflow: auto">
                        <table class="table-batch-select-quantity">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Số lô</th>
                              <th>HSD</th>
                              <th>Đ.Vị</th>
                              <th>Tồn</th>
                              <th>Số lượng</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(vbUnsent, vbUnsentIndex) in visitBatchUnsentListMap[
                                visitProduct.id
                              ]"
                              :key="vbUnsentIndex"
                            >
                              <td class="text-center">{{ vbUnsentIndex + 1 }}</td>
                              <td>{{ vbUnsent.batch.lotNumber }}</td>
                              <td>{{ timeToText(vbUnsent.batch.expiryDate) }}</td>
                              <td>
                                {{ visitProduct.product?.getUnitNameByRate(visitProduct.unitRate) }}
                              </td>
                              <td
                                class="text-center"
                                :class="
                                  vbUnsent.batch.quantity < vbUnsent.quantity
                                    ? 'font-bold text-red-500'
                                    : ''
                                "
                              >
                                {{ vbUnsent.batch.quantity / visitProduct.unitRate }}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  :class="
                                    vbUnsent.batch.quantity < vbUnsent.quantity
                                      ? 'text-red-500'
                                      : ''
                                  "
                                  :value="vbUnsent.quantity / visitProduct.unitRate"
                                  @input="
                                    (e) =>
                                      updateVisitBatchUnsentQuantity(
                                        visitProductIndex,
                                        vbUnsentIndex,
                                        Number((e.target as HTMLInputElement).value || 0) *
                                          visitProduct.unitRate
                                      )
                                  "
                                />
                              </td>
                            </tr>
                            <tr>
                              <td colspan="5" class="text-right" style="font-weight: 500">Tổng</td>
                              <td>
                                <input
                                  type="number"
                                  :value="visitProductList![visitProductIndex].unitQuantity"
                                  @input="
                                    (e) =>
                                      updateVisitProductQuantity(
                                        visitProductIndex,
                                        Number((e.target as HTMLInputElement)?.value || 0)
                                      )
                                  "
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </template>
                    <a class="text-xs italic underline">
                      {{ visitBatchUnsentListMap[visitProduct.id]?.length }} lô hàng
                    </a>
                  </a-popconfirm>
                </div>
                <div
                  v-if="(visitBatchUnsentListMap[visitProduct.id]?.length || 0) === 1"
                  class="text-xs italic"
                >
                  Lô {{ visitBatchUnsentListMap[visitProduct.id][0].batch!.lotNumber }} - HSD
                  {{ timeToText(visitBatchUnsentListMap[visitProduct.id][0].batch!.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td class="text-center">{{ visitProduct.unitName }}</td>
          <td class="text-center">{{ visitProduct.unitQuantityPrescription }}</td>
          <td class="text-center" style="width: 150px">
            <div
              v-if="
                visitProduct.isSent ||
                [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
              "
              class="text-center"
            >
              {{ visitProduct.unitQuantity }}
            </div>
            <div v-else class="flex items-center justify-between">
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="visitProductList![visitProductIndex].quantity <= 0"
                @click="
                  updateVisitProductQuantity(
                    visitProductIndex,
                    visitProductList![visitProductIndex].unitQuantity - 1
                  )
                "
              >
                <font-awesome-icon :icon="['fas', 'minus']" />
              </button>
              <div style="width: calc(100% - 60px); min-width: 50px">
                <InputNumber
                  :value="visitProductList![visitProductIndex].unitQuantity"
                  textAlign="right"
                  @update:value="(value) => updateVisitProductQuantity(visitProductIndex, value)"
                />
              </div>
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                @click="
                  updateVisitProductQuantity(
                    visitProductIndex,
                    visitProductList![visitProductIndex].unitQuantity + 1
                  )
                "
              >
                <font-awesome-icon :icon="['fas', 'plus']" />
              </button>
            </div>
          </td>
          <td class="text-right whitespace-nowrap">
            <div v-if="visitProduct.discountMoney" class="text-xs italic text-red-500">
              <del>{{ formatMoney(visitProduct.unitExpectedPrice) }}</del>
            </div>
            <div>{{ formatMoney(visitProduct.unitActualPrice) }}</div>
          </td>
          <td class="text-center" style="width: 40px">
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
                  <b>
                    {{ formatMoney(visitProduct.unitExpectedPrice) }}
                  </b>
                  )
                </div>
                <div class="mt-2">
                  <div>
                    <InputNumber
                      :value="visitProduct.unitDiscountMoney"
                      :disabled="
                        !!visitProduct.isSent ||
                        [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
                      "
                      append="VNĐ"
                      @update:value="
                        (e: number) => handleChangeProductDiscountMoney(e, visitProductIndex)
                      "
                    />
                  </div>
                  <div class="mt-2">
                    <div class="w-full">
                      <InputNumber
                        :value="visitProduct.discountPercent"
                        append="%"
                        :disabled="
                          !!visitProduct.isSent ||
                          [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
                        "
                        @update:value="
                          (e: number) => handleChangeProductDiscountPercent(e, visitProductIndex)
                        "
                      />
                    </div>
                  </div>
                </div>
              </template>
              <a-tag
                v-if="visitProduct.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer"
              >
                {{ formatMoney(visitProduct.unitDiscountMoney) }}
              </a-tag>
              <a-tag
                v-if="visitProduct.discountType === '%'"
                color="success"
                style="cursor: pointer"
              >
                {{ visitProduct.discountPercent || 0 }}%
              </a-tag>
            </a-popconfirm>
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(visitProduct.actualPrice * visitProduct.quantity) }}
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right" colspan="7">Tiền thuốc</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(productsMoney) }}
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right" colspan="7">Tổng tiền thanh toán</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(productsMoney + proceduresMoney) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-8 flex gap-4">
    <VueButton color="blue" @click="startPrint"><PrinterOutlined /> In hóa đơn</VueButton>
    <VueButton
      class="ml-auto"
      color="blue"
      :disabled="disabledSave"
      :loading="saveLoading"
      @click="saveVisitItems"
    >
      <template #icon> <SaveOutlined /> </template>
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped>
table.table-batch-select-quantity {
  border: 1px solid #ccc;
  th {
    border: 1px solid #ccc;
    padding: 0.5rem;
  }
  td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    input {
      border-top: 0;
      border-left: 0;
      border-right: 0;
      border-bottom: 1px solid #ccc;
    }
  }
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
