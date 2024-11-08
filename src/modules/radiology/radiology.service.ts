import { RefreshTimeDB } from '../../core/indexed-db/repository/refresh-time.repository'
import { RadiologyApi } from './radiology.api'
import type { Radiology } from './radiology.model'

export class RadiologyService {
  static loaded: boolean = false
  static radiologyAll: Radiology[]

  static async getAll() {
    if (!RadiologyService.loaded) {
      const fetchData = await RadiologyApi.list({})
      RadiologyService.radiologyAll = fetchData.data
      RadiologyService.loaded = true
    }

    return RadiologyService.radiologyAll
  }
}
