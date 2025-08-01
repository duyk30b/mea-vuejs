export type LoginDto = {
  organizationCode: string
  username: string
  password: string
}
export type LoginRootDto = LoginDto & { oid: number; uid: number }

export type RegisterDto = {
  phone: string
  email: string
  username: string
  password: string
}
