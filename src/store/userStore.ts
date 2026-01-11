import {defineStore} from "pinia";
import {computed, ref} from "vue";
import type {Router} from "vue-router";
import accountApi, {type UserInfoRes, type UserInfoResRoleItem} from "@/common/apis/accountApi";
import localStorageHelper from "@/common/helper/localStorageHelper";
import {RoleEnum} from "@/common/enums/roleEnum";

// 重新导出 RoleEnum 以便其他模块使用
export {RoleEnum};

/**
 * 用户状态管理 Store
 * 用于管理用户信息、角色权限等
 */
export const useUserStore = defineStore("user", () => {
    
    // ==================== 状态 ====================
    
    /** 用户完整信息（包含用户基本信息和角色列表） */
    const userInfo = ref<UserInfoRes | null>(null);
    
    /** 是否正在加载用户信息 */
    const loading = ref(false);
    
    /** 用户信息加载错误 */
    const error = ref<string | null>(null);
    
    
    // ==================== 计算属性 ====================
    
    /** 用户角色名称列表 */
    const roleNames = computed<string[]>(() => {
        if (!userInfo.value?.rols) return [];
        return userInfo.value.rols.map((role: UserInfoResRoleItem) => role.roleName);
    });
    
    /** 是否有管理员权限（包括超级管理员和普通管理员） */
    const hasAdminRole = computed(() => {
        return roleNames.value.includes(RoleEnum.ADMIN) || 
               roleNames.value.includes(RoleEnum.SUPER_ADMIN);
    });
    
    /** 是否有设计师权限（包括设计师和公司设计师） */
    const hasDesignerRole = computed(() => {
        return roleNames.value.includes(RoleEnum.DESIGNER) || 
               roleNames.value.includes(RoleEnum.COMPANY_DESIGNER);
    });
    
    /** 是否有超级管理员权限 */
    const isSuperAdmin = computed(() => {
        return roleNames.value.includes(RoleEnum.SUPER_ADMIN);
    });
    
    /** 用户显示名称（优先显示昵称，其次用户名） */
    const displayName = computed(() => {
        if (!userInfo.value) return '用户';
        return userInfo.value.nickname || 
               userInfo.value.username || 
               '用户';
    });
    
    /** 用户是否有任何可用的控制台权限 */
    const hasAnyPermission = computed(() => {
        return hasAdminRole.value || hasDesignerRole.value;
    });
    
    
    // ==================== 方法 ====================
    
    /**
     * 获取用户信息
     * @param forceRefresh - 是否强制刷新（忽略缓存）
     * @returns 是否获取成功
     */
    const fetchUserInfo = async (forceRefresh = false): Promise<boolean> => {
        // 如果已有用户信息且不强制刷新，直接返回
        if (userInfo.value && !forceRefresh) {
            return true;
        }
        
        try {
            loading.value = true;
            error.value = null;
            
            const response = await accountApi.getUserInfo();
            
            if (response.succeed && response.data) {
                // 保存用户信息到 store
                userInfo.value = response.data;
                
                // 同步保存到 localStorage
                localStorageHelper.setUserInfo(response.data);
                
                return true;
            } else {
                error.value = response.message || '获取用户信息失败';
                return false;
            }
        } catch (err: any) {
            console.error('获取用户信息失败:', err);
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 从 localStorage 加载缓存的用户信息
     */
    const loadCachedUserInfo = () => {
        const cached = localStorageHelper.getUserInfo();
        if (cached) {
            userInfo.value = cached;
        }
    };
    
    /**
     * 检查用户是否拥有指定角色
     * @param role - 角色名称或角色代码
     * @returns 是否拥有该角色
     */
    const hasRole = (role: string | RoleEnum): boolean => {
        if (!userInfo.value?.rols) return false;
        return userInfo.value.rols.some(r => r.roleName === role || r.roleCode === role);
    };
    
    /**
     * 检查用户是否拥有指定角色中的任意一个
     * @param roles - 角色名称或角色代码数组
     * @returns 是否拥有任意一个角色
     */
    const hasAnyRole = (roles: (string | RoleEnum)[]): boolean => {
        if (!userInfo.value?.rols) return false;
        return roles.some(role => 
            userInfo.value!.rols.some(r => r.roleName === role || r.roleCode === role)
        );
    };
    
    /**
     * 检查用户是否拥有所有指定角色
     * @param roles - 角色名称或角色代码数组
     * @returns 是否拥有所有角色
     */
    const hasAllRoles = (roles: (string | RoleEnum)[]): boolean => {
        if (!userInfo.value?.rols) return false;
        return roles.every(role => 
            userInfo.value!.rols.some(r => r.roleName === role || r.roleCode === role)
        );
    };
    
    /**
     * 清除用户信息
     */
    const clearUserInfo = () => {
        userInfo.value = null;
        error.value = null;
    };
    
    /**
     * 登出
     * 清除用户信息和 token
     */
    const logout = () => {
        clearUserInfo();
        localStorageHelper.logout();
    };
    
    /**
     * 登出并跳转到登录页
     * @param router - Vue Router 实例
     * 
     * 使用场景：
     * 1. 用户主动退出登录
     * 2. Token 过期或无效时自动登出
     * 3. 获取用户信息失败时登出
     * 
     * 注意：先清除状态，然后使用 window.location 强制刷新跳转，避免 Vue Router 的 DOM 更新冲突
     */
    const logoutAndRedirect = async (router: Router) => {
        // 先清除用户状态和本地存储
        logout();
        
        // 使用 window.location.replace 强制跳转，不留历史记录
        // 这样可以避免 Vue Router 的 DOM 更新冲突，且完全重置应用状态
        const loginPath = router.resolve({name: 'Login'}).href;
        window.location.replace(loginPath);
    };
    
    /**
     * 初始化用户信息
     * 先从缓存加载，然后从服务器获取最新数据
     */
    const initUserInfo = async (): Promise<boolean> => {
        // 先加载缓存
        loadCachedUserInfo();
        
        // 然后从服务器获取最新数据
        return await fetchUserInfo(true);
    };
    
    
    return {
        // 状态
        userInfo,
        loading,
        error,
        
        // 计算属性
        roleNames,
        hasAdminRole,
        hasDesignerRole,
        isSuperAdmin,
        displayName,
        hasAnyPermission,
        
        // 方法
        fetchUserInfo,
        loadCachedUserInfo,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        clearUserInfo,
        logout,
        logoutAndRedirect,
        initUserInfo,
    };
});

