import Axios from "./Axios"
import EnvHelper from "@/common/helper/EnvHelper";
import { RefreshTokenPlugin } from "./plugins/refreshTokenPlugin";
import localStorageUtil from "@/common/helper/localStorageHelper";
import axios from "axios";

const baseUrl = EnvHelper.env.VITE_API_BASE_URL

// 创建一个独立的 axios 实例用于刷新 token（不经过拦截器，避免循环调用）
const refreshInstance = axios.create({
    baseURL: baseUrl,
    timeout: 100000,
    headers: {},
});
// 清除 refreshInstance 的所有拦截器
refreshInstance.interceptors.request.clear();
refreshInstance.interceptors.response.clear();

// 创建 Axios 实例（先创建，因为插件需要引用它）
const http = new Axios({
    baseURL: baseUrl,
    timeout: 100000,
    headers: {},
});

// 创建 RefreshToken 插件
const refreshTokenPlugin = new RefreshTokenPlugin(
    {
        getToken: () => localStorageUtil.getToken(),
        setToken: (token) => localStorageUtil.setToken(token),
        removeToken: () => localStorageUtil.removeToken(),
        refreshApiUrl: `${baseUrl}/uc/account/refresh`,
        loginRouteName: 'Login',
        loginPath: '/account/login',
        getAxiosInstance: () => http.getInstance(), // 获取内部的 axios 实例
    },
    refreshInstance
);

// 注册 refreshToken 插件
http.use(refreshTokenPlugin);

export {
    http
}