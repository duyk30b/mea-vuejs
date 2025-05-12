import { ViettelPostAddressProvider } from './viettelpost.provider'

export type Ward = {
  id: string
  provinceId: string | number
  districtId: string | number
  code: string
  name: string
  province_id: string
}

export type District = {
  id: string
  provinceId: string | number
  code: string
  name: string
  wardList: Ward[]
}

export type Province = {
  id: string | number
  code: string
  name: string
  districtList: District[]
}

export interface IAddressProvider {
  getAllProvinces(): Promise<string[]>
  getDistrictsByProvince(provinceName: string): Promise<string[]>
  getWardsByProvinceAndDistrict(provinceName: string, districtName: string): Promise<string[]>
}

export class AddressService {
  static provider: IAddressProvider

  static init(provider: IAddressProvider) {
    AddressService.provider = provider
    AddressService.provider = new ViettelPostAddressProvider()
  }

  static async getAllProvinces(): Promise<string[]> {
    return await AddressService.provider.getAllProvinces()
  }

  static async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    return await AddressService.provider.getDistrictsByProvince(provinceName)
  }

  static async getWardsByProvinceAndDistrict(
    provinceName: string,
    districtName: string,
  ): Promise<string[]> {
    return await AddressService.provider.getWardsByProvinceAndDistrict(provinceName, districtName)
  }
}
