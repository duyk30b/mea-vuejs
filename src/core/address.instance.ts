type Ward = {
  id: string
  full_name: string
  name: string
  province_id: string
}

type District = {
  id: string
  full_name: string
  name: string
  wards: Ward[]
}

type Province = {
  id: string
  full_name: string
  name: string
  districts: District[]
}

export class AddressInstance {
  static data: Province[] = []

  static fetchAllProvinces = (() => {
    const start = async () => {
      try {
        const response = await fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
        const data = await response.json()
        AddressInstance.data = data.data as Province[]
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
    const province = this.data.find((item) => item.full_name === provinceName)
    if (!province) throw new Error(`No exists province: ${provinceName}`)

    try {
      if (!province.districts || province.districts?.length == 0) {
        const response = await fetch(`https://esgoo.net/api-tinhthanh/2/${province.id}.htm`)
        const data = await response.json()
        province.districts = data.data as District[]
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
    const province = this.data.find((item) => item.full_name === provinceName)
    if (!province) throw new Error(`No exists province: ${provinceName}`)

    const district = province.districts.find((item) => item.full_name === districtName)
    if (!district) throw new Error(`No exists district: ${districtName}`)

    try {
      if (!district.wards || district.wards.length === 0) {
        const response = await fetch(`https://esgoo.net/api-tinhthanh/3/${district.id}.htm`)
        const data = await response.json()
        district.wards = data.data as Ward[]
      }
      return district.wards
    } catch (error) {
      return []
    }
  }

  static async getAllProvinces(): Promise<string[]> {
    await this.fetchAllProvinces()
    return this.data.map((item) => item.full_name).sort()
  }

  static async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    const data = await this.fetchDistrictByProvince(provinceName)
    return data.map((item) => item.full_name).sort()
  }

  static async getWardsByProvinceAndDistrict(
    provinceName: string,
    districtName: string
  ): Promise<string[]> {
    const data = await this.fetchWardsByProvinceAndDistrict(provinceName, districtName)
    return data.map((item) => item.full_name).sort()
  }
}
