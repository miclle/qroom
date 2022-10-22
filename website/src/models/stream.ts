import { makeAutoObservable, runInAction } from "mobx"
import { QNLocalTrack, QNTrack } from "qnweb-rtc"
import { IAttendee } from "models"

export class Stream {

  user_id?: string

  attendee?: IAttendee

  isLocal: boolean = false

  tracks: QNTrack[] = []

  constructor() {
    makeAutoObservable(this);
  }

  pushTrack(tracks: QNTrack[]) {
    runInAction(() => {

      tracks.forEach((track) => {
        let index = this.tracks.findIndex(item => item.trackID === track.trackID)
        if (index < 0) {
          this.tracks.push(track)
        }
      })

    })
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
    runInAction(() => {
      if (this.isLocal) {
        this.tracks.forEach((track) => {
          const localTrack = track as QNLocalTrack
          localTrack.destroy()
        })
      }
      this.tracks = []
    })
  }
}
