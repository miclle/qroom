import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { QNTrack } from "qnweb-rtc"
import { groupBy, map } from "lodash"

import { useRoomStore } from "components/Room/context"
import { Stream } from "models"
import Monitor from "./monitor"

const RTC = observer(() => {
  const roomStore = useRoomStore()

  return (
    <div className="streams">
      {
        roomStore.RTC.streams.map((stream) => <Monitors key={stream.user_id} stream={stream} />)
      }
    </div>
  )
})

interface IMonitorsProps {
  stream: Stream
}

const Monitors = observer((props: IMonitorsProps) => {

  const { stream } = props
  const [trackGroup, setTrackGroup] = useState<{ [tag: string]: QNTrack[] }>()

  useEffect(() => {
    setTrackGroup(groupBy(stream.tracks, (track) => track.tag || 'other'))
  }, [stream.isLocal, stream.tracks, stream.user_id])

  return (
    <>
      {
        map(trackGroup, (tracks, tag) =>
          <Monitor key={tag} user_id={stream.user_id || ''} isLocal={stream.isLocal} tracks={tracks} />
        )
      }
    </>
  )
})

export default RTC
