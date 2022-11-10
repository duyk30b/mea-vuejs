
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

class Address {
	data: Province[] = []

	loadProvinces = false as any
	loadDistricts = false as any
	loadWards = false as any

	async fetchAllProvinces(): Promise<Province[]> {
		try {
			if (this.data.length === 0) {
				if (this.loadProvinces === false) {
					this.loadProvinces = await fetch('https://provinces.open-api.vn/api/p/')
				}
				this.data = await this.loadProvinces.json() as Province[]
				this.loadProvinces = false
			}
			return this.data
		} catch (error) {
			return []
		}
	}

	async fetchDistrictsByProvince(provinceName: string): Promise<District[]> {
		try {
			const province = this.data.find((item) => item.name === provinceName)
			if (!province) throw new Error(`No exists province: ${provinceName}`)
			if (province.districts.length === 0) {
				if (this.loadDistricts === false) {
					this.loadDistricts = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`)
				}
				const response = await this.loadDistricts.json()
				province.districts = response.districts
				this.loadDistricts = false
			}
			return province.districts
		} catch (error) {
			return []
		}
	}

	async fetchWardsByProvinceAndDistrict(provinceName: string, districtName: string): Promise<Ward[]> {
		try {
			const districts = await this.fetchDistrictsByProvince(provinceName)
			const district = districts.find((item) => item.name === districtName)
			if (!district) throw new Error(`No exists district: ${districtName}`)
			if (district.wards.length === 0) {
				if (this.loadWards === false) {
					this.loadWards = await fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
				}
				const response = await this.loadWards.json()
				district.wards = await response.wards
				this.loadWards = false
			}
			return district.wards
		} catch (error) {
			return []
		}
	}

	async getAllProvinces(): Promise<string[]> {
		this.data = await this.fetchAllProvinces()
		return this.data.map((item) => item.name).sort()
	}

	async getDistrictsByProvince(provinceName: string): Promise<string[]> {
		const data = await this.fetchDistrictsByProvince(provinceName)
		return data.map((item) => item.name).sort()
	}

	async getWardsByProvinceAndDistrict(provinceName: string, districtName: string): Promise<string[]> {
		const data = await this.fetchWardsByProvinceAndDistrict(provinceName, districtName)
		return data.map((item) => item.name).sort()
	}
}

export const AddressInstance = new Address()
