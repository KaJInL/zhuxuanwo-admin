/**
 * 客户端信息工具函数
 */

/**
 * 获取操作系统类型和版本
 */
export function getOSInfo(): { osType: string; osVersion: string } {
    const userAgent = navigator.userAgent
    let osType = 'Unknown'
    let osVersion = 'Unknown'

    if (userAgent.includes('Win')) {
        osType = 'Windows'
        const match = userAgent.match(/Windows NT (\d+\.\d+)/)
        if (match) {
            const ntVersion = match[1]
            const versionMap: Record<string, string> = {
                '10.0': '10/11',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7',
                '6.0': 'Vista',
                '5.1': 'XP'
            }
            osVersion = versionMap[ntVersion] || ntVersion
        }
    } else if (userAgent.includes('Mac')) {
        osType = 'macOS'
        const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
        if (match) {
            osVersion = match[1].replace(/_/g, '.')
        }
    } else if (userAgent.includes('Linux')) {
        osType = 'Linux'
        if (userAgent.includes('Android')) {
            osType = 'Android'
            const match = userAgent.match(/Android (\d+\.?\d*)/)
            if (match) {
                osVersion = match[1]
            }
        }
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        osType = 'iOS'
        const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/)
        if (match) {
            osVersion = match[1].replace(/_/g, '.')
        }
    }

    return { osType, osVersion }
}

/**
 * 获取平台类型
 */
export function getPlatform(): string {
    const userAgent = navigator.userAgent
    if (/Android/i.test(userAgent)) {
        return 'android'
    }
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return 'ios'
    }
    return 'web'
}

/**
 * 获取应用版本（从环境变量或配置中获取）
 */
export function getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

