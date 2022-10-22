import React from "react"
import { makeAutoObservable } from "mobx"
import { IAttendee, IRoom } from "models"
import { Room } from "services"

export class RoomStore {
  uuid?: string

  info?: IRoom

  // RTC: RTC = new RTC()

  // RTM: RTM = new RTM()

  isFullscreen: boolean = false

  chatPopUp: boolean = false

  constructor() {
    makeAutoObservable(this);
  }

  get attendees(): IAttendee[] | undefined {
    return this.info?.attendees
  }

  async init(uuid?: string) {
    if (uuid !== undefined) {
      this.uuid = uuid
      this.info = await Room.info(uuid)
      // this.rtn = await Room.rtn(uuid)

      // await this.RTC.init(this.rtn)
      // await this.RTM.init(this.rtn)
    }
  }

  // async leave() {
  //   await this.RTC.leave()
  //   await this.RTM.leave()
  // }
}

export const RoomContext = React.createContext<RoomStore>({} as any);

export const useRoomStore = () => React.useContext(RoomContext)
