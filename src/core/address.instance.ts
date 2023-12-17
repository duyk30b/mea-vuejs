type Ward = {
  name: string
}

type District = {
  code: number
  name: string
  wards: Ward[]
}

type Province = {
  code: number
  name: string
  districts: District[]
}

export class AddressInstance {
  static data: Province[] = []

  static fetchAllProvincesAndDistricts = (() => {
    const start = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/?depth=2')
        AddressInstance.data = (await response.json()) as Province[]
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

  static async fetchWardsByProvinceAndDistrict(
    provinceName: string,
    districtName: string
  ): Promise<Ward[]> {
    await this.fetchAllProvincesAndDistricts()
    const province = this.data.find((item) => item.name === provinceName)
    if (!province) throw new Error(`No exists province: ${provinceName}`)

    const district = province.districts.find((item) => item.name === districtName)
    if (!district) throw new Error(`No exists district: ${districtName}`)

    try {
      if (district.wards.length === 0) {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
        const resJson = await response.json()
        district.wards = await resJson.wards
      }
      return district.wards
    } catch (error) {
      return []
    }
  }

  static async getAllProvinces(): Promise<string[]> {
    await this.fetchAllProvincesAndDistricts()
    return this.data.map((item) => item.name).sort()
  }

  static async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    await this.fetchAllProvincesAndDistricts()
    const province = this.data.find((item) => item.name === provinceName)
    if (!province) throw new Error(`No exists province: ${provinceName}`)

    return province.districts.map((item) => item.name).sort()
  }

  static async getWardsByProvinceAndDistrict(
    provinceName: string,
    districtName: string
  ): Promise<string[]> {
    const data = await this.fetchWardsByProvinceAndDistrict(provinceName, districtName)
    return data.map((item) => item.name).sort()
  }
}
