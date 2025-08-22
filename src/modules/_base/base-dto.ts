export type BaseResponse<T = any> = {
  data: T
  meta: Record<string, any>
  message: string
  success: boolean
  time: string
}
