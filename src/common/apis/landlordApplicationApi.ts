import {IBaseResponse, IPageRes} from "@/common/apis/base/res"
import {http} from "@/plugin/axios"
import {LandlordApplicationStatusEnum} from "@/common/enums/landlordApplicationEnum"

enum LandlordApplicationApiEnum {
    PAGE = '/uc/landlord-application/admin/page',
    REVIEW = '/uc/landlord-application/admin/review',
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

const getApplicationPage = async (params: ApplicationPageReq): Promise<IBaseResponse<IPageRes<LandlordApplicationItem>>> => {
    return http.get<IPageRes<LandlordApplicationItem>>(LandlordApplicationApiEnum.PAGE, {params})
}

const reviewApplication = async (req: ReviewApplicationReq): Promise<IBaseResponse<LandlordApplicationItem>> => {
    return http.post<LandlordApplicationItem>(LandlordApplicationApiEnum.REVIEW, req)
}

export default {
    getApplicationPage,
    reviewApplication,
}
