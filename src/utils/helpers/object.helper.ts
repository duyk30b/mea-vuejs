export class ESObject {
  static stringify(
    obj: object,
    options?: { maxInlineLength?: number; maxInlineKeys?: 3; indent?: 2 },
  ): string {
    const maxInlineLength = options?.maxInlineLength || 60
    const maxInlineKeys = options?.maxInlineKeys || 3
    const indent = options?.indent || 2

    function shouldInline(value: any): boolean {
      if (typeof value !== 'object' || value === null) return true

      if (Array.isArray(value)) {
        // Array ngắn và đơn giản thì inline
        const str = JSON.stringify(value)
        return (
          str.length <= maxInlineLength && !value.some((v) => typeof v === 'object' && v !== null)
        )
      }

      // Object nhỏ thì inline
      const keys = Object.keys(value)
      if (keys.length > maxInlineKeys) return false

      const str = JSON.stringify(value)
      return str.length <= maxInlineLength
    }

    function stringifyInline(value: any): string {
      if (typeof value !== 'object' || value === null) return JSON.stringify(value)

      if (Array.isArray(value)) {
        return '[' + value.map((v) => stringifyInline(v)).join(', ') + ']'
      }

      // Object
      const keys = Object.keys(value)
      const pairs = keys.map((key) => {
        const val = value[key as keyof typeof value]
        return JSON.stringify(key) + ': ' + stringifyInline(val)
      })

      return '{ ' + pairs.join(', ') + ' }'
    }

    function stringify(value: any, currentIndent: number = 0): string {
      if (value === null) return 'null'
      if (typeof value !== 'object') return JSON.stringify(value)

      const spaces = ' '.repeat(currentIndent)
      const nextSpaces = ' '.repeat(currentIndent + indent)

      if (Array.isArray(value)) {
        if (value.length === 0) return '[]'
        if (shouldInline(value)) return JSON.stringify(value)

        // Mỗi item tự quyết định inline hay xuống dòng
        const items = value.map((v) => {
          const itemShouldInline = shouldInline(v)
          const serialized =
            itemShouldInline && typeof v === 'object' && v !== null
              ? stringifyInline(v)
              : stringify(v, currentIndent + indent)
          return nextSpaces + serialized
        })
        return '[\n' + items.join(',\n') + '\n' + spaces + ']'
      }

      // Object
      const keys = Object.keys(value)
      if (keys.length === 0) return '{}'

      const pairs = keys.map((key) => {
        const val = value[key as keyof typeof value]
        const serializedValue = shouldInline(val)
          ? stringifyInline(val)
          : stringify(val, currentIndent + indent)

        return nextSpaces + JSON.stringify(key) + ': ' + serializedValue
      })

      return '{\n' + pairs.join(',\n') + '\n' + spaces + '}'
    }

    return stringify(obj)
  }

  static safeStringify(data: any) {
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
