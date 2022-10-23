import React from "react"
import { makeAutoObservable, runInAction } from "mobx"

import { IAttendee, IRoom, IRTCInfo, IWhiteboardInfo, RTC } from "models"
import { Room } from "services"

export class RoomStore {
  uuid?: string;

  info?: IRoom;

  rtc?: IRTCInfo;

  whiteboard?: IWhiteboardInfo

  RTC: RTC = new RTC()

  isFullscreen: boolean = false

  chatPopUp: boolean = false

  constructor() {
    makeAutoObservable(this);
  }

  get attendees(): IAttendee[] {
    return this.info?.attendees || []
  }

  async init(uuid?: string) {
    runInAction(async () => {
      if (uuid !== undefined) {
        this.uuid = uuid

        this.info = await Room.info(uuid)
        this.rtc = await Room.rtc(uuid)
        this.whiteboard = await Room.whiteboard(uuid)

        this.RTC.init(this.rtc)
      }
    })
  }

  async leave() {
    await this.RTC.leave()
  }
}

export const RoomContext = React.createContext<RoomStore>({} as any);

export const useRoomStore = () => React.useContext(RoomContext)
