export interface IRoom {
  id:            number
  uuid:          string
  name:          string
  state:         string
  admin_id:      number
  whiteboard_id: string
  created_at:    number
  updated_at:    number
  attendees:     IAttendee[]
  self:          IAttendee
}

export enum Role {
  Admin    = "admin",
  User     = "user"
}

export interface IAttendee {
	user_id:     number
	room_id?:    number
	role:        Role
  uuid:        string
  name:        string
	created_at:  number
	updated_at:  number
}

export interface IRTCInfo {
  userID: string
  token:  string
}

export interface IWhiteboardInfo {
  app_id:     string
  user_id:    string
  room_uuid:  string
  room_token: string
}

export interface IFileItem {
  key:      string
	hash:     string
	fsize:    number
	putTime:  number
	mimeType: string
	type:     number
	endUser:  string
  url:      string
}