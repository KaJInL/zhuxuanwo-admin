import {defineStore} from "pinia";
import {ref, computed} from "vue";
import confApi, {type SysConfItem} from "@/common/apis/system/confApi";
import {SysConfKeyEnum} from "@/common/enums/sysConfKeyEnum";

/**
 * 系统配置状态管理 Store
 * 用于管理系统配置的加载、查询和更新
 */
export const useSysConfStore = defineStore("sysConf", () => {
    
    // ==================== 状态 ====================
    
    /** 系统配置列表 */
    const confList = ref<SysConfItem[]>([]);
    
    /** 是否正在加载配置列表 */
    const loading = ref(false);
    
    /** 配置列表加载错误 */
    const error = ref<string | null>(null);
    
    
    // ==================== 计算属性 ====================
    
    /** 配置项映射表（key -> SysConfItem），便于快速查找 */
    const confMap = computed<Record<string, SysConfItem>>(() => {
        const map: Record<string, SysConfItem> = {};
        confList.value.forEach(item => {
            map[item.sysKey] = item;
        });
        return map;
    });
    
    
    // ==================== 方法 ====================
    
    /**
     * 加载系统配置列表
     * @param forceRefresh - 是否强制刷新（忽略缓存）
     * @returns 是否加载成功
     */
    const loadSysconfList = async (forceRefresh = false): Promise<boolean> => {
        // 如果已有配置列表且不强制刷新，直接返回
        if (confList.value.length > 0 && !forceRefresh) {
            return true;
        }
        
        try {
            loading.value = true;
            error.value = null;
            
            const response = await confApi.getAllSysConf();
            
            if (response.succeed && response.data?.list) {
                confList.value = response.data.list;
                return true;
            } else {
                error.value = response.message || '加载系统配置失败';
                return false;
            }
        } catch (err: any) {
            console.error('加载系统配置失败:', err);
            error.value = err.message || '加载系统配置失败';
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 根据配置键获取配置项
     * @param key - 配置键枚举值
     * @returns 配置项，如果不存在则返回 null
     */
    const getConfByKey = (key: SysConfKeyEnum): SysConfItem | null => {
        // 如果配置列表为空，尝试加载
        if (confList.value.length === 0) {
            console.warn('配置列表为空，请先调用 loadSysconfList 加载配置');
            return null;
        }
        
        return confMap.value[key] || null;
    };
    
    /**
     * 根据配置键获取配置值
     * @param key - 配置键枚举值
     * @returns 配置值，如果不存在则返回 null
     */
    const getConfValueByKey = (key: SysConfKeyEnum): string | null => {
        const conf = getConfByKey(key);
        return conf?.sysValue || null;
    };
    
    /**
     * 更新系统配置
     * @param key - 配置键枚举值
     * @param value - 新的配置值
     * @returns 是否更新成功
     */
    const updateConf = async (key: SysConfKeyEnum, value: string): Promise<boolean> => {
        try {
            loading.value = true;
            error.value = null;
            
            // 先获取当前配置项
            const currentConf = getConfByKey(key);
            
            // 构建更新数据
            const updateData: SysConfItem = {
                sysKey: key,
                sysValue: value,
            };
            
            const response = await confApi.updateSysConf(updateData);
            
            if (response.succeed) {
                // 更新本地配置列表
                const index = confList.value.findIndex(item => item.sysKey === key);
                if (index !== -1) {
                    confList.value[index] = updateData;
                } else {
                    confList.value.push(updateData);
                }
                return true;
            } else {
                error.value = response.message || '更新系统配置失败';
                return false;
            }
        } catch (err: any) {
            console.error('更新系统配置失败:', err);
            error.value = err.message || '更新系统配置失败';
            return false;
        } finally {
            loading.value = false;
        }
    };
    
    /**
     * 清除配置列表
     */
    const clearConfList = () => {
        confList.value = [];
        error.value = null;
    };
    
    
    return {
        // 状态
        confList,
        loading,
        error,
        
        // 计算属性
        confMap,
        
        // 方法
        loadSysconfList,
        getConfByKey,
        getConfValueByKey,
        updateConf,
        clearConfList,
    };
});

