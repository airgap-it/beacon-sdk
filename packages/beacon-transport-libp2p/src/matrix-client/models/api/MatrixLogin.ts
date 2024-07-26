export interface MatrixLoginRequest {
  type: 'm.login.password'
  identifier: {
    type: 'm.id.user'
    user: string
  }
  password: string
  device_id?: string
}

export interface MatrixLoginResponse {
  type?: 'login'
  user_id: string
  device_id: string
  access_token: string
}
