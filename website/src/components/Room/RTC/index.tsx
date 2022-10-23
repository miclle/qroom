import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"

import { useRoomStore } from "components/Room/context"
import { Stream } from "models"
import Monitor from "./monitor"

const RTC = observer(() => {
  const roomStore = useRoomStore()

  const [streams, setStreams] = useState<Stream[]>([])

  useEffect(() => {
    console.log('RTC roomStore.RTC.streams', roomStore.RTC.streams);

    setStreams(roomStore.RTC.streams)

  }, [roomStore.RTC.streams])

  return (
    <div className="streams">
      {
        streams.map((stream) => <Monitor key={stream.user_id} user_id={stream.user_id || ''} isLocal={stream.isLocal} stream={stream} />)
      }
    </div>
  )
})

export default RTC
