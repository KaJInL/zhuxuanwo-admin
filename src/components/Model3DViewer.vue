<script setup lang="ts">

import { ref, shallowRef, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface Props {
  modelUrl?: string
  autoResize?: boolean
  showControls?: boolean
  backgroundColor?: string
  cameraPosition?: [number, number, number]
  defaultView?: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'diagonal'
  // 新增属性用于控制模型显示
  modelRotation?: [number, number, number] // 模型旋转角度 [x, y, z]
  doubleSided?: boolean // 是否启用双面渲染
  autoRotateModel?: boolean // 是否自动修复Blender坐标系
  // 位置偏移参数
  positionOffset?: [number, number, number] // 模型位置偏移 [x, y, z]
}

interface Emits {
  (e: 'load-start'): void
  (e: 'load-success'): void
  (e: 'load-error', error: string): void
  (e: 'ready'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelUrl: '',
  autoResize: true,
  showControls: true,
  backgroundColor: '#2a2a2a',
  cameraPosition: () => [1, 1, 1],
  defaultView: 'front',
  modelRotation: () => [0, 0, 0],
  doubleSided: true,
  autoRotateModel: false,
  positionOffset: () => [0, 0, 0]
})

const emit = defineEmits<Emits>()

// 状态管理
const loading = ref(false)
const error = ref('')
const isReady = ref(false)

// Three.js 相关 - 使用shallowRef避免深度响应式代理
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const scene = shallowRef<THREE.Scene>()
const camera = shallowRef<THREE.PerspectiveCamera>()
const renderer = shallowRef<THREE.WebGLRenderer>()
const controls = shallowRef<OrbitControls>()
const currentModel = shallowRef<THREE.Group>()
const animationId = ref<number>()

// 事件监听器管理
const eventListeners = ref<Array<{ element: HTMLElement, type: string, listener: EventListener, options?: any }>>([])

// 添加事件监听器的辅助函数
const addEventListenerWithCleanup = (element: HTMLElement, type: string, listener: EventListener, options?: any) => {
  element.addEventListener(type, listener, options)
  eventListeners.value.push({ element, type, listener, options })
}

// 防抖定时器
const resizeTimer = ref<number>()

// 尺寸更新 - 添加防抖优化
const updateSize = () => {
  if (!containerRef.value || !renderer.value || !camera.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  
  if (width > 0 && height > 0) {
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }
}

// 防抖版本的尺寸更新
const debouncedUpdateSize = () => {
  if (resizeTimer.value) {
    clearTimeout(resizeTimer.value)
  }
  resizeTimer.value = window.setTimeout(() => {
    updateSize()
  }, 16) // ~60fps
}

// ResizeObserver for responsive sizing
const resizeObserver = ref<ResizeObserver>()

// 初始化 Three.js 场景
const initThreeJS = async () => {
  if (!containerRef.value) {
    error.value = 'Container元素未找到，无法初始化3D预览'
    return false
  }

  try {
    // 检查WebGL支持
    const testCanvas = document.createElement('canvas')
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
    if (!gl) {
      error.value = '浏览器不支持WebGL，无法显示3D模型'
      return false
    }

    // 创建场景
    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color(props.backgroundColor)

    // 获取容器尺寸
    const rect = containerRef.value.getBoundingClientRect()
    const width = rect.width || 400
    const height = rect.height || 400

    // 创建相机
    camera.value = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.value.position.set(...props.cameraPosition)

    // 创建Canvas元素
    const canvas = document.createElement('canvas')
    canvasRef.value = canvas
    containerRef.value.appendChild(canvas)

    // 创建渲染器
    renderer.value = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      antialias: true,
      alpha: false 
    })
    
    renderer.value.setSize(width, height)
    renderer.value.shadowMap.enabled = true
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1.0
    
    // 创建优雅黑金渐变背景
    const bgGeometry = new THREE.SphereGeometry(100, 32, 32)
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0xf5f5dc) },
        bottomColor: { value: new THREE.Color(0x2c2c2c) },
        offset: { value: 30 },
        exponent: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    })
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    scene.value.add(bgMesh)

    // 添加控制器
    if (props.showControls) {
      controls.value = new OrbitControls(camera.value, renderer.value.domElement)
      controls.value.enableDamping = true
      controls.value.dampingFactor = 0.25
      controls.value.enableZoom = true
      controls.value.autoRotate = false

      // 阻止右键拖拽触发浏览器前进/后退手势
      // 这在某些浏览器（如Chrome）中很重要，避免右键拖拽时触发前进/后退手势
      const canvasElement = renderer.value.domElement
      
      // 阻止右键菜单
      addEventListenerWithCleanup(canvasElement, 'contextmenu', (e: Event) => {
        e.preventDefault()
      })
      
      // 阻止鼠标手势导航
      addEventListenerWithCleanup(canvasElement, 'mousedown', (e: Event) => {
        const mouseEvent = e as MouseEvent
        // 右键按下时阻止默认行为
        if (mouseEvent.button === 2) {
          console.debug('Model3DViewer: Right mouse button detected, preventing default behavior')
          e.preventDefault()
          e.stopPropagation()
        }
      })
      
      addEventListenerWithCleanup(canvasElement, 'mousemove', (e: Event) => {
        const mouseEvent = e as MouseEvent
        // 右键拖拽时阻止默认行为
        if (mouseEvent.buttons === 2) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
      
      addEventListenerWithCleanup(canvasElement, 'mouseup', (e: Event) => {
        const mouseEvent = e as MouseEvent
        // 右键释放时阻止默认行为
        if (mouseEvent.button === 2) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
      
      // 阻止触摸手势导航（移动端）
      addEventListenerWithCleanup(canvasElement, 'touchstart', (e: Event) => {
        const touchEvent = e as TouchEvent
        if (touchEvent.touches.length === 2) {
          e.preventDefault()
        }
      }, { passive: false })
      
      addEventListenerWithCleanup(canvasElement, 'touchmove', (e: Event) => {
        const touchEvent = e as TouchEvent
        if (touchEvent.touches.length === 2) {
          e.preventDefault()
        }
      }, { passive: false })
    }

    // 添加光源 - 自然光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.value.add(ambientLight)

    // 主光源 - 自然日光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.value.add(directionalLight)
    
    // 补光灯 - 柔和白光
    const fillLight = new THREE.DirectionalLight(0xf0f0f0, 0.5)
    fillLight.position.set(-10, 5, -5)
    scene.value.add(fillLight)
    
    // 顶部光源 - 天空光
    const topLight = new THREE.DirectionalLight(0xf5f5f5, 0.4)
    topLight.position.set(0, 15, 0)
    scene.value.add(topLight)
    
    // 底部光源 - 提亮地板
    const bottomLight = new THREE.DirectionalLight(0xfafafa, 0.3)
    bottomLight.position.set(0, -10, 0)
    scene.value.add(bottomLight)

    // 设置响应式尺寸
    resizeObserver.value = new ResizeObserver(() => {
      if (props.autoResize) {
        debouncedUpdateSize()
      }
    })
    resizeObserver.value.observe(containerRef.value)

    // 开始渲染循环
    animate()
    
    isReady.value = true
    emit('ready')
    return true
    
  } catch (err) {
    let errorMessage = '3D 预览初始化失败'
    const errorMsg = (err as Error)?.message || ''
    if (errorMsg.includes('WebGL')) {
      errorMessage = 'WebGL初始化失败，请检查浏览器支持'
    } else if (errorMsg.includes('canvas')) {
      errorMessage = 'Canvas初始化失败'
    } else if (errorMsg.includes('context')) {
      errorMessage = '渲染上下文创建失败'
    }
    
    error.value = errorMessage
    return false
  }
}

// 根据视角获取相机位置
const getCameraPosition = (view: string, distance: number): [number, number, number] => {
  switch (view) {
    case 'front':
      return [0, 0, distance]
    case 'back':
      return [0, 0, -distance]
    case 'left':
      return [-distance, 0, 0]
    case 'right':
      return [distance, 0, 0]
    case 'top':
      return [0, distance, 0]
    case 'bottom':
      return [0, -distance, 0]
    case 'diagonal':
    default:
      return [distance, distance, distance]
  }
}

// 动画循环
const animate = () => {
  if (!renderer.value || !scene.value || !camera.value) {
    return
  }

  animationId.value = requestAnimationFrame(animate)
  
  // 获取实际的Three.js对象引用，避免响应式代理问题
  const controlsInstance = controls.value
  const rendererInstance = renderer.value
  const sceneInstance = scene.value
  const cameraInstance = camera.value
  
  if (controlsInstance) {
    controlsInstance.update()
  }
  
  try {
    if (rendererInstance && sceneInstance && cameraInstance) {
      rendererInstance.render(sceneInstance, cameraInstance)
    }
  } catch (error) {
    // 静默处理渲染错误
  }
}

// 加载 3D 模型
const loadModel = async (url: string) => {
  const sceneInstance = scene.value
  if (!sceneInstance || !url) return

  try {
    loading.value = true
    error.value = ''
    emit('load-start')

    // 清除之前的模型
    if (currentModel.value) {
      sceneInstance.remove(currentModel.value)
      currentModel.value = undefined
    }

    const loader = new GLTFLoader()
    
    loader.load(
      url,
      (gltf) => {
        currentModel.value = gltf.scene
        sceneInstance.add(currentModel.value)

        // 计算模型边界盒，调整相机位置
        const box = new THREE.Box3().setFromObject(currentModel.value)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        // 调整模型位置到原点
        currentModel.value.position.sub(center)
        
        // 应用位置偏移
        const [offsetX, offsetY, offsetZ] = props.positionOffset
        currentModel.value.position.add(new THREE.Vector3(offsetX, offsetY, offsetZ))

        // 应用模型旋转设置
        if (props.autoRotateModel) {
          // 修复Blender导出模型的朝向问题
          // Blender通常以Z轴向上导出，而Three.js默认Y轴向上
          currentModel.value.rotation.x = -Math.PI / 2 // 将Z轴向上转换为Y轴向上
        }
        
        // 应用自定义旋转
        const [rotX, rotY, rotZ] = props.modelRotation
        currentModel.value.rotation.x += rotX
        currentModel.value.rotation.y += rotY
        currentModel.value.rotation.z += rotZ

        // 设置材质双面渲染，解决背面显示问题
        if (props.doubleSided) {
          currentModel.value.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              // 确保材质支持双面渲染
              if (Array.isArray(child.material)) {
                child.material.forEach(material => {
                  material.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          })
        }

        // 根据模型大小调整相机距离，让模型显示更大
        const maxDim = Math.max(size.x, size.y, size.z)
        const cameraInstance = camera.value!
        const fov = cameraInstance.fov * (Math.PI / 180)
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.4

        // 根据设置的默认视角计算相机位置
        const [x, y, z] = getCameraPosition(props.defaultView, cameraDistance)
        cameraInstance.position.set(x, y, z)
        cameraInstance.lookAt(0, 0, 0)

        const controlsInstance = controls.value
        if (controlsInstance) {
          controlsInstance.target.set(0, 0, 0)
          controlsInstance.update()
        }

        loading.value = false
        emit('load-success')
      },
      (progress) => {
        // 静默处理加载进度
      },
      (loadError: unknown) => {
        const err = loadError as Error
        
        let errorMessage = '3D 模型加载失败'
        const errorMsg = err?.message || ''
        if (errorMsg.includes('CORS')) {
          errorMessage = '跨域请求被阻止，请检查服务器CORS设置'
        } else if (errorMsg.includes('404')) {
          errorMessage = '模型文件不存在或路径错误'
        } else if (errorMsg.includes('NetworkError')) {
          errorMessage = '网络连接失败，请检查网络状态'
        }
        
        error.value = errorMessage
        loading.value = false
        emit('load-error', errorMessage)
      }
    )
  } catch (err) {
    const errorMessage = '3D 模型加载失败'
    error.value = errorMessage
    loading.value = false
    emit('load-error', errorMessage)
  }
}

// 停止动画循环
const stopAnimation = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = undefined
  }
}

// 清理Three.js资源
const cleanup3DResources = () => {
  stopAnimation()
  
  // 清理防抖定时器
  if (resizeTimer.value) {
    clearTimeout(resizeTimer.value)
    resizeTimer.value = undefined
  }
  
  // 清理事件监听器
  eventListeners.value.forEach(({ element, type, listener, options }) => {
    element.removeEventListener(type, listener, options)
  })
  eventListeners.value = []
  
  // 停止ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = undefined
  }
  
  const sceneInstance = scene.value
  if (currentModel.value && sceneInstance) {
    sceneInstance.remove(currentModel.value)
    currentModel.value = undefined
  }
  
  if (controls.value) {
    controls.value.dispose()
    controls.value = undefined
  }
  
  if (renderer.value) {
    renderer.value.dispose()
    renderer.value = undefined
  }
  
  // 清理Canvas元素
  if (canvasRef.value && containerRef.value) {
    containerRef.value.removeChild(canvasRef.value)
    canvasRef.value = undefined
  }
  
  scene.value = undefined
  camera.value = undefined
  error.value = ''
  isReady.value = false
}

// 暴露的方法
defineExpose({
  loadModel,
  cleanup: cleanup3DResources,
  updateSize,
  isReady: () => isReady.value,
  hasError: () => !!error.value,
  isLoading: () => loading.value
})

// 监听模型 URL 变化
watch(() => props.modelUrl, (newUrl) => {
  if (newUrl && isReady.value) {
    loadModel(newUrl)
  }
}, { immediate: false })

// 监听背景色变化
watch(() => props.backgroundColor, (newColor) => {
  if (scene.value && isReady.value) {
    scene.value.background = new THREE.Color(newColor)
  }
}, { immediate: false })

// 监听 autoResize 属性变化，当从 false 变为 true 时手动触发一次尺寸更新
watch(() => props.autoResize, (newAutoResize, oldAutoResize) => {
  if (newAutoResize && !oldAutoResize && isReady.value) {
    // 延迟一点确保DOM已更新
    nextTick(() => {
      updateSize()
    })
  }
}, { immediate: false })

// 组件挂载和卸载
onMounted(() => {
  nextTick(async () => {
    const success = await initThreeJS()
    if (success && props.modelUrl) {
      loadModel(props.modelUrl)
    }
  })
})

onUnmounted(() => {
  cleanup3DResources()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative">
    <!-- 加载状态 -->
    <div v-if="loading" class="absolute inset-0 bg-slate-900 bg-opacity-95 flex items-center justify-center rounded-lg z-10">
      <div class="relative">
        <!-- 简化的loading动画 - 只有转圈圈 -->
        <div class="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="absolute inset-0 bg-slate-900 bg-opacity-95 flex items-center justify-center rounded-lg z-10">
      <div class="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-red-500/30 text-center">
        <div class="text-3xl mb-4">⚠️</div>
        <div class="text-red-400 text-lg font-medium mb-2">模型加载失败</div>
        <div class="text-red-300 text-sm">{{ error }}</div>
      </div>
    </div>


  </div>
</template>

<style scoped lang="scss">
.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}
</style>
