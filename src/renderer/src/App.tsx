import { useState, useEffect } from 'react'
import { Form, Button, Card, message, Input, Row, Col, Space, List, Tag, Avatar, Popconfirm, Tooltip } from 'antd'
import { IValues, VideoState } from './type'
import { DeleteOutlined } from '@ant-design/icons'
import { LiteralUnion } from 'antd/lib/_util/type'
import { PresetColorType, PresetStatusColorType } from 'antd/es/_util/colors'
import { capitalize } from 'lodash'

const StatusColor: {
  [key in VideoState["status"]]: LiteralUnion<PresetColorType | PresetStatusColorType>
} = {
  "pending": "default",
  "downloading": "#8950fc",
  "done": "#87d068",
  "error": "#f64e60"
}

const defaultValues: Partial<IValues> = {
  channelId: "",
  cookie: ""
}

function App(): JSX.Element {
  const [values, setValues] = useState<Partial<IValues>>(defaultValues)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videos, setVideos] = useState<VideoState[]>([])
  const onDelete = (videoID: string) => {
    setVideos(videos.filter((video) => video.id !== videoID))
  }
  const handleSelectFolder = async (name: string) => {
    try {
      const directory = await window.electron.ipcRenderer.invoke('selectDirectory')
      setValues({
        ...values,
        [name]: directory,
      })
    } catch (ex: any) {
      message.error(ex.message);
    }
  }
  const handleGetVideo = async () => {
    try {
      if (!values.channelId) {
        message.error("Vui lòng nhập channel!")
        return
      }
      setLoadingVideo(true)
      const videos = await window.electron.ipcRenderer.invoke('getVideos', {
        channelId: values.channelId,
      })
      setVideos(videos.map((video) => ({
        ...video,
        status: "pending"
      })))
    } catch (ex: any) {
      message.error(ex.message);
    } finally {
      setLoadingVideo(false)
    }
  }
  const handleStart = async () => {
    try {
      setLoading(true)
      const lists = videos.filter((video) => video.status !== "done").map((video) => {
        return {
          id: video.contentDetails.videoId,
          title: video.snippet.title,
        }
      })
      if (lists.length === 0) {
        message.error("Không có video nào để tải!")
        return
      }
      if (!values.pathFolder) {
        message.error("Vui lòng chọn folder!")
        return
      }
      if (!values.cookie) {
        message.error("Vui lòng nhập cookie!")
        return
      }
      window.electron.ipcRenderer.send("startDownload", {
        videoIds: lists,
        pathFolder: values.pathFolder,
        cookie: values.cookie,
      })
    } catch (ex: any) {
      message.error(ex.message);
    } finally {
      setLoading(false)
    }
  }
  const handleStop = async () => {
    try {
      setLoading(true)
      window.electron.ipcRenderer.send("stopDownload")
    } catch (ex: any) {
      message.error(ex.message);
    }
  }
  useEffect(() => {
    window.electron.ipcRenderer.on("started", () => {
      message.success("Started!")
      setLoading(false)
      setStarted(true)
    })
    window.electron.ipcRenderer.on("stopped", () => {
      message.success("Stopped!")
      setLoading(false)
      setStarted(false)
    })
    window.electron.ipcRenderer.on("status", (_, data: {
      id: string,
      status: VideoState["status"],
      percent?: string,
      downloaded?: string,
      total?: string,
    }) => {
      console.log("data", data)
      try {
        setVideos((videos) => {
          const index = videos.findIndex((video) => video.contentDetails.videoId === data.id)
          if (index !== -1) {
            videos[index] = {
              ...videos[index],
              status: data.status,
              percent: data?.percent,
              downloaded: data?.downloaded,
              total: data?.total,
            }
          }
          return [...videos]
        })
      } catch (ex: any) {
        message.error(ex.message)
      }
    })
    window.electron.ipcRenderer.on("error", (_, data: {
      message: string
    }) => {
      message.error(data.message)
    })
    window.electron.ipcRenderer.on("message", (_, data: {
      message: string
    }) => {
      message.info(data.message)
    })
  }, [])
  return (
    <div>
      <Card style={{
        marginBottom: 16
      }}>
        <Form
          layout="vertical"
          initialValues={defaultValues}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Channel ID"
              >
                <Input
                  value={values.channelId}
                  onChange={(e) => setValues({
                    ...values,
                    channelId: e.target.value,
                  })}
                  placeholder={"UChmJqLUWbSHvZRFZ_DJk4Kw"}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Path Folder"
              >
                <Space.Compact block>
                  <Input value={values.pathFolder} disabled />
                  <Button type="primary" onClick={() => handleSelectFolder("pathFolder")}>Select Folder</Button>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Cookie"
                rules={[{ required: true, message: "Vui lòng chọn nhập cookie!" }]}
              >
                <Input
                  value={values.cookie}
                  onChange={(e) => setValues({
                    ...values,
                    cookie: e.target.value,
                  })}
                  placeholder={"key1=value1; key2=value2; key3=value3"}
                />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loadingVideo}
              onClick={handleGetVideo}
            >
              Get Videos
            </Button>
            {!started ? (<Button
              type="primary"
              htmlType="submit"
              loading={loading}
              onClick={handleStart}
            >
              Start
            </Button>) : (<Button
              type="primary"
              htmlType="submit"
              loading={loading}
              onClick={handleStop}
            >
              Stop
            </Button>)}
          </Space>
        </Form>
      </Card>
      <Card
        title="Videos"
      >
        <List
          className="demo-loadmore-list"
          loading={loadingVideo}
          itemLayout="horizontal"
          dataSource={videos}
          renderItem={(item) => (
            <List.Item
              actions={[<Popconfirm
                title="Chắc chắn xóa?"
                onConfirm={() => onDelete(item.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading}
                />
              </Popconfirm>]}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.snippet.thumbnails.default.url} />}
                title={<a href={`https://www.youtube.com/watch?v=${item.contentDetails.videoId}`} target="_blank">{item.snippet.title}</a>}
                description={item.snippet.channelTitle}
              />
              {
                item.status == "downloading" ? (
                  <Tooltip title={`${item.downloaded} / ${item.total}`}>
                    <Tag color={StatusColor[item.status]}>{item.percent}%</Tag>
                  </Tooltip>
                ) : (
                  <Tag color={StatusColor[item.status]}>{capitalize(item.status)}</Tag>
                )
              }
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default App