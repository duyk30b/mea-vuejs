<script lang="ts" setup>
import { FileSyncOutlined, MoreOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconDollar, IconFileSearch } from '../../../common/icon'
import { IconDelete } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputNumber } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus, DiscountType, PaymentViewType } from '../../../modules/enum'
import { Laboratory, LaboratoryService } from '../../../modules/laboratory'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtml, printHtmlCompiledTemplate, PrintHtmlService } from '../../../modules/print-html'
import { TicketStatus } from '../../../modules/ticket'
import {
  TicketClinicApi,
  ticketClinicRef,
  ticketRefDeliveryStatus,
} from '../../../modules/ticket-clinic'
import { TicketLaboratory } from '../../../modules/ticket-laboratory'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { TicketProduct } from '../../../modules/ticket-product'
import { TicketRadiology, TicketRadiologyStatus } from '../../../modules/ticket-radiology'
import { DDom, timeToText } from '../../../utils'
import ModalProcedureDetail from '../../master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalRadiologyDetail from '../../master-data/radiology/detail/ModalRadiologyDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicReturnProduct from './modal/ModalTicketClinicReturnProduct.vue'
import { useRoute, useRouter } from 'vue-router'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketClinicReturnProduct = ref<InstanceType<typeof ModalTicketClinicReturnProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const laboratoryMap = ref<Record<string, Laboratory>>({})

const ticketProductConsumableList = ref<TicketProduct[]>([])
const ticketProductPrescriptionList = ref<TicketProduct[]>([])
const ticketProcedureList = ref<TicketProcedure[]>([])
const ticketLaboratoryList = ref<TicketLaboratory[]>([])
const ticketRadiologyList = ref<TicketRadiology[]>([])

const ticketDiscount = reactive({
  discountPercent: 0,
  discountMoney: 0,
  discountType: DiscountType.VND,
})

const saveLoading = ref(false)
const sendProductLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicSummary.vue:46 ~ onMounted')
  laboratoryMap.value = await LaboratoryService.getMap()
})

watchEffect(() => {
  ticketDiscount.discountPercent = ticketClinicRef.value.discountPercent
  ticketDiscount.discountMoney = ticketClinicRef.value.discountMoney
  ticketDiscount.discountType = ticketClinicRef.value.discountType
})

watch(
  () => ticketClinicRef.value.ticketProductConsumableList,
  (newValue, oldValue) => {
    ticketProductConsumableList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)

watch(
  () => ticketClinicRef.value.ticketProductPrescriptionList,
  (newValue, oldValue) => {
    ticketProductPrescriptionList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketProcedureList,
  (newValue, oldValue) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketLaboratoryList,
  (newValue, oldValue) => {
    ticketLaboratoryList.value = TicketLaboratory.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketRadiologyList,
  (newValue, oldValue) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true }
)

const prescriptionMoney = ref(0)
const consumableMoney = ref(0)
const procedureMoney = ref(0)
const laboratoryMoney = ref(0)
const radiologyMoney = ref(0)
const prescriptionDiscount = ref(0)
const consumableDiscount = ref(0)
const procedureDiscount = ref(0)
const laboratoryDiscount = ref(0)
const radiologyDiscount = ref(0)
const itemsActualMoney = ref(0)
const itemsDiscount = ref(0)

watchEffect(() => {
  let prescriptionMoneyTemp = 0
  let consumableMoneyTemp = 0
  let procedureMoneyTemp = 0
  let laboratoryMoneyTemp = 0
  let radiologyMoneyTemp = 0
  let prescriptionDiscountTemp = 0
  let consumableDiscountTemp = 0
  let procedureDiscountTemp = 0
  let laboratoryDiscountTemp = 0
  let radiologyDiscountTemp = 0

  ticketProductPrescriptionList.value.forEach((item) => {
    prescriptionMoneyTemp += item.actualPrice * item.quantity
    prescriptionDiscountTemp += item.discountMoney * item.quantity
  })
  ticketProductConsumableList.value.forEach((item) => {
    consumableMoneyTemp += item.actualPrice * item.quantity
    consumableDiscountTemp += item.discountMoney * item.quantity
  })
  ticketProcedureList.value.forEach((item) => {
    procedureMoneyTemp += item.actualPrice * item.quantity
    procedureDiscountTemp += item.discountMoney * item.quantity
  })
  ticketLaboratoryList.value.forEach((item) => {
    laboratoryMoneyTemp += item.actualPrice
    laboratoryDiscountTemp += item.discountMoney
  })
  ticketRadiologyList.value.forEach((item) => {
    radiologyMoneyTemp += item.actualPrice
    radiologyDiscountTemp += item.discountMoney
  })
  const itemsDiscountTemp =
    prescriptionDiscountTemp +
    consumableDiscountTemp +
    procedureDiscountTemp +
    laboratoryDiscountTemp +
    radiologyDiscountTemp
  const itemsActualMoneyTemp =
    prescriptionMoneyTemp +
    consumableMoneyTemp +
    procedureMoneyTemp +
    laboratoryMoneyTemp +
    radiologyMoneyTemp

  prescriptionMoney.value = prescriptionMoneyTemp
  consumableMoney.value = consumableMoneyTemp
  procedureMoney.value = procedureMoneyTemp
  laboratoryMoney.value = laboratoryMoneyTemp
  radiologyMoney.value = radiologyMoneyTemp
  prescriptionDiscount.value = prescriptionDiscountTemp
  consumableDiscount.value = consumableDiscountTemp
  procedureDiscount.value = procedureDiscountTemp
  laboratoryDiscount.value = laboratoryDiscountTemp
  radiologyDiscount.value = radiologyDiscountTemp
  itemsDiscount.value = itemsDiscountTemp
  itemsActualMoney.value = itemsActualMoneyTemp
})

watch(
  () => itemsActualMoney.value,
  (newValue, oldValue) => {
    if (ticketDiscount.discountType === DiscountType.VND) {
      ticketDiscount.discountPercent =
        newValue == 0 ? 0 : Math.floor((ticketDiscount.discountMoney * 100) / newValue)
    }
    if (ticketDiscount.discountType === DiscountType.Percent) {
      ticketDiscount.discountMoney = Math.floor((ticketDiscount.discountPercent * newValue) / 100)
    }
  }
)

const disabledSave = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketClinicRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return false
  }
  if (
    !TicketProduct.equalList(
      ticketProductConsumableList.value,
      ticketClinicRef.value.ticketProductConsumableList || []
    )
  ) {
    return false
  }
  if (
    !TicketProcedure.equalList(
      ticketProcedureList.value,
      ticketClinicRef.value.ticketProcedureList || []
    )
  ) {
    return false
  }
  if (
    !TicketLaboratory.equalList(
      ticketLaboratoryList.value,
      ticketClinicRef.value.ticketLaboratoryList || []
    )
  ) {
    return false
  }
  if (
    !TicketRadiology.equalList(
      ticketRadiologyList.value,
      ticketClinicRef.value.ticketRadiologyList || []
    )
  ) {
    return false
  }
  if (
    ticketDiscount.discountMoney !== ticketClinicRef.value.discountMoney ||
    ticketDiscount.discountPercent !== ticketClinicRef.value.discountPercent ||
    ticketDiscount.discountType !== ticketClinicRef.value.discountType
  ) {
    console.log(
      '🚀 ~ file: TicketClinicSummary.vue:248 ~ disabledSave ~ ticketClinicRef:',
      ticketClinicRef
    )
    console.log(
      '🚀 ~ file: TicketClinicSummary.vue:248 ~ disabledSave ~ ticketDiscount:',
      ticketDiscount
    )
    return false
  }
  console.log('🚀 ~ file: TicketClinicSummary.vue:252 ~ disabledSave ~ 7:', true)
  return true
})

const disableSendProduct = computed(() => {
  // chỉ được phép khi ở trạng thái đang khám (Executing)
  if (ticketClinicRef.value.ticketStatus !== TicketStatus.Executing) {
    return true
  }
  // chỉ được phép khi có hàng chưa gửi (Pending)
  if (ticketRefDeliveryStatus.value !== DeliveryStatus.Pending) {
    return true
  }

  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketClinicRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductConsumableList.value,
      ticketClinicRef.value.ticketProductConsumableList || []
    )
  ) {
    return true
  }
  return false
})

const handleChangeTicketProcedureDiscountMoney = (discountMoney: number, index: number) => {
  const expectedPrice = ticketProcedureList.value[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProcedureList.value[index].discountMoney = discountMoney
  ticketProcedureList.value[index].discountPercent = discountPercent
  ticketProcedureList.value[index].actualPrice = actualPrice
  ticketProcedureList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProcedureDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketProcedureList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProcedureList.value[index].discountPercent = discountPercent
  ticketProcedureList.value[index].discountMoney = discountMoney
  ticketProcedureList.value[index].actualPrice = actualPrice
  ticketProcedureList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketLaboratoryDiscountMoney = (discountMoney: number, index: number) => {
  const expectedPrice = ticketLaboratoryList.value[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketLaboratoryList.value[index].discountMoney = discountMoney
  ticketLaboratoryList.value[index].discountPercent = discountPercent
  ticketLaboratoryList.value[index].actualPrice = actualPrice
  ticketLaboratoryList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketLaboratoryDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketLaboratoryList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketLaboratoryList.value[index].discountPercent = discountPercent
  ticketLaboratoryList.value[index].discountMoney = discountMoney
  ticketLaboratoryList.value[index].actualPrice = actualPrice
  ticketLaboratoryList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketRadiologyDiscountMoney = (discountMoney: number, index: number) => {
  const expectedPrice = ticketRadiologyList.value[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketRadiologyList.value[index].discountMoney = discountMoney
  ticketRadiologyList.value[index].discountPercent = discountPercent
  ticketRadiologyList.value[index].actualPrice = actualPrice
  ticketRadiologyList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketRadiologyDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketRadiologyList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketRadiologyList.value[index].discountPercent = discountPercent
  ticketRadiologyList.value[index].discountMoney = discountMoney
  ticketRadiologyList.value[index].actualPrice = actualPrice
  ticketRadiologyList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketProductPrescriptionDiscountMoney = (data: number, index: number) => {
  const expectedPrice = ticketProductPrescriptionList.value[index].expectedPrice || 0
  const discountMoney = data / ticketProductPrescriptionList.value[index].unitRate
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProductPrescriptionList.value[index].discountMoney = discountMoney
  ticketProductPrescriptionList.value[index].discountPercent = discountPercent
  ticketProductPrescriptionList.value[index].actualPrice = actualPrice
  ticketProductPrescriptionList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProductPrescriptionDiscountPercent = (
  discountPercent: number,
  index: number
) => {
  const expectedPrice = ticketProductPrescriptionList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProductPrescriptionList.value[index].discountPercent = discountPercent
  ticketProductPrescriptionList.value[index].discountMoney = discountMoney
  ticketProductPrescriptionList.value[index].actualPrice = actualPrice
  ticketProductPrescriptionList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketProductConsumableDiscountMoney = (data: number, index: number) => {
  const expectedPrice = ticketProductConsumableList.value[index].expectedPrice || 0
  const discountMoney = data / ticketProductConsumableList.value[index].unitRate
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProductConsumableList.value[index].discountMoney = discountMoney
  ticketProductConsumableList.value[index].discountPercent = discountPercent
  ticketProductConsumableList.value[index].actualPrice = actualPrice
  ticketProductConsumableList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProductConsumableDiscountPercent = (
  discountPercent: number,
  index: number
) => {
  const expectedPrice = ticketProductConsumableList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProductConsumableList.value[index].discountPercent = discountPercent
  ticketProductConsumableList.value[index].discountMoney = discountMoney
  ticketProductConsumableList.value[index].actualPrice = actualPrice
  ticketProductConsumableList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketDiscountMoney = (discountMoney: number) => {
  ticketDiscount.discountType = DiscountType.VND
  ticketDiscount.discountMoney = discountMoney
  ticketDiscount.discountPercent =
    itemsActualMoney.value == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney.value)
}

const handleChangeTicketDiscountPercent = (discountPercent: number) => {
  ticketDiscount.discountType = DiscountType.Percent
  ticketDiscount.discountPercent = discountPercent
  ticketDiscount.discountMoney = Math.floor((discountPercent * itemsActualMoney.value) / 100)
}

const updateTicketProductConsumableQuantity = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductConsumableList.value[index]

  ticketProductCurrent.unitQuantity = unitQuantity

  // tính costAmount
  let itemCostAmount = 0
  if (ticketProductCurrent.batchId) {
    itemCostAmount = ticketProductCurrent.quantity * ticketProductCurrent.batch!.costPrice
  } else if (ticketProductCurrent.product!.quantity <= 0) {
    itemCostAmount = (ticketProductCurrent.product?.costPrice || 0) * ticketProductCurrent.quantity
  } else {
    itemCostAmount =
      (ticketProductCurrent.product!.costAmount * ticketProductCurrent.quantity) /
      ticketProductCurrent.product!.quantity
  }
  const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10

  ticketProductCurrent.costAmount = itemCostAmountFix
}

const updateTicketProductPrescriptionQuantity = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductPrescriptionList.value[index]

  ticketProductCurrent.unitQuantity = unitQuantity

  // tính costAmount
  let itemCostAmount = 0
  if (ticketProductCurrent.batchId) {
    itemCostAmount = ticketProductCurrent.quantity * ticketProductCurrent.batch!.costPrice
  } else if (ticketProductCurrent.product!.quantity <= 0) {
    itemCostAmount = (ticketProductCurrent.product?.costPrice || 0) * ticketProductCurrent.quantity
  } else {
    itemCostAmount =
      (ticketProductCurrent.product!.costAmount * ticketProductCurrent.quantity) /
      ticketProductCurrent.product!.quantity
  }
  const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10

  ticketProductCurrent.costAmount = itemCostAmountFix
}

const saveTicketItemsMoney = async () => {
  saveLoading.value = true
  try {
    const prescriptionChangeList = ticketProductPrescriptionList.value.filter((item, index) => {
      return !TicketProduct.equal(item, ticketClinicRef.value.ticketProductPrescriptionList![index])
    })
    const consumableChangeList = ticketProductConsumableList.value.filter((item, index) => {
      return !TicketProduct.equal(item, ticketClinicRef.value.ticketProductConsumableList![index])
    })

    await TicketClinicApi.updateItemsMoney({
      ticketId: ticketClinicRef.value.id,
      itemsActualMoney: itemsActualMoney.value,
      discountMoney: ticketDiscount.discountMoney,
      discountPercent: ticketDiscount.discountPercent,
      discountType: ticketDiscount.discountType,
      ticketProductList: [...prescriptionChangeList, ...consumableChangeList],
      ticketProcedureList: ticketProcedureList.value.filter((item, index) => {
        return !TicketProcedure.equal(item, ticketClinicRef.value.ticketProcedureList![index])
      }),
      ticketRadiologyList: ticketRadiologyList.value.filter((item, index) => {
        return !TicketRadiology.equal(item, ticketClinicRef.value.ticketRadiologyList![index])
      }),
      ticketLaboratoryList: ticketLaboratoryList.value.filter((item, index) => {
        return !TicketLaboratory.equal(item, ticketClinicRef.value.ticketLaboratoryList![index])
      }),
    })
  } catch (e) {
    console.log('🚀 ~ file: TicketClinicSummary.vue:321 ~ saveTicketItemsMoney ~ e:', e)
  } finally {
    saveLoading.value = false
  }
}

const validateQuantity = () => {
  if (settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
    return true
  }

  const ticketProductUnsentList = [
    ...ticketProductConsumableList.value,
    ...ticketProductPrescriptionList.value,
  ].filter((i) => {
    return i.deliveryStatus === DeliveryStatus.Pending
  })

  for (let i = 0; i < ticketProductUnsentList.length; i++) {
    const ticketProductUnsent = ticketProductUnsentList[i]
    const { product, batch } = ticketProductUnsent

    if (!product?.hasManageQuantity) continue

    if (ticketProductUnsent.quantity > (product?.quantity || 0)) {
      AlertStore.addError(
        `Sản phẩm ${product?.brandName} không đủ ` +
          `(tồn ${product?.quantity || 0} - lấy ${ticketProductUnsent.quantity})`
      )
      return false
    }

    if (product?.hasManageBatches) {
      if (ticketProductUnsent.quantity > (batch?.quantity || 0)) {
        AlertStore.addError(
          `Lô hàng ${timeToText(batch!.expiryDate)} của Sản phẩm ${product?.brandName} ` +
            `không đủ (tồn ${batch!.quantity} - lấy ${ticketProductUnsent.quantity})`
        )
        return false
      }
    }
  }
  return true
}

const startSendProduct = async () => {
  sendProductLoading.value = true
  try {
    if (!validateQuantity()) return
    await TicketClinicApi.sendProduct({ ticketId: ticketClinicRef.value.id })
  } catch (error) {
    console.log('🚀 ~ file: VisitPayment.vue:301 ~ startSendProduct ~ error:', error)
  } finally {
    sendProductLoading.value = false
  }
}

const startReopenVisit = async () => {
  await TicketClinicApi.reopen(ticketClinicRef.value.id)
}

const clickReopenTicket = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    content: [
      ...(ticketClinicRef.value.debt > 0
        ? [
            `- Số tiền nợ sẽ được hoàn trả, khi đóng hồ sơ lại sẽ ghi nợ trở lại`,
            `- Trừ nợ khách hàng: ${formatMoney(ticketClinicRef.value.debt)}`,
          ]
        : ['- Hồ sơ này sẽ quay lại trạng thái: "Đang khám"']),
    ],
    async onOk() {
      await startReopenVisit()
    },
  })
}

const clickDestroyTicket = () => {
  if ([TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.value.ticketStatus)) {
    return ModalStore.alert({
      title: 'Phiếu khám đã đóng',
      content: ['- Bắt buộc MỞ LẠI hồ sơ trước khi HỦY phiếu khám'],
    })
  }

  if (ticketRefDeliveryStatus.value === DeliveryStatus.Delivered) {
    return ModalStore.alert({
      title: 'Đã xuất thuốc - vật tư',
      content: ['- Bắt buộc HOÀN TRẢ thuốc và vật tư trước khi HỦY phiếu khám'],
    })
  }
  if (
    (ticketClinicRef.value.ticketRadiologyList || []).find(
      (i) => i.status == TicketRadiologyStatus.Completed
    )
  ) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh đã được thực hiện ?',
      content: 'Cần HỦY KẾT QUẢ phiếu CĐHA trước khi HỦY phiếu khám',
    })
  }

  if (ticketClinicRef.value.paid > 0) {
    return ModalStore.alert({
      title: 'Khách hàng còn tiền tạm ứng',
      content: 'Cần HOÀN TRẢ tất cả tiền đã thanh toán trước khi HỦY phiếu khám',
    })
  }

  return ModalStore.confirm({
    title: 'Bạn có chắc chắn HỦY phiếu khám này',
    content: ['- Phiếu khám khi đã xóa không thể phục hồi lại được.', `- Vẫn hủy phiếu khám.`],
    okText: 'Xác nhận HỦY phiếu',
    async onOk() {
      await TicketClinicApi.destroy(ticketClinicRef.value.id)
      router.push({ name: 'TicketClinicList' })
    },
  })
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'RETURN_PRODUCT_LIST') {
    if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
      return ModalStore.alert({
        title: 'Trạng thái hồ sơ không hợp lệ ?',
        content: 'Cần mở lại hồ sơ trước khi hoàn trả',
      })
    } else {
      modalTicketClinicReturnProduct.value?.openModal()
    }
  }
  if (menu.key === 'REFUND_OVERPAID') {
    modalTicketClinicPayment.value?.openModal(PaymentViewType.RefundOverpaid)
  }
  if (menu.key === 'REOPEN_TICKET') {
    clickReopenTicket()
  }
  if (menu.key === 'DESTROY_TICKET') {
    clickDestroyTicket()
  }
}

const startPrint = async () => {
  try {
    // const response = await fetch('/template/visit-invoice.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketClinicRef.value,
    // })

    let printHtmlId = settingStore.TICKET_CLINIC_DETAIL.printHtmlIdSetting.invoice
    let printHtml: PrintHtml | undefined
    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.invoice
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      masterData: { laboratoryMap: laboratoryMap.value },
      printHtml: printHtml!,
    })

    await DDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:421 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketClinicReturnProduct ref="modalTicketClinicReturnProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <div class="mt-4 flex gap-4">
    <VueButton
      class="ml-auto"
      color="green"
      :disabled="disableSendProduct"
      :loading="sendProductLoading"
      icon="send"
      @click="startSendProduct">
      <span class="font-bold">XUẤT THUỐC - VẬT TƯ</span>
    </VueButton>
    <VueButton
      v-if="
        [TicketStatus.Approved, TicketStatus.Executing].includes(ticketClinicRef.ticketStatus) &&
        ticketClinicRef.paid > ticketClinicRef.totalMoney
      "
      icon="dollar"
      size="small"
      color="green"
      @click="modalTicketClinicPayment?.openModal(PaymentViewType.RefundOverpaid)">
      <span class="font-bold">HOÀN TIỀN</span>
    </VueButton>
    <div class="flex items-center">
      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item key="REFUND_OVERPAID">
              <span class="text-red-500">
                <IconDollar class="mr-2" />
                Hoàn trả tiền
              </span>
            </a-menu-item>
            <a-menu-item key="RETURN_PRODUCT_LIST">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Hoàn trả thuốc - vật tư
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
              "
              key="REOPEN_TICKET">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Mở lại phiếu khám
              </span>
            </a-menu-item>
            <a-menu-item key="DESTROY_TICKET">
              <span class="text-red-500">
                <IconDelete class="mr-2" />
                Xóa phiếu
              </span>
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
      <template v-if="ticketProductPrescriptionList.length">
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
            v-for="(tpPrescription, tpPrescriptionIndex) in ticketProductPrescriptionList"
            :key="tpPrescription.id + '_' + tpPrescriptionIndex">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ tpPrescriptionIndex + 1 }}
            </td>
            <td>
              <div class="flex items-center gap-1" style="font-weight: 500">
                <span>{{ tpPrescription.product?.brandName }}</span>
                <a
                  style="line-height: 0"
                  @click="modalProductDetail?.openModal(tpPrescription.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="tpPrescription.product?.substance" class="text-xs italic">
                {{ tpPrescription.product.substance }}
              </div>
              <div v-if="tpPrescription.batchId" class="text-xs italic">
                Lô {{ tpPrescription.batch?.lotNumber }} - HSD
                {{ timeToText(tpPrescription.batch?.expiryDate) }}
              </div>
            </td>
            <td class="text-center">{{ tpPrescription.unitName }}</td>
            <td class="text-center">{{ tpPrescription.unitQuantityPrescription }}</td>
            <td class="text-center" style="width: 150px">
              <div
                v-if="
                  tpPrescription.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
                "
                class="text-center">
                {{ tpPrescription.unitQuantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpPrescription.quantity <= 0"
                  @click="
                    updateTicketProductPrescriptionQuantity(
                      tpPrescriptionIndex,
                      tpPrescription.unitQuantity - 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpPrescription.unitQuantity"
                    textAlign="right"
                    @update:value="
                      (value) => updateTicketProductPrescriptionQuantity(tpPrescriptionIndex, value)
                    " />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="
                    updateTicketProductPrescriptionQuantity(
                      tpPrescriptionIndex,
                      tpPrescription.unitQuantity + 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpPrescription.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpPrescription.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpPrescription.unitActualPrice) }}</div>
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
                    <b>{{ formatMoney(tpPrescription.unitExpectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="tpPrescription.unitDiscountMoney"
                        :disabled="
                          tpPrescription.deliveryStatus === DeliveryStatus.Delivered ||
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        append="VNĐ"
                        @update:value="
                          (e: number) =>
                            handleChangeTicketProductPrescriptionDiscountMoney(
                              e,
                              tpPrescriptionIndex
                            )
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="tpPrescription.discountPercent"
                          append="%"
                          :disabled="
                            tpPrescription.deliveryStatus === DeliveryStatus.Delivered ||
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) =>
                              handleChangeTicketProductPrescriptionDiscountPercent(
                                e,
                                tpPrescriptionIndex
                              )
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="tpPrescription.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(tpPrescription.unitDiscountMoney) }}
                </a-tag>
                <a-tag
                  v-if="tpPrescription.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ tpPrescription.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpPrescription.actualPrice * tpPrescription.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền thuốc</span>
                <span v-if="prescriptionDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(prescriptionDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(prescriptionMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketProductConsumableList.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="2">VẬT TƯ</th>
            <th>Đ.Vị</th>
            <th>SL</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(tpConsumable, tpConsumableIndex) in ticketProductConsumableList"
            :key="tpConsumable.id + '_' + tpConsumableIndex">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ tpConsumableIndex + 1 }}
            </td>
            <td colspan="2">
              <div class="flex items-center gap-1" style="font-weight: 500">
                <span>{{ tpConsumable.product?.brandName }}</span>
                <a
                  style="line-height: 0"
                  @click="modalProductDetail?.openModal(tpConsumable.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="tpConsumable.product?.substance" class="text-xs italic">
                {{ tpConsumable.product.substance }}
              </div>
              <div v-if="tpConsumable.batchId" class="text-xs italic">
                Lô {{ tpConsumable.batch?.lotNumber }} - HSD
                {{ timeToText(tpConsumable.batch?.expiryDate) }}
              </div>
            </td>
            <td class="text-center">{{ tpConsumable.unitName }}</td>
            <td class="text-center" style="width: 150px">
              <div
                v-if="
                  tpConsumable.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
                "
                class="text-center">
                {{ tpConsumable.unitQuantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpConsumable.quantity <= 0"
                  @click="
                    updateTicketProductConsumableQuantity(
                      tpConsumableIndex,
                      tpConsumable.unitQuantity - 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpConsumable.unitQuantity"
                    textAlign="right"
                    @update:value="
                      (value) => updateTicketProductConsumableQuantity(tpConsumableIndex, value)
                    " />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="
                    updateTicketProductConsumableQuantity(
                      tpConsumableIndex,
                      tpConsumable.unitQuantity + 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpConsumable.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpConsumable.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpConsumable.unitActualPrice) }}</div>
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
                    <b>{{ formatMoney(tpConsumable.unitExpectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="tpConsumable.unitDiscountMoney"
                        :disabled="
                          tpConsumable.deliveryStatus === DeliveryStatus.Delivered ||
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        append="VNĐ"
                        @update:value="
                          (e: number) =>
                            handleChangeTicketProductConsumableDiscountMoney(e, tpConsumableIndex)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="tpConsumable.discountPercent"
                          append="%"
                          :disabled="
                            tpConsumable.deliveryStatus === DeliveryStatus.Delivered ||
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) =>
                              handleChangeTicketProductConsumableDiscountPercent(
                                e,
                                tpConsumableIndex
                              )
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="tpConsumable.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(tpConsumable.unitDiscountMoney) }}
                </a-tag>
                <a-tag
                  v-if="tpConsumable.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ tpConsumable.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpConsumable.actualPrice * tpConsumable.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền vật tư</span>
                <span v-if="consumableDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(consumableDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(consumableMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketProcedureList.length">
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
          <tr v-for="(ticketProcedure, index) in ticketProcedureList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="3">
              <div class="flex items-center gap-1">
                <span>{{ ticketProcedure.procedure?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="modalProcedureDetail?.openModal(ticketProcedure.procedure!)">
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td class="text-center">{{ ticketProcedure.quantity }}</td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
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
                    <b>{{ formatMoney(ticketProcedure.expectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="ticketProcedure.discountMoney"
                        append="VNĐ"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="
                          (e: number) => handleChangeTicketProcedureDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketProcedure.discountPercent"
                          append="%"
                          :disabled="
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) => handleChangeTicketProcedureDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="ticketProcedure.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(ticketProcedure.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="ticketProcedure.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ ticketProcedure.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền dịch vụ</span>
                <span v-if="procedureDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(procedureDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(procedureMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketLaboratoryList.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="4" style="text-transform: uppercase">Xét nghiệm</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketLaboratory, index) in ticketLaboratoryList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="4">
              <div class="flex items-center gap-1">
                <span>{{ laboratoryMap[ticketLaboratory.laboratoryId]?.name }}</span>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketLaboratory.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketLaboratory.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketLaboratory.actualPrice) }}</div>
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
                    <b>{{ formatMoney(ticketLaboratory.expectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="ticketLaboratory.discountMoney"
                        append="VNĐ"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="
                          (e: number) => handleChangeTicketLaboratoryDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketLaboratory.discountPercent"
                          append="%"
                          :disabled="
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) => handleChangeTicketLaboratoryDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="ticketLaboratory.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(ticketLaboratory.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="ticketLaboratory.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ ticketLaboratory.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketLaboratory.actualPrice) }}
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền xét nghiệm</span>
                <span v-if="laboratoryDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(laboratoryDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(laboratoryMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketRadiologyList.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="4">CHẨN ĐOÁN HÌNH ẢNH</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketRadiology, index) in ticketRadiologyList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="4">
              <div class="flex items-center gap-1">
                <span>{{ ticketRadiology.radiology?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="modalRadiologyDetail?.openModal(ticketRadiology.radiology!)">
                  <IconFileSearch />
                </a>
                <a-tag
                  v-if="ticketRadiology.status === TicketRadiologyStatus.Pending"
                  color="warning"
                  style="cursor: pointer">
                  Chưa hoàn thành
                </a-tag>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
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
                    <b>{{ formatMoney(ticketRadiology.expectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="ticketRadiology.discountMoney"
                        append="VNĐ"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="
                          (e: number) => handleChangeTicketRadiologyDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketRadiology.discountPercent"
                          append="%"
                          :disabled="
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) => handleChangeTicketRadiologyDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="ticketRadiology.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(ticketRadiology.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="ticketRadiology.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ ticketRadiology.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketRadiology.actualPrice) }}
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền CĐHA</span>
                <span v-if="radiologyDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(radiologyDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(radiologyMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr>
          <td class="text-right" colspan="7">
            <div class="flex items-center justify-end gap-2">
              <span>Tổng cộng</span>
              <span v-if="itemsDiscount" class="italic" style="font-size: 13px">
                (CK: {{ formatMoney(itemsDiscount) }})
              </span>
            </div>
          </td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(itemsActualMoney) }}
          </td>
        </tr>
        <tr>
          <td class="text-right" colspan="7">Chiết khấu</td>
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
                  Chiết khấu (Tổng tiền hiện tại:
                  <b>{{ formatMoney(itemsActualMoney) }}</b>
                  )
                </div>
                <div class="mt-2">
                  <div>
                    <InputNumber
                      :value="ticketDiscount.discountMoney"
                      append="VNĐ"
                      :disabled="
                        [TicketStatus.Debt, TicketStatus.Completed].includes(
                          ticketClinicRef.ticketStatus
                        )
                      "
                      @update:value="handleChangeTicketDiscountMoney" />
                  </div>
                  <div class="mt-2">
                    <div class="w-full">
                      <InputNumber
                        :value="ticketDiscount.discountPercent"
                        append="%"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="handleChangeTicketDiscountPercent" />
                    </div>
                  </div>
                </div>
              </template>
              <a-tag
                v-if="ticketDiscount.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(ticketDiscount.discountMoney) }}
              </a-tag>
              <a-tag
                v-if="ticketDiscount.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ ticketDiscount.discountPercent || 0 }}%
              </a-tag>
            </a-popconfirm>
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right font-bold" colspan="7">Tổng tiền</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(itemsActualMoney - ticketDiscount.discountMoney) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-8 flex gap-4">
    <VueButton color="blue" icon="print" @click="startPrint">In hóa đơn</VueButton>
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_ITEMS_MONEY]"
      class="ml-auto"
      color="blue"
      :disabled="disabledSave"
      :loading="saveLoading"
      icon="save"
      @click="saveTicketItemsMoney">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
