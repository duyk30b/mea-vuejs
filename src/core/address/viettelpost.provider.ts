import type { IAddressProvider, Province } from './address.service'

export type ViettelPostWard = {
  id: string
  provinceId: string | number
  districtId: string | number
  code: string
  name: string
  province_id: string
}

export type ViettelPostDistrict = {
  DISTRICT_ID: number
  DISTRICT_VALUE: string
  DISTRICT_NAME: string
  PROVINCE_ID: number
  wardList: ViettelPostWard[]
}

export type ViettelPostProvince = {
  PROVINCE_ID: number
  PROVINCE_CODE: string
  PROVINCE_NAME: string
  districtList: ViettelPostDistrict[]
}

export type ViettelPostApiResponse = {
  status: string
  error: boolean
  message: string
  data: any[]
}

const API = 'https://partner.viettelpost.vn'

export class ViettelPostAddressProvider implements IAddressProvider {
  static data: ViettelPostProvince[]

  static fetchAllProvinces = (() => {
    const start = async () => {
      try {
        const response = await fetch(`${API}/v2/categories/listProvinceById?provinceId=-1`)
        const responseJson: ViettelPostApiResponse = await response.json()
        const provinceList = responseJson.data as ViettelPostProvince[]
        ViettelPostAddressProvider.data = provinceList
      } catch (error) {
        console.log('🚀 ~ file: address.instance.ts:26 ~ Address ~ start ~ error:', error)
      }
    }
    let fetchPromise: Promise<void> | null = null
    return async (options: { refresh?: boolean } = {}) => {
      if (!fetchPromise || options.refresh) {
        fetchPromise = start()
      }
      await fetchPromise
    }
  })()

  async fetchDistrictByProvince(provinceName: string) {
    await ViettelPostAddressProvider.fetchAllProvinces()
    const province = ViettelPostAddressProvider.data.find((item) => {
      return item.PROVINCE_NAME === provinceName
    })
    if (!province) {
      console.log(`No exists province: ${provinceName}`)
      return []
    }

    try {
      if (!province.districtList || province.districtList?.length == 0) {
        const response = await fetch(
          `${API}/v2/categories/listDistrict?provinceId=${province.PROVINCE_ID}`,
        )
        const responseJson = await response.json()
        const districtList = responseJson.data as ViettelPostDistrict[]
        province.districtList = districtList
      }
      return province.districtList || []
    } catch (error) {
      return []
    }
  }

  async fetchWardsByProvinceAndDistrict(provinceName: string, districtName: string) {
   
  }

  async getAllProvinces(): Promise<string[]> {
    await ViettelPostAddressProvider.fetchAllProvinces()
    return ViettelPostAddressProvider.data.map((item) => item.PROVINCE_NAME)
  }

  async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    const data = await this.fetchDistrictByProvince(provinceName)
    return data.map((item) => item.DISTRICT_NAME).sort()
  }

  getWardsByProvinceAndDistrict(provinceName: string, districtName: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }
}
