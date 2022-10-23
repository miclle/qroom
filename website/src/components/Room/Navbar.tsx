import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { observer } from "mobx-react-lite"
import fscreen from "fscreen"
import { Layout, Row, Col, Button, Tooltip, Modal, Input, message } from "antd"
import CopyToClipboard from "react-copy-to-clipboard"
import { FiUsers } from "react-icons/fi";
import { BiChalkboard, BiCommentDetail, BiMicrophone, BiMicrophoneOff } from "react-icons/bi"
import { TbScreenShare } from "react-icons/tb"
import { AiOutlineFolderOpen, AiOutlineLink, AiOutlineSetting } from "react-icons/ai"
import { FaSignOutAlt } from "react-icons/fa"
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs"
import { VscScreenNormal, VscScreenFull } from "react-icons/vsc"

import { useGlobalContext } from "GlobalStore"
import { useRoomStore } from "./context"
import FileBox from "./FileBox"

// import Settings from "./settings"

const Navbar = observer(() => {
  const globalStore = useGlobalContext();
  const roomStore = useRoomStore()

  const shareLink = `http://localhost:9000/room/${roomStore.info?.uuid}`

  const [invitePeopleModalVisible, setInvitePeopleModalVisible] = useState(false)
  const [folderModalVisible, setFolderModalVisible] = useState(false)
  const [settingsModalVisible, setSettingsModalVisible] = useState(false)

  // 全屏事件监听
  useEffect(() => {
    if (fscreen.fullscreenEnabled) {
      fscreen.addEventListener("fullscreenchange", () => { roomStore.isFullscreen = fscreen.fullscreenElement !== null }, false)
    }
  }, [roomStore])

  // 全屏切换
  const switchFullscreen = () => {
    roomStore.isFullscreen ? fscreen.exitFullscreen() : fscreen.requestFullscreen(document.documentElement)
  }

  // 离开房间
  const exit = async () => {
    await roomStore.leave()
    window.location.href = "/"
  }

  return (
    <Layout.Header className="navbar-room">
      <Row>
        <Col flex="auto" className="navbar-brand">
          <Link className="brand" to="/">
            <span>QROOM</span>
            <sup>Beta</sup>
          </Link>
          <span className="nav-item" style={{ marginLeft: 30 }}>{globalStore.user.name}</span>
        </Col>

        <Col>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Tooltip placement="bottom" title="邀请他人">
                <Button type="link" onClick={() => setInvitePeopleModalVisible(true)}>
                  <FiUsers size={22} />
                </Button>
              </Tooltip>

              <Modal
                title="邀请他人"
                open={invitePeopleModalVisible}
                onCancel={() => setInvitePeopleModalVisible(false)}
                centered={true}
                footer={null}
                bodyStyle={{ textAlign: "right" }}>
                <Input size="large" readOnly={true} value={shareLink} />

                <CopyToClipboard text={shareLink} onCopy={() => message.success('链接复制到剪贴板。')}>
                  <Button size="large" style={{ marginTop: 5 }}>
                    <AiOutlineLink width={18} height={18} style={{ verticalAlign: "middle", marginRight: 3 }} />
                    拷贝分享链接
                  </Button>
                </CopyToClipboard>
              </Modal>
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title="白板">
                <Button type="link">
                  <BiChalkboard size={22} />
                </Button>
              </Tooltip>
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title="共享文件">
                <Button type="link" onClick={() => setFolderModalVisible(true)}>
                  <AiOutlineFolderOpen size={22} />
                </Button>
              </Tooltip>

              <Modal
                title="共享文件"
                open={folderModalVisible}
                onCancel={() => setFolderModalVisible(false)}
                width={1000}
                footer={null}
                bodyStyle={{ padding: 0 }}
              >
                <FileBox />
              </Modal>
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title={roomStore.chatPopUp ? '关闭聊天' : '打开聊天'}>
                <Button type="link" onClick={() => roomStore.chatPopUp = !roomStore.chatPopUp}>
                  <BiCommentDetail size={22} />
                </Button>
              </Tooltip>
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title="分享屏幕">
                <Button type="link" onClick={() => roomStore.RTC.shareScreen()} disabled={roomStore.RTC.localScreenStream !== undefined}>
                  <TbScreenShare size={22} />
                </Button>
              </Tooltip>
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title={roomStore.RTC.localStream.audioMuted ? '打开麦克风' : '麦克风静音'}>
                <Button type="link" onClick={() => roomStore.RTC.setLocalTrackMute("audio", !roomStore.RTC.localStream.audioMuted)}>
                  {roomStore.RTC.localStream.audioMuted ? <BiMicrophoneOff size={22} /> : <BiMicrophone size={22} />}
                </Button>
              </Tooltip>
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title={roomStore.RTC.localStream.videoMuted ? '开启摄像头' : '关闭摄像头'}>
                <Button type="link" onClick={() => roomStore.RTC.setLocalTrackMute("video", !roomStore.RTC.localStream.videoMuted)}>
                  {roomStore.RTC.localStream.videoMuted ? <BsCameraVideoOff size={22} /> : <BsCameraVideo size={22} />}
                </Button>
              </Tooltip>
            </li>

            {
              fscreen.fullscreenEnabled &&
              <li className="nav-item">
                <Tooltip placement="bottom" title={roomStore.isFullscreen ? '退出全屏' : '全屏'}>
                  <Button type="link" onClick={switchFullscreen}>
                    {roomStore.isFullscreen ? <VscScreenNormal size={22} /> : <VscScreenFull size={22} />}
                  </Button>
                </Tooltip>
              </li>
            }

            <li className="nav-item">
              <Tooltip placement="bottom" title="设置">
                <Button type="link" onClick={() => setSettingsModalVisible(true)}>
                  <AiOutlineSetting size={22} />
                </Button>
              </Tooltip>
              {/* <Settings visible={settingsModalVisible} onCancel={() => setSettingsModalVisible(false)} /> */}
            </li>

            <li className="nav-item">
              <Tooltip placement="bottom" title="离开房间">
                <Button type="link" onClick={exit}>
                  <FaSignOutAlt size={22} />
                </Button>
              </Tooltip>
            </li>
          </ul>
        </Col>
      </Row>
    </Layout.Header>
  )
})

export default Navbar
