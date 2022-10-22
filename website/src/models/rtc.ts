import { makeAutoObservable, observable, runInAction } from "mobx"
import QNRTC, { QNRemoteAudioTrack, QNRemoteVideoTrack, QNRTCClient } from "qnweb-rtc"

import { IRTCInfo, Stream } from "models";

export class RTC {

  info?: IRTCInfo;

  client: QNRTCClient = QNRTC.createClient();

  isFullscreen: boolean = false

  localStream: Stream = new Stream()

  // streams: Stream[] = []
  streams = observable.array<Stream>([], { deep: true })

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
    this.localStream.tracks.push(localTracks[0], localTracks[1])
    this.localStream.isLocal = true

    await this.client.publish(localTracks);
    console.log('publish success! client.userID: ', this.client.userID);

    this.streams.push(this.localStream)

    // ----------------------------------------------------------------

    this.client.remoteUsers.forEach(async (user) => {

      const stream = new Stream()
      stream.user_id = user.userID

      const { videoTracks, audioTracks } = await this.client.subscribe([...user.getVideoTracks(), ...user.getAudioTracks()])
      stream.tracks.push(...videoTracks, ...audioTracks)
      this.streams.push(stream)
    })

    // ----------------------------------------------------------------

    // 用户加入频道
    this.client.on("user-joined", (remoteUserID: string, userData?: string) => {
      runInAction(() => {
        if (this.streams.findIndex(item => item.user_id === remoteUserID) < 0) {
          const stream = new Stream()
          stream.user_id = remoteUserID
          this.streams.push(stream)
        }
      })
    })

    // 用户离开频道
    this.client.on("user-left", (remoteUserID: string) => {
      runInAction(() => {
        const stream = this.streams.find(item => item.user_id === remoteUserID)
        if (stream) { this.streams.remove(stream) }
      })
    })

    // ----------------------------------------------------------------

    // 订阅远端音视频
    this.client.on("user-published", async (userID: string, qntrack: (QNRemoteAudioTrack | QNRemoteVideoTrack)[]) => {
      runInAction(async () => {
        const { videoTracks, audioTracks } = await this.client.subscribe(qntrack)
        let stream = this.streams.find(item => item.user_id === userID)
        if (stream === undefined) {
          stream = new Stream()
          stream.user_id = userID
        }

        stream.tracks.push(...videoTracks, ...audioTracks)
        this.streams.push(stream)
      })
    })

    // 远程用户更新静音状态
    // this.client.on("user-mute-updated", (user: IAgoraRTCRemoteUser) => {
    //   const stream = this.streams.find(item => item.uid === user.uid)
    //   if (stream === undefined) { return }
    //   stream.audioMuted = user.audioMuted
    //   stream.videoMuted = user.videoMuted
    // })
  }

  async shareScreen() {
    // if (this.info === undefined) return

    // this.screenClient = AgoraRTC.createClient({mode: "rtc", codec: "vp8"})

    // this.localScreenStream = new Stream()

    // this.localScreenStream.uid = await this.screenClient.join(this.info.app_id, this.info.channel, this.info.screen_rtc_token, this.info.screen_uid)

    // 创建屏幕共享 track
    // this.localScreenStream.videoTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" })

    // 发布本地音视频
    // await this.screenClient.publish(this.localScreenStream.videoTrack)

    // this.localScreenStream.audioMuted = this.localScreenStream.videoTrack.isMuted
    // this.localScreenStream.isLocal = true

    // this.streams.push(this.localScreenStream)
  }

  // setLocalVideoTrackClarity(clarity: VideoEncoderConfigurationPreset) {
  //   this.localVideoTrackClarity = clarity
  //   const localVideoTrack = this.localStream.videoTrack as ICameraVideoTrack
  //   if (localVideoTrack) {
  //     localVideoTrack.setEncoderConfiguration(clarity as VideoEncoderConfigurationPreset)
  //   }
  // }

  setLocalTrackMute(kind: "audio" | "video", muted: boolean) {
    // this.localStream.muteTrack(kind, muted)
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
