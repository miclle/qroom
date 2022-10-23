import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { Button, Col, Form, Input, Layout, Modal, notification, Row, Typography } from "antd"
import { Link } from "react-router-dom"
import { BsCameraVideo } from "react-icons/bs"
import { BiChalkboard, BiCommentDetail } from "react-icons/bi"
import { AiOutlineFolderOpen } from "react-icons/ai"

import { useGlobalContext } from "GlobalStore"
import { IUser } from "models"
import { Room, User } from "services"

const Home = observer(() => {

  const store = useGlobalContext();

  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const createRoom = async () => {
    try {
      const room = await Room.create({})
      window.location.href = `/room/${room.uuid}`
    } catch (error) {
      notification.error({ key: 'create-room-error', message: '创建房间失败，请点击重试' });
    }
  }

  const quickStart = async (type?: string) => {
    if (store.user.signed_in) {
      createRoom()
    } else {
      setModalOpen(true)
    }
  }

  const onFinish = async (values: any) => {
    try {
      await User.create(values).then(async (user: IUser) => { store.setUser(user) })
    } catch (error) {
      notification.error({ key: 'create-user-error', message: '创建用户失败' });
      return
    }
    setModalOpen(false)
    createRoom()
  }

  return (
    <React.Fragment>
      <Modal title="快速开始" open={modalOpen} centered={true} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} name="start" className="start-form" size="large" onFinish={onFinish}>
          <Form.Item name="name" rules={[{ required: true, message: '名字必填' }]}>
            <Input placeholder="输入您的名字" />
          </Form.Item>
          <Form.Item shouldUpdate={true} style={{ textAlign: "right", marginBottom: 0 }}>
            {() => (
              <Button
                type="primary"
                htmlType="submit"
                disabled={!form.isFieldsTouched(true) || form.getFieldsError().filter(({ errors }) => errors.length).length > 0}
              >
                快速开始
              </Button>
            )}
          </Form.Item>
        </Form>
      </Modal>

      <Layout className="landing">
        <Layout.Header>
          <Row>
            <Col flex="auto">
              <Link className="brand" to="/">
                <span>QROOM</span>
                <sup>Beta</sup>
              </Link>
            </Col>
            <Col>
              <Button type="primary" onClick={() => quickStart('quick_start')}>快速开始</Button>
            </Col>
          </Row>
        </Layout.Header>

        <Layout.Content className="welcome">
          <div className="hero">
            <div className="section">
              {
                store.user.signed_in &&
                <Typography.Title level={2}>{`嗨，${store.user.name}`}</Typography.Title>
              }
              <Typography.Title level={1}>与你的家人、朋友和同事互动</Typography.Title>
              <Typography.Title level={3}>在 QROOM，你可以召开视频会议，使用白板分享你的想法，与你喜欢的人发信息聊天。</Typography.Title>
              <div className="feature-actions">
                <ul className="list-inline">
                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('f2f')}><BsCameraVideo /></Button>
                    <span>实时视频</span>
                  </li>
                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('board')}><BiChalkboard /></Button>
                    <span>互动白板</span>
                  </li>
                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('board')}><AiOutlineFolderOpen /></Button>
                    <span>文件共享</span>
                  </li>
                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('im')}><BiCommentDetail /></Button>
                    <span>IM 聊天</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Layout.Content>
      </Layout>
    </React.Fragment>
  )
})

export default Home
