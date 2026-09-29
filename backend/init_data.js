// 初始化测试数据
const fs = require('fs');
const path = require('path');

// 确保上传目录存在
function createUploadsDir() {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
        console.log('创建上传目录成功');
    }
}

// 创建测试文件并添加到数据库
function createTestFiles(fileDatabase) {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // 清空文件数据库
    fileDatabase.length = 0;
    
    // 测试文件内容
    const testFiles = [
        {
            name: '电力安全操作规程.pdf',
            content: Buffer.from('这是电力安全操作规程测试文件内容。\n\n1. 总则\n2. 安全工作规程\n3. 操作规范\n4. 事故处理\n5. 附则'),
            category: '安全监管',
            publishDate: '2023-06-15',
            docNumber: 'DL-2023-001',
            downloadCount: 156
        },
        {
            name: '电网调度管理条例.docx',
            content: Buffer.from('这是电网调度管理条例测试文件内容。\n\n1. 调度管理体制\n2. 调度计划\n3. 调度命令\n4. 调度系统\n5. 监督管理'),
            category: '调度管理',
            publishDate: '2023-05-20',
            docNumber: 'DL-2023-002',
            downloadCount: 98
        },
        {
            name: '电力设备维护指南.xlsx',
            content: Buffer.from('这是电力设备维护指南测试文件内容。\n\n设备类型,维护周期,维护项目\n变压器,1年,绝缘测试\n断路器,半年,机械特性测试\n线路,2年,杆塔检查\n电容器,1年,容量测试'),
            category: '设备管理',
            publishDate: '2023-04-10',
            docNumber: 'DL-2023-003',
            downloadCount: 210
        }
    ];
    
    // 创建测试文件并添加到数据库
    testFiles.forEach((file, index) => {
        const filePath = path.join(uploadsDir, file.name);
        fs.writeFileSync(filePath, file.content);
        
        // 获取文件信息
        const stats = fs.statSync(filePath);
        
        // 添加到数据库
        const fileInfo = {
            id: (Date.now() + index).toString(),
            filename: file.name,
            path: filePath,
            mimetype: 'application/octet-stream', // 简化处理
            size: stats.size,
            category: file.category,
            publishDate: file.publishDate,
            docNumber: file.docNumber,
            downloadCount: file.downloadCount,
            uploadDate: new Date()
        };
        
        fileDatabase.push(fileInfo);
        console.log(`创建测试文件 ${index + 1}: ${file.name}`);
    });
}

// 运行初始化
function init(fileDatabase = null) {
    try {
        console.log('开始初始化测试数据...');
        createUploadsDir();
        
        if (fileDatabase) {
            createTestFiles(fileDatabase);
        } else {
            // 如果没有提供数据库，只创建文件
            const testFiles = [
                { name: '电力安全操作规程.pdf', content: Buffer.from('这是电力安全操作规程测试文件内容。') },
                { name: '电网调度管理条例.docx', content: Buffer.from('这是电网调度管理条例测试文件内容。') },
                { name: '电力设备维护指南.xlsx', content: Buffer.from('这是电力设备维护指南测试文件内容。') }
            ];
            
            const uploadsDir = path.join(__dirname, 'uploads');
            testFiles.forEach((file, index) => {
                const filePath = path.join(uploadsDir, file.name);
                fs.writeFileSync(filePath, file.content);
                console.log(`创建测试文件 ${index + 1}: ${file.name}`);
            });
        }
        
        console.log('测试数据初始化完成！');
    } catch (error) {
        console.error('初始化测试数据失败:', error);
    }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
    init();
}

module.exports = { init };