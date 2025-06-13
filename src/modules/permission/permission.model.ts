import type { PermissionId } from './permission.enum'

export enum PermissionStatus {
  BLOCK = -1,
  NORMAL = 0,
  PUBLIC = 1,
}

export class Permission {
  id: PermissionId
  level: number
  code: keyof typeof PermissionId
  name: string
  parentId: PermissionId | 0
  rootId: PermissionId
  pathId: string
  isActive: 0 | 1

  children: Permission[]

  static basic(source: Permission) {
    const target = new Permission()
    Object.keys(target).forEach((key) => {
      const value = target[key as keyof typeof target]
      if (value === undefined) delete target[key as keyof typeof target]
    })
    Object.assign(target, source)
    return target
  }

  static basicList(sources: Permission[]): Permission[] {
    return sources.map((i) => Permission.basic(i))
  }

  static from(source: Permission) {
    const target = Permission.basic(source)
    return target
  }

  static fromList(sourceList: Permission[]): Permission[] {
    return sourceList.map((i) => Permission.from(i))
  }
}
