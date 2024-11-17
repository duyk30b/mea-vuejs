export type LoginDto = {
  orgPhone: string
  username: string
  password: string
}
export type LoginRootDto = LoginDto & { oid: number }

export type RegisterDto = {
  phone: string
  email: string
  username: string
  password: string
}
