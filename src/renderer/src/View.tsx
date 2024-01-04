import { useState, useEffect } from 'react'
import { Form, Button, Card, message, Input, Row, Col, Space, List, Tag, Avatar, Popconfirm, Tooltip, InputNumber } from 'antd'
import { IValues, VideoState } from './type'
import { DeleteOutlined } from '@ant-design/icons'
import { LiteralUnion } from 'antd/lib/_util/type'
import { PresetColorType, PresetStatusColorType } from 'antd/es/_util/colors'
import { capitalize } from 'lodash'
import { useAppDispatch, useAppSelector } from './redux/hooks'
import { setChannelId, setCookie, setPathFolder, setThread } from './redux/reducers/settingSlice'
import axios from 'axios'

export const APIURL = 'https://api.tuprofile.pro'

const StatusColor: {
  [key in VideoState["status"]]: LiteralUnion<PresetColorType | PresetStatusColorType>
} = {
  "pending": "default",
  "downloading": "#8950fc",
  "done": "#87d068",
  "error": "#f64e60"
}

function View(): JSX.Element {
  const dispatch = useAppDispatch()
  const defaultValues: Partial<IValues> = useAppSelector((state) => state.setting)
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
      dispatch(setPathFolder(directory))
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
      const oldVideos = await axios({
        method: 'GET',
        url: `${APIURL}/api/video`,
        params: {
          channelId: values.channelId,
        }
      })
      setVideos(videos.map((video, id) => {
        const index = oldVideos.data.data.findIndex((oldVideo: any) => oldVideo.videoId === video.contentDetails.videoId)
        return {
          ...video,
          status: index !== -1 ? "done" : "pending",
          stt: id + 1,
        }
      }))
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
          stt: video.stt
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
        videos: lists,
        pathFolder: values.pathFolder,
        cookie: values.cookie,
        channelId: values.channelId,
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
                  onChange={(e) => {
                    dispatch(setChannelId(e.target.value))
                    setValues({
                      ...values,
                      channelId: e.target.value,
                    })
                  }}
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
            <Col span={12}>
              <Form.Item
                label="Cookie"
                rules={[{ required: true, message: "Vui lòng chọn nhập cookie!" }]}
              >
                <Input
                  value={values.cookie}
                  onChange={(e) => {
                    dispatch(setCookie(e.target.value))
                    setValues({
                      ...values,
                      cookie: e.target.value,
                    })
                  }}
                  placeholder={"key1=value1; key2=value2; key3=value3"}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Thread"
                rules={[{ required: true, message: "Vui lòng chọn nhập thread!" }]}
              >
                <InputNumber
                  value={values.thread}
                  min={1}
                  onChange={(e) => {
                    dispatch(setThread(e || 1))
                    setValues({
                      ...values,
                      thread: e || 1,
                    })
                  }}
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

export default View