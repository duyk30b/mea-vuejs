export type BaseResponse<T = any> = {
  message: string
  status: number
  data: T
}
