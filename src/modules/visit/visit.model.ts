import { Customer } from '../customer'
import { CustomerPayment } from '../customer-payment/customer-payment.model'
import { DiscountType } from '../enum'
import { VisitBatch } from '../visit-batch'
import { VisitDiagnosis } from '../visit-diagnosis'
import { VisitExpense } from '../visit-expense/visit-expense.model'
import { VisitProcedure } from '../visit-procedure/visit-procedure.model'
import { VisitProduct } from '../visit-product/visit-product.model'
import { VisitRadiology } from '../visit-radiology'
import { VisitSurcharge } from '../visit-surcharge/visit-surcharge.model'

export enum VisitStatus {
  Draft = 1, // Hẹn khám
  Waiting = 2, // Đợi khám
  InProgress = 3, // Đang khám,
  Debt = 4, // Nợ
  Completed = 5,
  Cancel = 6,
}

export enum VisitType {
  Store = 1, // Bán hàng
  Clinic = 2, // Phòng khám
}

export class Visit {
  id: number
  customerId: number
  visitType: VisitType
  visitStatus: VisitStatus
  isSent: number
  totalCostAmount: number
  proceduresMoney: number
  productsMoney: number
  radiologyMoney: number
  discountMoney: number // tiền giảm giá
  discountPercent: number // % giảm giá
  discountType: DiscountType // Loại giảm giá
  surcharge: number // Phụ phí
  totalMoney: number // Doanh thu = proceduresMoney + productsMoney + phụ phí - tiền giảm giá
  expense: number
  profit: number
  paid: number
  debt: number
  note: string
  registeredAt: number // Giờ đăng ký khám
  startedAt: number | null // Giờ vào khám
  endedAt: number
  updatedAt: number | null // Giờ kết thúc khám
  customer?: Customer
  customerPaymentList?: CustomerPayment[]
  visitDiagnosis?: VisitDiagnosis
  visitBatchList?: VisitBatch[]
  visitProductList?: VisitProduct[]
  visitProcedureList?: VisitProcedure[]
  visitRadiologyList?: VisitRadiology[]
  visitSurchargeList?: VisitSurcharge[]
  visitExpenseList?: VisitExpense[]

  static init(): Visit {
    const ins = new Visit()
    ins.id = 0
    ins.visitStatus = VisitStatus.Draft
    ins.totalCostAmount = 0
    ins.proceduresMoney = 0
    ins.productsMoney = 0
    ins.radiologyMoney = 0
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

  static blank(): Visit {
    const ins = Visit.init()
    // ins.customer = Customer.init() // Uncaught ReferenceError: Cannot access 'Customer' before initialization
    ins.customerPaymentList = []
    ins.visitDiagnosis = VisitDiagnosis.init()
    ins.visitProcedureList = []
    ins.visitProductList = []
    ins.visitBatchList = []
    ins.visitRadiologyList = []
    ins.visitSurchargeList = [VisitSurcharge.init()]
    ins.visitExpenseList = [VisitExpense.init()]

    return ins
  }

  static from(source: Visit) {
    const target = new Visit()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'customer')) {
      if (!source.customer) {
        target.customer = source.customer
      } else {
        const customer = new Customer()
        Object.assign(customer, source.customer)
        target.customer = customer
      }
    }
    if (Object.prototype.hasOwnProperty.call(source, 'visitDiagnosis')) {
      if (!source.visitDiagnosis) {
        target.visitDiagnosis = source.visitDiagnosis
      } else {
        const visitDiagnosis = new VisitDiagnosis()
        Object.assign(visitDiagnosis, source.visitDiagnosis)
        target.visitDiagnosis = visitDiagnosis
      }
    }
    if (source.customerPaymentList) {
      target.customerPaymentList = source.customerPaymentList.map((i) => {
        const customerPayment = new CustomerPayment()
        Object.assign(customerPayment, i)
        return customerPayment
      })
    }
    if (source.visitBatchList) {
      target.visitBatchList = source.visitBatchList.map((i) => {
        const visitBatch = new VisitBatch()
        Object.assign(visitBatch, i)
        return visitBatch
      })
    }
    if (source.visitProductList) {
      target.visitProductList = VisitProduct.fromList(source.visitProductList)
    }
    if (source.visitProcedureList) {
      target.visitProcedureList = source.visitProcedureList.map((i) => {
        const visitProcedure = new VisitProcedure()
        Object.assign(visitProcedure, i)
        return visitProcedure
      })
    }
    if (source.visitRadiologyList) {
      target.visitRadiologyList = source.visitRadiologyList.map((i) => {
        const visitRadiology = new VisitRadiology()
        Object.assign(visitRadiology, i)
        return visitRadiology
      })
    }
    if (source.visitSurchargeList) {
      target.visitSurchargeList = source.visitSurchargeList.map((i) => {
        const visitSurcharge = new VisitSurcharge()
        Object.assign(visitSurcharge, i)
        return visitSurcharge
      })
    }
    if (source.visitExpenseList) {
      target.visitExpenseList = source.visitExpenseList.map((i) => {
        const visitExpense = new VisitExpense()
        Object.assign(visitExpense, i)
        return visitExpense
      })
    }
    return target
  }

  static fromList(sourceList: Visit[]) {
    return sourceList.map((i) => Visit.from(i))
  }

  static toBasic(root: Visit) {
    const ins = new Visit()
    Object.assign(ins, root)
    delete ins.customer
    delete ins.customerPaymentList
    delete ins.visitDiagnosis
    delete ins.visitBatchList
    delete ins.visitProductList
    delete ins.visitProcedureList
    delete ins.visitRadiologyList
    delete ins.visitSurchargeList
    delete ins.visitExpenseList
    return ins
  }

  static toBasics(roots: Visit[]) {
    return roots.map((i) => Visit.toBasic(i))
  }
}
