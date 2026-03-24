/**
 * 角色枚举（对应后端 SystemRoleEnum）
 */
export enum RoleEnum {
    /** 超级管理员 */
    SUPER_ADMIN = 'SUPER_ADMIN',
    /** 管理员 */
    ADMIN = 'ADMIN',
    /** 普通用户 */
    USER = 'USER',
    /** 租客 */
    TENANT = 'TENANT',
    /** 房东 */
    LANDLORD = 'LANDLORD',
    /** 设计师 */
    DESIGNER = 'designer',
    /** 公司设计师 */
    COMPANY_DESIGNER = 'company_designer',
}

/**
 * 角色显示名称映射
 */
export const RoleNameMap: Record<RoleEnum, string> = {
    [RoleEnum.SUPER_ADMIN]: '超级管理员',
    [RoleEnum.ADMIN]: '管理员',
    [RoleEnum.USER]: '普通用户',
    [RoleEnum.TENANT]: '租客',
    [RoleEnum.LANDLORD]: '房东',
    [RoleEnum.DESIGNER]: '设计师',
    [RoleEnum.COMPANY_DESIGNER]: '公司设计师',
};

/**
 * 角色描述映射
 */
export const RoleDescriptionMap: Record<RoleEnum, string> = {
    [RoleEnum.SUPER_ADMIN]: '拥有系统所有权限',
    [RoleEnum.ADMIN]: '拥有管理权限',
    [RoleEnum.USER]: '普通用户权限',
    [RoleEnum.TENANT]: '租客权限',
    [RoleEnum.LANDLORD]: '房东权限，可发布房源',
    [RoleEnum.DESIGNER]: '设计师权限',
    [RoleEnum.COMPANY_DESIGNER]: '公司设计师权限',
};

