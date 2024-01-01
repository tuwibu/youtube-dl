import { APIKEY } from './constants'
import axios from 'axios'
import { ContentDetailsResponse, PlaylistItemsResponse, PlaylistItemsItems } from './typings/youtube.api'
import path from 'path'
import { convertValidFilename, sleep } from './utils'
import ytdl from 'ytdl-core'
import fs from 'node:fs'

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
      const listVideos: PlaylistItemsItems[] = []
      const contentDetails = await this.getContentDetails(channelId)
      for (let i = 0; i < contentDetails.items.length; i++) {
        const uploadsId = contentDetails.items[i].contentDetails.relatedPlaylists.uploads
        let playlist = await this.getVideosFromPlaylist(uploadsId)
        listVideos.push(...playlist.items)
        while (playlist.nextPageToken) {
          playlist = await this.getVideosFromPlaylist(uploadsId, playlist.nextPageToken)
          listVideos.push(...playlist.items)
        }
      }
      const uniqueVideos = listVideos.filter((video, index, self) => {
        return self.findIndex(v => v.id === video.id) === index
      })
      return uniqueVideos
    } catch (ex) {
      throw ex
    }
  }

  public async getContentDetails(channelId: string): Promise<ContentDetailsResponse> {
    try {
      const response = await axios<ContentDetailsResponse>({
        method: 'GET',
        url: `https://www.googleapis.com/youtube/v3/channels`,
        params: {
          key: this.getRandomApiKey(),
          part: 'contentDetails',
          id: channelId
        }
      })
      return response.data
    } catch (ex) {
      throw ex
    }
  }

  public async getVideosFromPlaylist(playlistId: string, pageToken?: string): Promise<{
    nextPageToken?: string,
    prevPageToken?: string,
    items: PlaylistItemsItems[]
  }> {
    try {
      const response = await axios<PlaylistItemsResponse>({
        method: 'GET',
        url: `https://www.googleapis.com/youtube/v3/playlistItems`,
        params: {
          key: this.getRandomApiKey(),
          part: 'snippet,contentDetails',
          maxResults: 10,
          playlistId: playlistId,
          pageToken: pageToken ? pageToken : undefined
        }
      })
      return {
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken,
        items: response.data.items
      }
    } catch (ex) {
      throw ex
    }
  }

  public async startDownload(videos: { id: string, title: string }[], pathFolder: string, cookie: string, event: Electron.IpcMainEvent) {
    try {
      event.sender.send('started')
      for (let i = 0; i < videos.length; i++) {
        if (this.isStop) {
          this.isStop = false
          break
        }
        const video = videos[i]
        const pathSave = path.resolve(pathFolder, convertValidFilename(`${i + 1}. ${video.title}.mp4`))
        await this.downloadVideo(video, pathSave, cookie, event)
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
    return new Promise((resolve, reject) => {
      const youtubeDl = ytdl(`https://www.youtube.com/watch?v=${video.id}`, {
        requestOptions: {
          headers: {
            cookie: cookie,
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

  private getRandomApiKey() {
    const keys = APIKEY
    return keys[Math.floor(Math.random() * keys.length)]
  }
}