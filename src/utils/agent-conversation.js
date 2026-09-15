function isFailedReply(message) {
  return message?.role === 'assistant' && message?.error === true
}

// 旧版本会在每次“重试这条”时追加一对相同的用户/失败消息。
// 只折叠连续、内容完全相同的失败重试，保留最后一对，不能误删真实对话。
export function collapseRetriedFailures(messages = []) {
  const source = Array.isArray(messages) ? messages : []
  const collapsed = []

  for (let index = 0; index < source.length;) {
    const userMessage = source[index]
    const failedReply = source[index + 1]
    if (userMessage?.role !== 'user' || !isFailedReply(failedReply)) {
      collapsed.push(userMessage)
      index += 1
      continue
    }

    let lastUser = userMessage
    let lastReply = failedReply
    let cursor = index + 2
    while (
      source[cursor]?.role === 'user' &&
      source[cursor]?.content === userMessage.content &&
      isFailedReply(source[cursor + 1])
    ) {
      lastUser = source[cursor]
      lastReply = source[cursor + 1]
      cursor += 2
    }
    collapsed.push(lastUser, lastReply)
    index = cursor
  }

  return collapsed
}

// 重试复用原有消息行，不再向列表追加同一条用户输入和失败占位。
export function getRetryPayload(messages = [], assistantMessageId, fallback = {}) {
  const source = Array.isArray(messages) ? messages : []
  const assistantIndex = source.findIndex((message) => message?.id === assistantMessageId && isFailedReply(message))
  if (assistantIndex < 1) return null

  let userIndex = assistantIndex - 1
  while (userIndex >= 0 && source[userIndex]?.role !== 'user') userIndex -= 1
  const userMessage = source[userIndex]
  if (!userMessage) return null

  const text = String(userMessage.requestText ?? userMessage.content ?? fallback.text ?? '').trim()
  const attachments = Array.isArray(userMessage.attachments)
    ? userMessage.attachments.slice()
    : (Array.isArray(fallback.attachments) ? fallback.attachments.slice() : [])
  if (!text && !attachments.length) return null

  const retryPayload = {
    assistantId: assistantMessageId,
    userIndex,
    text,
    attachments
  }
  const clientMessageId = String(userMessage.client_message_id || userMessage.clientMessageId || '').trim()
  if (clientMessageId) retryPayload.clientMessageId = clientMessageId
  return retryPayload
}
