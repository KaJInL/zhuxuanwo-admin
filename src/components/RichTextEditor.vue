<template>
  <div class="w-editor-container">
    <!-- 工具栏 -->
    <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
    />
    <!-- 编辑器 -->
    <Editor
        style="height: 500px; overflow-y: hidden;"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
        @onChange="handleChange"
        @onDestroyed="handleDestroyed"
        @onFocus="handleFocus"
        @onBlur="handleBlur"
        @customAlert="customAlert"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'RichTextEditor'
})

import '@wangeditor/editor/dist/css/style.css' // 引入 css
import {onBeforeUnmount, ref, shallowRef, onMounted, watch, nextTick} from 'vue'
import {Editor, Toolbar} from '@wangeditor/editor-for-vue'
import {IDomEditor, IEditorConfig, IToolbarConfig} from '@wangeditor/editor'
import fileApi from '@/common/apis/fileApi'
import { message } from 'ant-design-vue'

interface Props {
  modelValue?: string
  placeholder?: string
  height?: string
  mode?: 'default' | 'simple'
  disabled?: boolean
  maxLength?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void

  (e: 'change', value: string): void

  (e: 'focus', editor: IDomEditor): void

  (e: 'blur', editor: IDomEditor): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  height: '500px',
  mode: 'default',
  disabled: false,
  maxLength: 0
})
const emit = defineEmits<Emits>()

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>()

// 内容 HTML
const valueHtml = ref('')

// 安全地处理初始内容
onMounted(() => {
  const initialValue = props.modelValue || ''
  // 确保初始值不为空，避免 Slate 解析错误
  valueHtml.value = initialValue.trim() === '' ? '<p><br></p>' : initialValue
})

// 监听父组件传入的值变化
watch(() => props.modelValue, (newValue) => {
  const safeNewValue = newValue || ''
  // 处理空内容，避免 Slate 解析错误
  const processedValue = safeNewValue.trim() === '' ? '<p><br></p>' : safeNewValue
  
  if (processedValue !== valueHtml.value) {
    valueHtml.value = processedValue
    
    // 如果编辑器已经创建，直接设置内容
    const editor = editorRef.value
    if (editor) {
      // 延迟设置，确保编辑器状态稳定
      nextTick(() => {
        try {
          editor.setHtml(processedValue)
        } catch (error) {
          console.warn('设置编辑器内容失败:', error)
          // 如果设置失败，使用默认空内容
          editor.setHtml('<p><br></p>')
        }
      })
    }
  }
})

// 工具栏配置
const toolbarConfig: Partial<IToolbarConfig> = {
  // 工具栏配置
  toolbarKeys: [
    // 菜单 key
    'headerSelect',
    'blockquote',
    '|',
    'bold',
    'underline',
    'italic',
    {
      key: 'group-more-style', // 必须包含 key ，且 key 需要以 group 开头
      title: '更多样式', // 必须包含 title
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>', // 可选
      menuKeys: ['through', 'code', 'sup', 'sub', 'clearStyle'] // 下级菜单 key ，必须包含 menuKeys
    },
    'color',
    'bgColor',
    '|',
    'fontSize',
    'fontFamily',
    'lineHeight',
    '|',
    'bulletedList',
    'numberedList',
    'todo',
    {
      key: 'group-justify', // 必须包含 key ，且 key 需要以 group 开头
      title: '对齐', // 必须包含 title
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>', // 可选
      menuKeys: ['justifyLeft', 'justifyRight', 'justifyCenter', 'justifyJustify'] // 下级菜单 key ，必须包含 menuKeys
    },
    {
      key: 'group-indent', // 必须包含 key ，且 key 需要以 group 开头
      title: '缩进', // 必须包含 title
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>', // 可选
      menuKeys: ['indent', 'delIndent'] // 下级菜单 key ，必须包含 menuKeys
    },
    '|',
    'emotion',
    'insertLink',
    {
      key: 'group-image', // 必须包含 key ，且 key 需要以 group 开头
      title: '图片', // 必须包含 title
      iconSvg: '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>', // 可选
      menuKeys: ['insertImage', 'uploadImage'] // 下级菜单 key ，必须包含 menuKeys
    },
    'insertVideo',
    'insertTable',
    'codeBlock',
    'divider',
    '|',
    'undo',
    'redo',
    '|',
    'fullScreen'
  ]
}

// 编辑器配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  maxLength: props.maxLength || undefined,
  // 菜单配置
  MENU_CONF: {
    // 配置颜色
    fontColor: {
      colors: ['#000000', '#eeece0', '#1c487f', '#4d80bf', '#c24f4a', '#8baa4a', '#7b5ba1', '#46acc8', '#f9963b', '#ffffff']
    },
    bgColor: {
      colors: ['#000000', '#eeece0', '#1c487f', '#4d80bf', '#c24f4a', '#8baa4a', '#7b5ba1', '#46acc8', '#f9963b', '#ffffff']
    },
    // 配置上传图片
    uploadImage: {
      // 自定义上传
      async customUpload(file: File, insertFn: Function) {
        try {
          const hideLoading = message.loading('图片上传中...', 0)
          
          const result = await fileApi.upload(file, {
            onProgress: (progress) => {
              // 富文本编辑器内部上传，进度显示在 loading 消息中
            }
          })

          hideLoading()
          message.success('图片上传成功')

          // 插入图片到编辑器
          insertFn(result.fileUrl, file.name, result.fileUrl)
        } catch (error) {
          console.error('图片上传失败:', error)
          message.error('图片上传失败，请重试')
        }
      }
    },
    // 配置上传视频
    uploadVideo: {
      // 自定义上传
      async customUpload(file: File, insertFn: Function) {
        try {
          const hideLoading = message.loading('视频上传中...', 0)
          
          const result = await fileApi.upload(file, {
            onProgress: (progress) => {
              // 富文本编辑器内部上传，进度显示在 loading 消息中
            }
          })

          hideLoading()
          message.success('视频上传成功')

          // 插入视频到编辑器
          insertFn(result.fileUrl)
        } catch (error) {
          console.error('视频上传失败:', error)
          message.error('视频上传失败，请重试')
        }
      }
    }
  }
}

const mode = ref(props.mode)

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor // 记录 editor 实例，重要！
  
  // 编辑器创建后，设置初始内容
  nextTick(() => {
    const currentValue = valueHtml.value || '<p><br></p>'
    try {
      editor.setHtml(currentValue)
    } catch (error) {
      console.warn('设置编辑器初始内容失败:', error)
      // 如果设置失败，使用默认空内容
      editor.setHtml('<p><br></p>')
    }
  })
}

function handleChange(editor: IDomEditor) {
  const safeValue = valueHtml.value || ''
  emit('update:modelValue', safeValue)
  emit('change', safeValue)
}

function handleDestroyed(editor: IDomEditor) {
}

function handleFocus(editor: IDomEditor) {
  emit('focus', editor)
}

function handleBlur(editor: IDomEditor) {
  emit('blur', editor)
}

function customAlert(info: string, type: string) {
  alert(`【自定义提示】${type} - ${info}`)
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// 获取编辑器内容（HTML格式）
const getHtml = () => {
  const editor = editorRef.value
  if (editor == null) return ''
  return editor.getHtml()
}

// 获取编辑器内容（纯文本格式）
const getText = () => {
  const editor = editorRef.value
  if (editor == null) return ''
  return editor.getText()
}

// 设置编辑器内容
const setHtml = (html: string) => {
  const editor = editorRef.value
  if (editor == null) return
  
  try {
    // 处理空内容
    const processedHtml = (html || '').trim() === '' ? '<p><br></p>' : html
    editor.setHtml(processedHtml)
  } catch (error) {
    console.warn('设置编辑器内容失败:', error)
    // 如果设置失败，使用默认空内容
    editor.setHtml('<p><br></p>')
  }
}

// 插入内容
const insertText = (text: string) => {
  const editor = editorRef.value
  if (editor == null) return
  editor.insertText(text)
}

// 设置编辑器是否可编辑
const enable = () => {
  const editor = editorRef.value
  if (editor == null) return
  editor.enable()
}

const disable = () => {
  const editor = editorRef.value
  if (editor == null) return
  editor.disable()
}

// 暴露方法给父组件
defineExpose({
  getHtml,
  getText,
  setHtml,
  insertText,
  enable,
  disable
})
</script>

<style scoped>
.w-editor-container {
  border: 1px solid #ccc;
  z-index: 100; /* 按需定义 */
}
</style>
