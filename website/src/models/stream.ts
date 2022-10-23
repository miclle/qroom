import { makeAutoObservable, runInAction } from "mobx"
import { QNCameraVideoTrack, QNLocalAudioTrack, QNLocalTrack, QNMicrophoneAudioTrack, QNRemoteAudioTrack, QNRemoteVideoTrack, QNScreenVideoTrack } from "qnweb-rtc"
import { IAttendee } from "models"

export class Stream {

  user_id?: string

  attendee?: IAttendee

  isLocal: boolean = false

  tag: string = '';

  audioTrack?: QNMicrophoneAudioTrack | QNLocalAudioTrack | QNRemoteAudioTrack;
  audioMuted: boolean = false;

  videoTrack?: QNCameraVideoTrack | QNScreenVideoTrack | QNRemoteVideoTrack;
  videoMuted: boolean = false;


  constructor() {
    makeAutoObservable(this);
  }

  muteTrack(kind: "audio" | "video", muted: boolean) {
    console.log('muteTrack', kind, muted);
    runInAction(() => {
      switch (kind) {
        case "audio":
          if (this.isLocal && this.audioTrack) {
            const localAudioTrack = this.audioTrack as QNLocalTrack
            localAudioTrack.setMuted(muted);
            this.audioMuted = muted
          }
          break
        case "video":
          if (this.isLocal && this.videoTrack) {
            const localVideoTrack = this.videoTrack as QNLocalTrack
            localVideoTrack.setMuted(muted)
            this.videoMuted = muted
          }
          break
      }
    })
  }

  release() {
    runInAction(() => {
      const localAudioTrack = this.audioTrack as QNLocalTrack
      if (localAudioTrack) {
        localAudioTrack.destroy()
      }

      const localVideoTrack = this.videoTrack as QNLocalTrack
      if (localVideoTrack) {
        localVideoTrack.destroy()
      }

      this.audioTrack = undefined
      this.videoTrack = undefined
    })
  }
}
