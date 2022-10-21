import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { Button, Col, Layout, Row, Typography } from "antd"
import { Link } from "react-router-dom"

import { BsCameraVideo } from "react-icons/bs"
import { BiChalkboard, BiCommentDetail } from "react-icons/bi"

import QuickStart from "components/QuickStart"

const Home = observer(() => {

  const [modalOpen, setModalOpen] = useState(false)

  const quickStart = (type?: string) => {
    setModalOpen(true)
  }

  return (
    <React.Fragment>
      <QuickStart open={modalOpen} onCancel={ () => setModalOpen(false) } />

      <Layout className="landing">
        <Layout.Header>
          <Row>
            <Col flex="auto">
              <Link className="brand" to="/">
                <span>QROOM</span>
                <sup>Beta</sup>
              </Link>
            </Col>

            <Col className="navs">
              <Button type="primary" onClick={() => quickStart('quick_start')}>快速开始</Button>
            </Col>
          </Row>
        </Layout.Header>

        <Layout.Content className="welcome">
          <div className="hero">
            <div className="section">

              <Typography.Title level={1}>与你的家人、朋友和同事互动</Typography.Title>
              <Typography.Title level={3}>在 QROOM，你可以召开视频会议，使用白板分享你的想法，与你喜欢的人发信息聊天。</Typography.Title>

              <div className="feature-actions">
                <ul className="list-inline">
                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('f2f')}>
                      <BsCameraVideo />
                    </Button>
                    <span>实时视频</span>
                  </li>

                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('board')}>
                      <BiChalkboard />
                    </Button>
                    <span>互动白板</span>
                  </li>

                  <li className="list-inline-item">
                    <Button shape="circle" onClick={() => quickStart('im')}>
                      <BiCommentDetail />
                    </Button>
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
