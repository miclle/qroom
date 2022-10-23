import React, { useRef } from "react"
import className from "classnames"
import { observer } from "mobx-react-lite"
import { Button, Form, Input } from "antd"

import { ChatMessage, IAttendee } from "models"

import { useRoomStore } from "./context"
import { BiCommentDetail } from "react-icons/bi"
import { AiOutlineClose } from "react-icons/ai"

const Chat = observer(() => {

  const roomStore = useRoomStore()

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [form] = Form.useForm()

  const getMember = (uid: string): IAttendee | undefined => {
    return roomStore.attendees?.find(item => item.uuid === uid)
  }

  const onFinish = async (values: any) => {

    if (values.content === undefined || values.content.trim() === "") {
      form.resetFields()
      if (inputRef.current) {
        inputRef.current.focus()
      }
      return
    }

    const message = new ChatMessage({
      content: values.content as string,
      uid:  `${roomStore.info?.self.uuid}`
    })

    await roomStore.RTC.sendMessage(message).then(() => {
      form.resetFields()
      roomStore.RTC.chatMessages.push(message)
    })

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div id="chat" className={className({open: roomStore.chatPopUp})}>
      <header>
        <BiCommentDetail size="16" />
        <span style={{ marginLeft: 5 }}>聊天</span>

        <Button type="link" size="small" onClick={ () => roomStore.chatPopUp = false }>
          <AiOutlineClose size="20" />
        </Button>
      </header>

      <ul className="message-list">
        {
          roomStore.RTC.chatMessages.map((message, index) =>
          <li key={`${message.timestamp}-${message.uid}-${index}`} className={className({ "self": `${roomStore.info?.self.uuid}` === message.uid })}>
            <div className="avatar">
              {/* <img src="" alt="" width="64" height="64" /> */}
            </div>

            <div className="body">
              <h6 className="userinfo">
                <span>{ getMember(message.uid)?.name || message.uid }</span>
              </h6>
              <p>{ message.content }</p>
            </div>
          </li>
          )
        }
      </ul>

      <Form
        form={form}
        name="signin"
        className="intercom"
        onFinish={onFinish}>

        <Form.Item name="content">
          <Input.TextArea
            ref={inputRef}
            autoSize={{minRows: 2, maxRows: 2}}
            placeholder="给房间里的每个人发个信息"
            onPressEnter={ () => { form.submit(); return false } }
          />
        </Form.Item>
      </Form>
    </div>
  )
})

export default Chat
