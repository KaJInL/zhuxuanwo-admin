import type { RouteRecordRaw } from "vue-router";

/**
 * 设计师工作台子路由配置
 */
const designerRoutes: RouteRecordRaw[] = [
    {
        path: '',
        redirect: {name: 'DesignerDesign'}
    },
    {
        path: 'home',
        name: 'DesignerHome',
        component: () => import('@/views/pages/designer/home/index.vue'),
        meta: {
            title: '设计师工作台首页',
        }
    },
    {
        path: 'design',
        name: 'DesignerDesign',
        component: () => import('@/views/pages/designer/design/index.vue'),
        meta: {
            title: '设计作品',
        }
    },
    {
        path: 'design/edit',
        name: 'DesignerDesignEdit',
        component: () => import('@/views/pages/designer/design/edit.vue'),
        meta: {
            title: '编辑作品',
        }
    },
    {
        path: 'design/edit/:id',
        name: 'DesignerDesignEditById',
        component: () => import('@/views/pages/designer/design/edit.vue'),
        meta: {
            title: '编辑作品',
        }
    }
];

export default designerRoutes;

