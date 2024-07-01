import { Image } from '../image/image.model'

export class VisitDiagnosis {
  id: number
  visitId: number
  reason: string // Lý do vào khám
  healthHistory: string // Tóm tăt bệnh án
  summary: string // Tóm tăt bệnh án
  diagnosis: string // Chẩn đoán
  vitalSigns: string
  imageIds: string
  imageList: Image[]
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

  static from(source: VisitDiagnosis) {
    const target = new VisitDiagnosis()
    Object.assign(target, source)
    if (source.imageList) {
      target.imageList = source.imageList.map((i) => {
        const image = new Image()
        Object.assign(image, i)
        return image
      })
    }
    return target
  }
}
