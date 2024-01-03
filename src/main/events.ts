import { ipcMain, dialog } from 'electron'
import Youtube from './youtube'

ipcMain.handle('selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('getVideos', async (_, arg) => {
  const { channelId } = arg
  const videos = await Youtube.getInstance().getVideos(channelId)
  return videos
})

ipcMain.on('startDownload', async (event, arg) => {
  const { pathFolder, videos, channelId, cookie } = arg
  await Youtube.getInstance().startDownload({
    channelId,
    videos,
    pathFolder,
    cookie,
    event
  })
})

ipcMain.on('stopDownload', () => {
  Youtube.getInstance().stopDownload()
})