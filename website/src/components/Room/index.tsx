import React, { useEffect, useMemo } from "react"
import { observer } from "mobx-react-lite"
import { Col, Layout, Row } from "antd"
import { Link, useParams } from "react-router-dom"
import QNRTC from "qnweb-rtc";

import { RoomContext, RoomStore } from "./context";

const Room = observer(() => {

  const store = useMemo<RoomStore>(() => new RoomStore(), []);

  const { uuid } = useParams()

  useEffect(() => {
    console.log("current version is", QNRTC.VERSION);

    if (uuid) {
      store.init(uuid)
    }

  }, [store, uuid])

  return (
    <RoomContext.Provider value={store}>
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

        <Layout.Content>

        </Layout.Content>
      </Layout>
    </RoomContext.Provider>
  )
})

export default Room
