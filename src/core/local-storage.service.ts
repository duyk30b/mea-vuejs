export const ACCESS_TOKEN = 'access_token'
export const ACCESS_EXP = 'access_exp'
export const REFRESH_TOKEN = 'refresh_token'
export const REFRESH_EXP = 'refresh_exp'
export const USER = 'user'
export const ORG_PHONE = 'org_phone'

export class LocalStorageService {
	static setAuth(data: any) {
		const { access_token, refresh_token, user } = data
		localStorage.setItem(ACCESS_TOKEN, access_token.token)
		localStorage.setItem(ACCESS_EXP, access_token.exp)
		localStorage.setItem(REFRESH_TOKEN, refresh_token.token)
		localStorage.setItem(REFRESH_EXP, refresh_token.exp)
		localStorage.setItem(USER, JSON.stringify(user))
		localStorage.setItem(ORG_PHONE, user.organization.phone)
	}

	static removeAuth() {
		localStorage.removeItem(ACCESS_TOKEN)
		localStorage.removeItem(ACCESS_EXP)
		localStorage.removeItem(REFRESH_TOKEN)
		localStorage.removeItem(REFRESH_EXP)
		localStorage.removeItem(USER)
	}

	static setAccessToken(data: any) {
		const { access_token } = data
		localStorage.setItem(ACCESS_TOKEN, access_token.token)
		localStorage.setItem(ACCESS_EXP, access_token.exp)
	}
}
