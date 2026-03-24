/**
 * 房东申请状态枚举
 */
export enum LandlordApplicationStatusEnum {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

/**
 * 状态显示名映射
 */
export const LandlordApplicationStatusNameMap: Record<LandlordApplicationStatusEnum, string> = {
    [LandlordApplicationStatusEnum.PENDING]: '待审核',
    [LandlordApplicationStatusEnum.APPROVED]: '已通过',
    [LandlordApplicationStatusEnum.REJECTED]: '已拒绝',
}

/**
 * 状态 Tag 颜色映射
 */
export const LandlordApplicationStatusColorMap: Record<LandlordApplicationStatusEnum, string> = {
    [LandlordApplicationStatusEnum.PENDING]: 'orange',
    [LandlordApplicationStatusEnum.APPROVED]: 'green',
    [LandlordApplicationStatusEnum.REJECTED]: 'red',
}
