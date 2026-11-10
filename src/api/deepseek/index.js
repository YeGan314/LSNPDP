/**
 * DeepSeek API 配置
 * 请将你的 API Key 配置在环境变量 VUE_APP_DEEPSEEK_API_KEY 中
 * 或在 .env 文件中设置：VUE_APP_DEEPSEEK_API_KEY=your_api_key_here
 */
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.VUE_APP_DEEPSEEK_API_KEY || 'sk-72b8d000aac84c53baec1564789664bc'

/**
 * 使用 DeepSeek 官方 API 发起请求，支持流式响应处理
 * @param {Array} messages 消息历史数组，格式: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
 * @param {Function} onMessage 每次接收到文本时调用的回调函数
 * @param {Object} options 可选配置
 * @param {string} options.model 模型名称，默认 'deepseek-chat'
 * @param {number} options.temperature 温度参数，默认 0.7
 * @param {number} options.max_tokens 最大token数，默认 2000
 */
export async function callDeepSeekAPI(messages, onMessage, options = {}) {
  const {
    model = 'deepseek-chat',
    temperature = 0.7,
    max_tokens = 2000
  } = options

  // 检查 API Key
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置，请在环境变量中设置 VUE_APP_DEEPSEEK_API_KEY')
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
        max_tokens
      })
    })

    // 检查响应状态
    if (!response.ok) {
      let errorData = {}
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : {}
      } catch (e) {
        console.warn('解析错误响应失败：', e)
      }
      
      const errorMessage = errorData.error?.message || 
        `API 请求失败: ${response.status} ${response.statusText}`
      
      console.error('DeepSeek API 错误响应：', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      })
      
      throw new Error(errorMessage)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流（response.body 不存在）')
    }

    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let done = false

    while (!done) {
      const result = await reader.read()
      done = result.done

      if (result.value) {
        buffer += decoder.decode(result.value, { stream: true })
        
        // 处理 SSE 格式的数据流
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim() // 移除 'data: ' 前缀并去除空格
            
            if (data === '[DONE]') {
              done = true
              break
            }

            try {
              const json = JSON.parse(data)
              const delta = json.choices?.[0]?.delta
              
              if (delta?.content && onMessage) {
                onMessage(delta.content)
              }
              
              // 检查是否有错误
              if (json.error) {
                throw new Error(json.error.message || 'API 返回错误')
              }
            } catch (e) {
              // 如果不是 JSON 解析错误，抛出
              if (e.message && !e.message.includes('JSON')) {
                throw e
              }
              console.warn('JSON 解析失败：', data, e)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('DeepSeek API 请求失败：', err)
    throw err
  }
}

/**
 * 兼容旧版本的函数（保留向后兼容）
 * @deprecated 请使用 callDeepSeekAPI 替代
 */
export async function callDeepSeekR1(params, onMessage) {
  console.warn('callDeepSeekR1 已废弃，请使用 callDeepSeekAPI')
  
  // 将旧格式转换为新格式
  const messages = [
    { role: 'user', content: params.prompt || params.content || '' }
  ]
  
  return callDeepSeekAPI(messages, onMessage, {
    model: params.model || 'deepseek-chat'
  })
}
