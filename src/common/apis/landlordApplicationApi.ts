import {IBaseResponse, IPageRes} from "@/common/apis/base/res"
import {http} from "@/plugin/axios"
import {LandlordApplicationStatusEnum} from "@/common/enums/landlordApplicationEnum"

enum LandlordApplicationApiEnum {
    PAGE = '/uc/landlord-application/admin/page',
    REVIEW = '/uc/landlord-application/admin/review',
    SET_LANDLORD = '/uc/landlord-application/admin/set-landlord',
}

export interface LandlordApplicationItem {
    id: string
    userId: string
    username: string
    nickname: string
    phone: string
    proofImages: string[]
    remark: string
    status: LandlordApplicationStatusEnum
    rejectReason: string | null
    reviewedAt: string | null
    createdAt: string | null
}

export interface ApplicationPageReq {
    status?: LandlordApplicationStatusEnum | null
    page: number
    pageSize: number
}

export interface ReviewApplicationReq {
    applicationId: string
    approved: boolean
    rejectReason?: string
}

export interface AdminSetLandlordReq {
    userId: string
}

const getApplicationPage = async (params: ApplicationPageReq): Promise<IBaseResponse<IPageRes<LandlordApplicationItem>>> => {
    return http.get<IPageRes<LandlordApplicationItem>>(LandlordApplicationApiEnum.PAGE, {params})
}

const reviewApplication = async (req: ReviewApplicationReq): Promise<IBaseResponse<LandlordApplicationItem>> => {
    return http.post<LandlordApplicationItem>(LandlordApplicationApiEnum.REVIEW, req)
}

const setLandlord = async (req: AdminSetLandlordReq): Promise<IBaseResponse<boolean>> => {
    return http.post<boolean>(LandlordApplicationApiEnum.SET_LANDLORD, req)
}

export default {
    getApplicationPage,
    reviewApplication,
    setLandlord,
}
