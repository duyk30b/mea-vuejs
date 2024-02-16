import { Exclude, Expose, plainToInstance } from 'class-transformer'
import { FROM_PLAIN } from '../_base/base-expose'
import type { PermissionId } from './permission.enum'

export enum PermissionStatus {
  BLOCK = -1,
  NORMAL = 0,
  PUBLIC = 1,
}

export class Permission {
  @Expose()
  id: PermissionId

  @Expose()
  level: number

  @Expose()
  code: keyof typeof PermissionId

  @Expose()
  name: string

  @Expose()
  parentId: PermissionId | 0

  @Expose()
  rootId: PermissionId

  @Expose()
  pathId: string

  @Expose()
  isActive: 0 | 1

  static fromPlains(plains: Record<string, any>[]): Permission[] {
    return plainToInstance(Permission, plains, {
      exposeUnsetFields: false,
      excludeExtraneousValues: true,
      groups: [FROM_PLAIN],
    })
  }
}
