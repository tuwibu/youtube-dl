import Youtube from './youtube'

(async() => {
  const youtube = new Youtube()
  const videos = await youtube.getVideos('UChmJqLUWbSHvZRFZ_DJk4Kw')
  console.log(JSON.stringify(videos))
  console.log("length: ", videos.length)
})();