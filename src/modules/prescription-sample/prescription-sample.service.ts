import { DString } from '../../utils'
import { PrescriptionSampleApi } from './prescription-sample.api'
import type {
  PrescriptionSampleListQuery,
  PrescriptionSamplePaginationQuery,
} from './prescription-sample.dto'
import { PrescriptionSample } from './prescription-sample.model'

export class PrescriptionSampleService {
  static loadedAll: boolean = false

  static prescriptionSampleAll: PrescriptionSample[]

  private static async getAll() {
    if (PrescriptionSampleService.loadedAll) return

    const { data } = await PrescriptionSampleApi.list({
      relation: { medicineList: true },
    })
    const prescriptionSampleList = data
    PrescriptionSampleService.prescriptionSampleAll = prescriptionSampleList
    PrescriptionSampleService.loadedAll = true
  }

  static async pagination(options: PrescriptionSamplePaginationQuery) {
    const page = options.page || 1
    const limit = options.limit || 10
    await PrescriptionSampleService.getAll()
    let data = PrescriptionSampleService.prescriptionSampleAll
    if (options.sort) {
      if (options.sort?.id) {
        data.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (options.sort?.priority) {
        data.sort((a, b) => {
          if (options.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (options.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    data = data.slice((page - 1) * limit, page * limit)
    return {
      data,
      meta: { total: PrescriptionSampleService.prescriptionSampleAll.length },
    }
  }

  static async list(options: PrescriptionSampleListQuery) {
    const filter = options.filter || {}
    await PrescriptionSampleService.getAll()
    let data = PrescriptionSampleService.prescriptionSampleAll
    if (options.filter) {
      data = data.filter((i) => {
        return true
      })
    }
    if (options.sort) {
      if (options.sort?.id) {
        data.sort((a, b) => {
          if (options.sort?.id === 'ASC') return a.id < b.id ? -1 : 1
          if (options.sort?.id === 'DESC') return a.id > b.id ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
      if (options.sort?.priority) {
        data.sort((a, b) => {
          if (options.sort?.priority === 'ASC') return a.priority < b.priority ? -1 : 1
          if (options.sort?.priority === 'DESC') return a.priority > b.priority ? -1 : 1
          return a.id > b.id ? -1 : 1
        })
      }
    }
    return PrescriptionSample.fromList(data)
  }

  static async createOne(prescriptionSample: PrescriptionSample) {
    const result = await PrescriptionSampleApi.createOne(prescriptionSample)
    PrescriptionSampleService.loadedAll = false
    return result
  }

  static async updateOne(id: number, prescriptionSample: PrescriptionSample) {
    const result = await PrescriptionSampleApi.updateOne(id, prescriptionSample)
    PrescriptionSampleService.loadedAll = false
    return result
  }

  static async destroyOne(id: number) {
    const result = await PrescriptionSampleApi.destroyOne(id)
    PrescriptionSampleService.loadedAll = false
    return result
  }

  static async search(text: string) {
    if (!text) text = ''
    return PrescriptionSampleService.prescriptionSampleAll.filter((i) => {
      return DString.customFilter(i.name, text)
    })
  }
}
