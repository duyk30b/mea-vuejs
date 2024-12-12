// Chỉ ghi đè các trường có thể ghi đè (không làm thay đổi object gốc)
// const origin = { a: 10, b: { b1: 1, b2: 2 }, c: 'xx' }
// const result = objectUpdatePropertyByObject(origin, { a: 3, b: { d: 555, xx: 'xx', b2: 1000 }, c: true })

// result ==> { a: 3, b: { b1: 1, b2: 1000 }, c: 'xx' }
export const objectUpdatePropertyByObject = (origin: Record<string, any>, other: any) => {
  // nếu thay đổi kiểu dữ liệu, phải giữ thằng gốc
  if (typeof origin !== typeof other) {
    if (typeof origin !== 'object') return origin
    else return JSON.parse(JSON.stringify(origin))
  }
  // cùng kiểu dữ liệu thì xử lý cập nhật
  if (typeof origin === typeof other) {
    if (typeof origin !== 'object') return other // giá trị cơ bản thì cập nhật thôi
    if (Array.isArray(origin)) {
      if (!Array.isArray(other)) return JSON.parse(JSON.stringify(origin))
      else return JSON.parse(JSON.stringify(other))
    } else {
      const result = JSON.parse(JSON.stringify(origin))
      for (const key in result) {
        result[key] = objectUpdatePropertyByObject(result[key], other[key])
      }
      return result
    }
  }
}

export const uniqueArray = <T>(array: T[]) => {
  return Array.from(new Set(array))
}

export const arrayToKeyValue = <T>(array: T[], property: keyof T) => {
  const object: Record<string, T> = {}
  array.forEach((item: T) => {
    const key = (item[property] as any).toString()
    object[key] = item
  })
  return object
}

export const arrayToKeyArray = <T>(array: T[], property: keyof T) => {
  const object: Record<string, T[]> = {}
  array.forEach((item: T) => {
    const key = (item[property] as any).toString()
    if (!object[key]) object[key] = []
    object[key].push(item)
  })
  return object
}
