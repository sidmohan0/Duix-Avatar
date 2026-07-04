import path from 'path'
import os from 'os'

const isWin = process.platform === 'win32'

// Override service endpoints via env vars, e.g. when the GPU services run on a
// remote host: DUIX_SERVICE_HOST=192.168.4.204 npm run dev
const serviceHost = process.env.DUIX_SERVICE_HOST || '127.0.0.1'

export const serviceUrl = {
  face2face: process.env.DUIX_FACE2FACE_URL || `http://${serviceHost}:8383/easy`,
  tts: process.env.DUIX_TTS_URL || `http://${serviceHost}:18180`
}

export const assetPath = {
  model: isWin
    ? path.join('D:', 'duix_avatar_data', 'face2face', 'temp')
    : path.join(os.homedir(), 'duix_avatar_data', 'face2face', 'temp'), // 模特视频
  ttsProduct: isWin
    ? path.join('D:', 'duix_avatar_data', 'face2face', 'temp')
    : path.join(os.homedir(), 'duix_avatar_data', 'face2face', 'temp'), // TTS 产物
  ttsRoot: isWin
    ? path.join('D:', 'duix_avatar_data', 'voice', 'data')
    : path.join(os.homedir(), 'duix_avatar_data', 'voice', 'data'), // TTS服务根目录
  ttsTrain: isWin
    ? path.join('D:', 'duix_avatar_data', 'voice', 'data', 'origin_audio')
    : path.join(os.homedir(), 'duix_avatar_data', 'voice', 'data', 'origin_audio') // TTS 训练产物
}
