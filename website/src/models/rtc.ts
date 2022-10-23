import { makeAutoObservable, runInAction } from "mobx"
import QNRTC, { QNRemoteAudioTrack, QNRemoteTrack, QNRemoteVideoTrack, QNRTCClient, QNScreenVideoTrack } from "qnweb-rtc"

import { IRTCInfo, Stream } from "models";

export class RTC {

  info?: IRTCInfo;

  client: QNRTCClient = QNRTC.createClient();

  isFullscreen: boolean = false

  localStream: Stream = new Stream()

  localScreenStream?: Stream;

  streams: Stream[] = []
  // streams = observable.array<Stream>([], { deep: true })

  constructor() {
    makeAutoObservable(this);
  }

  async init(info: IRTCInfo) {
    this.info = info;

    await this.client.join(this.info.token)

    const audioConfig = { tag: 'mc' }
    const videoConfig = { tag: 'mc' }
    const localTracks = await QNRTC.createMicrophoneAndCameraTracks(audioConfig, videoConfig);
    console.log("my local tracks", localTracks);

    this.localStream.user_id = this.client.userID || this.info.userID
    this.localStream.isLocal = true
    this.localStream.tag = 'mc'
    this.localStream.audioTrack = localTracks[0]
    this.localStream.videoTrack = localTracks[1]

    await this.client.publish(localTracks);
    console.log('publish success! client.userID: ', this.client.userID);

    this.streams.push(this.localStream)

    // ----------------------------------------------------------------

    this.subscribeRemoteUser()

    // ----------------------------------------------------------------

    // 用户加入频道
    // this.client.on("user-joined", (remoteUserID: string, userData?: string) => {
    // })

    // 用户离开频道
    this.client.on("user-left", (remoteUserID: string) => {
      runInAction(() => {
        const index = this.streams.findIndex(item => item.user_id === remoteUserID)
        this.streams.splice(index, 1)
      })
    })

    // ----------------------------------------------------------------

    // 订阅远端音视频
    this.client.on("user-published", async (userID: string, qntrack: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]) => {
      runInAction(async () => {
        const { videoTracks, audioTracks } = await this.client.subscribe(qntrack)

        videoTracks.forEach((track) => {
          let stream = this.streams.find(item => item.user_id === userID && item.tag === track.tag)
          if (stream === undefined) {
            stream = new Stream()
            stream.user_id = userID
            stream.tag = track.tag || 'mc'
            this.streams.push(stream)
          }
          stream.videoTrack = track
        })

        audioTracks.forEach((track) => {
          let stream = this.streams.find(item => item.user_id === userID && item.tag === track.tag)
          if (stream === undefined) {
            stream = new Stream()
            stream.user_id = userID
            stream.tag = track.tag || 'mc'
            this.streams.push(stream)
          }
          stream.audioTrack = track
        })

        this.muteStateChanged([...videoTracks, ...audioTracks])
      })
    })
  }

  subscribeRemoteUser() {
    this.client.remoteUsers.forEach(async (user) => {
      const { videoTracks, audioTracks } = await this.client.subscribe([...user.getVideoTracks(), ...user.getAudioTracks()])

      const mcStream = new Stream()
      const screenStream = new Stream()

      videoTracks.forEach((track) => {
        if (track.tag === 'mc') mcStream.videoTrack = track;
        if (track.tag === 'screen') screenStream.videoTrack = track;
      })

      audioTracks.forEach((track) => {
        if (track.tag === 'mc') mcStream.audioTrack = track;
        if (track.tag === 'screen') screenStream.audioTrack = track;
      })

      if (mcStream.videoTrack !== undefined || mcStream.audioTrack !== undefined) {
        mcStream.user_id = user.userID
        this.streams.push(mcStream)
      }

      if (screenStream.videoTrack !== undefined || screenStream.audioTrack !== undefined) {
        screenStream.user_id = user.userID
        this.streams.push(screenStream)
      }

      this.muteStateChanged([...videoTracks, ...audioTracks])
    })
  }

  // 远程用户更新静音状态
  muteStateChanged(tracks: QNRemoteTrack[]) {
    tracks.forEach((track) => {
      (function (track, streams) {
        track.on('mute-state-changed', (isMuted: boolean) => {
          runInAction(async () => {
            const stream = streams.find(item => item.user_id === track.userID && item.tag === track.tag)
            if (stream === undefined) { return }
            if (track.isAudio()) stream.audioMuted = isMuted
            if (track.isVideo()) stream.videoMuted = isMuted
          })
        })
      })(track, this.streams)
    })
  }

  async shareScreen() {
    if (this.info === undefined) return

    const screenTrack = await QNRTC.createScreenVideoTrack({
      screenVideoTag: 'screen',
      screenAudioTag: 'screen'
    }, 'disable') as QNScreenVideoTrack

    await this.client.publish(screenTrack)

    this.localScreenStream = new Stream()
    this.localScreenStream.user_id = this.info.userID
    this.localScreenStream.isLocal = true
    this.localScreenStream.videoTrack = screenTrack
    this.streams.push(this.localScreenStream)
  }

  // setLocalVideoTrackClarity(clarity: VideoEncoderConfigurationPreset) {
  //   this.localVideoTrackClarity = clarity
  //   const localVideoTrack = this.localStream.videoTrack as ICameraVideoTrack
  //   if (localVideoTrack) {
  //     localVideoTrack.setEncoderConfiguration(clarity as VideoEncoderConfigurationPreset)
  //   }
  // }

  setLocalTrackMute(kind: "audio" | "video", muted: boolean) {
    this.localStream.muteTrack(kind, muted)
  }

  async leave() {
    if (this.localStream) {
      this.localStream.release()
    }

    if (this.client) {
      await this.client.leave()
    }
  }
}
