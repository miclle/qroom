import React from "react"
import { observer } from "mobx-react-lite"
import { useQuery } from "@tanstack/react-query"
import moment from "moment"
import {filesize} from "filesize";
import { Button, notification, Skeleton, Table, Upload, UploadProps } from "antd"
import { UploadChangeParam, UploadFile } from "antd/lib/upload"
import { AiOutlineCloudUpload, AiOutlineDownload } from "react-icons/ai"

import { IFileItem } from 'models';
import { Room } from "services"
import { useRoomStore } from "./context"
import { trimStart } from "lodash"

const FileBox = observer(() => {

  const roomStore = useRoomStore()

  const {
    isLoading,
    isFetching,
    data: files,
    refetch
  } = useQuery<IFileItem[]>(['files'], () => Room.files(roomStore.uuid || ''), {
    enabled: roomStore.uuid !== '',
    initialData: []
  })

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    maxCount: 100,
    action: `/api/rooms/${roomStore.uuid}/files`,
    withCredentials: true,
    onChange: (info: UploadChangeParam<UploadFile<any>>) => {
      const { status } = info.file;
      if (status === 'done') {
        notification.success({ key: 'upload-success', message: `${info.file.name} file uploaded successfully.` });
        refetch();
      } else if (status === 'error') {
        notification.error({ key: 'upload-error', message: `${info.file.name} file upload failed.` });
      }
    },
    showUploadList: {
      showDownloadIcon: false,
      showRemoveIcon: false,
    },
  }

  if (isLoading) {
    return <Skeleton active />;
  }

  return (
    <div id="filebox">
      <Table
        className="filelist"
        rowKey="key"
        size="small"
        dataSource={files}
        pagination={false}
        loading={isFetching}
        scroll={{ y: 600 }}
      >
        <Table.Column
          title="文件名"
          dataIndex="key"
          render={(key: string, file: IFileItem) => <a href={file.url} target="_blank" rel="noreferrer">{trimStart(key, `${roomStore.uuid}/`)}</a>}
        />
        <Table.Column
          width={120}
          title="文件大小"
          dataIndex="fsize"
          align="right"
          render={(fsize: number) => filesize(fsize, {base: 2, standard: "jedec"}).toString()}
        />
        <Table.Column
          width={120}
          title="文件类型"
          dataIndex="mimeType"
        />
        <Table.Column
          width={180}
          title="上传时间"
          dataIndex="putTime"
          align="center"
          render={(time: number) => moment.unix(time / 1000 / 1000 / 10).format('YYYY-MM-DD hh:mm:ss')}
        />
        <Table.Column
          width={80}
          title="下载"
          dataIndex="url"
          align="center"
          render={(url: string) =>
            <Button type="link" size="small" icon={<AiOutlineDownload />} href={url} target="_blank" />
          }
        />
      </Table>

      <div className="uploader">
        <Upload {...props}>
          <Button icon={<AiOutlineCloudUpload />}>上传文件</Button>
        </Upload>
      </div>
    </div>
  )
})

export default FileBox
