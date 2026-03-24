import {defineStore} from "pinia";
import {ref, computed, watch, h} from "vue";
import {useRouter, useRoute} from "vue-router";
import {
    HomeOutlined,
    UserOutlined,
    AppstoreOutlined,
    FolderOutlined,
    BookOutlined,
    ExperimentOutlined,
    GiftOutlined,
    ShoppingOutlined, SettingFilled, AntDesignOutlined
} from "@ant-design/icons-vue";

export const useManagementMenuStore = defineStore("managementMenu", () => {
    const router = useRouter();
    const route = useRoute();

    const collapsed = ref(false);

    // 菜单结构
    const menuItems = ref([
            {
                key: "1", icon: () => h(HomeOutlined), label: "首页", routeName: "Home"
            },
            {
                key: "3", icon: () => h(UserOutlined), label: '房东管理', routeName: "LandlordManagement"
            },
            {
                key: "2", icon: () => h(SettingFilled), label: '设置', routeName: "Settings"
            },


        ]
    );

    // 递归根据 routeName 找完整 key 路径（包含父菜单key）
    function findMenuPathByRouteName(items: any[], routeName: string, path: string[] = []): string[] | null {
        for (const item of items) {
            if (item.routeName === routeName) {
                return [...path, item.key];
            }
            if (item.children) {
                const res = findMenuPathByRouteName(item.children, routeName, [...path, item.key]);
                if (res) return res;
            }
        }
        return null;
    }

    // 计算选中菜单 key（数组，只含最后一级菜单key）
    const selectedKeys = computed(() => {
        if (!route.name) return [];
        const keys = findMenuPathByRouteName(menuItems.value, String(route.name));
        return keys ? [keys[keys.length - 1]] : [];
    });

    // 控制展开的父菜单 key 数组
    const openKeys = ref<string[]>([]);

    // 跟踪路由变化，自动更新展开菜单
    watch(
        () => route.name,
        (newName) => {
            if (!newName) {
                openKeys.value = [];
                return;
            }
            const keys = findMenuPathByRouteName(menuItems.value, String(newName));
            if (keys) {
                openKeys.value = keys.slice(0, -1); // 父菜单 keys
            } else {
                openKeys.value = [];
            }
        },
        {immediate: true}
    );

    // 点击菜单跳转，递归找到 routeName
    function findRouteNameByKey(items: any[], key: string): string | null {
        for (const item of items) {
            if (item.key === key) return item.routeName || null;
            if (item.children) {
                const res = findRouteNameByKey(item.children, key);
                if (res) return res;
            }
        }
        return null;
    }

    const handleMenuClick = (info: {
        key: string
    }) => {
        const routeName = findRouteNameByKey(menuItems.value, info.key);
        if (routeName) {
            router.push({name: routeName});
        }
    };

    const toggleCollapsed = () => {
        collapsed.value = !collapsed.value;
    };

    return {
        collapsed,
        menuItems,
        selectedKeys,
        openKeys,
        handleMenuClick,
        toggleCollapsed,
    };
});
