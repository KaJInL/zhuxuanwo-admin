import {EmptyDataRespons,  IBaseResponse, IListRes} from "@/common/apis/base/res";
import {http} from "@/plugin/axios";

enum ConfApiEnum {
    GET_ALL_CONF = '/system/conf/admin/all',// 查询全部系统配置
    UPDATE_CONF = '/system/conf/admin/update', // 更新配置
}

export interface SysConfItem {
    id?: string,
    sysKey: string,
    sysValue: string
}

const getAllSysConf = async (): Promise<IBaseResponse<IListRes<SysConfItem>>> => {
    return http.get<IListRes<SysConfItem>>(ConfApiEnum.GET_ALL_CONF)
}

const updateSysConf = (data: SysConfItem): Promise<IBaseResponse<EmptyDataRespons>> => {
    return http.post<EmptyDataRespons>(ConfApiEnum.UPDATE_CONF, data)
}

export default {
    getAllSysConf,
    updateSysConf
}