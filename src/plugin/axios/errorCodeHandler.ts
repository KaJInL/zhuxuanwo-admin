// 错误码处理

import { IBaseResponse } from "@/common/apis/base/res";
import { message } from 'ant-design-vue';
import localStorageHelper from "@/common/helper/localStorageHelper";
import router from "@/plugin/router";
import { ResponseCode } from "@/common/enums/responseCodeEnum";

/**
 * 标记是否正在处理认证错误（防止重复跳转）
 */
let isHandlingAuthError = false;

/**
 * 处理错误码
 * @param res 响应数据
 */
function handlerCodeError(res: IBaseResponse<any>) {
    const code = res.code;
    
    switch (code) {
        case ResponseCode.SUCCESS:
            break;
            
        case ResponseCode.NOT_LOGIN:
        case ResponseCode.LOGIN_EXPIRED:
        case ResponseCode.LOGIN_FAILED:
            // 如果正在处理认证错误，避免重复处理
            if (isHandlingAuthError) return;
            isHandlingAuthError = true;
            message.error('登录失效，请重新登录');
            localStorageHelper.removeToken();
            setTimeout(() => {
                router.push('/account/login').finally(() => {
                    setTimeout(() => {
                        isHandlingAuthError = false;
                    }, 2000);
                });
            }, 1000);
            break;
            
        case ResponseCode.PARAM_MISSING:
        case ResponseCode.PARAM_INVALID:
            message.error(res.message || '参数校验错误');
            break;
            
        case ResponseCode.SHOW_MESSAGE:
            message.info(res.message || '提示');
            break;
            
        case ResponseCode.PERMISSION_DENIED:
            message.error(res.message || '没有权限执行该操作');
            break;
            
        case ResponseCode.ERROR:
        default:
            // 默认错误处理
            message.error(res.message || '操作失败');
            break;
    }
}

export default { handlerCodeError }