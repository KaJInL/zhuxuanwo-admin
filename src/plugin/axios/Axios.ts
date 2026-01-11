import axios, {AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse} from "axios";
import localStorageUtil from "@/common/helper/localStorageHelper";
import errorCodeHandler from "@/plugin/axios/errorCodeHandler";
import {IBaseResponse} from "@/common/apis/base/res";
import {getAppVersion, getOSInfo, getPlatform} from "./clientInfo";
import type { AxiosPlugin } from "./plugins/types";

/**
 * Axios 封装类
 * 支持插件系统，可以灵活扩展功能
 */
export default class Axios {
    private instance: AxiosInstance
    private plugins: AxiosPlugin[] = []

    constructor(config: AxiosRequestConfig, plugins: AxiosPlugin[] = []) {
        this.instance = axios.create(config)
        this.plugins = plugins
        
        this.setupPlugins()
        this.setupDefaultInterceptors()
    }

    /**
     * 设置插件
     */
    private setupPlugins() {
        this.plugins.forEach(plugin => {
            // 设置请求拦截器
            if (plugin.onRequest) {
                this.instance.interceptors.request.use(
                    plugin.onRequest,
                    plugin.onRequestError
                );
            }
            
            // 设置响应拦截器
            if (plugin.onResponse || plugin.onResponseError) {
                this.instance.interceptors.response.use(
                    plugin.onResponse,
                    plugin.onResponseError
                );
            }
        });
    }

    /**
     * 获取内部的 axios 实例（供插件使用）
     */
    public getInstance(): AxiosInstance {
        return this.instance;
    }

    /**
     * 注册插件（支持动态添加插件）
     */
    public use(plugin: AxiosPlugin): void {
        this.plugins.push(plugin);
        // 重新设置插件
        if (plugin.onRequest) {
            this.instance.interceptors.request.use(
                plugin.onRequest,
                plugin.onRequestError
            );
        }
        if (plugin.onResponse || plugin.onResponseError) {
            this.instance.interceptors.response.use(
                plugin.onResponse,
                plugin.onResponseError
            );
        }
    }

    /**
     * 设置默认拦截器（基础功能）
     */
    private setupDefaultInterceptors() {
        this.interceptorsReq()
        this.interceptorsRes()
    }

    /**
     * 请求拦截
     */
    private interceptorsReq() {
        this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
            // 确保 headers 存在
            config.headers = config.headers || {}
            
            // 添加认证token
            const token = localStorageUtil.getToken()?.accessToken
            if (token) {
                config.headers.Authorization = `${token}`
            }

            // 添加客户端信息请求头
            const osInfo = getOSInfo()
            config.headers['X-Platform'] = getPlatform()
            config.headers['X-Device-Id'] = localStorageUtil.getDeviceId()
            config.headers['X-OS-Type'] = osInfo.osType
            config.headers['X-OS-Version'] = osInfo.osVersion
            config.headers['X-App-Version'] = getAppVersion()

            return config
        }, error => {
            return Promise.reject(error)
        })
    }

    /**
     * 响应拦截
     */
    private interceptorsRes() {
        this.instance.interceptors.response.use(
            async (res: AxiosResponse<IBaseResponse<any>>) => {
                const responseData = res.data
                
                // 其他错误码处理
                if (!responseData.succeed) {
                    errorCodeHandler.handlerCodeError(responseData)
                }
                // 修改 res.data 确保返回正确的数据格式
                res.data = responseData as any
                return res
            },
            error => {
                // 处理 HTTP 错误（如 401、403、500 等）
                if (error.response) {
                    const status = error.response.status
                    const timestamp = Date.now() // 动态生成时间戳

                    // 401 未授权
                    if (status === 401) {
                        // 构造一个标准的错误响应格式，让 errorCodeHandler 统一处理
                        errorCodeHandler.handlerCodeError({
                            code: 40100, // UNAUTHORIZED
                            message: '用户未登录',
                            isSuccess: false,
                            data: null,
                            timestamp
                        })
                    }
                    // 403 禁止访问
                    else if (status === 403) {
                        errorCodeHandler.handlerCodeError({
                            code: 40300, // FORBIDDEN
                            message: '没有权限访问',
                            isSuccess: false,
                            data: null,
                            timestamp
                        })
                    }
                    // 500 服务器错误
                    else if (status >= 500) {
                        errorCodeHandler.handlerCodeError({
                            code: 40000, // ERROR
                            message: '服务器错误，请稍后重试',
                            isSuccess: false,
                            data: null,
                            timestamp
                        })
                    }
                }
                return Promise.reject(error)
            }
        )
    }

    public async request<T, D = IBaseResponse<T>>(config: AxiosRequestConfig): Promise<D> {
        const response = await this.instance.request<D>(config)
        return response.data
    }

    public async get<T>(url: string, data: any = {}) {
        return this.request<T>({
            url: url,
            params: data,
            method: 'get'
        })
    }

    public async post<T>(url: string, data: any = {}, params: any = {}) {
        return this.request<T>({
            url: url,
            data,
            params,
            method: 'post',
        })
    }

    public async upload<T>(url: string, data: FormData) {
        return this.request<T>({
            url: url,
            data,
            method: 'post',
            headers: {
                "Content-Type": "multipart/form-data",
            }
        })
    }
}