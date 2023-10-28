import {
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from 'class-transformer'
import { BaseModel } from '../base.model'
import { Customer } from '../customer'
import { Diagnosis } from '../diagnosis/diagnosis.model'
import { Invoice } from '../invoice'

export enum ArrivalType {
  Invoice = 1,
  Normal = 2,
}

export enum ArrivalStatus {
  Unknown = 0,
  Waiting = 1,
  Examining = 2,
  Paying = 3,
  Finish = 4,
}

export class Arrival extends BaseModel {
  @Expose({ name: 'customer_id', groups: ['CREATE'] })
  customerId?: number

  @Expose({ name: 'type' })
  type: ArrivalType

  @Expose({ name: 'status', toClassOnly: true })
  status: ArrivalStatus

  @Expose({ name: 'start_time' })
  startTime: number // Giờ vào khám

  @Expose({ name: 'end_time' })
  endTime: number // Giờ kết thúc khám

  @Expose({ name: 'customer', toClassOnly: true })
  @Type(() => Customer)
  customer?: Customer

  @Expose({ name: 'arrival_diagnosis' })
  @Type(() => Diagnosis)
  diagnosis?: Diagnosis

  @Expose({ name: 'invoices' })
  @Type(() => Invoice)
  invoices: Invoice[] = []

  static blank(): Arrival {
    const arrival = new Arrival()
    arrival.customer = new Customer()
    return arrival
  }

  static fromPlain(plain: Record<string, any>): Arrival {
    return plainToInstance(Arrival, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Arrival[] {
    return plainToInstance(Arrival, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Arrival): Arrival {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      ignoreDecorators: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Arrival, type: 'CREATE' | 'UPDATE'): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }
}
