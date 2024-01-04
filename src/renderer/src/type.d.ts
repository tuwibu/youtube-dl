export interface IValues {
  pathFolder: string,
  channelId: string,
  cookie: string,
  thread: number,
}
export type VideoState = {
  kind: string,
  etag: string,
  id: string,
  snippet: {
    publishedAt: string,
    channelId: string,
    title: string,
    description: string,
    thumbnails: {
      default: {
        url: string,
        width: number,
        height: number,
      },
      medium: {
        url: string,
        width: number,
        height: number,
      },
      high: {
        url: string,
        width: number,
        height: number,
      },
      standard: {
        url: string,
        width: number,
        height: number,
      },
      maxres: {
        url: string,
        width: number,
        height: number,
      },
    },
    channelTitle: string,
    playlistId: string,
    position: number,
    resourceId: {
      kind: string,
      videoId: string,
    },
  },
  contentDetails: {
    videoId: string,
    videoPublishedAt: string,
  },
  status: "pending" | "downloading" | "done" | "error",
  percent?: string,
  downloaded?: string,
  total?: string,
  stt?: number,
}