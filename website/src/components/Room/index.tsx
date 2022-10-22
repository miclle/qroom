import React, { useEffect, useMemo, useState } from "react"
import { observer } from "mobx-react-lite"
import { Button, Col, Form, Input, Layout, Modal, notification, Row } from "antd"
import { Link, useParams } from "react-router-dom"

import { IUser } from "models";
import { User } from "services";
import { useGlobalContext } from "GlobalStore";
import { RoomContext, RoomStore } from "./context";
import RTC from "./RTC";

const Room = observer(() => {

  const store = useGlobalContext();
  const roomStore = useMemo<RoomStore>(() => new RoomStore(), []);

  const { uuid } = useParams()

  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values: any) => {
    try {
      await User.create(values).then(async (user: IUser) => { store.setUser(user) })
    } catch (error) {
      notification.error({ key: 'create-user-error', message: '创建用户失败' });
      return
    }
    setModalOpen(false)
  }

  useEffect(() => {

    console.log('store.user.signed_in', store.user.signed_in);

    if (store.user.signed_in) {
      roomStore.init(uuid)
    } else {
      setModalOpen(true)
    }

    return function cleanup() {
      roomStore.leave()
    }
  }, [uuid, roomStore, store.user.signed_in])

  return (
    <>
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
                进入会议
              </Button>
            )}
          </Form.Item>
        </Form>
      </Modal>

      <RoomContext.Provider value={roomStore}>
        <Layout className="room">
          <Layout.Header>
            <Row>
              <Col flex="auto">
                <Link className="brand" to="/">
                  <span>QROOM</span>
                  <sup>Beta</sup>
                </Link>
              </Col>

              <Col className="navs" />
            </Row>
          </Layout.Header>

          {
            store.user.signed_in &&
            <Layout.Content>
              {roomStore.rtc && <RTC />}
            </Layout.Content>
          }
        </Layout>
      </RoomContext.Provider>
    </>
  )
})

export default Room
