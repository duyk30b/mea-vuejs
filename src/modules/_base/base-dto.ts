export type BaseResponse<T = any> = {
  data: T
  meta: { page: number; limit: number; total: number } | Record<string, any>
  message: string
  status: number
  time: string
}
