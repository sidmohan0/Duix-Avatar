import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import log from '../logger.js'

// macOS: prefer a bundled binary if present, otherwise fall back to a system
// install (e.g. Homebrew). ffmpeg is not redistributed for darwin in this repo.
const darwinArch = process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
const systemBinDirs = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']

function findSystemBinary(name) {
  const dirs = [...systemBinDirs, ...(process.env.PATH || '').split(path.delimiter)]
  const found = dirs.map((dir) => path.join(dir, name)).find((p) => fs.existsSync(p))
  if (!found) {
    log.error(`${name} not found. Install it first, e.g. "brew install ffmpeg"`)
  }
  return found
}

function resolveBinary(name, winName) {
  const devRoot = path.join(__dirname, '../../resources/ffmpeg')
  const prodRoot = path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'ffmpeg')
  const binPath = {
    'development-win32': path.join(devRoot, 'win-amd64', 'bin', winName),
    'development-linux': path.join(devRoot, 'linux-amd64', name),
    'development-darwin': path.join(devRoot, darwinArch, name),
    'production-win32': path.join(prodRoot, 'win-amd64', 'bin', winName),
    'production-linux': path.join(prodRoot, 'linux-amd64', name),
    'production-darwin': path.join(prodRoot, darwinArch, name)
  }[`${process.env.NODE_ENV}-${process.platform}`]

  if (process.platform === 'darwin' && (!binPath || !fs.existsSync(binPath))) {
    return findSystemBinary(name)
  }
  return binPath
}

function initFFmpeg() {
  if (process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = 'production'
  }
  log.debug('ENV:', `${process.env.NODE_ENV}-${process.platform}`)

  const ffmpegPathValue = resolveBinary('ffmpeg', 'ffmpeg.exe')
  log.info('FFmpeg path:', ffmpegPathValue)
  ffmpeg.setFfmpegPath(ffmpegPathValue)

  const ffprobePathValue = resolveBinary('ffprobe', 'ffprobe.exe')
  log.info('FFprobe path:', ffprobePathValue)
  ffmpeg.setFfprobePath(ffprobePathValue)
}

initFFmpeg()

export function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .save(audioPath)
      .on('end', () => {
        log.info('audio split done')
        resolve(true)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

export async function toH264(videoPath, outputPath) {
  // const hasNvidia = await detectNvidia()
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoCodec('libx264')
      .outputOptions('-pix_fmt yuv420p')
      .save(outputPath)
      .on('end', () => {
        log.info('video convert to h264 done')
        resolve(true)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

export function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath).ffprobe((err, data) => {
      if (err) {
        log.error("🚀 ~ ffmpeg ~ err:", err)
        reject(err)
      } else if (data && data.streams && data.streams.length > 0) {
        resolve(data.streams[0].duration) // 单位秒
      } else {
        log.error('No streams found')
        reject(new Error('No streams found'))
      }
    })
  })
}
