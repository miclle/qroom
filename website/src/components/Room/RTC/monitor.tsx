import React, { useState, useRef, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { QNCameraVideoTrack, QNLocalAudioTrack, QNMicrophoneAudioTrack, QNRemoteAudioTrack, QNRemoteVideoTrack, QNScreenVideoTrack, QNTrack } from "qnweb-rtc"
import className from "classnames"
import { BiMicrophoneOff } from "react-icons/bi"

import { IAttendee } from "models"
import { useRoomStore } from "../context"
import AudioVolume from "./AudioVolume"

interface IMonitorOptions {
  user_id: string
  isLocal: boolean
  tracks: QNTrack[]
}

const Monitor = observer((options: IMonitorOptions) => {
  const roomStore = useRoomStore()

  const { user_id, isLocal, tracks } = options

  const [attendee, setAttendee] = useState<IAttendee | undefined>(undefined)
  const playerRef = useRef<HTMLDivElement>(null)

  const [audioTrack, setAudioTrack] = useState<QNMicrophoneAudioTrack | QNLocalAudioTrack | QNRemoteAudioTrack>()
  const [videoTrack, setVideoTrack] = useState<QNCameraVideoTrack | QNScreenVideoTrack | QNRemoteVideoTrack>()

  useEffect(() => {
    const playerElement = playerRef.current
    if (!playerElement) return

    tracks.forEach((track) => {
      if (track.isAudio()) {
        setAudioTrack(track as QNMicrophoneAudioTrack | QNLocalAudioTrack | QNRemoteAudioTrack)
        if (!isLocal) track.play(playerElement)
      }
      if (track.isVideo()) {
        setVideoTrack(track as QNCameraVideoTrack | QNScreenVideoTrack | QNRemoteVideoTrack)
        track.play(playerElement)
      }
    })
  }, [isLocal, tracks])

  useEffect(() => {
    const attendee = roomStore.attendees?.find(item => item.uuid === user_id)
    if (attendee !== undefined) {
      setAttendee(attendee)
      return
    }
    // if (user_id !== undefined) {
    //   const user_id = +user_id
    //   const attendee = roomStore.attendees?.find(item => item.uuid === user_id)
    //   if (attendee !== undefined) {
    //     attendee.name = `${attendee.name}'s Screensharing`
    //     setAttendee(attendee)
    //   }
    // }
  }, [user_id, roomStore.attendees])

  return (
    <div id={`monitor-${user_id}`} className="monitor">
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
