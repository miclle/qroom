export interface IRoom {
  id:         number
  uuid:       string
  name:       string
  state:      string
  admin_id:   number
  created_at: number
  updated_at: number
  attendees:  IAttendee[]
  self:       IAttendee
}

export enum Role {
  Admin    = "admin",
  User     = "user"
}

export interface IAttendee {
	user_id:     number
	room_id?:    number
	role:        Role
	created_at:  number
	updated_at:  number
}
