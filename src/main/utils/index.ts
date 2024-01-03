export const convertValidFilename = (filename: string): string => {
  return filename.replace(/[\\/:*?"<>|]/g, '')
}
export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}