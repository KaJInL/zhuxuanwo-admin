import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { IBaseResponse } from "@/common/apis/base/res";

/**
 * Axios 插件接口
 * 用于扩展 Axios 功能，实现请求和响应拦截
 */
export interface AxiosPlugin {
    /**
     * 插件名称
     */
    name: string;

    /**
     * 请求拦截器
     * @param config 请求配置
     * @returns 修改后的请求配置或 Promise
     */
    onRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

    /**
     * 请求错误拦截器
     * @param error 错误对象
     * @returns Promise reject
     */
    onRequestError?: (error: any) => Promise<any>;

    /**
     * 响应拦截器
     * @param response 响应对象
     * @returns 修改后的响应或 Promise
     */
    onResponse?: <T = any>(response: AxiosResponse<IBaseResponse<T>>) => AxiosResponse<IBaseResponse<T>> | Promise<AxiosResponse<IBaseResponse<T>>>;

    /**
     * 响应错误拦截器
     * @param error 错误对象
     * @returns Promise reject
     */
    onResponseError?: (error: any) => Promise<any>;
}

