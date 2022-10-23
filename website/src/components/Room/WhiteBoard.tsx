import React, { useEffect, useRef } from "react"
import { observer } from "mobx-react-lite"
import QNWhiteBoard from "qnweb-whiteboard";
import { useRoomStore } from "./context"

const client = QNWhiteBoard.create();

const WhiteBoard = observer(() => {

  const roomStore = useRoomStore()

  const whiteboardRef = useRef<HTMLDivElement>(null)

  console.log("QNWhiteBoard current version is", QNWhiteBoard.version);

  useEffect(() => {
    if (whiteboardRef.current === null) return
    if (roomStore.whiteboard === undefined) return

    console.log('whiteboardRef.current', whiteboardRef.current);

    client.initConfig({
      path: '/webassembly/whiteboardcanvas.html',
      el: whiteboardRef.current,
    })

    client.registerRoomEvent({
      onJoinSuccess: () => console.log('onJoinSuccess'),
      onJoinFailed: () => console.log('onJoinFailed'),
      onRoomStatusChanged: () => console.log('onRoomStatusChanged'),
    })

    const appId = roomStore.whiteboard.app_id
    const meetingId = roomStore.whiteboard.meeting_id
    const userId = roomStore.whiteboard.user_id
    const token = roomStore.whiteboard.token


    // client.joinRoom(appId, meetingId, userId, token);

  }, [roomStore.whiteboard])

  return (
    <div id="whiteboard">
      <h1>WhiteBoard</h1>
      <div id="iframeBox" ref={whiteboardRef}></div>
    </div>
  )
})

export default WhiteBoard
