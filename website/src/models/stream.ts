import { makeAutoObservable } from "mobx"
import { QNTrack } from "qnweb-rtc"
import { IAttendee } from "models"

export class Stream {

  user_id?: string

  attendee?: IAttendee

  isLocal: boolean = false

  tracks: QNTrack[] = []

  constructor() {
    makeAutoObservable(this);
  }

  // muteTrack(kind: "audio" | "video", muted: boolean) {
  //   switch (kind) {
  //     case "audio":
  //       if (this.isLocal && this.audioTracks) {
  //         const localAudioTrack = this.audioTracks as QNLocalTrack
  //         localAudioTrack.setMuted(muted);
  //       }
  //       break
  //     case "video":
  //       if (this.isLocal && this.videoTracks) {
  //         const localVideoTrack = this.videoTracks as QNLocalTrack
  //         localVideoTrack.setMuted(muted)
  //       }
  //       break
  //   }
  // }

  release() {
    // if (this.isLocal) {
    //   const localAudioTrack = this.audioTracks as QNLocalTrack
    //   if (localAudioTrack) {
    //     localAudioTrack.destroy()
    //   }

    //   const localVideoTrack = this.videoTracks as QNLocalTrack
    //   if (localVideoTrack) {
    //     localVideoTrack.destroy()
    //   }
    // }

    // this.audioTracks = undefined
    // this.videoTracks = undefined
  }
}
