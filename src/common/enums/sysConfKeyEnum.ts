/**
 * 系统配置键枚举（对应后端 SysConfKeyEnum）
 * 用于存放常用的系统配置键，避免硬编码字符串
 */
export enum SysConfKeyEnum {
    /** 默认头像 */
    DEFAULT_AVATAR = 'defaultAvatar',

}

/**
 * 系统配置键描述映射
 */
export const SysConfKeyDescriptionMap: Record<SysConfKeyEnum, string> = {
    [SysConfKeyEnum.DEFAULT_AVATAR]: '默认头像地址',
};

