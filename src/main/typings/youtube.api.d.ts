export type YoutubeApiResponse<T> = {
  success: boolean,
  data: {
    kind: string,
    etag: string,
    nextPageToken?: string,
    prevPageToken?: string,
    items: T,
  }
}
export type ApiResponse<T> = {
  success: boolean,
  data: T,
}
export type ContentDetailsItems = {
  kind: string,
  etag: string,
  id: string,
  contentDetails: {
    relatedPlaylists: {
      likes: string,
      uploads: string,
    },
  }
}
export type PlaylistItemsItems = {
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
}
export type ProxyState = {
  id: number,
  address: string,
  username?: string,
  password?: string,
  createdAt: string,
  updatedAt: string,
}
export type ContentDetailsResponse = ApiResponse<ContentDetailsItems>
export type PlaylistItemsResponse = ApiResponse<PlaylistItemsItems[]>
export type ProxyResponse = ApiResponse<ProxyState>