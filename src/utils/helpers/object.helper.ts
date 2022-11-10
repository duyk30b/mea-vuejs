// Chỉ ghi đè các trường có thể ghi đè (không làm thay đổi object gốc)
// const origin = { a: 10, b: { b1: 1, b2: 2 }, c: 'xx' }
// const result = objectUpdatePropertyByObject(origin, { a: 3, b: { d: 555, xx: 'xx', b2: 1000 }, c: true })
// result ==> { a: 3, b: { b1: 1, b2: 1000 }, c: 'xx' }
export const objectUpdatePropertyByObject = (origin: Record<string, any>, other: any) => {
	if (typeof origin !== typeof other) {
		if (typeof origin !== 'object') return origin
		else return JSON.parse(JSON.stringify(origin))
	}
	if (typeof origin === typeof other) {
		if (typeof origin !== 'object') return other
		else {
			const result = JSON.parse(JSON.stringify(origin))
			for (const key in result) {
				result[key] = objectUpdatePropertyByObject(result[key], other[key])
			}
			return result
		}
	}
}
