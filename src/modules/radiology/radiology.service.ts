import { RadiologyApi } from './radiology.api'
import type { Radiology } from './radiology.model'

export class RadiologyService {
  static loadedAll: boolean = false
  static radiologyAll: Radiology[]

  static loadedExample: boolean = false
  static radiologyExampleList: Radiology[]

  static async getAll() {
    if (!RadiologyService.loadedAll) {
      const fetchData = await RadiologyApi.list({})
      RadiologyService.radiologyAll = fetchData.data
      RadiologyService.loadedAll = true
    }

    return RadiologyService.radiologyAll
  }

  static async exampleList() {
    if (!RadiologyService.loadedExample) {
      RadiologyService.radiologyExampleList = await RadiologyApi.exampleList()
      RadiologyService.loadedExample = true
    }

    return RadiologyService.radiologyExampleList
  }

  static async createOne(radiology: Radiology) {
    const result = await RadiologyApi.createOne(radiology)
    RadiologyService.loadedAll = false
    return result
  }

  static async deleteOne(id: number) {
    const result = await RadiologyApi.deleteOne(id)
    RadiologyService.loadedAll = false
    return result
  }
}
