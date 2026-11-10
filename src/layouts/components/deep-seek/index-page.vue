<template>
    <div
        class="btn"
        ref="btnRef"
        :style="btnStyle"
        @mousedown="onBtnMouseDown"
        @click="onBtnClick"
    >
        <img src="@/assets/ai/ai.svg" alt="">
    </div>
    <div
        class="chat-container"
        v-show="chatShow"
        ref="chatContainer"
        :style="chatStyle"
    >
        <!-- 聊天标题 -->
        <div class="chat-header" @mousedown="onHeaderMouseDown">
            <h2>AI 助手</h2>
            <div class="status-indicator" :class="{ active: loading }">
                {{ loading ? '思考中...' : '在线' }}
            </div>
            <img src="@/assets/ai/close.svg" alt="" @click="() => { chatShow = false }" class="close-icon">
        </div>

        <!-- 聊天内容区域 -->
        <div ref="chatWindow" class="chat-window">
            <!-- 空状态提示 -->
            <div v-if="messages.length === 0" class="empty-state">
                <div class="empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <p>开始与 AI 对话吧</p>
            </div>

            <!-- 消息列表 -->
            <div v-for="(msg, index) in messages" :key="index" :class="['message-bubble', msg.role === 'user' ? 'user' : 'ai']">
                <!-- 头像 -->
                <div class="avatar">
                    <img v-if="msg.role === 'user'" src="https://avatars.dicebear.com/api/human/user.svg" alt="用户">
                    <img v-else src="@/assets/ai/ai.svg" alt="AI">
                </div>

                <!-- 消息内容 -->
                <div class="message-content">
                    <div class="message-text">{{ msg.content }}</div>
                    <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                </div>
            </div>

            <!-- 加载指示器 -->
            <div v-if="loading" class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
            <div class="input-wrapper">
                <textarea v-model="inputText" @keydown.enter.exact.prevent="sendMessage" placeholder="输入消息..." rows="1"
                    ref="textarea" @input="adjustTextareaHeight"></textarea>
                <button @click="sendMessage" :disabled="loading || !inputText.trim()" class="send-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
            <div class="input-footer">
                <small>AI 可能会产生不准确的信息，请谨慎验证</small>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch, computed } from 'vue'
import { callDeepSeekAPI } from '@/api/deepseek/index'

const chatShow = ref(false)
const inputText = ref('')
const messages = ref([])
const loading = ref(false)
const textarea = ref(null)
const chatWindow = ref(null)
const chatContainer = ref(null)
const btnRef = ref(null)

// 聊天窗口位置（使用 top/left 便于拖拽）
const chatPosition = ref({ top: null, left: null })
const isDragging = ref(false)
let dragStart = { x: 0, y: 0 }
let startPosition = { top: 0, left: 0 }

// AI 按钮位置
const btnPosition = ref({ top: null, left: null })
const isBtnDragging = ref(false)
let btnDragStart = { x: 0, y: 0 }
let btnStartPosition = { top: 0, left: 0 }
let btnDragMoved = false

// 计算样式：位置已初始化后使用 top/left 固定，便于后续拖拽
const chatStyle = computed(() => {
    const style = {}
    if (chatPosition.value.top !== null && chatPosition.value.left !== null) {
        style.top = chatPosition.value.top + 'px'
        style.left = chatPosition.value.left + 'px'
    }
    return style
})

const btnStyle = computed(() => {
    const style = {}
    if (btnPosition.value.top !== null && btnPosition.value.left !== null) {
        style.top = btnPosition.value.top + 'px'
        style.left = btnPosition.value.left + 'px'
    }
    return style
})

const getChatMetrics = () => {
    const container = chatContainer.value
    if (!container) return null

    const width = container.offsetWidth || 500
    const height = container.offsetHeight || Math.round(window.innerHeight * 0.9)

    return { width, height }
}

const setChatPositionToRightSide = () => {
    const metrics = getChatMetrics()
    if (!metrics) return

    const padding = 20
    const left = Math.max(0, window.innerWidth - metrics.width - padding)
    const top = Math.max(0, Math.round((window.innerHeight - metrics.height) / 2))

    chatPosition.value = { top, left }
}

const clampChatPosition = () => {
    const metrics = getChatMetrics()
    if (!metrics || chatPosition.value.top === null || chatPosition.value.left === null) {
        return
    }

    const maxLeft = Math.max(0, window.innerWidth - metrics.width)
    const maxTop = Math.max(0, window.innerHeight - metrics.height)

    chatPosition.value = {
        top: Math.min(Math.max(0, chatPosition.value.top), maxTop),
        left: Math.min(Math.max(0, chatPosition.value.left), maxLeft)
    }
}

const getBtnMetrics = () => {
    const btn = btnRef.value
    if (!btn) return { width: 50, height: 50 }

    return {
        width: btn.offsetWidth || 50,
        height: btn.offsetHeight || 50
    }
}

const setBtnPositionToBottomRight = () => {
    const { width, height } = getBtnMetrics()
    const rightPadding = 20
    const bottomOffset = 120 // 向上抬高，避免与右下角底图切换按钮重叠

    btnPosition.value = {
        top: Math.max(0, window.innerHeight - height - bottomOffset),
        left: Math.max(0, window.innerWidth - width - rightPadding)
    }
}

const clampBtnPosition = () => {
    const { width, height } = getBtnMetrics()

    if (btnPosition.value.top === null || btnPosition.value.left === null) {
        setBtnPositionToBottomRight()
        return
    }

    const maxLeft = Math.max(0, window.innerWidth - width)
    const maxTop = Math.max(0, window.innerHeight - height)

    btnPosition.value = {
        top: Math.min(Math.max(0, btnPosition.value.top), maxTop),
        left: Math.min(Math.max(0, btnPosition.value.left), maxLeft)
    }
}

// 格式化时间
const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// 自动调整输入框高度
const adjustTextareaHeight = () => {
    const textareaEl = textarea.value
    if (!textareaEl) return
    textareaEl.style.height = 'auto'
    textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, 150)}px`
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (chatWindow.value) {
            chatWindow.value.scrollTo({
                top: chatWindow.value.scrollHeight,
                behavior: 'smooth'
            })
        }
    })
}

// 构建消息历史（用于 API 调用）
const buildMessageHistory = () => {
    return messages.value
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }))
}

// 发送消息
const sendMessage = async () => {
    if (!inputText.value.trim() || loading.value) return

    const userMessage = {
        role: 'user',
        content: inputText.value.trim(),
        timestamp: Date.now()
    }

    messages.value.push(userMessage)

    const aiMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
    }
    messages.value.push(aiMessage)

    loading.value = true
    inputText.value = ''
    adjustTextareaHeight()
    scrollToBottom()

    try {
        // 构建消息历史（包含当前用户消息）
        const messageHistory = buildMessageHistory()
        
        await callDeepSeekAPI(
            messageHistory,
            (text) => {
                // 实时更新 AI 最后一条消息内容
                const lastIndex = messages.value.length - 1
                if (messages.value[lastIndex].role === 'assistant') {
                    messages.value[lastIndex].content += text
                    scrollToBottom()
                }
            },
            {
                model: 'deepseek-chat', // 使用 DeepSeek Chat 模型
                temperature: 0.7,
                max_tokens: 2000
            }
        )

        // 更新AI消息的完整时间戳
        messages.value[messages.value.length - 1].timestamp = Date.now()
    } catch (e) {
        const lastIndex = messages.value.length - 1
        if (messages.value[lastIndex].role === 'assistant') {
            let errorMessage = '抱歉，我遇到了些问题，请稍后再试。'
            
            // 输出完整错误信息到控制台，方便调试
            console.error('AI 请求失败详情：', {
                error: e,
                message: e.message,
                stack: e.stack,
                name: e.name
            })
            
            // 根据错误类型显示更详细的错误信息
            if (e.message?.includes('API Key')) {
                errorMessage = 'API Key 未配置，请在环境变量中设置 VUE_APP_DEEPSEEK_API_KEY'
            } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError') || e.message?.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络连接或 API 服务是否可用'
            } else if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
                errorMessage = 'API Key 无效，请检查 API Key 是否正确'
            } else if (e.message?.includes('429')) {
                errorMessage = '请求过于频繁，请稍后再试'
            } else if (e.message?.includes('CORS')) {
                errorMessage = '跨域请求失败，请检查 API 配置'
            } else if (e.message) {
                errorMessage = `错误：${e.message}`
            }
            
            messages.value[lastIndex].content = errorMessage
        }
        console.error('发送消息失败：', e)
        console.error('错误详情：', {
            message: e.message,
            stack: e.stack,
            name: e.name
        })
    } finally {
        loading.value = false
        scrollToBottom()
    }
}

// 监听输入变化调整高度
watch(inputText, () => {
    adjustTextareaHeight()
})

// 初始化时调整高度
onMounted(() => {
    adjustTextareaHeight()
    window.addEventListener('resize', clampChatPosition)
    window.addEventListener('resize', clampBtnPosition)

    nextTick(() => {
        setBtnPositionToBottomRight()
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', clampChatPosition)
    window.removeEventListener('resize', clampBtnPosition)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('mousemove', onBtnMouseMove)
    window.removeEventListener('mouseup', onBtnMouseUp)
})

watch(chatShow, async (visible) => {
    if (!visible) return

    await nextTick()
    setChatPositionToRightSide()
})

// 鼠标按下，开始拖拽（在标题栏触发）
const onHeaderMouseDown = (event) => {
    if (event.button !== 0) return
    const container = chatContainer.value
    if (!container) return

    // 确保已有位置
    if (chatPosition.value.top === null || chatPosition.value.left === null) {
        const rect = container.getBoundingClientRect()
        chatPosition.value = { top: rect.top, left: rect.left }
    }

    isDragging.value = true
    dragStart = { x: event.clientX, y: event.clientY }
    startPosition = { ...chatPosition.value }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (event) => {
    if (!isDragging.value) return

    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y

    let newLeft = startPosition.left + dx
    let newTop = startPosition.top + dy

    const container = chatContainer.value
    if (container) {
        const rect = container.getBoundingClientRect()
        const maxLeft = Math.max(0, window.innerWidth - rect.width)
        const maxTop = Math.max(0, window.innerHeight - rect.height)

        newLeft = Math.min(Math.max(0, newLeft), maxLeft)
        newTop = Math.min(Math.max(0, newTop), maxTop)
    }

    chatPosition.value = { top: newTop, left: newLeft }
}

const onMouseUp = () => {
    if (!isDragging.value) return
    isDragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
}

const onBtnMouseDown = (event) => {
    if (event.button !== 0) return

    if (btnPosition.value.top === null || btnPosition.value.left === null) {
        const rect = btnRef.value?.getBoundingClientRect()
        btnPosition.value = {
            top: rect?.top ?? 0,
            left: rect?.left ?? 0
        }
    }

    isBtnDragging.value = true
    btnDragMoved = false
    btnDragStart = { x: event.clientX, y: event.clientY }
    btnStartPosition = { ...btnPosition.value }

    window.addEventListener('mousemove', onBtnMouseMove)
    window.addEventListener('mouseup', onBtnMouseUp)
}

const onBtnMouseMove = (event) => {
    if (!isBtnDragging.value) return

    const dx = event.clientX - btnDragStart.x
    const dy = event.clientY - btnDragStart.y

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        btnDragMoved = true
    }

    const { width, height } = getBtnMetrics()
    const maxLeft = Math.max(0, window.innerWidth - width)
    const maxTop = Math.max(0, window.innerHeight - height)

    btnPosition.value = {
        top: Math.min(Math.max(0, btnStartPosition.top + dy), maxTop),
        left: Math.min(Math.max(0, btnStartPosition.left + dx), maxLeft)
    }
}

const onBtnMouseUp = () => {
    if (!isBtnDragging.value) return

    isBtnDragging.value = false
    window.removeEventListener('mousemove', onBtnMouseMove)
    window.removeEventListener('mouseup', onBtnMouseUp)
}

// 按钮点击事件：直接打开聊天窗口
const onBtnClick = () => {
    if (btnDragMoved) {
        btnDragMoved = false
        return
    }
    chatShow.value = true
}
</script>

<style scoped lang="scss">
.btn {
    position: fixed;
    background: linear-gradient(135deg, #6e8efb, #a777e3);
    width: 50px;
    height: 50px;
    overflow: hidden;
    border-radius: 50px;
    text-align: center;
    cursor: pointer;
    z-index: 999999;
    user-select: none;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }

    img {
        width: 30px;
        height: 30px;
        margin: 10px;
        pointer-events: none;
    }
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');

.chat-container {
    z-index: 99999999;
    position: fixed;
    display: flex;
    flex-direction: column;
    height: 90vh;
    width: 500px;
    max-width: min(500px, calc(100vw - 40px));
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.chat-header {
    padding: 16px 24px;
    background: linear-gradient(135deg, #6e8efb, #a777e3);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;

    h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
}

.status-indicator {
    font-size: 14px;
    display: flex;
    align-items: center;

    &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ade80;
        margin-right: 8px;
    }

    &.active::before {
        background: #fbbf24;
        animation: pulse 1.5s infinite;
    }
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }

    100% {
        opacity: 1;
    }
}

.chat-window {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #f9fafb;
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #9ca3af;
    text-align: center;

    .empty-icon {
        margin-bottom: 16px;
        color: #d1d5db;
    }

    p {
        margin: 0;
        font-size: 16px;
    }
}

.message-bubble {
    display: flex;
    margin-bottom: 16px;
    max-width: 85%;

    .avatar {
        margin-right: 12px;

        img {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin: 8px;
            object-fit: cover;
            background: linear-gradient(135deg, #6e8efb, #a777e3);

        }
    }

    .message-content {
        flex: 1;
    }

    .message-text {
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 13px;
        line-height: 1.2;
        word-wrap: break-word;
        white-space: pre-wrap;
    }

    .message-time {
        margin-top: 4px;
        font-size: 12px;
        color: #6b7280;
        padding: 0 8px;
    }
}

.message-bubble.user {
    margin-left: auto;
    flex-direction: row-reverse;

    .avatar {
        margin-right: 0;
        margin-left: 12px;
    }

    .message-text {
        background: #3b82f6;
        color: white;
        border-top-right-radius: 4px;
    }

    .message-time {
        text-align: right;
    }
}

.message-bubble.ai {
    .message-text {
        background: white;
        color: #111827;
        border: 1px solid #e5e7eb;
        border-top-left-radius: 4px;
    }
}

.typing-indicator {
    display: flex;
    padding: 12px 16px;
    background: white;
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    width: fit-content;
    margin-bottom: 16px;

    .dot {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        margin: 0 4px;
        animation: bounce 1.4s infinite ease-in-out;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }

        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }
}

@keyframes bounce {

    0%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-6px);
    }
}

.input-area {
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    background: white;
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    background: #f9fafb;
    border-radius: 12px;
    padding: 8px 12px;

    textarea {
        flex: 1;
        border: none;
        background: transparent;
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.5;
        max-height: 150px;
        padding: 28px 0;

        &::placeholder {
            color: #9ca3af;
        }
    }

    .send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-left: 8px;
        transition: all 0.2s;

        &:disabled {
            background: #bfdbfe;
            cursor: not-allowed;
        }

        &:not(:disabled):hover {
            background: #2563eb;
            transform: translateY(-2px);
        }
    }
}

.input-footer {
    margin-top: 8px;
    text-align: center;
    color: #9ca3af;
    font-size: 12px;
}

.close-icon {
    width: 20px;
    cursor: pointer;
}
</style>
