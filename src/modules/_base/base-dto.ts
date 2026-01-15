export type FullResponse<T = any> = {
  success: boolean
  time: string
  meta: { oid: number; uid: number; clientId: string }
  data: T
  message: string
  args?: Record<string, any>
}
