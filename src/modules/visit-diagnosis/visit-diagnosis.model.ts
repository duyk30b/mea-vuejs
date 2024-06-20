import {
  Expose,
  Transform,
  TransformationType,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer'
import { FROM_PLAIN, USER_CREATE, USER_UPDATE } from '../_base/base-expose'

export class VisitDiagnosis {
  @Expose({ groups: [FROM_PLAIN] })
  id: number

  @Expose({ groups: [FROM_PLAIN] })
  visitId: number

  @Expose()
  reason: string // Lý do vào khám

  @Expose()
  healthHistory: string // Tóm tăt bệnh án

  @Expose()
  summary: string // Tóm tăt bệnh án

  @Expose()
  diagnosis: string // Chẩn đoán

  @Expose()
  vitalSigns: string

  @Expose({ groups: [FROM_PLAIN] })
  advice?: string // Lời nhắc

  static init(): VisitDiagnosis {
    const ins = new VisitDiagnosis()
    ins.id = 0
    ins.reason = ''
    ins.healthHistory = ''
    ins.summary = ''
    ins.diagnosis = ''
    ins.vitalSigns = JSON.stringify({})
    ins.advice = ''
    return ins
  }

  static blank(): VisitDiagnosis {
    const ins = VisitDiagnosis.init()
    return ins
  }

  static fromPlain(plain: Record<string, any>): VisitDiagnosis {
    return plainToInstance(VisitDiagnosis, plain, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }

  static toPlain(
    instance: VisitDiagnosis,
    type: typeof USER_CREATE | typeof USER_UPDATE
  ): Record<string, any> {
    return instanceToPlain(instance, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [type],
    })
  }

  static clone(root: VisitDiagnosis): VisitDiagnosis {
    const result = new VisitDiagnosis()
    Object.assign(result, root)
    return result
  }
}
