import {LoginRes, UserInfoRes} from "@/common/apis/accountApi";

export interface IData {
    data: any
    expire?: number
}

export enum LocalStorageKey {
    TOKEN = 'token',
    USER_INFO = 'user_info',
    DEVICE_ID = 'device_id',
}

/**
 * localStorage工具
 */
const localStorageHelper = {
    /**
     * 设置数据到 localStorage
     * @param key 存储键
     * @param data 存储数据
     * @param expireInSecond 过期时间（秒），不传则永久有效
     */
    set(key: string, data: any, expireInSecond?: number): void {
        let cache: IData = {data}
        if (expireInSecond) {
            cache.expire = new Date().getTime() + expireInSecond * 1000
        }
        localStorage.setItem(key, JSON.stringify(cache))
    },

    /**
     * 从 localStorage 获取数据
     * @param key 存储键
     * @param defaultValue 默认值
     * @returns 存储的数据或默认值
     */
    get(key: string, defaultValue: any = null): any {
        const cacheStore = localStorage.getItem(key)
        if (cacheStore) {
            const cache = JSON.parse(cacheStore)
            const expire = cache?.expire
            if (expire && expire < new Date().getTime()) {
                localStorage.removeItem(key)
                return defaultValue
            }
            return cache.data
        }
        return defaultValue
    },

    /**
     * 从 localStorage 移除数据
     * @param key 存储键
     */
    remove(key: string): void {
        localStorage.removeItem(key)
    },

    /**
     * 清空所有 localStorage 数据
     */
    clear(): void {
        localStorage.clear()
    },

    /**
     * 检查 key 是否存在
     * @param key 存储键
     * @returns 是否存在
     */
    has(key: string): boolean {
        return localStorage.getItem(key) !== null
    },

    // Token 相关便捷方法
    /**
     * 保存 token
     * @param loginRes 登录返沪爹数据对象
     * @param expireInSecond 过期时间（秒），默认 7 天
     */
    setToken(loginRes: LoginRes, expireInSecond: number = 7 * 24 * 60 * 60): void {
        this.set(LocalStorageKey.TOKEN, loginRes, expireInSecond)
    },

    /**
     * 获取 token
     * @returns token 字符串或 null
     */
    getToken(): LoginRes | null {
        return this.get(LocalStorageKey.TOKEN, null)
    },

    /**
     * 移除 token（登出时使用）
     */
    removeToken(): void {
        this.remove(LocalStorageKey.TOKEN)
    },

    /**
     * 检查是否已登录（是否有 token）
     * @returns 是否已登录
     */
    isLoggedIn(): boolean {
        return this.getToken() !== null
    },

    // 用户信息相关便捷方法
    /**
     * 保存用户信息
     * @param userInfo 用户信息对象
     * @param expireInSecond 过期时间（秒），默认 7 天
     */
    setUserInfo(userInfo: UserInfoRes, expireInSecond: number = 7 * 24 * 60 * 60): void {
        this.set(LocalStorageKey.USER_INFO, userInfo, expireInSecond)
    },

    /**
     * 获取用户信息
     * @returns 用户信息对象或 null
     */
    getUserInfo(): UserInfoRes | null {
        return this.get(LocalStorageKey.USER_INFO, null)
    },

    /**
     * 移除用户信息（登出时使用）
     */
    removeUserInfo(): void {
        this.remove(LocalStorageKey.USER_INFO)
    },

    /**
     * 登出（清除 token 和用户信息）
     */
    logout(): void {
        this.removeToken()
        this.removeUserInfo()
    },

    // Device ID 相关方法
    /**
     * 生成唯一设备ID
     * @returns 设备ID字符串
     */
    generateDeviceId(): string {
        const timestamp = Date.now().toString(36)
        const randomPart = Math.random().toString(36).substring(2, 15)
        const randomPart2 = Math.random().toString(36).substring(2, 15)
        return `${timestamp}-${randomPart}-${randomPart2}`
    },

    /**
     * 获取设备ID，如果不存在则生成一个新的并存储（永不过期）
     * @returns 设备ID字符串
     */
    getDeviceId(): string {
        // 直接从 localStorage 读取，不使用 get 方法，因为 deviceId 永不过期
        const cacheStore = localStorage.getItem(LocalStorageKey.DEVICE_ID)
        if (cacheStore) {
            try {
                const cache = JSON.parse(cacheStore)
                if (cache.data) {
                    return cache.data
                }
            } catch {
                // 如果解析失败，直接返回原始值（兼容旧格式）
                return cacheStore
            }
        }
        // 生成新的 deviceId 并存储（不设置过期时间）
        const newDeviceId = this.generateDeviceId()
        localStorage.setItem(LocalStorageKey.DEVICE_ID, JSON.stringify({data: newDeviceId}))
        return newDeviceId
    },

    LocalStorageKey
}

export default localStorageHelper
