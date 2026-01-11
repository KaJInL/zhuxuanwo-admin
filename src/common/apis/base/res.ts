export interface IBaseResponse<T> {
    code: number,
    message: string,
    succeed: boolean,
    timestamp: number,
    data: T
}

export interface EmptyDataRespons {}

/**
 * 列表数据响应类型
 */
export interface IListRes<T> {
    list: T[]
}

/**
 * 分页响应类型
 */
export interface IPageRes<T> {
    total: number,
    hasNext: boolean,
    list: T[],
}