import type { Router } from 'vue-router'
import { checkAppInitialization } from './checkAppInitialization'

/**
 * 路由守卫配置
 * 集中管理所有路由守卫
 * @param router 路由对象
 */
export function setupRouterGuard(router: Router) {
    // 检查应用初始化状态
    router.beforeEach(checkAppInitialization);
}
