export type LoginDto = {
  orgPhone: string
  username: string
  password: string
}

export type RegisterDto = {
  phone: string
  email: string
  username: string
  password: string
}

export type ForgotPasswordDto = {
  orgPhone: string
  email: string
  username: string
}

export type ResetPasswordDto = {
  orgPhone: string
  username: string
  password: string
  token: string
}
