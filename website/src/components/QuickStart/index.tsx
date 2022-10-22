import React from "react"
import { AxiosResponse } from "axios";
import { IErrorMessage } from "services/lib/http";
import { map } from "lodash";
import { Button, Modal, Form, Input, notification } from "antd"

import { User } from 'services';
import { IUser } from "models";

export interface IQuickStartOptions {
  open: boolean;
  onCancel: () => void;
  onOk: (user: IUser) => void;
}

export default function QuickStart(options: IQuickStartOptions) {

  const [form] = Form.useForm()

  const onFinish = (values: any) => {
    User.create(values.name)
      .then((user) => {
        options.onOk(user)
      })
      .catch((resp: AxiosResponse<IErrorMessage>) => {
        notification.error({
          key: 'create-company-error',
          message: '创建互动房间失败',
          description: map(resp.data.message, (value, key) => value).join('\n')
        });
      })
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