import { ParaclinicalApi } from './paraclinical.api'
import type { Paraclinical } from './paraclinical.model'

export class ParaclinicalService {
  static loaded: boolean = false
  static paraclinicalAll: Paraclinical[]

  static loadedExample: boolean = false
  static paraclinicalExampleList: Paraclinical[]

  static async getAll() {
    if (!ParaclinicalService.loaded) {
      const fetchData = await ParaclinicalApi.list({})
      ParaclinicalService.paraclinicalAll = fetchData.data
      ParaclinicalService.loaded = true
    }

    return ParaclinicalService.paraclinicalAll
  }

  static async exampleList() {
    if (!ParaclinicalService.loaded) {
      ParaclinicalService.paraclinicalExampleList = await ParaclinicalApi.exampleList()
      ParaclinicalService.loadedExample = true
    }

    return ParaclinicalService.paraclinicalExampleList
  }

  static async createOne(paraclinical: Paraclinical) {
    return await ParaclinicalApi.createOne(paraclinical)
  }

  static async deleteOne(id: number) {
    return await ParaclinicalApi.deleteOne(id)
  }
}
