import { Laboratory } from '../laboratory/laboratory.model'
import { TemplateHtml } from '../template-html'

export class LaboratoryGroup {
  id: number
  name: string
  templateHtmlId: number
  roomId: number

  templateHtml?: TemplateHtml
  laboratoryList?: Laboratory[]

  static init(): LaboratoryGroup {
    const ins = new LaboratoryGroup()
    ins.id = 0
    ins.templateHtmlId = 0
    ins.name = ''
    ins.roomId = 0
    return ins
  }

  static blank(): LaboratoryGroup {
    const ins = LaboratoryGroup.init()
    return ins
  }

  static basic(source: LaboratoryGroup) {
    const target = new LaboratoryGroup()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: LaboratoryGroup[]): LaboratoryGroup[] {
    return sources.map((i) => LaboratoryGroup.basic(i))
  }

  static from(source: LaboratoryGroup) {
    const target = LaboratoryGroup.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'templateHtml')) {
      target.templateHtml = target.templateHtml ? TemplateHtml.basic(target.templateHtml) : target.templateHtml
    }
    if (source.laboratoryList) {
      target.laboratoryList = Laboratory.basicList(source.laboratoryList)
    }
    return target
  }

  static fromList(sourceList: LaboratoryGroup[]) {
    return sourceList.map((i) => LaboratoryGroup.from(i))
  }
}
