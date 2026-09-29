// 启动服务器
const app = require('./app');
const { init } = require('./init_data');

console.log('服务器启动中...');
console.log('正在初始化测试数据...');

// 初始化测试数据
try {
    // 直接从fileRoutes模块获取fileDatabase
    const fileRoutes = require('./routes/fileRoutes');
    // 检查fileRoutes是否有fileDatabase属性或者从其导出的对象中获取
    let fileDatabase;
    
    // 尝试不同的方式获取fileDatabase
    if (fileRoutes && fileRoutes.fileDatabase) {
        fileDatabase = fileRoutes.fileDatabase;
    } else {
        // 动态获取module.exports中的fileDatabase
        const moduleExports = require('./routes/fileRoutes');
        // 遍历module.exports的所有属性来查找fileDatabase
        for (const key in moduleExports) {
            if (key === 'fileDatabase') {
                fileDatabase = moduleExports[key];
                break;
            }
        }
    }
    
    // 调用init函数并传递fileDatabase
    init(fileDatabase);
} catch (error) {
    console.warn('测试数据初始化时出现问题:', error);
}

console.log('请确保已配置 .env 文件中的必要参数');
console.log('后端API地址: http://localhost:3000');
console.log('\n可用API接口:');
console.log('  - 文件上传: POST /api/files/upload');
console.log('  - 获取文件列表: GET /api/files');
console.log('  - 搜索文件: GET /api/files/search?q=关键词');
console.log('  - 下载文件: GET /api/files/download/:id');
console.log('  - 预览文件: GET /api/files/preview/:id');
console.log('  - 智能问答: POST /api/chat/ask');
console.log('  - 获取快速问题: GET /api/chat/quick-questions');
console.log('\n前端页面已配置为调用这些API接口。');
console.log('请启动前端页面并尝试使用这些功能。');