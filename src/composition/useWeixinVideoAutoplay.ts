import {nextTick, onMounted} from 'vue'

let isShowAlert = true
let weixinBridgeReady = false
let pendingVideoCallbacks: (() => void)[] = []

// 检测是否在微信环境
const isWeixin = () => /MicroMessenger/i.test(navigator.userAgent)

// 执行所有待播放的视频回调
const executePendingCallbacks = () => {
    while (pendingVideoCallbacks.length > 0) {
        const callback = pendingVideoCallbacks.shift()
        if (callback) {
            try {
                callback()
            } catch (error) {
                // 静默处理错误
            }
        }
    }
}

export function useWeixinVideoAutoplay() {
    const tryPlayAllVideos = () => {
        try {
            const videos = document.querySelectorAll('video')
            videos.forEach(video => {
                // 确保视频是静音的
                video.muted = true
                // 设置播放内联
                video.playsInline = true

                // 简单尝试播放，不进行复杂的错误处理
                video.play().catch(() => {
                    // 静默处理错误，不进行重试
                })
            })
        } catch (error) {
            // 静默处理错误，避免阻塞页面
        }
    }

    const onBridgeReady = () => {
        try {
            if ((window as any).WeixinJSBridge) {
                (window as any).WeixinJSBridge.invoke('getNetworkType', {}, () => {
                    weixinBridgeReady = true
                    tryPlayAllVideos()
                    executePendingCallbacks()
                })
            } else {
                document.addEventListener('WeixinJSBridgeReady', () => {
                    if ((window as any).WeixinJSBridge) {
                        (window as any).WeixinJSBridge.invoke('getNetworkType', {}, () => {
                            weixinBridgeReady = true
                            tryPlayAllVideos()
                            executePendingCallbacks()
                        })
                    }
                }, {once: true})
            }
        } catch (error) {
            // 静默处理错误，避免阻塞页面
        }
    }

    nextTick(() => {
        try {
            // 检测是否在微信环境
            if (isWeixin()) {
                if (isShowAlert) {
                    isShowAlert = false
                    alert('视频将自动播放')
                }
                onBridgeReady()
                
                // 添加用户交互事件监听，作为备用方案
                const handleUserInteraction = () => {
                    weixinBridgeReady = true
                    tryPlayAllVideos()
                    executePendingCallbacks()
                }
                
                // 不移除事件监听器，保持持续监听
                document.addEventListener('touchstart', handleUserInteraction, { passive: true })
                document.addEventListener('click', handleUserInteraction, { passive: true })
                document.addEventListener('scroll', handleUserInteraction, { passive: true })
            } else {
                // 非微信环境，直接标记为准备就绪
                weixinBridgeReady = true
            }

            // 简单的延迟播放，避免复杂逻辑
            setTimeout(() => {
                tryPlayAllVideos()
                if (!isWeixin()) {
                    executePendingCallbacks()
                }
            }, 500)
        } catch (error) {
            // 静默处理错误，避免阻塞页面
        }
    })
}

// 注册微信视频播放回调
export function registerWeixinVideoCallback(callback: () => void) {
    if (!isWeixin()) {
        // 非微信环境，直接执行
        callback()
        return
    }
    
    if (weixinBridgeReady) {
        // Bridge已就绪，直接执行
        callback()
    } else {
        // 添加到待执行队列
        pendingVideoCallbacks.push(callback)
    }
}

// 强制播放所有视频（用于滚动时触发）
export function forcePlayWeixinVideos() {
    if (!isWeixin()) return
    
    try {
        const videos = document.querySelectorAll('video')
        videos.forEach(video => {
            if (video.paused && video.readyState >= 2) { // 确保视频已加载足够数据
                video.muted = true
                video.playsInline = true
                
                // 设置微信特有属性
                video.setAttribute('webkit-playsinline', 'true')
                video.setAttribute('x5-playsinline', 'true')
                video.setAttribute('x5-video-player-type', 'h5')
                video.setAttribute('x5-video-player-fullscreen', 'false')
                
                video.play().catch(() => {
                    // 静默处理错误
                })
            }
        })
    } catch (error) {
        // 静默处理错误
    }
}

// 获取微信播放状态
export function getWeixinPlayStatus() {
    return {
        isWeixin: isWeixin(),
        bridgeReady: weixinBridgeReady,
        pendingCallbacks: pendingVideoCallbacks.length
    }
}
