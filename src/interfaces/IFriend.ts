export interface IFriend {
  id?: string
  firstName: string
  lastName: string
  email: string
  password: string
  role?: string
}

export interface IEditFriend {
  id?: string
  firstName: string
  lastName: string
  email: string
  password?: string
  role?: string
}
