import React, { useState, useRef, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { QNCameraVideoTrack, QNLocalAudioTrack, QNMicrophoneAudioTrack, QNRemoteAudioTrack, QNRemoteVideoTrack, QNScreenVideoTrack } from "qnweb-rtc"
import className from "classnames"
import { BiMicrophoneOff } from "react-icons/bi"

import { IAttendee, Stream } from "models"
import { useRoomStore } from "../context"
import AudioVolume from "./AudioVolume"

interface IMonitorOptions {
  user_id: string
  isLocal: boolean
  stream: Stream
  // tracks: QNTrack[]
}

const Monitor = observer((options: IMonitorOptions) => {
  const roomStore = useRoomStore()

  const { user_id, isLocal, stream } = options

  const [attendee, setAttendee] = useState<IAttendee | undefined>(undefined)
  const playerRef = useRef<HTMLDivElement>(null)

  const [audioTrack, setAudioTrack] = useState<QNMicrophoneAudioTrack | QNLocalAudioTrack | QNRemoteAudioTrack>()
  const [videoTrack, setVideoTrack] = useState<QNCameraVideoTrack | QNScreenVideoTrack | QNRemoteVideoTrack>()

  useEffect(() => {
    stream.tracks.forEach((track) => {

      const playerElement = playerRef.current
      if (!playerElement) return

      const tag = track.tag || 'other'

      let span
      let elements = playerRef.current.getElementsByClassName(tag)
      if (elements.length > 0) {
        span = elements[0] as HTMLElement
      } else {
        span = document.createElement('span');
        span.className = tag
        playerRef.current.appendChild(span);
      }

      if (track.isAudio()) {
        setAudioTrack(track as QNMicrophoneAudioTrack | QNLocalAudioTrack | QNRemoteAudioTrack)
        if (!isLocal) track.play(span)
      }
      if (track.isVideo()) {
        setVideoTrack(track as QNCameraVideoTrack | QNScreenVideoTrack | QNRemoteVideoTrack)
        track.play(span, { mirror: true })
      }
    })
  }, [isLocal, stream.tracks])

  useEffect(() => {
    const attendee = roomStore.attendees?.find(item => item.uuid === user_id)
    if (attendee !== undefined) {
      setAttendee(attendee)
      return
    }
  }, [user_id, roomStore.attendees])

  return (
    <div id={`monitor-${user_id}`} className={className({ "monitor": true, "isLocal": isLocal })}>
      <svg role="img" viewBox="0 0 16 9" xmlns="http:www.w3.org/2000/svg"></svg>

      <div className="cover" />

      <div
        ref={playerRef}
        className={className({
          "player": true,
          "video-mute": videoTrack?.isMuted(),
          "audio-mute": audioTrack?.isMuted()
        })}
      />

      <div className="info">
        <span>{attendee?.name}</span>
        <div className={className({ "audio-status": true, "mute": audioTrack?.isMuted() })}>
          {
            (audioTrack && !audioTrack.isMuted()) && <AudioVolume track={audioTrack} />
          }
          {
            (audioTrack && audioTrack.isMuted()) && <BiMicrophoneOff height={18} />
          }
        </div>
      </div>
    </div>
  )
})

export default Monitor;
