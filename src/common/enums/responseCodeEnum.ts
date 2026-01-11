/**
 * 响应码枚举（与后端 ResponseEnum 保持一致）
 * 对应后端：com.zhuxuanwo.common.enums.ResponseEnum
 * 
 * 错误码分类：
 * - 20000–20099: 成功类
 * - 40000–40099: 通用错误
 * - 40100–40199: 认证/登录
 * - 40300–40399: 权限
 * - 40400–40499: 资源不存在
 * - 42200–42299: 参数校验
 * - 50000–50099: 系统异常
 */
export enum ResponseCode {
    // ==================== 20000–20099: 成功类 ====================
    /** 成功 */
    SUCCESS = 20000,

    // ==================== 40000–40099: 通用错误 ====================
    /** 失败 */
    ERROR = 40000,
    /** 错误（展示消息） */
    SHOW_MESSAGE = 40001,
    /** 请求方法不支持 */
    METHOD_NOT_SUPPORT = 40002,

    // ==================== 40100–40199: 认证/登录 ====================
    /** 登录失败 */
    LOGIN_FAILED = 40100,
    /** 未登录 */
    NOT_LOGIN = 40101,
    /** 登录已过期 */
    LOGIN_EXPIRED = 40102,
    /** Access Token 已过期 */
    ACCESS_TOKEN_EXPIRED = 40103,
    /** Refresh Token 已过期 */
    REFRESH_TOKEN_EXPIRED = 40104,

    // ==================== 40300–40399: 权限 ====================
    /** 无权限访问 */
    PERMISSION_DENIED = 40300,

    // ==================== 40400–40499: 资源不存在 ====================
    // 预留：资源不存在相关错误码

    // ==================== 42200–42299: 参数校验 ====================
    /** 缺少必要参数 */
    PARAM_MISSING = 42200,
    /** 参数格式错误 */
    PARAM_INVALID = 42201,
    /** value为空 */
    VALUE_EMPTY = 42202,

    // ==================== 50000–50099: 系统异常 ====================
    // 预留：系统异常相关错误码
}

/**
 * 响应码显示消息映射
 */
export const ResponseCodeMessageMap: Record<ResponseCode, string> = {
    [ResponseCode.SUCCESS]: '成功',
    [ResponseCode.ERROR]: '失败',
    [ResponseCode.SHOW_MESSAGE]: '错误',
    [ResponseCode.METHOD_NOT_SUPPORT]: '请求方法不支持',
    [ResponseCode.LOGIN_FAILED]: '登录失败',
    [ResponseCode.NOT_LOGIN]: '未登录',
    [ResponseCode.LOGIN_EXPIRED]: '登录已过期',
    [ResponseCode.ACCESS_TOKEN_EXPIRED]: 'Access Token 已过期',
    [ResponseCode.REFRESH_TOKEN_EXPIRED]: 'Refresh Token 已过期',
    [ResponseCode.PERMISSION_DENIED]: '无权限访问',
    [ResponseCode.PARAM_MISSING]: '缺少必要参数',
    [ResponseCode.PARAM_INVALID]: '参数格式错误',
    [ResponseCode.VALUE_EMPTY]: 'value为空',
};

