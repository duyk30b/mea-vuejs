import { Image } from '../image/image.model'

export class TicketDiagnosis {
  id: number
  ticketId: number
  reason: string // Lý do vào khám
  healthHistory: string // Tóm tăt bệnh án
  summary: string // Tóm tăt bệnh án
  diagnosis: string // Chẩn đoán
  vitalSigns: string
  imageIds: string
  imageList: Image[]
  advice?: string // Lời nhắc

  static init(): TicketDiagnosis {
    const ins = new TicketDiagnosis()
    ins.id = 0
    ins.reason = ''
    ins.healthHistory = ''
    ins.summary = ''
    ins.diagnosis = ''
    ins.vitalSigns = JSON.stringify({})
    ins.advice = ''
    return ins
  }

  static blank(): TicketDiagnosis {
    const ins = TicketDiagnosis.init()
    return ins
  }

  static basic(source: TicketDiagnosis) {
    const target = new TicketDiagnosis()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: TicketDiagnosis[]): TicketDiagnosis[] {
    return sources.map((i) => TicketDiagnosis.basic(i))
  }

  static from(source: TicketDiagnosis) {
    const target = TicketDiagnosis.basic(source)
    if (source.imageList) {
      target.imageList = Image.basicList(source.imageList)
    }
    return target
  }
}
