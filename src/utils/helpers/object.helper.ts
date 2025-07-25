export class ESObject {
  static stringify(data: any) {
    if (typeof data === 'number' || typeof data === 'boolean' || typeof data === 'undefined') {
      return data
    }
    if (typeof data === 'string') {
      return `"${data}"`
    }
    if (typeof data === 'function') {
      return data.toString()
    }
    if (typeof data === 'object') {
      if (data == null) {
        return data
      }
      if (data.name === 'Error') {
        return `Error: ${data.message}`
      }
      try {
        return JSON.stringify(data, null, 2)
      } catch {
        return '[Circular]'
      }
    }
    return data.toString()
  }

  static getNestedValue(obj: Record<string, any>, keyPath: string): any {
    return keyPath.split('.').reduce((acc, key) => {
      if (acc && typeof acc === 'object') {
        return acc[key]
      }
      return undefined
    }, obj)
  }
}

export class ESArray {
  static checkDuplicate = <T>(array: T[], property: keyof T) => {
    const arrayProperty = array.map((item) => item[property])
    const arrayPropertyUnique = Array.from(new Set(arrayProperty))
    return array.length !== arrayPropertyUnique.length
  }

  static uniqueArray = <T>(array: T[]) => {
    return Array.from(new Set(array))
  }

  static arrayToKeyValue = <T>(array: T[], property: keyof T) => {
    const object: Record<string, T> = {}
    array.forEach((item: T) => {
      const key = (item[property] as any).toString()
      object[key] = item
    })
    return object
  }

  static arrayToKeyArray = <T>(array: T[], property: keyof T) => {
    const object: Record<string, T[]> = {}
    array.forEach((item: T) => {
      const key = (item[property] as any).toString()
      if (!object[key]) object[key] = []
      object[key].push(item)
    })
    return object
  }

  static equal = <T>(a: T[], b: T[]) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      const aItem = a[i]
      const bItem = b[i]
      if (typeof aItem !== typeof bItem) return false
      if (aItem !== bItem) {
        return false
      }
    }
    return true
  }
}

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

export const arrayToKeyValue = <T>(array: T[], property: keyof T) => {
  const object: Record<string, T> = {}
  array.forEach((item: T) => {
    const key = (item[property] as any).toString()
    object[key] = item
  })
  return object
}
