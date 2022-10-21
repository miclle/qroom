import React from "react"
import { Button, Modal, Form, Input, ModalProps } from "antd"

export interface IQuickStartOptions extends ModalProps {
  open: boolean
  onCancel: () => void
}

export default function QuickStart(options: IQuickStartOptions) {

  const [form] = Form.useForm()

  const onFinish = async (values: any) => {
    console.log("onFinish:", values)
  }

  return (
    <Modal
      title="快速开始"
      open={options.open}
      centered={true}
      onCancel={() => options.onCancel()}
      footer={null}>

      <Form
        form={form}
        name="start"
        className="start-form"
        size="large"
        onFinish={onFinish}
      >

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
  )
}