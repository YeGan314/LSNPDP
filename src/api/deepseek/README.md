# DeepSeek API 配置说明

## 快速开始

### 1. 获取 API Key

1. 访问 [DeepSeek 平台](https://platform.deepseek.com/api_keys)
2. 注册/登录账号
3. 创建 API Key

### 2. 配置 API Key

在项目根目录创建 `.env` 文件（如果不存在），添加以下内容：

```env
VUE_APP_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**注意：** 请将 `your_deepseek_api_key_here` 替换为你的实际 API Key

### 3. 重启开发服务器

配置环境变量后，需要重启开发服务器才能生效：

```bash
npm run serve
```

## API 使用说明

### 基本用法

```javascript
import { callDeepSeekAPI } from '@/api/deepseek/index'

// 构建消息历史
const messages = [
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
  { role: 'user', content: '介绍一下你自己' }
]

// 调用 API
await callDeepSeekAPI(
  messages,
  (text) => {
    // 流式接收文本
    console.log('收到文本:', text)
  },
  {
    model: 'deepseek-chat',  // 模型名称
    temperature: 0.7,         // 温度参数 (0-2)
    max_tokens: 2000          // 最大 token 数
  }
)
```

### 支持的模型

- `deepseek-chat` - DeepSeek Chat 模型（推荐）
- `deepseek-coder` - DeepSeek Coder 模型（代码专用）

### 参数说明

- **messages**: 消息历史数组，格式为 `[{role: 'user'|'assistant', content: string}]`
- **onMessage**: 流式响应回调函数，每次接收到文本片段时调用
- **options**: 可选配置
  - `model`: 模型名称，默认 `'deepseek-chat'`
  - `temperature`: 温度参数（0-2），控制输出随机性，默认 `0.7`
  - `max_tokens`: 最大生成 token 数，默认 `2000`

## 错误处理

如果 API Key 未配置，会抛出错误提示：
```
DeepSeek API Key 未配置，请在环境变量中设置 VUE_APP_DEEPSEEK_API_KEY
```

## 注意事项

1. **API Key 安全**: 不要将 API Key 提交到代码仓库，使用 `.env` 文件并添加到 `.gitignore`
2. **费用**: DeepSeek API 按使用量计费，请注意控制使用量
3. **速率限制**: API 有速率限制，频繁请求可能被限制

## 故障排查

### 问题：API Key 未配置错误

**解决方案**: 检查 `.env` 文件是否存在，且包含正确的 `VUE_APP_DEEPSEEK_API_KEY` 配置

### 问题：请求失败

**解决方案**: 
1. 检查网络连接
2. 验证 API Key 是否有效
3. 查看浏览器控制台的错误信息

### 问题：流式响应不工作

**解决方案**: 确保浏览器支持 `ReadableStream` API（现代浏览器都支持）

