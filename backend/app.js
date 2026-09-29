// 引入必要的模块
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();

// 配置中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 静态文件服务 - 用于提供上传的文件
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// 引入路由
const fileRouter = require('./routes/fileRoutes');
const chatRouter = require('./routes/chatRoutes');

// 使用路由
app.use('/api/files', fileRouter);
app.use('/api/chat', chatRouter);

// 根路由
app.get('/', (req, res) => {
    res.send('电小智后端服务已启动');
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('服务器发生错误');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;