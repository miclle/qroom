import React, { useState, useRef, useEffect } from "react"
import { observer } from "mobx-react-lite"
import className from "classnames"
import { Button } from "antd"
import { BiMicrophoneOff } from "react-icons/bi"

import { IAttendee, Stream } from "models"
import { useRoomStore } from "../context"
import AudioVolume from "./AudioVolume"
import { VscScreenFull, VscScreenNormal } from "react-icons/vsc"

interface IMonitorOptions {
  user_id: string
  isLocal: boolean
  stream: Stream
}

const Monitor = observer((options: IMonitorOptions) => {
  const roomStore = useRoomStore()

  const { user_id, isLocal, stream } = options

  const streamID = `${user_id}-${stream.tag}`

  const [attendee, setAttendee] = useState<IAttendee | undefined>(undefined)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const playerElement = playerRef.current
    if (!playerElement) return
    if (!stream.videoTrack) return
    stream.videoTrack.play(playerElement, { mirror: true })
  }, [stream.videoTrack])

  useEffect(() => {
    const playerElement = playerRef.current
    if (!playerElement) return

    if (!stream.audioTrack || stream.isLocal) return
    stream.audioTrack.play(playerElement)
  }, [stream])

  useEffect(() => {
    const attendee = roomStore.attendees?.find(item => item.uuid === user_id)
    if (attendee !== undefined) {
      setAttendee(attendee)
      return
    }
  }, [user_id, roomStore.attendees])

  return (
    <div
      id={`monitor-${user_id}`}
      className={className({
        "monitor": true,
        "isLocal": isLocal,
        "active": roomStore.stageStreamID === streamID
      })}
    >
      <svg role="img" viewBox="0 0 16 9" xmlns="http:www.w3.org/2000/svg"></svg>

      <div className="cover" />

      <div
        ref={playerRef}
        className={className({
          "player": true,
          "video-mute": stream.videoMuted,
          "audio-mute": stream.audioMuted
        })}
      />

      <div className="info">
        <span>
          {attendee?.name}
          {stream.tag === 'screen' && ' 屏幕共享'}
        </span>
        <div className={className({ "audio-status": true, "mute": stream.audioMuted })}>
          {
            (stream.audioTrack && !stream.audioMuted) && <AudioVolume track={stream.audioTrack} />
          }
          {
            (stream.audioTrack && stream.audioMuted) && <BiMicrophoneOff height={18} />
          }
        </div>
      </div>

      <div className="actions">
        <Button
          size="small"
          type="link"
          onClick={() => roomStore.setStageStream(roomStore.stageStreamID === streamID ? '' : streamID)}>
          {
            roomStore.stageStreamID === streamID
            ? <VscScreenNormal size={22} />
            : <VscScreenFull size={22} />
          }
        </Button>
      </div>
    </div>
  )
})

export default Monitor;
