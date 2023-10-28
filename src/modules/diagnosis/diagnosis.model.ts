import { Expose, instanceToPlain, plainToInstance } from 'class-transformer'

export class Diagnosis {
  @Expose({ toClassOnly: true })
  id?: number

  @Expose()
  arrivalId?: number

  @Expose()
  reason?: string // Lý do vào khám

  @Expose()
  summary?: string // Tóm tăt bệnh án

  @Expose()
  diagnosis?: string // Chẩn đoán

  @Expose()
  pulse?: number // Mạch

  @Expose()
  temperature?: number // Nhiệt độ

  @Expose()
  bloodPressure?: string // Huyết áp

  @Expose()
  respiratoryRate?: number // Nhịp thở

  @Expose()
  spO2?: number // sp02

  @Expose()
  height?: number // Chiều cao

  @Expose()
  weight?: number // Cân nặng

  @Expose()
  note?: string // Ghi chú

  static blank(): Diagnosis {
    return new Diagnosis()
  }

  static fromPlain(plain: Record<string, any>): Diagnosis {
    return plainToInstance(Diagnosis, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static toPlain(instance: Diagnosis): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: ['ALL'],
    })
  }

  static fromInstance(instance: Diagnosis): Diagnosis {
    const result = new Diagnosis()
    Object.assign(result, instance)
    return result
  }
}
