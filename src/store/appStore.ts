import {defineStore} from "pinia";
import {computed, ref} from "vue";
import accountApi from "@/common/apis/accountApi";

/**
 * 全局应用状态管理 Store
 * 用于管理系统初始化检查
 */
export const useAppStore = defineStore("app", () => {



    /** 是否已创建超级管理员 */
    const isSuperuserCreated = ref<boolean | null>(null);

    /** 系统是否已经完成初始化 */
    const isSystemInitialization = computed(() => {
        let a = isSuperuserCreated.value !== null
        return a
    })

    /**
     * 检查系统是否已初始化（是否已创建超级管理员）
     * @returns Promise<boolean> 是否已创建超级管理员
     */
    const checkSystemInitialization = async (): Promise<boolean> => {
        if (isSystemInitialization.value) {
            return isSuperuserCreated.value ?? false;
        }

        const response = await accountApi.isSuperUserCreated();

        if (!response.succeed) {
            return false
        }

        isSuperuserCreated.value = response.data.isCreated;
        console.log(response.data.isCreated)
        console.log(isSuperuserCreated)
        return isSuperuserCreated.value;
    };

    /**
     * 设置超级管理员用户为已创建
     */
    const markSuperuserCreated = () => {
        isSuperuserCreated.value = true
    }

    return {
        isSuperuserCreated,
        checkSystemInitialization,
        isSystemInitialization,
        markSuperuserCreated
    };
});

