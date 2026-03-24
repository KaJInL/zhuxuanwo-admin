import {IBaseResponse, IPageRes} from "@/common/apis/base/res"
import {http} from "@/plugin/axios"

enum UserAdminApiEnum {
    PAGE = '/uc/user/admin/page',
    UPDATE_INFO = '/uc/user/admin/update-info',
    UPDATE_STATE = '/uc/user/admin/update-state',
    UPDATE_ROLES = '/uc/user/admin/update-roles',
    SET_LANDLORD = '/uc/user/admin/set-landlord',
}

export interface UserAdminItem {
    id: string
    username: string
    nickname: string
    phone: string
    email: string
    avatar: string
    state: string
    isSuperuser: boolean
    roles: { roleCode: string; roleName: string }[]
    createdAt: string | null
}

export interface UserPageReq {
    keyword?: string
    state?: string | null
    page: number
    pageSize: number
}

export interface UpdateUserInfoReq {
    userId: string
    nickname?: string
    email?: string
    avatar?: string
}

export interface UpdateUserStateReq {
    userId: string
    state: string
}

export interface UpdateUserRolesReq {
    userId: string
    roleCodes: string[]
}

export interface SetLandlordReq {
    userId: string
    proofImages?: string[]
    remark?: string
}

const getUserPage = async (params: UserPageReq): Promise<IBaseResponse<IPageRes<UserAdminItem>>> => {
    return http.get<IPageRes<UserAdminItem>>(UserAdminApiEnum.PAGE, {params})
}

const updateUserInfo = async (req: UpdateUserInfoReq): Promise<IBaseResponse<boolean>> => {
    return http.post<boolean>(UserAdminApiEnum.UPDATE_INFO, req)
}

const updateUserState = async (req: UpdateUserStateReq): Promise<IBaseResponse<boolean>> => {
    return http.post<boolean>(UserAdminApiEnum.UPDATE_STATE, req)
}

const updateUserRoles = async (req: UpdateUserRolesReq): Promise<IBaseResponse<boolean>> => {
    return http.post<boolean>(UserAdminApiEnum.UPDATE_ROLES, req)
}

const setLandlord = async (req: SetLandlordReq): Promise<IBaseResponse<boolean>> => {
    return http.post<boolean>(UserAdminApiEnum.SET_LANDLORD, req)
}

export default {
    getUserPage,
    updateUserInfo,
    updateUserState,
    updateUserRoles,
    setLandlord,
}
