/*
 * The AI services and the main process report task status as Chinese strings
 * (the video service is a compiled module, so they cannot be changed at the
 * source). Map the known ones to i18n keys; unknown strings pass through.
 */
const SERVICE_MESSAGE_KEYS = {
  正在提交任务: 'submitting',
  正在生成语音: 'generatingSpeech',
  文件下载完成: 'downloadDone',
  视频特征提取完成: 'videoFeatureDone',
  任务完成: 'taskDone',
  系统异常: 'systemError',
  忙碌中: 'busy',
  参数异常: 'paramError',
  获取锁异常: 'lockError',
  任务不存在: 'taskNotFound'
}

export function localizeServiceMessage(message, t) {
  if (typeof message !== 'string') return message
  const key = SERVICE_MESSAGE_KEYS[message.trim()]
  return key ? t(`common.serviceMessage.${key}`) : message
}
