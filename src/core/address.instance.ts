type Ward = {
  ward_id: string
  ward_name: string
  ward_type: string
  province_id: string
}

type District = {
  district_id: string
  district_name: string
  district_type: string
  province_id: string
  wards: Ward[]
}

type Province = {
  province_id: string
  province_name: string
  province_type: string
  districts: District[]
}

export class AddressInstance {
  static data: Province[] = []

  static fetchAllProvinces = (() => {
    const start = async () => {
      try {
        const response = await fetch('https://vapi.vnappmob.com/api/province')
        const data = await response.json()
        AddressInstance.data = data.results as Province[]
      } catch (error) {
        console.log('🚀 ~ file: address.instance.ts:26 ~ Address ~ start ~ error:', error)
      }
    }
    let fetching: any = null
    return async () => {
      if (!fetching) fetching = start()
      await fetching
    }
  })()

  static async fetchDistrictByProvince(provinceName: string): Promise<District[]> {
    await this.fetchAllProvinces()
    const province = this.data.find((item) => item.province_name === provinceName)
    if (!province) throw new Error(`No exists province: ${provinceName}`)

    try {
      if (!province.districts || province.districts?.length == 0) {
        const response = await fetch(
          `https://vapi.vnappmob.com/api/province/district/${province.province_id}`
        )
        const data = await response.json()
        province.districts = data.results as District[]
      }
      return province.districts
    } catch (error) {
      return []
    }
  }

  static async fetchWardsByProvinceAndDistrict(
    provinceName: string,
    districtName: string
  ): Promise<Ward[]> {
    await this.fetchAllProvinces()
    const province = this.data.find((item) => item.province_name === provinceName)
    if (!province) throw new Error(`No exists province: ${provinceName}`)

    const district = province.districts.find((item) => item.district_name === districtName)
    if (!district) throw new Error(`No exists district: ${districtName}`)

    try {
      if (!district.wards || district.wards.length === 0) {
        const response = await fetch(
          `https://vapi.vnappmob.com/api/province/ward/${district.district_id}`
        )
        const data = await response.json()
        district.wards = (await data.results) as Ward[]
      }
      return district.wards
    } catch (error) {
      return []
    }
  }

  static async getAllProvinces(): Promise<string[]> {
    await this.fetchAllProvinces()
    return this.data.map((item) => item.province_name).sort()
  }

  static async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    const data = await this.fetchDistrictByProvince(provinceName)
    return data.map((item) => item.district_name).sort()
  }

  static async getWardsByProvinceAndDistrict(
    provinceName: string,
    districtName: string
  ): Promise<string[]> {
    const data = await this.fetchWardsByProvinceAndDistrict(provinceName, districtName)
    return data.map((item) => item.ward_name).sort()
  }
}
