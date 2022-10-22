import React, { useEffect, useMemo } from "react"
import { observer } from "mobx-react-lite"
import { Col, Layout, Row } from "antd"
import { Link, useParams } from "react-router-dom"

import { RoomContext, RoomStore } from "./context";
import RTC from "./RTC";

const Room = observer(() => {

  const store = useMemo<RoomStore>(() => new RoomStore(), []);

  const { uuid } = useParams()

  useEffect(() => {
    store.init(uuid)

    return function cleanup() {
      store.leave()
    }
  }, [uuid, store])

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

          { store.rtc && <RTC /> }

        </Layout.Content>
      </Layout>
    </RoomContext.Provider>
  )
})

export default Room
