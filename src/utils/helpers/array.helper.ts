export const arrayToKeyValue = <T>(array: T[], property: keyof T) => {
  const object: Record<string, T> = {}
  array.forEach((item: T) => {
    const key = (item[property] as any).toString()
    object[key] = item
  })
  return object
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
