import ytdl from 'ytdl-core'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

(async () => {
  const url = 'https://www.youtube.com/watch?v=P00lWA7Hp2c'
  const output = path.resolve(__dirname, 'video.mp4');
  const video = ytdl(url, {
    // IPv6Block: '2001:2::/48',
    requestOptions: {
      headers: {
        cookie: 'VISITOR_INFO1_LIVE=cg5W9z2JMNU; _gcl_au=1.1.150164432.1702930281; VISITOR_PRIVACY_METADATA=CgJWThIEGgAgbg%3D%3D; LOGIN_INFO=AFmmF2swRQIhAKhZGWWIkotRgYk-_cqHa_v1CCLfyXY-ASZOxkDQ2WXxAiApCi35_SsmXta1-K4uPR0Ar4w2SuwQ-V1puXWwjnDf0A:QUQ3MjNmd3Jvb3JWWFhGZmo1a2ZoNkV4cUhuMU1oOFJOVkd1bnM4Zk9WY2xkWk1yWFU0OXBId1NZaE82QzhhQlVZRDBVZlhJY0lKbWZxRzdlRWNwRFUtZ2pTcC14bXVEeFluRE8wUks3MTZEYjlhazdzbnFWUjc3UDdTUkJpcThGUVItV0lNc2hpdE16a1JJX3Vhem9jZzJjbXkxM3EwUTlHYWtCMU1LbUtpQjZ2VjEzZ2JfMll5Z25QM3IxQXlZeU03R3RBLVF5VG9WaE5Zc2lQMWFSbkF4ZmEzTFpTWWNKZw==; PREF=f6=80&f7=100&playback_rate=1&tz=Asia.Saigon; NID=511=bjzNo_v4a2U9GL4dyyse452wdA55e0kmX7xLjOjOBzqmQSVu9Y5NQBAQgScOasBaGQ3YGihYTw-fDX29aDRB2CCLWdt2XVOgcvGe2QCrdzlJ6jmqtKOgRBu8fu14In3-XMdB3Fv0Lu4vH4bEMhOZ2K-3monoHIRDzr1gzllQ1Bi0yD6TmYqkWvjkyFP4LIyVgd4DDtLSYQh8Y5qAjP_KQqK6sQXjq87dKYysU7niakqd; HSID=AlZFDwMo1zRtYW0Es; SSID=AQdSNl7q5FrVcQkAf; APISID=OZHed-bTvR3vrUIs/ADuZwhKcKqZUmIwWr; SAPISID=o_ZOG67WtZFYtxCP/Aus8ZMimBzngLKgca; __Secure-1PAPISID=o_ZOG67WtZFYtxCP/Aus8ZMimBzngLKgca; __Secure-3PAPISID=o_ZOG67WtZFYtxCP/Aus8ZMimBzngLKgca; SID=ewgooY_5dn_1h1IXlqqG27-4KJlCVOp57ZmD7tj_hkkEG10aPaQw2dDdAL0Rt8b2dK91DA.; __Secure-1PSID=ewgooY_5dn_1h1IXlqqG27-4KJlCVOp57ZmD7tj_hkkEG10aAKCiAU124L9kDLt5dOOxnQ.; __Secure-3PSID=ewgooY_5dn_1h1IXlqqG27-4KJlCVOp57ZmD7tj_hkkEG10a2G1PB61qp3hgmuSadoisfA.; YSC=B333GCp9a1M; __Secure-1PSIDTS=sidts-CjEBPVxjShfYokxZem0HH1OYQnt5RnaUa6pExoxPjlj5q4DfCKKB_odQd8HgP0Yj2GYQEAA; __Secure-3PSIDTS=sidts-CjEBPVxjShfYokxZem0HH1OYQnt5RnaUa6pExoxPjlj5q4DfCKKB_odQd8HgP0Yj2GYQEAA; SIDCC=ABTWhQEepe8xEOZCCUgZAHmaSmXUXcoil_vYkqDYRgQ2WmD66AioWdGmZ5xqZmxdmE-6nP-20jY; __Secure-1PSIDCC=ABTWhQHW5OhlBR0vyA2ly6wW8aIfYjDbWEokyi3hZeZFohxw0GT2D52_0xLG2CoKcHUwFBfsvQ; __Secure-3PSIDCC=ABTWhQH_FFu7SjZRMQ-0e_az6pzx0b4neXZcuxgG2VNrcaAHiAgjZv6jeNytZqWD5rh66JH_HA',
      }
    }
  });
  let starttime;
  video.pipe(fs.createWriteStream(output));
  video.once('response', () => {
    starttime = Date.now();
  });
  video.on('progress', (chunkLength, downloaded, total) => {
    const percent = downloaded / total;
    const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
    const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
    process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
    process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
    process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
    readline.moveCursor(process.stdout, 0, -1);
  });
  video.on('end', () => {
    process.stdout.write('\n\n');
  });
})()