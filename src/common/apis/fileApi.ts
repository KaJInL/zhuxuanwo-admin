/**
 * 文件相关 API 模块
 *
 * 提供统一的文件上传接口：
 * - upload: 上传文件到 OSS 并保存到数据库
 * - 支持秒传功能（通过文件 hash 识别重复文件）
 * - 自动文件类型验证
 */
import {http} from "@/plugin/axios";
import {IBaseResponse} from "@/common/apis/base/res";

/**
 * 文件 API 路径枚举
 */
enum FileApiEnum {
    /** 检查文件是否已上传 */
    CHECK_FILE = "/file/check",
    /** 保存上传的文件信息 */
    SAVE_FILE = "/file/save"
}

/**
 * 文件类型枚举
 * 支持的文件类型：
 * - 图片：JPG, PNG, GIF
 * - 文档：DOC, DOCX, PPT, PPTX, XLSX, PDF, TXT, CSV
 * - 视频：MP4
 */
export enum FileTypeEnum {
    // 图片类型
    JPG = "JPG",
    PNG = "PNG",
    GIF = "GIF",

    // 文档类型
    DOC = "DOC",
    DOCX = "DOCX",
    PPT = "PPT",
    PPTX = "PPTX",
    XLSX = "XLSX",
    PDF = "PDF",
    TXT = "TXT",
    CSV = "CSV",

    // 视频类型
    MP4 = "MP4"
}

/**
 * 文件信息
 */
export interface FileInfo {
    /** 文件完整访问 URL（格式：{baseUrl}/xxx/xx.jpg） */
    fileUrl: string
    /** 文件相对路径（格式：/xxx/xx.jpg） */
    path: string
}

/**
 * 文件检查响应
 */
export interface FileCheckResponse {
    /** 文件是否存在 */
    exists: boolean
    /** 文件信息（如果存在） */
    file?: FileInfo
    /** OSS 上传签名（如果不存在） */
    signature?: OssUploadSignatureRes
}

/**
 * OSS 上传签名响应
 */
export interface OssUploadSignatureRes {
    /** OSS Endpoint */
    endpoint: string
    /** OSS Bucket 名称 */
    bucketName: string
    /** 访问域名 */
    host: string
    /** 临时 AccessKey ID */
    accessKeyId: string
    /** 安全令牌 */
    securityToken: string
    /** 上传策略（Base64 编码的 JSON） */
    policy: string
    /** 签名 */
    signature: string
    /** 过期时间（Unix 时间戳，秒） */
    expiration: number
}

/**
 * 保存文件请求
 */
export interface SaveFileReq {
    /** 文件 hash 值 */
    fileHash: string
    /** 文件路径 */
    path: string
    /** 文件类型 */
    fileType: FileTypeEnum
    /** 文件大小（字节） */
    fileSize: number
    /** 文件名 */
    fileName: string
}

/**
 * OSS 上传结果
 */
export interface OssUploadResult {
    /** 文件访问 URL */
    url: string
    /** 文件在 OSS 中的 Object Key */
    objectKey: string
}

/**
 * 文件上传配置选项
 */
export interface FileUploadOptions {
    /** 进度回调函数 */
    onProgress?: (progress: number) => void
    /** 是否记录详细日志 */
    verbose?: boolean
}

/**
 * 检查文件是否已上传
 * 根据文件 hash 查询数据库，如果存在则返回文件路径，否则返回 STS 上传签名
 *
 * @param hash 文件 hash 值（如 MD5 或 SHA256）
 * @returns 文件检查响应，包含是否存在、文件路径或上传签名
 */
const checkFile = async (hash: string): Promise<IBaseResponse<FileCheckResponse>> => {
    return await http.get<FileCheckResponse>(
        FileApiEnum.CHECK_FILE,
        {hash}
    )
}

/**
 * 保存上传的文件信息
 *
 * @param req 保存文件请求
 * @returns 保存结果
 */
const saveFile = async (req: SaveFileReq): Promise<IBaseResponse<boolean>> => {
    return await http.post<boolean>(
        FileApiEnum.SAVE_FILE,
        req
    )
}

/**
 * 计算文件的 SHA-256 hash 值
 *
 * @param file 要计算 hash 的文件
 * @returns 文件的 SHA-256 hash 值（十六进制字符串）
 */
const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 根据文件扩展名获取文件类型枚举
 *
 * @param fileName 文件名
 * @returns 文件类型枚举，如果不支持则返回 null
 */
const getFileTypeFromName = (fileName: string): FileTypeEnum | null => {
    const ext = fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase()
    if (Object.values(FileTypeEnum).includes(ext as FileTypeEnum)) {
        return ext as FileTypeEnum
    }
    return null
}

/**
 * 检查文件类型是否支持
 *
 * @param fileName 文件名
 * @returns 是否支持该文件类型
 */
const isFileTypeSupported = (fileName: string): boolean => {
    return getFileTypeFromName(fileName) !== null
}


/**
 * 生成唯一文件名
 * @param originalName 原始文件名
 * @returns 唯一的文件名（时间戳_随机字符串.扩展名）
 */
const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    return `${timestamp}_${random}${ext}`;
}

/**
 * 解析 Policy 获取目录前缀
 * @param policy Base64 编码的 Policy
 * @param verbose 是否输出详细日志
 * @returns 目录前缀
 */
const parsePolicyDirectory = (policy: string, verbose: boolean = false): string => {
    let policyJson;

    try {
        policyJson = JSON.parse(atob(policy));
    } catch (e) {
        console.warn('无法解析 Policy:', e);
        return '';
    }

    // 从 Policy 条件中提取目录前缀
    const startsWithCondition = policyJson.conditions.find((c: any) =>
        Array.isArray(c) && c[0] === 'starts-with' && c[1] === '$key'
    );

    if (!startsWithCondition || startsWithCondition[2] === undefined) {
        return '';
    }

    const policyDir = startsWithCondition[2];

    // 如果 Policy 要求以 "/" 开头，这是错误的配置（OSS 不允许 objectKey 以 "/" 开头）
    if (policyDir === '/' || policyDir.startsWith('/')) {
        console.error('错误：Policy 要求以 "/" 开头，但 OSS 不允许 objectKey 以 "/" 开头。请检查后端配置。');
        console.error('建议：后端应该确保 defaultDir 不以 "/" 开头，例如使用 "uploads/" 而不是 "/" 或 "/uploads/"');
    }

    return policyDir;
}

/**
 * 生成 OSS Object Key
 * @param fileName 文件名
 * @param policyDir Policy 中的目录前缀
 * @param verbose 是否输出详细日志
 * @returns OSS Object Key
 */
const generateObjectKey = (fileName: string, policyDir: string, verbose: boolean = false): string => {
    let objectKey = generateObjectKeyWithPolicy(fileName, policyDir, verbose);

    // 最终验证：确保 objectKey 不以 "/" 开头（OSS 要求）
    if (objectKey.startsWith('/')) {
        objectKey = objectKey.substring(1);
        console.warn('警告：objectKey 以 "/" 开头，已自动移除');
    }

    // 确保 objectKey 有目录前缀（不能只是文件名）
    if (!objectKey.includes('/') || objectKey === fileName) {
        console.warn('警告：objectKey 缺少目录前缀，添加默认目录 "uploads/"');
        objectKey = `uploads/${fileName}`;
    }

    return objectKey;
}

/**
 * 根据 Policy 生成 Object Key
 * @param fileName 文件名
 * @param policyDir Policy 中的目录前缀
 * @param verbose 是否输出详细日志
 * @returns Object Key
 */
const generateObjectKeyWithPolicy = (fileName: string, policyDir: string, verbose: boolean): string => {
    // 如果没有 policyDir，使用日期作为后备方案
    if (!policyDir) {
        return generateFallbackObjectKey(fileName);
    }

    // 检查 Policy 是否要求以 "/" 开头（这是错误的配置）
    if (policyDir === '/' || (policyDir.startsWith('/') && policyDir.length === 1)) {
        throw new Error(
            '后端配置错误：Policy 要求 objectKey 以 "/" 开头，但 OSS 不允许 objectKey 以 "/" 开头。\n' +
            '请检查后端配置中的 defaultDir，应该使用 "uploads/" 而不是 "/" 或 "/uploads/"。\n' +
            '如果后端代码已更新，请重新编译并部署。'
        );
    }

    const normalizedPolicyDir = normalizePolicyDirectory(policyDir);
    const objectKey = `${normalizedPolicyDir}${fileName}`;

    return objectKey;
}

/**
 * 规范化 Policy 目录前缀
 * @param policyDir Policy 目录前缀
 * @returns 规范化后的目录前缀
 */
const normalizePolicyDirectory = (policyDir: string): string => {
    // 移除所有开头的 "/"
    let normalized = policyDir;
    while (normalized.startsWith('/')) {
        normalized = normalized.substring(1);
    }

    // 如果移除 "/" 后为空，说明 Policy 要求的是根目录 "/"
    // 这种情况下，我们使用默认目录 "uploads/" 而不是空字符串
    if (normalized === '') {
        console.warn('警告：Policy 要求根目录 "/"，使用默认目录 "uploads/"');
        return 'uploads/';
    }

    // 确保目录前缀以 "/" 结尾
    if (!normalized.endsWith('/')) {
        normalized = `${normalized}/`;
    }

    return normalized;
}

/**
 * 生成后备 Object Key（使用日期格式）
 * @param fileName 文件名
 * @returns Object Key
 */
const generateFallbackObjectKey = (fileName: string): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fallbackDir = `${year}${month}${day}/`;
    console.warn('警告：无法从 Policy 中提取目录前缀，使用后备方案：', fallbackDir);
    return `${fallbackDir}${fileName}`;
}

/**
 * 上传文件到 OSS 并保存到数据库
 *
 * 功能特性：
 * - 自动检查文件类型是否支持
 * - 计算文件 hash，实现秒传功能
 * - 如果文件已存在，直接返回已有文件的 URL
 * - 如果文件不存在，上传到 OSS 并保存到数据库
 *
 * @param file 要上传的文件
 * @param options 上传配置选项
 * @returns 文件访问 URL
 *
 * @example
 * ```typescript
 * const fileUrl = await fileApi.upload(file, {
 *   onProgress: (progress) => console.log(`上传进度: ${progress}%`),
 *   verbose: true
 * });
 * console.log('文件 URL:', fileUrl);
 * ```
 */
const upload = async (
    file: File,
    options: FileUploadOptions = {}
): Promise<{ fileUrl: string, path: string }> => {
    const {onProgress, verbose = false} = options;

    try {
        // 1. 检查文件类型是否支持
        const fileType = getFileTypeFromName(file.name)
        if (!fileType) {
            throw new Error(`不支持的文件类型: ${file.name}`)
        }

        // 2. 计算文件 hash
        onProgress?.(5);
        const fileHash = await calculateFileHash(file)


        // 3. 检查文件是否已上传（秒传）
        onProgress?.(10);
        const existingFileUrl = await checkExistingFile(fileHash, verbose, onProgress);
        if (existingFileUrl) return existingFileUrl;

        // 4. 文件不存在，执行上传流程
        const signature = await getUploadSignature(fileHash, onProgress, verbose);
        const ossFileRes = await uploadToOss(file, signature, verbose, onProgress);
        await saveFileToDatabase(file, fileHash, ossFileRes.fileUrl, fileType, signature, verbose, onProgress);

        onProgress?.(100);
        return {
            fileUrl: ossFileRes.fileUrl,
            path: ossFileRes.path
        };

    } catch (error: any) {
        console.error('上传失败:', error);
        throw error;
    }
}

/**
 * 检查文件是否已存在（实现秒传）
 * @param fileHash 文件 hash 值
 * @param verbose 是否输出详细日志
 * @param onProgress 进度回调
 * @returns 如果文件已存在，返回文件 URL；否则返回 null
 */
const checkExistingFile = async (
    fileHash: string,
    verbose: boolean,
    onProgress?: (progress: number) => void
): Promise<FileInfo | null> => {
    const checkResponse = await checkFile(fileHash);

    if (!checkResponse.succeed || !checkResponse.data) {
        const errorMsg = checkResponse.message || '检查文件失败';
        console.error('检查文件失败:', {
            succeed: checkResponse.succeed,
            message: checkResponse.message,
            data: checkResponse.data,
            fullResponse: checkResponse
        });
        throw new Error(errorMsg);
    }

    // 文件不存在，需要上传
    if (!checkResponse.data.exists || !checkResponse.data.file) {
        return null;
    }

    // 文件已存在，秒传成功
    onProgress?.(100);
    return checkResponse.data.file;
}

/**
 * 获取上传签名
 * @param fileHash 文件 hash 值
 * @param onProgress 进度回调
 * @param verbose 是否输出详细日志
 * @returns OSS 上传签名
 */
const getUploadSignature = async (
    fileHash: string,
    onProgress?: (progress: number) => void,
    verbose: boolean = false
): Promise<OssUploadSignatureRes> => {
    const checkResponse = await checkFile(fileHash);

    if (!checkResponse.succeed || !checkResponse.data) {
        const errorMsg = checkResponse.message || '检查文件失败';
        console.error('获取签名失败:', {
            succeed: checkResponse.succeed,
            message: checkResponse.message,
            data: checkResponse.data
        });
        throw new Error(errorMsg);
    }

    const signature = checkResponse.data.signature;
    if (!signature) {
        console.error('响应中没有签名信息:', checkResponse.data);
        throw new Error('获取上传签名失败：响应中没有签名信息');
    }

    onProgress?.(20);
    return signature;
}

/**
 * 上传文件到 OSS
 * @param file 要上传的文件
 * @param signature OSS 上传签名
 * @param verbose 是否输出详细日志
 * @param onProgress 进度回调
 * @returns 文件访问 URL
 */
const uploadToOss = async (
    file: File,
    signature: OssUploadSignatureRes,
    verbose: boolean,
    onProgress?: (progress: number) => void
): Promise<{ fileUrl: string, path: string }> => {
    // 1. 解析 Policy 获取目录前缀
    const policyDir = parsePolicyDirectory(signature.policy, verbose);

    // 2. 生成文件名和 Object Key
    const fileName = generateFileName(file.name);
    const objectKey = generateObjectKey(fileName, policyDir, verbose);

    onProgress?.(30);

    // 3. 构造 FormData（注意：字段顺序很重要，key 必须在最前面）
    const formData = new FormData();
    formData.append('key', objectKey);
    formData.append('policy', signature.policy);
    formData.append('OSSAccessKeyId', signature.accessKeyId);
    formData.append('x-oss-security-token', signature.securityToken);
    formData.append('signature', signature.signature);
    formData.append('success_action_status', '200');
    formData.append('file', file);

    // 4. 上传到 OSS
    const ossUrl = `https://${signature.bucketName}.${signature.endpoint}`;

    onProgress?.(40);

    const response = await fetch(ossUrl, {
        method: 'POST',
        body: formData,
        // 不要设置 Content-Type，让浏览器自动设置（包含 boundary）
    });

    onProgress?.(80);

    if (!response.ok) {
        throw new Error(await parseOssError(response, verbose));
    }

    // 5. 构建文件访问 URL
    return {
        fileUrl: `${signature.host}/${objectKey}`,
        path: `${objectKey}`
    };
}

/**
 * 解析 OSS 错误信息
 * @param response OSS 响应
 * @param verbose 是否输出详细日志
 * @returns 错误信息
 */
const parseOssError = async (response: Response, verbose: boolean): Promise<string> => {
    const errorText = await response.text();

    if (verbose) {
        console.error('OSS 上传失败:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            headers: Object.fromEntries(response.headers.entries())
        });
    }

    // 尝试解析 XML 错误信息
    let errorMessage = `上传失败: ${response.status} ${response.statusText}`;

    if (!errorText) {
        return errorMessage;
    }

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(errorText, 'text/xml');
        const codeElement = xmlDoc.querySelector('Code');
        const messageElement = xmlDoc.querySelector('Message');

        if (codeElement && messageElement) {
            errorMessage = `${codeElement.textContent}: ${messageElement.textContent}`;
        }
    } catch (e) {
        // 如果解析失败，使用原始错误文本
        if (errorText.length < 500) {
            errorMessage = errorText;
        }
    }

    return errorMessage;
}

/**
 * 保存文件信息到数据库
 * @param file 原始文件
 * @param fileHash 文件 hash 值
 * @param fileUrl 文件访问 URL
 * @param fileType 文件类型
 * @param signature OSS 上传签名
 * @param verbose 是否输出详细日志
 * @param onProgress 进度回调
 */
const saveFileToDatabase = async (
    file: File,
    fileHash: string,
    fileUrl: string,
    fileType: FileTypeEnum,
    signature: OssUploadSignatureRes,
    verbose: boolean,
    onProgress?: (progress: number) => void
): Promise<void> => {
    onProgress?.(90);

    // 从 fileUrl 中提取 objectKey
    const objectKey = fileUrl.replace(`${signature.host}/`, '');

    const saveFileReq: SaveFileReq = {
        fileHash: fileHash,
        path: objectKey,
        fileType: fileType,
        fileSize: file.size,
        fileName: file.name
    }

    const saveResponse = await saveFile(saveFileReq);

    if (!saveResponse.succeed) {
        console.warn('保存文件信息失败:', saveResponse.message);
        // 注意：即使保存失败，文件也已经上传成功，所以不抛出异常
    }
}

/**
 * 文件 API 接口集合
 */
export default {
    /** 上传文件（支持秒传，自动保存到数据库） */
    upload
}

