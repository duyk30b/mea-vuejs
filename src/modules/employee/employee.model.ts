import { Exclude, Expose, instanceToInstance, instanceToPlain, plainToInstance, Type } from 'class-transformer'
import { BaseModel } from '../base.model'
import type { EGender } from '../enum'

export class Employee extends BaseModel {
  @Expose({ toClassOnly: true })
  username: string = ''

  @Expose()
  phone: string

  @Expose()
  fullName?: string

  @Expose()
  birthday?: number

  @Expose()
  gender?: EGender

  static blank(): Employee {
    return new Employee()
  }

  static fromPlain(plain: Record<string, any>): Employee {
    return plainToInstance(Employee, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromPlains(plains: Record<string, any>[]): Employee[] {
    return plainToInstance(Employee, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Partial<Employee>): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
    })
  }

  static fromInstance(instance: Employee): Employee {
    return instanceToInstance(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      ignoreDecorators: true,
    })
  }
}
