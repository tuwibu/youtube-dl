import { APIURL } from './constants'
import axios from 'axios'
import { ContentDetailsResponse, PlaylistItemsItems, PlaylistItemsResponse, ProxyResponse } from './typings/youtube.api'
import path from 'path'
import { convertValidFilename, sleep } from './utils'
import ytdl from 'ytdl-core'
import fs from 'node:fs'
import { checkProxy, getAgentProxy } from './utils/proxy'

export default class Youtube {
  private static instance: Youtube
  private isStop: boolean = false
  public static getInstance() {
    if (!this.instance) {
      this.instance = new Youtube()
    }
    return this.instance
  }

  public async getVideos(channelId: string): Promise<PlaylistItemsItems[]> {
    try {
      await axios<ContentDetailsResponse>({
        method: 'GET',
        url: `${APIURL}/api/channel/info?channelId=${channelId}`
      })
      const videos = await axios<PlaylistItemsResponse>({
        method: 'GET',
        url: `${APIURL}/api/channel/video?channelId=${channelId}`
      })
      return videos.data.data
    } catch (ex) {
      throw ex
    }
  }

  public async startDownload({ channelId, videos, pathFolder, cookie, event }: {
    channelId: string,
    videos: { id: string, title: string, stt: number }[],
    pathFolder: string,
    cookie: string,
    event: Electron.IpcMainEvent
  }) {
    try {
      event.sender.send('started')
      for (let i = 0; i < videos.length; i++) {
        if (this.isStop) {
          this.isStop = false
          break
        }
        const video = videos[i]
        const pathSave = path.resolve(pathFolder, convertValidFilename(`${video.stt}. ${video.title}.mp4`))
        await this.downloadVideo(video, pathSave, cookie, event)
        await this.addVideo(channelId, video.id, video.stt)
        await sleep(1000)
      }
      event.sender.send('stopped')
    } catch (ex) {
      throw ex
    }
  }

  public stopDownload() {
    this.isStop = true
  }

  private downloadVideo(video: { id: string, title: string }, pathSave: string, cookie: string, event: Electron.IpcMainEvent) {
    return new Promise(async(resolve, reject) => {
      const proxy = await this.getProxy()
      const agent = getAgentProxy(proxy)
      const youtubeDl = ytdl(`https://www.youtube.com/watch?v=${video.id}`, {
        requestOptions: {
          headers: {
            cookie: cookie,
            agent: agent,
            httpsAgent: agent
          }
        }
      });
      youtubeDl.pipe(fs.createWriteStream(pathSave));
      youtubeDl.on('error', (err) => {
        event.sender.send('status', {
          id: video.id,
          status: 'error',
          error: err
        })
        event.sender.send('error', {
          message: err.message,
        })
        reject(err)
      });
      youtubeDl.on('progress', (_, downloaded, total) => {
        const percent = downloaded / total;
        event.sender.send('status', {
          id: video.id,
          status: 'downloading',
          percent: (percent * 100).toFixed(2),
          downloaded: `${(downloaded / 1024 / 1024).toFixed(2)}MB`,
          total: `${(total / 1024 / 1024).toFixed(2)}MB`,
        })
      });
      youtubeDl.on('end', () => {
        event.sender.send('status', {
          id: video.id,
          status: 'done',
          path: pathSave
        })
        resolve(pathSave)
      });
    })
  }

  private async getProxy() {
    try {
      let tried = 0
      let proxyInfo = await this.fetchProxy()
      let proxy = await checkProxy(proxyInfo).catch(() => null)
      while (!proxy && tried < 10) {
        await sleep(1000)
        proxyInfo = await this.fetchProxy()
        proxy = await checkProxy(proxyInfo).catch(() => null)
        tried++
      }
      if (!proxy) {
        throw new Error('No proxy available')
      }
      return proxy
    } catch (ex) {
      throw ex
    }
  }

  private async fetchProxy() {
    try {
      const videos = await axios<ProxyResponse>({
        method: 'GET',
        url: `${APIURL}/api/proxy`
      })
      return videos.data.data
    } catch (ex) {
      throw ex
    }
  }

  private async addVideo(channelId: string, videoId: string, stt: number) {
    try {
      await axios({
        method: 'GET',
        url: `${APIURL}/api/video/add`,
        params: {
          channelId,
          videoId,
          stt
        }
      })
    } catch(ex) {
      throw ex
    }
  }
}