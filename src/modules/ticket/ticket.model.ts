import { ESArray } from '../../utils'
import { Appointment } from '../appointment'
import { Batch } from '../batch'
import { Customer } from '../customer'
import { CustomerSource } from '../customer-source'
import { DeliveryStatus, DiscountType } from '../enum'
import { Image } from '../image/image.model'
import { LaboratoryService, LaboratoryValueType } from '../laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../laboratory-group'
import { Payment } from '../payment/payment.model'
import { Procedure, ProcedureService } from '../procedure'
import { Product, ProductService } from '../product'
import { RadiologyService } from '../radiology'
import { RoleService } from '../role'
import { TicketAttribute, type TicketAttributeMap } from '../ticket-attribute'
import { TicketBatch } from '../ticket-batch'
import { TicketExpense } from '../ticket-expense/ticket-expense.model'
import { TicketLaboratory } from '../ticket-laboratory'
import { TicketLaboratoryGroup } from '../ticket-laboratory-group'
import { TicketLaboratoryResult } from '../ticket-laboratory-result'
import { TicketProcedure } from '../ticket-procedure/ticket-procedure.model'
import { TicketProduct } from '../ticket-product/ticket-product.model'
import { TicketRadiology } from '../ticket-radiology'
import { TicketSurcharge } from '../ticket-surcharge/ticket-surcharge.model'
import { TicketUser } from '../ticket-user'
import { UserService } from '../user'

export enum TicketStatus {
  Schedule = 1,
  Draft = 2,
  Deposited = 3,
  Executing = 4,
  Debt = 5,
  Completed = 6,
  Cancelled = 7,
}

export enum TicketType {
  Order = 2,
  Clinic = 3,
  Spa = 4,
  Eye = 5,
  Obstetric = 6,
}

export class Ticket {
  id: number
  customerId: number
  customerSourceId: number
  ticketType: TicketType
  customType: number
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
  paid: number
  debt: number

  imageIds: string

  year: number
  month: number
  date: number
  dailyIndex: number

  note: string

  registeredAt: number // Giờ đăng ký khám
  startedAt: number | null // Giờ vào khám
  endedAt: number
  updatedAt: number | null // Giờ kết thúc khám

  customer?: Customer
  paymentList?: Payment[]
  customerSource?: CustomerSource
  ticketAttributeList?: TicketAttribute[]
  ticketBatchList?: TicketBatch[]
  ticketProductList?: TicketProduct[]
  ticketProductConsumableList?: TicketProduct[]
  ticketProductPrescriptionList?: TicketProduct[]
  ticketProcedureList?: TicketProcedure[]
  ticketLaboratoryList?: TicketLaboratory[]
  ticketLaboratoryGroupList?: TicketLaboratoryGroup[]
  ticketLaboratoryResultList?: TicketLaboratoryResult[]
  ticketRadiologyList?: TicketRadiology[]
  ticketUserList?: TicketUser[]
  ticketSurchargeList?: TicketSurcharge[]
  ticketExpenseList?: TicketExpense[]

  toAppointment?: Appointment
  imageList: Image[]

  ticketAttributeMap: TicketAttributeMap // chỉ convert tại front-end
  ticketUserGroup: Record<string, Record<string, TicketUser[]>> // chỉ convert tại front-end

  static init(): Ticket {
    const ins = new Ticket()
    ins.id = 0
    ins.customType = 0
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
    ins.paid = 0
    ins.debt = 0
    return ins
  }

  static blank(): Ticket {
    const ins = Ticket.init()
    ins.customer = Customer.init() // Uncaught ReferenceError: Cannot access 'Customer' before initialization
    ins.paymentList = []
    ins.ticketAttributeList = []
    ins.ticketBatchList = []
    ins.ticketProductList = []
    ins.ticketProcedureList = []
    ins.ticketLaboratoryList = []
    ins.ticketLaboratoryGroupList = []
    ins.ticketLaboratoryResultList = []
    ins.ticketRadiologyList = []
    ins.ticketUserList = []
    ins.ticketSurchargeList = [TicketSurcharge.init()]
    ins.ticketExpenseList = [TicketExpense.init()]
    ins.imageList = []

    ins.ticketAttributeMap = {}
    ins.ticketUserGroup = {}
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

  async refreshProduct() {
    const ticketProductList = [
      ...(this.ticketProductList || []),
      ...(this.ticketProductPrescriptionList || []),
      ...(this.ticketProductConsumableList || []),
    ].filter((i) => !!i)

    if (!ticketProductList.length) return

    const productIdList = ticketProductList.map((i) => i.productId)
    let productMap: Record<string, Product> = {}
    if (productIdList.length) {
      const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })
      productMap = ESArray.arrayToKeyValue(productList, 'id')
    }

    ticketProductList.forEach((i) => (i.product = productMap[i.productId]))
  }

  async refreshProcedure() {
    if (!this.ticketProcedureList || !this.ticketProcedureList.length) {
      return
    }
    const procedureMap = await ProcedureService.getMap()
    this.ticketProcedureList?.forEach((i) => {
      i.procedure = procedureMap![i.procedureId]
    })
  }

  async refreshRadiology() {
    if (!this.ticketRadiologyList || !this.ticketRadiologyList.length) {
      return
    }
    const radiologyMap = await RadiologyService.getMap()
    this.ticketRadiologyList.forEach((i) => {
      i.radiology = radiologyMap![i.radiologyId]
    })
  }

  async refreshUserAndRole() {
    if (!this.ticketUserList || !this.ticketUserList.length) {
      return
    }
    const [userMap, roleMap] = await Promise.all([UserService.getMap(), RoleService.getMap()])
    this.ticketUserList.forEach((i) => {
      i.user = userMap![i.userId]
      i.role = roleMap![i.roleId]
    })
  }

  async refreshLaboratory() {
    if (!this.ticketLaboratoryList || !this.ticketLaboratoryList.length) {
      return
    }
    if (!this.ticketLaboratoryGroupList) this.ticketLaboratoryGroupList = []
    if (!this.ticketLaboratoryResultList) this.ticketLaboratoryResultList = []

    const [laboratoryMap, laboratoryGroupMap] = await Promise.all([
      LaboratoryService.getMap(),
      LaboratoryGroupService.getMap(),
    ])

    this.ticketLaboratoryList.forEach((tl) => {
      tl.laboratory = laboratoryMap[tl.laboratoryId]

      tl.ticketLaboratoryResult = this.ticketLaboratoryResultList!.find((tlr) => {
        return tlr.ticketLaboratoryId === tl.id && tlr.laboratoryId === tl.laboratoryId
      })

      if (tl.laboratory?.valueType === LaboratoryValueType.Children) {
        tl.children =
          tl.laboratory?.children?.map((laboratoryChild) => {
            let currentTlr = this.ticketLaboratoryResultList!.find((tlr) => {
              return tlr.ticketLaboratoryId === tl.id && tlr.laboratoryId === laboratoryChild.id
            })
            if (!currentTlr) {
              currentTlr = TicketLaboratoryResult.blank()
              currentTlr.laboratoryId = tl.laboratoryId
              currentTlr.ticketLaboratoryId = tl.id
              currentTlr.ticketLaboratoryGroupId = tl.ticketLaboratoryGroupId
            }
            return {
              laboratory: laboratoryChild,
              ticketLaboratoryResult: currentTlr,
            }
          }) || []
      }
    })

    this.ticketLaboratoryGroupList.forEach((tlg) => {
      let laboratoryGroup
      if (laboratoryGroupMap[tlg.laboratoryGroupId]) {
        laboratoryGroup = laboratoryGroupMap[tlg.laboratoryGroupId]
      } else if (tlg.laboratoryGroupId === 0) {
        laboratoryGroup = LaboratoryGroup.blank()
        laboratoryGroup.name = 'Chưa phân nhóm phiếu'
      } else {
        laboratoryGroup = LaboratoryGroup.blank()
        laboratoryGroup.name = `(ID${tlg.laboratoryGroupId}) Nhóm bị xóa`
      }
      tlg.laboratoryGroup = laboratoryGroup
      tlg.ticketLaboratoryList = this.ticketLaboratoryList!.filter((tl) => {
        return tl.ticketLaboratoryGroupId === tlg.id
      })
    })

    // === fix cho những xét nghiệm cũ chưa phân nhóm
    const tlNoGroup = this.ticketLaboratoryList.filter((tl) => {
      return tl.ticketLaboratoryGroupId === 0
    })
    if (tlNoGroup.length) {
      let tlgZero = this.ticketLaboratoryGroupList.find((tlg) => tlg.id === 0)
      if (!tlgZero) {
        tlgZero = TicketLaboratoryGroup.blank()
        tlgZero.laboratoryGroup = LaboratoryGroup.blank()
        this.ticketLaboratoryGroupList.unshift(tlgZero)
      }
      tlgZero.ticketLaboratoryList = tlNoGroup
    } else {
      this.ticketLaboratoryGroupList = this.ticketLaboratoryGroupList.filter((i) => !!i.id)
    }
  }

  refreshTicketProductHasTicketBatchList() {
    this.ticketBatchList ||= []
    const ticketProductList = [
      ...(this.ticketProductList || []),
      ...(this.ticketProductConsumableList || []),
      ...(this.ticketProductPrescriptionList || []),
    ]
    ticketProductList.forEach((tp) => {
      tp.ticketBatchList = this.ticketBatchList!.filter((tb) => {
        return tp.id === tb.ticketProductId
      })
    })
  }

  refreshTicketUserGroup() {
    this.ticketUserGroup = {}
    ;(this.ticketUserList || []).forEach((i) => {
      if (!this.ticketUserGroup[i.interactType]) {
        this.ticketUserGroup[i.interactType] = {}
      }
      if (!this.ticketUserGroup[i.interactType][i.ticketItemId]) {
        this.ticketUserGroup[i.interactType][i.ticketItemId] = []
      }
      this.ticketUserGroup[i.interactType][i.ticketItemId].push(i)
    })
  }

  async refreshAllData() {
    await Promise.all([
      this.refreshProduct(),
      this.refreshProcedure(),
      this.refreshRadiology(),
      this.refreshLaboratory(),
      this.refreshUserAndRole(),
    ])
    this.refreshTicketProductHasTicketBatchList()
    this.refreshTicketUserGroup()
  }

  static from(source: Ticket) {
    const target = Ticket.basic(source)
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

    if (source.ticketAttributeList) {
      target.ticketAttributeList = TicketAttribute.basicList(source.ticketAttributeList)
      target.ticketAttributeMap = TicketAttribute.basicMap(source.ticketAttributeList)
    }
    if (source.ticketUserList) {
      target.ticketUserList = TicketUser.basicList(source.ticketUserList)
      target.refreshTicketUserGroup()
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
    }

    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }
    return target
  }

  static fromList(sourceList: Ticket[]) {
    return sourceList.map((i) => Ticket.from(i))
  }

  static equal(a: Ticket, b: Ticket) {
    if (a.id != b.id) return false
    if (a.customerId != b.customerId) return false
    if (a.customType != b.customType) return false
    if (a.customerSourceId != b.customerSourceId) return false
    if (a.ticketType != b.ticketType) return false
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
    if (a.paid != b.paid) return false
    if (a.debt != b.debt) return false

    if (a.imageIds != b.imageIds) return false
    if (a.year != b.year) return false
    if (a.month != b.month) return false
    if (a.date != b.date) return false
    if (a.dailyIndex != b.dailyIndex) return false

    if (a.registeredAt != b.registeredAt) return false
    if (a.startedAt != b.startedAt) return false
    if (a.endedAt != b.endedAt) return false
    if (a.updatedAt != b.updatedAt) return false

    return true
  }
}
