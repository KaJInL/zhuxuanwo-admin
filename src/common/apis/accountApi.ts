/**
 * 账户相关 API 模块
 * 
 * 提供用户账户管理相关的接口，包括：
 * - 超级管理员创建
 * - 用户登录
 * - 用户信息获取
 */
import {http} from "@/plugin/axios";
import {IBaseResponse} from "@/common/apis/base/res";

/**
 * 账户 API 路径枚举
 */
enum AccountApiEnum {
    /** 检查超级管理员是否已创建 */
    IS_SUPERUSER_CREATED = "/uc/account/is-superuser-created",
    /** 创建超级管理员 */
    CREATE_SUPERUSER = "/uc/account/create-superuser",
    /** 密码登录 */
    LOGIN_BY_PWD = "/uc/account/login-by-pwd",
    /** 获取用户信息 */
    GET_USER_INFO = "/uc/account/userinfo",
    /** 刷新 Token */
    REFRESH = "/uc/account/refresh",
}

/**
 * 检查超级管理员是否已创建 - 响应
 */
export interface IsSuperUserCreatedRes {
    /** 超级管理员是否已创建 */
    isCreated: boolean
}

/**
 * 创建超级管理员 - 请求
 */
export interface CreateSuperUserReq {
    /** 手机号 */
    phone: string
    /** 密码 */
    password: string
    /** 邮箱 */
    email: string
}

/**
 * 密码登录 - 请求
 */
export interface LoginByPwdReq {
    /** 手机号 */
    phone: string
    /** 密码 */
    password: string
}

/**
 * 密码登录 - 响应
 */
export interface LoginRes {
    /** Access Token */
    accessToken: string
    /** Refresh Token */
    refreshToken: string
}

/**
 * 用户信息响应中的角色项
 */
export interface UserInfoResRoleItem {
    /** 角色代码 */
    roleCode: string
    /** 角色名称 */
    roleName: string
    /** 角色描述 */
    roleDescription: string
}

/**
 * 用户信息响应
 * 对应后端 UserInfoRes
 */
export interface UserInfoRes {
    /** 用户ID */
    id: number
    /** 用户名 */
    username: string
    /** 昵称 */
    nickname: string
    /** 邮箱 */
    email: string
    /** 头像URL */
    avatar: string
    /** 角色列表（注意：后端字段名为 rols） */
    rols: UserInfoResRoleItem[]
}

/**
 * 刷新 Token - 请求
 */
export interface RefreshReq {
    /** Access Token */
    accessToken: string
    /** Refresh Token */
    refreshToken: string
}

/**
 * 检查超级管理员是否已创建
 * 
 * 用于系统初始化时判断是否需要显示超级管理员创建页面
 * 
 * @returns 返回超级管理员创建状态
 */
const isSuperUserCreated = async (): Promise<IBaseResponse<IsSuperUserCreatedRes>> => {
    return await http.get<IsSuperUserCreatedRes>(AccountApiEnum.IS_SUPERUSER_CREATED)
}

/**
 * 创建超级管理员
 * 
 * 系统初始化时创建第一个超级管理员账户
 * 
 * @param req - 创建超级管理员请求参数
 * @returns 返回创建是否成功
 */
const createSuperUser = async (req: CreateSuperUserReq): Promise<IBaseResponse<boolean>> => {
    return await http.post<boolean>(AccountApiEnum.CREATE_SUPERUSER, req)
}

/**
 * 密码登录
 * 
 * 使用手机号和密码进行登录认证
 * 
 * @param req - 登录请求参数（手机号、密码）
 * @returns 返回 JWT 令牌
 */
const loginByPwd = async (req: LoginByPwdReq): Promise<IBaseResponse<LoginRes>> => {
    return await http.post<LoginRes>(AccountApiEnum.LOGIN_BY_PWD, req)
}

/**
 * 获取当前登录用户信息
 * 
 * 获取当前登录用户的完整信息，包括用户基本信息和角色列表
 * 需要在请求头中携带有效的 JWT 令牌
 * 
 * @returns 返回用户信息和角色列表
 */
const getUserInfo = async (): Promise<IBaseResponse<UserInfoRes>> => {
    return await http.get<UserInfoRes>(AccountApiEnum.GET_USER_INFO)
}

/**
 * 刷新 Token
 * 
 * 使用 refreshToken 刷新 accessToken
 * 
 * @param req - 刷新 Token 请求参数（accessToken 和 refreshToken）
 * @returns 返回新的 JWT 令牌
 */
const refresh = async (req: RefreshReq): Promise<IBaseResponse<LoginRes>> => {
    return await http.post<LoginRes>(AccountApiEnum.REFRESH, req)
}

/**
 * 账户 API 接口集合
 */
export default {
    /** 检查超级管理员是否已创建 */
    isSuperUserCreated,
    /** 创建超级管理员 */
    createSuperUser,
    /** 密码登录 */
    loginByPwd,
    /** 获取当前登录用户信息 */
    getUserInfo,
    /** 刷新 Token */
    refresh
}