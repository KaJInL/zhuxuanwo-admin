/**
 * 角色枚举（对应后端 RoleEnum）
 */
export enum RoleEnum {
    /** 超级管理员 */
    SUPER_ADMIN = 'super_admin',
    /** 管理员 */
    ADMIN = 'admin',
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
    [RoleEnum.DESIGNER]: '设计师',
    [RoleEnum.COMPANY_DESIGNER]: '公司设计师',
};

/**
 * 角色描述映射
 */
export const RoleDescriptionMap: Record<RoleEnum, string> = {
    [RoleEnum.SUPER_ADMIN]: '拥有系统所有权限',
    [RoleEnum.ADMIN]: '拥有管理权限',
    [RoleEnum.DESIGNER]: '设计师权限',
    [RoleEnum.COMPANY_DESIGNER]: '公司设计师权限',
};

