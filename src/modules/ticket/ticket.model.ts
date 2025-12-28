import { ESArray, ESTimer } from '../../utils'
import { Appointment } from '../appointment'
import { Batch } from '../batch'
import { Customer } from '../customer'
import { CustomerSource } from '../customer-source'
import { DeliveryStatus, DiscountType } from '../enum'
import { Expense } from '../expense'
import { Image } from '../image/image.model'
import { Payment } from '../payment'
import { PositionType } from '../position'
import { Procedure } from '../procedure'
import { Product } from '../product'
import { Surcharge } from '../surcharge'
import { TicketAttribute, type TicketAttributeMap } from '../ticket-attribute'
import { TicketBatch } from '../ticket-batch'
import { TicketExpense } from '../ticket-expense/ticket-expense.model'
import {
  TicketLaboratory,
  TicketLaboratoryGroup,
  TicketLaboratoryResult,
  TicketLaboratoryService,
} from '../ticket-laboratory'
import { TicketProcedureService } from '../ticket-procedure'
import { TicketProcedure, TicketProcedureType } from '../ticket-procedure/ticket-procedure.model'
import { TicketProductService } from '../ticket-product'
import { TicketProduct, TicketProductType } from '../ticket-product/ticket-product.model'
import { TicketRadiology, TicketRadiologyService } from '../ticket-radiology'
import type { TicketReception } from '../ticket-reception'
import { TicketRegimen, TicketRegimenItem, TicketRegimenService } from '../ticket-regimen'
import { TicketSurchargeService } from '../ticket-surcharge'
import { TicketSurcharge } from '../ticket-surcharge/ticket-surcharge.model'
import { TicketUser, TicketUserService } from '../ticket-user'
import type { TicketPaymentDetail } from './ticket-payment-detail.model'

export enum TicketStatus {
  Schedule = 1,
  Draft = 2,
  Deposited = 3,
  Executing = 4,
  Debt = 5,
  Completed = 6,
  Cancelled = 7,
}

export class Ticket {
  id: string
  customerId: number
  roomId: number
  customerSourceId: number

  isPaymentEachItem: number
  status: TicketStatus
  deliveryStatus: DeliveryStatus

  itemsCostAmount: number
  procedureMoney: number
  productMoney: number
  radiologyMoney: number
  laboratoryMoney: number
  itemsActualMoney: number
  itemsDiscount: number
  itemsDiscountProduct: number // chỉ convert ở front-end
  itemsDiscountProcedure: number // chỉ convert ở front-end

  discountMoney: number
  discountPercent: number
  discountType: DiscountType

  surcharge: number // Phụ phí
  totalMoney: number // Doanh thu = procedureMoney + productMoney + phụ phí - tiền giảm giá
  expense: number
  commissionMoney: number
  profit: number
  paidTotal: number
  debtTotal: number

  imageDiagnosisIds: string

  year: number
  month: number
  date: number
  dailyIndex: number

  note: string

  createdAt: number // Giờ đăng ký khám
  receptionAt: number | null // Giờ vào khám
  endedAt: number

  customer?: Customer
  paymentList?: Payment[]
  customerSource?: CustomerSource
  toAppointment?: Appointment

  ticketReceptionList?: TicketReception[]

  ticketAttributeList?: TicketAttribute[]
  ticketSurchargeList?: TicketSurcharge[]
  ticketExpenseList?: TicketExpense[]

  ticketBatchList?: TicketBatch[]
  ticketProductList?: TicketProduct[]
  ticketProductConsumableList?: TicketProduct[]
  ticketProductPrescriptionList?: TicketProduct[]

  ticketProcedureList?: TicketProcedure[]
  ticketProcedureNormalList?: TicketProcedure[]
  ticketRegimenList?: TicketRegimen[]
  ticketRegimenItemList?: TicketRegimenItem[]

  ticketLaboratoryList?: TicketLaboratory[]
  ticketLaboratoryGroupList?: TicketLaboratoryGroup[]
  ticketLaboratoryResultList?: TicketLaboratoryResult[]

  ticketRadiologyList?: TicketRadiology[]

  ticketUserReceptionList?: TicketUser[]
  ticketUserList?: TicketUser[]
  ticketUserTree: Record<string, Record<string, TicketUser[]>> // ticketUserTree[positionType][ticketItemId] = []

  imageList: Image[]
  imageMap: Record<string, Image>
  imageDiagnosisList: Image[]

  ticketPaymentDetail: TicketPaymentDetail
  ticketAttributeMap: TicketAttributeMap // chỉ convert tại front-end

  get itemsCostAmountExpected() {
    let itemsCostAmount = 0
    this.ticketProductList?.forEach((item) => {
      itemsCostAmount += (item.product?.costPrice || 0) * item.quantity
    })
    return itemsCostAmount
  }

  get profitExpected() {
    return this.totalMoney - this.expense - this.itemsCostAmountExpected
  }

  static init(): Ticket {
    const ins = new Ticket()
    ins.id = ''
    ins.roomId = 0
    ins.status = TicketStatus.Draft
    ins.itemsCostAmount = 0
    ins.procedureMoney = 0
    ins.productMoney = 0
    ins.radiologyMoney = 0
    ins.laboratoryMoney = 0
    ins.discountMoney = 0
    ins.discountPercent = 0
    ins.discountType = DiscountType.Percent
    ins.surcharge = 0
    ins.totalMoney = 0
    ins.expense = 0
    ins.profit = 0
    ins.paidTotal = 0
    ins.debtTotal = 0
    ins.note = ''
    return ins
  }

  static blank(): Ticket {
    const ins = Ticket.init()
    ins.customer = Customer.init() // Uncaught ReferenceError: Cannot access 'Customer' before initialization
    ins.paymentList = []

    ins.ticketReceptionList = []

    ins.ticketAttributeList = []
    ins.ticketAttributeMap = {}
    ins.ticketSurchargeList = [TicketSurcharge.init()]
    ins.ticketExpenseList = [TicketExpense.init()]

    ins.ticketBatchList = []
    ins.ticketProductList = []

    ins.ticketProcedureList = []
    ins.ticketRegimenList = []

    ins.ticketLaboratoryList = []
    ins.ticketLaboratoryGroupList = []
    ins.ticketLaboratoryResultList = []

    ins.ticketRadiologyList = []

    ins.ticketUserReceptionList = []
    ins.ticketUserList = []
    ins.ticketUserTree = { [PositionType.Reception]: { 0: [] } } // ticketUserTree[positionType][ticketItemId] = []

    ins.imageList = []
    ins.imageMap = {}
    ins.imageDiagnosisList = []
    return ins
  }

  static basic(source: Ticket) {
    const target = new Ticket()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Ticket[]): Ticket[] {
    return sources.map((i) => Ticket.basic(i))
  }

  refreshImageMap() {
    this.imageMap = ESArray.arrayToKeyValue(this.imageList || [], 'id')
  }

  refreshTicketAttribute() {
    const ticketAttributeMap: TicketAttributeMap = {}
    this.ticketAttributeList?.forEach((i) => {
      ticketAttributeMap[i.key] = i.value
    })
    this.ticketAttributeMap = ticketAttributeMap
  }

  refreshTicketUser() {
    if (!this.ticketUserList) return

    this.ticketUserList.sort((a, b) => {
      if (a.positionType < b.positionType) return -1
      if (a.positionType > b.positionType) return 1
      if (a.ticketItemId < b.ticketItemId) return -1
      if (a.ticketItemId > b.ticketItemId) return 1
      if (a.roleId < b.roleId) return -1
      if (a.roleId > b.roleId) return 1
      return -1
    })

    this.ticketUserTree = {}
    this.ticketUserList?.forEach((i) => {
      this.ticketUserTree[i.positionType] ||= {}
      this.ticketUserTree[i.positionType][i.ticketItemId] ||= []
      this.ticketUserTree[i.positionType][i.ticketItemId].push(i)
    })
  }

  refreshTicketUserRelationTicketItem() {
    this.ticketUserList?.forEach((tu) => {
      if ([PositionType.RegimenRequest].includes(tu.positionType)) {
        tu.ticketRegimen = (this.ticketRegimenList || []).find((tp) => {
          return tp.id === tu.ticketItemId
        })
      }
      if ([PositionType.ProcedureRequest, PositionType.ProcedureResult].includes(tu.positionType)) {
        tu.ticketProcedure = (this.ticketProcedureList || []).find((tp) => {
          return tp.id === tu.ticketItemId
        })
      }
    })
  }

  refreshTicketProduct() {
    if (!this.ticketProductList) return // không để !this.ticketProductList.length, vì thằng dưới còn filter

    if (this.ticketBatchList) {
      this.ticketProductList.forEach((tp) => {
        tp.ticketBatchList = this.ticketBatchList!.filter((tb) => {
          return tp.id === tb.ticketProductId
        })
      })
    }

    this.ticketProductConsumableList = this.ticketProductList.filter((i) => {
      return i.type === TicketProductType.Consumable
    })
    this.ticketProductPrescriptionList = this.ticketProductList.filter((i) => {
      return i.type === TicketProductType.Prescription
    })
  }

  refreshTicketProcedureAndRegimen() {
    if (!this.ticketProcedureList && !this.ticketRegimenList) return // không để !this.ticketProcedureList.length, vì thằng dưới còn filter
    this.ticketProcedureList?.forEach((tp) => {
      tp.ticketUserRequestList = this.ticketUserTree?.[PositionType.ProcedureRequest]?.[tp.id] || []
      tp.ticketUserResultList = this.ticketUserTree?.[PositionType.ProcedureResult]?.[tp.id] || []
      try {
        const imageIdList: number[] = JSON.parse(tp.imageIds || '[]')
        tp.imageList = imageIdList.map((imageId) => {
          return this.imageMap[imageId]
        })
      } catch (error) {
        tp.imageList = []
      }
      tp.ticketProductProcedureList = (this.ticketProductList || []).filter((i) => {
        return i.type === TicketProductType.Procedure && i.ticketProcedureId === tp.id
      })
    })
    this.ticketProcedureNormalList = this.ticketProcedureList?.filter((i) => {
      return i.ticketProcedureType === TicketProcedureType.Normal
    })

    this.ticketRegimenList?.forEach((tr) => {
      tr.ticketUserRequestList = this.ticketUserTree?.[PositionType.RegimenRequest]?.[tr.id] || []
      tr.ticketRegimenItemList = (this.ticketRegimenItemList || []).filter((i) => {
        return i.ticketRegimenId === tr.id
      })
      tr.ticketRegimenItemList.forEach((tri) => {
        tri.ticketProcedureList = this.ticketProcedureList?.filter((i) => {
          return (
            i.ticketProcedureType === TicketProcedureType.InRegimen &&
            i.ticketRegimenId === tr.id &&
            i.ticketRegimenItemId === tri.id
          )
        })
      })

      tr.ticketProcedureList = this.ticketProcedureList?.filter((i) => {
        return (
          i.ticketProcedureType === TicketProcedureType.InRegimen && i.ticketRegimenId === tr.id
        )
      })
      tr.ticketProcedureSessionMap = {}
      tr.ticketProcedureList?.sort((a, b) => (a.id < b.id ? -1 : 1))
      tr.ticketProcedureList?.forEach((tp) => {
        const sessionKey = ESTimer.timeToText(tp.createdAt, 'YYYY/MM/DD')
        tr.ticketProcedureSessionMap[sessionKey] ||= []
        tr.ticketProcedureSessionMap[sessionKey].push(tp)
      })
    })
  }

  refreshTicketRadiology() {
    if (!this.ticketRadiologyList?.length) return

    this.ticketRadiologyList.forEach((tr) => {
      tr.ticketUserRequestList = this.ticketUserTree?.[PositionType.RadiologyRequest]?.[tr.id] || []
      tr.ticketUserResultList = this.ticketUserTree?.[PositionType.RadiologyResult]?.[tr.id] || []

      try {
        const imageIdList: number[] = JSON.parse(tr.imageIds || '[]')
        tr.imageList = imageIdList.map((imageId) => {
          return this.imageMap[imageId]
        })
      } catch (error) {
        tr.imageList = []
      }
    })
  }

  refreshTicketLaboratory() {
    if (!this.ticketLaboratoryList || !this.ticketLaboratoryList.length) {
      return
    }
    if (!this.ticketLaboratoryGroupList) this.ticketLaboratoryGroupList = []
    if (!this.ticketLaboratoryResultList) this.ticketLaboratoryResultList = []

    this.ticketLaboratoryGroupList.forEach((tlg) => {
      tlg.ticketLaboratoryList = this.ticketLaboratoryList!.filter((tl) => {
        return tl.ticketLaboratoryGroupId === tlg.id
      })
      const tlrList = this.ticketLaboratoryResultList!.filter((tlr) => {
        return tlr.ticketLaboratoryGroupId === tlg.id
      })
      tlg.ticketLaboratoryResultMap = ESArray.arrayToKeyValue(tlrList, 'laboratoryId')
    })
  }

  refreshTreeData() {
    this.refreshImageMap()
    this.refreshTicketAttribute()
    this.refreshTicketUser()
    this.refreshTicketProduct()
    this.refreshTicketProcedureAndRegimen()
    this.refreshTicketLaboratory()
  }

  async refreshRelation() {
    await Promise.all([
      TicketUserService.refreshRelation(this.ticketUserList || []),
      // TicketProductService.refreshRelation(this.ticketProductList || []),
      TicketProcedureService.refreshRelation(this.ticketProcedureList || []),
      TicketRegimenService.refreshRelation(this.ticketRegimenList || []),
      TicketRegimenService.refreshRelationItem(this.ticketRegimenItemList || []),
      TicketLaboratoryService.refreshRelation(this.ticketLaboratoryList || []),
      TicketLaboratoryService.refreshRelationGroup(this.ticketLaboratoryGroupList || []),
      TicketLaboratoryService.refreshRelationResult(this.ticketLaboratoryResultList || []),
      TicketRadiologyService.refreshRelation(this.ticketRadiologyList),
      TicketSurchargeService.refreshRelation(this.ticketSurchargeList),
    ])
  }

  async refreshAllData() {
    await this.refreshRelation()
    this.refreshTreeData()
  }

  static from(source: Ticket) {
    const target = Ticket.basic(source)
    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }

    if (source.ticketAttributeList) {
      target.ticketAttributeList = TicketAttribute.basicList(source.ticketAttributeList)
    }

    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      target.customer = target.customer ? Customer.basic(target.customer) : target.customer
    }
    if (Object.prototype.hasOwnProperty.call(source, 'customerSource')) {
      target.customerSource = target.customerSource
        ? CustomerSource.basic(target.customerSource)
        : target.customerSource
    }

    if (Object.prototype.hasOwnProperty.call(source, 'toAppointment')) {
      target.toAppointment = target.toAppointment
        ? Appointment.basic(target.toAppointment)
        : target.toAppointment
    }

    if (source.paymentList) {
      target.paymentList = Payment.basicList(source.paymentList)
    }
    if (source.ticketProductList) {
      target.ticketProductList = TicketProduct.basicList(source.ticketProductList)
      target.ticketProductList.forEach((i) => {
        i.product = Product.basic(i.product!)
      })
    }
    if (source.ticketBatchList) {
      target.ticketBatchList = TicketBatch.basicList(source.ticketBatchList)
      target.ticketBatchList.forEach((i) => {
        i.batch = Batch.basic(i.batch!)
      })
    }
    if (source.ticketProductPrescriptionList) {
      target.ticketProductPrescriptionList = TicketProduct.basicList(
        source.ticketProductPrescriptionList,
      )
      target.ticketProductPrescriptionList.forEach((i) => {
        i.product = Product.basic(i.product!)
      })
    }
    if (source.ticketProductConsumableList) {
      target.ticketProductConsumableList = TicketProduct.basicList(
        source.ticketProductConsumableList,
      )
      target.ticketProductConsumableList.forEach((i) => {
        i.product = Product.basic(i.product!)
      })
    }
    if (source.ticketProcedureList) {
      target.ticketProcedureList = TicketProcedure.basicList(source.ticketProcedureList)
      target.ticketProcedureList.forEach((i) => {
        i.procedure = Procedure.basic(i.procedure!)
      })
    }
    if (source.ticketLaboratoryList) {
      target.ticketLaboratoryList = TicketLaboratory.basicList(source.ticketLaboratoryList)
    }
    if (source.ticketLaboratoryGroupList) {
      target.ticketLaboratoryGroupList = TicketLaboratoryGroup.basicList(
        source.ticketLaboratoryGroupList,
      )
    }
    if (source.ticketLaboratoryResultList) {
      target.ticketLaboratoryResultList = TicketLaboratoryResult.basicList(
        source.ticketLaboratoryResultList,
      )
    }
    if (source.ticketRadiologyList) {
      target.ticketRadiologyList = TicketRadiology.basicList(source.ticketRadiologyList)
    }

    if (source.ticketSurchargeList) {
      target.ticketSurchargeList = TicketSurcharge.basicList(source.ticketSurchargeList)
    }
    if (source.ticketExpenseList) {
      target.ticketExpenseList = TicketExpense.basicList(source.ticketExpenseList)
      target.ticketExpenseList.forEach((i) => {
        i.expense = Expense.basic(i.expense!)
      })
    }

    if (source.ticketUserList) {
      target.ticketUserList = TicketUser.basicList(source.ticketUserList)
    }
    return target
  }

  static fromList(sourceList: Ticket[]) {
    return sourceList.map((i) => Ticket.from(i))
  }

  static equal(a: Ticket, b: Ticket) {
    if (a.id != b.id) return false
    if (a.customerId != b.customerId) return false
    if (a.roomId != b.roomId) return false
    if (a.customerSourceId != b.customerSourceId) return false
    if (a.status != b.status) return false
    if (a.deliveryStatus != b.deliveryStatus) return false

    if (a.itemsCostAmount != b.itemsCostAmount) return false
    if (a.procedureMoney != b.procedureMoney) return false
    if (a.productMoney != b.productMoney) return false
    if (a.radiologyMoney != b.radiologyMoney) return false
    if (a.laboratoryMoney != b.laboratoryMoney) return false
    if (a.itemsDiscount != b.itemsDiscount) return false

    if (a.discountMoney != b.discountMoney) return false
    if (a.discountPercent != b.discountPercent) return false
    // if (a.discountType != b.discountType) return false

    if (a.surcharge != b.surcharge) return false
    if (a.totalMoney != b.totalMoney) return false
    if (a.expense != b.expense) return false
    if (a.commissionMoney != b.commissionMoney) return false
    if (a.profit != b.profit) return false
    if (a.paidTotal != b.paidTotal) return false
    if (a.debtTotal != b.debtTotal) return false

    if (a.imageDiagnosisIds != b.imageDiagnosisIds) return false
    if (a.year != b.year) return false
    if (a.month != b.month) return false
    if (a.date != b.date) return false
    if (a.dailyIndex != b.dailyIndex) return false

    if (a.createdAt != b.createdAt) return false
    if (a.receptionAt != b.receptionAt) return false
    if (a.endedAt != b.endedAt) return false

    return true
  }
}
