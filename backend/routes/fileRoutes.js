const express = require('express');
const multer = require('multer');
const path = require('path');
const fsAsync = require('fs').promises;
const fs = require('fs');
const router = express.Router();

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 确保待删除文件夹存在
const deletedDir = './deleted_files';
if (!fs.existsSync(deletedDir)) {
    fs.mkdirSync(deletedDir, { recursive: true });
}

// 配置Multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名，避免覆盖
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.xml', '.json'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 初始化Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// 从上传目录读取实际文件
const getFilesFromDirectory = async () => {
    try {
        const files = await fsAsync.readdir(uploadDir);
        
        const fileInfoList = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(uploadDir, filename);
                const stats = await fsAsync.stat(filePath);
                
                // 解析文件名，尝试从中提取信息
                let originalName = filename;
                let id = filename;
                
                // 尝试匹配之前的命名规则 fieldname-timestamp-random.ext
                const match = filename.match(/([^-]+)-(\d+)-\d+(\.[^.]+)$/);
                if (match) {
                    // 对于之前上传的文件，我们使用时间戳作为ID
                    id = match[2];
                }
                
                return {
                    id: id,
                    filename: originalName,
                    path: filePath,
                    mimetype: getMimeType(path.extname(filename)),
                    size: stats.size,
                    category: '安全监管', // 默认分类，实际项目中可以存储在数据库中
                    publishDate: new Date(stats.birthtime).toISOString().split('T')[0],
                    docNumber: `DOC-${id}`,
                    downloadCount: 0,
                    uploadDate: stats.birthtime
                };
            })
        );
        
        return fileInfoList;
    } catch (error) {
        console.error('读取文件目录失败:', error);
        return [];
    }
};

// 根据文件扩展名获取MIME类型
const getMimeType = (extension) => {
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.xml': 'application/xml',
        '.json': 'application/json'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

// 为了兼容旧代码，保留fileDatabase数组
const fileDatabase = [];
router.fileDatabase = fileDatabase;

// 上传文件
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有文件被上传' });
        }
        
        // 提取文件信息
        const fileInfo = {
            id: Date.now().toString(),
            filename: req.file.originalname,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            category: req.body.category || '安全监管',
            publishDate: new Date().toISOString().split('T')[0],
            docNumber: `DOC-${Date.now()}`,
            downloadCount: 0,
            uploadDate: new Date()
        };
        
        // 保存到模拟数据库
        fileDatabase.push(fileInfo);
        
        res.status(200).json({
            message: '文件上传成功',
            file: fileInfo
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取所有文件
router.get('/', async (req, res) => {
    try {
        const files = await getFilesFromDirectory();
        res.status(200).json({
            files: files,
            total: files.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 搜索文件
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = req.query.category || '';
        
        // 从实际文件夹获取文件列表
        const files = await getFilesFromDirectory();
        let results = files;
        
        // 根据查询关键词过滤
        if (query) {
            results = results.filter(file => 
                file.filename.toLowerCase().includes(query.toLowerCase()) ||
                file.docNumber.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // 根据分类过滤
        if (category) {
            results = results.filter(file => 
                file.category === category
            );
        }
        
        res.status(200).json({
            files: results,
            total: results.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 下载文件
router.get('/download/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        let foundFile = null;
        
        // 读取所有子文件夹和根目录的文件
        const uploadDirPath = path.resolve(uploadDir);
        
        // 递归搜索函数
        async function searchFiles(dir) {
            try {
                const items = await fsAsync.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    
                    if (item.isDirectory()) {
                        // 递归搜索子文件夹
                        const result = await searchFiles(fullPath);
                        if (result) {
                            return result;
                        }
                    } else {
                        // 检查是否为目标文件
                        // 1. 首先尝试使用文件名匹配（更可靠）
                        if (item.name.includes(fileId)) {
                            const stats = await fsAsync.stat(fullPath);
                            return {
                                id: fileId,
                                filename: item.name,
                                path: fullPath,
                                mimetype: getMimeType(path.extname(item.name)),
                                size: stats.size,
                                category: path.basename(path.dirname(fullPath)) === path.basename(uploadDirPath) ? '根目录' : path.basename(path.dirname(fullPath)),
                                publishDate: new Date(stats.birthtime).toISOString().split('T')[0],
                                docNumber: `DOC-${Date.now()}`,
                                downloadCount: 0,
                                uploadDate: stats.birthtime
                            };
                        }
                    }
                }
                return null;
            } catch (error) {
                console.error('搜索文件时出错:', error);
                return null;
            }
        }
        
        // 开始搜索
        foundFile = await searchFiles(uploadDirPath);
        
        // 如果没找到，尝试备选方案：通过序号查找第一个匹配的文件
        if (!foundFile && !isNaN(fileId)) {
            const fileIndex = parseInt(fileId) - 1;
            if (fileIndex >= 0) {
                // 获取所有文件并按名称排序
                let allFiles = [];
                
                // 递归收集所有文件
                async function collectFiles(dir) {
                    const items = await fsAsync.readdir(dir, { withFileTypes: true });
                    for (const item of items) {
                        const fullPath = path.join(dir, item.name);
                        if (item.isDirectory()) {
                            await collectFiles(fullPath);
                        } else {
                            const stats = await fsAsync.stat(fullPath);
                            allFiles.push({
                                path: fullPath,
                                filename: item.name,
                                birthtime: stats.birthtime
                            });
                        }
                    }
                }
                
                await collectFiles(uploadDirPath);
                
                // 按创建时间排序
                allFiles.sort((a, b) => b.birthtime - a.birthtime);
                
                if (fileIndex < allFiles.length) {
                    const file = allFiles[fileIndex];
                    foundFile = {
                        id: fileId,
                        filename: file.filename,
                        path: file.path,
                        mimetype: getMimeType(path.extname(file.filename)),
                        size: (await fsAsync.stat(file.path)).size,
                        category: path.basename(path.dirname(file.path)) === path.basename(uploadDirPath) ? '根目录' : path.basename(path.dirname(file.path)),
                        publishDate: new Date(file.birthtime).toISOString().split('T')[0],
                        docNumber: `DOC-${Date.now()}`,
                        downloadCount: 0,
                        uploadDate: file.birthtime
                    };
                }
            }
        }
        
        if (!foundFile) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 检查文件是否存在
        const fileExists = await fsAsync.stat(foundFile.path)
            .then(() => true)
            .catch(() => false);
        
        if (!fileExists) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 下载文件
        res.download(foundFile.path, foundFile.filename, (err) => {
            if (err) {
                console.error('下载文件失败:', err);
                res.status(500).json({ error: '下载文件失败' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 预览文件（对于PDF等浏览器支持的文件类型）
router.get('/preview/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        
        // 首先尝试从分类文件中查找（包括子文件夹）
        const categorizedFiles = await getFilesByCategory();
        let foundFile = null;
        
        // 遍历所有分类查找文件
        for (const category in categorizedFiles) {
            const filesInCategory = categorizedFiles[category];
            const file = filesInCategory.find(f => f.id === fileId);
            if (file) {
                foundFile = file;
                break;
            }
        }
        
        // 如果在分类中没找到，再尝试从根目录查找
        if (!foundFile) {
            const rootFiles = await getFilesFromDirectory();
            foundFile = rootFiles.find(f => f.id === fileId);
        }
        
        if (!foundFile) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 检查文件是否存在
        const fileExists = await fsAsync.stat(foundFile.path)
            .then(() => true)
            .catch(() => false);
        
        if (!fileExists) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 设置Content-Type
        res.setHeader('Content-Type', foundFile.mimetype);
        // 对于PDF文件，设置为inline以在浏览器中显示
        if (foundFile.mimetype === 'application/pdf') {
            res.setHeader('Content-Disposition', `inline; filename="${foundFile.filename}"`);
        }
        
        // 读取并发送文件
        fs.createReadStream(foundFile.path).pipe(res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除文件（移至待删除文件夹）
router.delete('/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        
        // 首先尝试从分类文件中查找（包括子文件夹）
        const categorizedFiles = await getFilesByCategory();
        let foundFile = null;
        
        // 遍历所有分类查找文件
        for (const category in categorizedFiles) {
            const filesInCategory = categorizedFiles[category];
            const file = filesInCategory.find(f => f.id === fileId);
            if (file) {
                foundFile = file;
                break;
            }
        }
        
        // 如果在分类中没找到，再尝试从根目录查找
        if (!foundFile) {
            const rootFiles = await getFilesFromDirectory();
            foundFile = rootFiles.find(f => f.id === fileId);
        }
        
        if (!foundFile) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 检查文件是否存在
        const fileExists = await fsAsync.stat(foundFile.path)
            .then(() => true)
            .catch(() => false);
        
        if (!fileExists) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 构建新的文件名，避免冲突
        const timestamp = Date.now();
        const extension = path.extname(foundFile.filename);
        const newFilename = `${path.basename(foundFile.filename, extension)}_${timestamp}${extension}`;
        const deletedFilePath = path.join(deletedDir, newFilename);
        
        // 将文件移动到待删除文件夹
        await fsAsync.rename(foundFile.path, deletedFilePath);
        
        // 同时更新模拟数据库（如果存在的话）
        const index = fileDatabase.findIndex(f => f.id === fileId);
        if (index !== -1) {
            fileDatabase.splice(index, 1);
        }
        
        res.status(200).json({
            message: '文件已删除',
            fileName: foundFile.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取文件夹结构和按分类的文件列表
router.get('/category-structure', async (req, res) => {
    try {
        // 读取uploads目录下的所有子文件夹
        const categories = await getFilesByCategory();
        
        res.status(200).json({
            categories: categories,
            totalCategories: Object.keys(categories).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 按子文件夹分类获取文件
const getFilesByCategory = async () => {
    try {
        // 读取uploads目录内容
        const items = await fsAsync.readdir(uploadDir, { withFileTypes: true });
        const categorizedFiles = {};
        
        // 处理每个子文件夹
        for (const item of items) {
            // 只处理目录
            if (item.isDirectory()) {
                const categoryName = item.name;
                const categoryPath = path.join(uploadDir, categoryName);
                
                // 读取子文件夹中的文件
                const files = await fsAsync.readdir(categoryPath);
                const fileInfos = await Promise.all(
                    files.map(async (filename) => {
                        const filePath = path.join(categoryPath, filename);
                        const stats = await fsAsync.stat(filePath);
                        
                        // 只处理文件，跳过子目录
                        if (stats.isFile()) {
                            // 解析文件名，尝试从中提取信息
                            let id = Date.now() + '-' + Math.round(Math.random() * 1E9);
                            
                            // 尝试匹配之前的命名规则 fieldname-timestamp-random.ext
                            const match = filename.match(/([^-]+)-(\d+)-\d+(\.[^.]+)$/);
                            if (match) {
                                // 对于之前上传的文件，我们使用时间戳作为ID
                                id = match[2];
                            }
                            
                            return {
                                id: id,
                                filename: filename,
                                path: filePath,
                                mimetype: getMimeType(path.extname(filename)),
                                size: stats.size,
                                category: categoryName,
                                publishDate: new Date(stats.birthtime).toISOString().split('T')[0],
                                docNumber: `${categoryName.replace(/[^a-zA-Z0-9]/g, '')}-${id}`,
                                downloadCount: 0,
                                uploadDate: stats.birthtime
                            };
                        }
                        return null;
                    })
                );
                
                // 过滤掉null值（非文件项）
                const validFiles = fileInfos.filter(file => file !== null);
                
                if (validFiles.length > 0) {
                    categorizedFiles[categoryName] = validFiles;
                }
            }
        }
        
        // 检查根目录中是否有文件（不在任何子文件夹中）
        const rootFiles = [];
        for (const item of items) {
            if (item.isFile()) {
                const filePath = path.join(uploadDir, item.name);
                const stats = await fsAsync.stat(filePath);
                
                let id = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const match = item.name.match(/([^-]+)-(\d+)-\d+(\.[^.]+)$/);
                if (match) {
                    id = match[2];
                }
                
                rootFiles.push({
                    id: id,
                    filename: item.name,
                    path: filePath,
                    mimetype: getMimeType(path.extname(item.name)),
                    size: stats.size,
                    category: '根目录',
                    publishDate: new Date(stats.birthtime).toISOString().split('T')[0],
                    docNumber: `ROOT-${id}`,
                    downloadCount: 0,
                    uploadDate: stats.birthtime
                });
            }
        }
        
        // 如果根目录有文件，添加到分类中
        if (rootFiles.length > 0) {
            categorizedFiles['根目录'] = rootFiles;
        }
        
        return categorizedFiles;
    } catch (error) {
        console.error('读取文件分类失败:', error);
        return {};
    }
};

module.exports = router;