import { PrintHtml } from '../print-html'
import { Radiology } from '../radiology/radiology.model'
import { User } from '../user'

export class RadiologySample {
  id: number
  priority: number
  name: string

  userId: number
  radiologyId: number
  printHtmlId: number

  description: string
  result: string
  customVariables: string // Dạng Javascript
  customStyles: string // Dạng Style

  printHtml?: PrintHtml
  radiology?: Radiology
  user?: User

  static init() {
    const ins = new RadiologySample()
    ins.id = 0
    ins.name = ''
    ins.priority = 1

    ins.userId = 0
    ins.radiologyId = 0
    ins.printHtmlId = 0

    ins.description = ''
    ins.result = ''
    ins.customVariables = ''
    ins.customStyles = ''
    return ins
  }

  static blank() {
    const ins = RadiologySample.init()
    ins.printHtml = PrintHtml.init()
    ins.radiology = Radiology.init()
    return ins
  }

  static basic(source: RadiologySample) {
    const target = new RadiologySample()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: RadiologySample[]): RadiologySample[] {
    return sources.map((i) => RadiologySample.basic(i))
  }

  static from(source: RadiologySample) {
    const target = RadiologySample.basic(source)
    if (Object.prototype.hasOwnProperty.call(source, 'radiology')) {
      target.radiology = target.radiology ? Radiology.basic(target.radiology) : target.radiology
    }
    if (Object.prototype.hasOwnProperty.call(source, 'printHtml')) {
      target.printHtml = target.printHtml ? PrintHtml.basic(target.printHtml) : target.printHtml
    }
    if (Object.prototype.hasOwnProperty.call(source, 'user')) {
      target.user = target.user ? User.basic(target.user) : target.user
    }
    return target
  }

  static fromList(sourceList: RadiologySample[]): RadiologySample[] {
    return sourceList.map((i) => RadiologySample.from(i))
  }

  static equal(a: RadiologySample, b: RadiologySample) {
    if (a.id != b.id) return false
    if (a.name != b.name) return false
    if (a.priority != b.priority) return false
    if (a.userId != b.userId) return false
    if (a.radiologyId != b.radiologyId) return false
    if (a.printHtmlId != b.printHtmlId) return false
    if (a.description != b.description) return false
    if (a.result != b.result) return false
    if (a.customVariables != b.customVariables) return false
    if (a.customStyles != b.customStyles) return false
    return true
  }

  static equalList(a: RadiologySample[], b: RadiologySample[]) {
    if (a.length != b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!RadiologySample.equal(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}
