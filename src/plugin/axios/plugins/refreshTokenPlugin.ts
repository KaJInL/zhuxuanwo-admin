import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { AxiosPlugin } from "./types";
import type { IBaseResponse } from "@/common/apis/base/res";
import { ResponseCode } from "@/common/enums/responseCodeEnum";
import { LoginRes, RefreshReq } from "@/common/apis/accountApi";
import errorCodeHandler from "@/plugin/axios/errorCodeHandler";
import router from "@/plugin/router";

/**
 * RefreshToken 插件配置
 */
export interface RefreshTokenPluginConfig {
    /** 获取 token 的函数 */
    getToken: () => { accessToken: string; refreshToken: string } | null;
    /** 保存 token 的函数 */
    setToken: (token: { accessToken: string; refreshToken: string }) => void;
    /** 清除 token 的函数 */
    removeToken: () => void;
    /** 刷新 token 的 API 地址 */
    refreshApiUrl: string;
    /** 登录页面路由名称 */
    loginRouteName?: string;
    /** 登录页面路径（备用） */
    loginPath?: string;
    /** 获取 axios 实例的函数（用于重新发送请求） */
    getAxiosInstance: () => AxiosInstance;
}

/**
 * RefreshToken 自动刷新插件
 * 
 * 功能：
 * 1. 检测 ACCESS_TOKEN_EXPIRED (40007) 错误码
 * 2. 自动调用 refresh API 刷新 token
 * 3. 重新发送原始请求
 * 4. 处理并发请求（队列机制）
 * 5. 处理 REFRESH_TOKEN_EXPIRED (40008) 错误码，跳转登录
 */
export class RefreshTokenPlugin implements AxiosPlugin {
    name = "RefreshTokenPlugin";
    
    private config: RefreshTokenPluginConfig;
    private refreshInstance: AxiosInstance;
    private isRefreshing = false;
    private refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

    constructor(config: RefreshTokenPluginConfig, refreshInstance: AxiosInstance) {
        this.config = config;
        this.refreshInstance = refreshInstance;
    }

    onResponse = async <T = any>(response: AxiosResponse<IBaseResponse<T>>): Promise<AxiosResponse<IBaseResponse<T>>> => {
        const responseData = response.data;
        
        // 检查是否为 ACCESS_TOKEN_EXPIRED (40007)
        if (responseData.code === ResponseCode.ACCESS_TOKEN_EXPIRED) {
            const originalConfig = response.config as InternalAxiosRequestConfig & { _retry?: boolean };
            
            // 如果已经在重试，避免无限循环
            if (originalConfig._retry) {
                errorCodeHandler.handlerCodeError(responseData);
                response.data = responseData as any;
                return Promise.reject(response);
            }
            
            // 如果正在刷新 token，将当前请求加入队列
            if (this.isRefreshing) {
                return new Promise((resolve, reject) => {
                    this.refreshSubscribers.push({ 
                        resolve: (token: string) => {
                            // 创建新的 config 对象，不污染原始 config
                            const newConfig = {
                                ...originalConfig,
                                headers: {
                                    ...originalConfig.headers,
                                    Authorization: `${token}`
                                }
                            };
                            // 使用原始 axios 实例重新发送请求
                            this.config.getAxiosInstance().request(newConfig).then(resolve).catch(reject);
                        }, 
                        reject 
                    });
                });
            }

            // 开始刷新 token
            this.isRefreshing = true;
            
            try {
                // 获取当前的 token
                const tokenData = this.config.getToken();
                if (!tokenData || !tokenData.accessToken || !tokenData.refreshToken) {
                    // 跳转到登录页面
                    this.redirectToLogin();
                    return Promise.reject(response);
                }
                
                // 调用刷新 token API
                const refreshReq: RefreshReq = {
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken
                };
                
                const refreshResponse = await this.refreshInstance.post<IBaseResponse<LoginRes>>(
                    this.config.refreshApiUrl,
                    refreshReq
                );
                
                // 检查刷新响应
                if (refreshResponse.data.code === ResponseCode.REFRESH_TOKEN_EXPIRED) {
                    // refreshToken 已过期，直接跳转登录页面
                    this.isRefreshing = false;
                    this.refreshSubscribers.forEach(subscriber => subscriber.reject(new Error('RefreshToken 已过期')));
                    this.refreshSubscribers = [];
                    
                    // 清除 token
                    this.config.removeToken();
                    
                    // 跳转到登录页面
                    this.redirectToLogin();
                    
                    // 返回错误响应
                    response.data = refreshResponse.data as any;
                    return Promise.reject(response);
                }
                
                // 检查刷新是否成功
                if (refreshResponse.data.isSuccess && refreshResponse.data.data) {
                    const newToken = refreshResponse.data.data.accessToken;
                    
                    // 保存新的 token
                    this.config.setToken(refreshResponse.data.data);
                    
                    // 立即复位刷新状态，然后通知等待的请求
                    this.isRefreshing = false;
                    this.refreshSubscribers.forEach(subscriber => subscriber.resolve(newToken));
                    this.refreshSubscribers = [];
                    
                    // 创建新的 config 对象，不污染原始 config
                    const newConfig = {
                        ...originalConfig,
                        headers: {
                            ...originalConfig.headers,
                            Authorization: `${newToken}`
                        },
                        _retry: true
                    };
                    
                    // 重新发送原始请求
                    return await this.config.getAxiosInstance().request(newConfig);
                } else {
                    throw new Error('Token 刷新失败');
                }
            } catch (error: any) {
                // 刷新失败，通知所有等待的请求
                this.isRefreshing = false;
                this.refreshSubscribers.forEach(subscriber => subscriber.reject(error));
                this.refreshSubscribers = [];
                
                // 清除 token 并跳转登录
                this.config.removeToken();
                errorCodeHandler.handlerCodeError(responseData);
                response.data = responseData as any;
                return Promise.reject(response);
            }
        }
        
        return response;
    };

    /**
     * 跳转到登录页面
     */
    private redirectToLogin(): void {
        if (this.config.loginRouteName) {
            router.push({ name: this.config.loginRouteName }).catch(() => {
                if (this.config.loginPath) {
                    window.location.href = this.config.loginPath;
                }
            });
        } else if (this.config.loginPath) {
            window.location.href = this.config.loginPath;
        }
    }
}

