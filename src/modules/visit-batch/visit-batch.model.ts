import { BaseModel } from '../base.model'
import { Batch } from '../batch/batch.model'

export class VisitBatch {
  id: number
  visitId: number
  productId: number
  batchId: number
  visitProductId: number
  quantity: number
  batch?: Batch

  static init(): VisitBatch {
    const ins = new VisitBatch()
    ins.id = 0
    ins.quantity = 0
    return ins
  }

  static blank(): VisitBatch {
    const ins = VisitBatch.init()
    ins.batch = Batch.init()
    return ins
  }

  static from(source: VisitBatch) {
    const target = new VisitBatch()
    Object.assign(target, source)
    if (Object.prototype.hasOwnProperty.call(source, 'batch')) {
      if (!source.batch) {
        target.batch = source.batch
      } else {
        const batch = new Batch()
        Object.assign(batch, source.batch)
        target.batch = batch
      }
    }
    return target
  }

  static fromList(sourceList: VisitBatch[]): VisitBatch[] {
    return sourceList.map((i) => VisitBatch.from(i))
  }
}
