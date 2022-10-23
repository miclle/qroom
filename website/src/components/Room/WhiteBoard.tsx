import React from "react"
import { observer } from "mobx-react-lite"

import { useFastboard, Fastboard } from "@netless/fastboard-react";

import { useRoomStore } from "./context"

const WhiteBoard = observer(() => {

  const roomStore = useRoomStore()

  const fastboard = useFastboard(() => ({
    sdkConfig: {
      appIdentifier: roomStore.whiteboard!.app_id,
      region: "cn-hz",
    },
    joinRoom: {
      uid: roomStore.whiteboard!.user_id,
      uuid: roomStore.whiteboard!.room_uuid,
      roomToken: roomStore.whiteboard!.room_token,
    },
  }));

  return (
    <div id="whiteboard">
      <Fastboard app={fastboard} />
    </div>
  )
})

export default WhiteBoard
