# 智能问答后端服务

## 项目介绍
这是智能问答的后端服务，提供文件存储和大模型接口连接功能，支持前端页面的文件预览、下载和智能问答服务。

## 功能特性
1. **文件管理**：上传、下载、预览、搜索规章制度文件
2. **智能问答**：连接大模型API，提供电力专业知识问答服务

## 技术栈
- Node.js
- Express
- Multer (文件上传)
- CORS (跨域处理)
- dotenv (环境变量)

## 安装说明

### 前提条件
- Node.js (已在v16.20.2版本测试通过)
- npm

### 安装步骤
1. 进入项目的backend目录：
   ```bash
   cd c:\Users\asus\OneDrive\桌面\电小智\new\backend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```

## 配置方法
- `.env`文件已创建，包含以下默认配置：
  ```env
  PORT=3000
  UPLOAD_DIR=./uploads
  # 大模型API配置
  MODEL_API_KEY=your_api_key_here
  MODEL_API_URL=http://localhost:3000/api/chat/mock-response
  ```
- 如需连接真实大模型API，请修改MODEL_API_KEY和MODEL_API_URL

## 启动步骤
1. 在backend目录下运行：
   ```bash
   node start.js
   ```
2. 服务器将在 http://localhost:3000 启动
3. 启动时会自动创建测试数据，包含3个示例文件

## 前端配置
前端页面（电力规章制度语料库.html和电力规章制度智能问答平台.html）已配置为调用后端API：
- 文件操作：调用 http://localhost:3000/api/files/ 相关接口
- 智能问答：调用 http://localhost:3000/api/chat/ask 接口

## API接口文档

### 文件管理接口

#### 1. 上传文件
- **URL**: `/api/files/upload`
- **Method**: POST
- **Form Data**: 
  - `file`: 要上传的文件 (支持PDF、DOC、DOCX、XLS、XLSX等)
  - `category`: 文件分类
- **返回**: 
  ```json
  {
    "success": true,
    "message": "文件上传成功",
    "file": {
      "id": "唯一ID",
      "filename": "文件名",
      "path": "文件路径",
      "size": 文件大小,
      "category": "文件分类",
      "uploadDate": "上传日期"
    }
  }
  ```

#### 2. 获取文件列表
- **URL**: `/api/files`
- **Method**: GET
- **返回**: 
  ```json
  {
    "success": true,
    "files": [
      {
        "id": "唯一ID",
        "filename": "文件名",
        "category": "文件分类",
        "publishDate": "发布日期",
        "docNumber": "文件编号",
        "downloadCount": 下载次数
      },
      // 更多文件...
    ]
  }
  ```

#### 3. 搜索文件
- **URL**: `/api/files/search`
- **Method**: GET
- **参数**: 
  - `q`: 搜索关键词
  - `category`: 分类筛选
- **返回**: 
  ```json
  {
    "success": true,
    "files": [
      // 搜索结果文件列表
    ]
  }
  ```

#### 4. 下载文件
- **URL**: `/api/files/download/:id`
- **Method**: GET
- **返回**: 文件下载

#### 5. 预览文件
- **URL**: `/api/files/preview/:id`
- **Method**: GET
- **返回**: 文件预览

### 智能问答接口

#### 1. 提问回答
- **URL**: `/api/chat/ask`
- **Method**: POST
- **Body**: 
  ```json
  {
    "question": "用户提问",
    "model": "使用的模型"
  }
  ```
- **返回**: 
  ```json
  {
    "success": true,
    "answer": "AI回答内容",
    "model": "使用的模型",
    "responseTime": 响应时间
  }
  ```

#### 2. 获取快速问题列表
- **URL**: `/api/chat/quick-questions`
- **Method**: GET
- **返回**: 
  ```json
  {
    "success": true,
    "questions": [
      "快速问题1",
      "快速问题2",
      // 更多问题...
    ]
  }
  ```

## 错误处理
所有API接口在遇到错误时会返回统一的错误格式：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 注意事项
1. 上传文件大小限制为50MB
2. 支持的文件类型：PDF、Word文档、Excel表格等
3. 默认使用模拟大模型响应，如需连接真实API请修改.env文件
4. 服务器启动时会自动创建uploads目录和测试文件
5. 前端页面有容错机制，当后端不可用时会显示备用内容

## 使用说明
1. 启动后端服务
2. 打开前端HTML页面（电力规章制度语料库.html和电力规章制度智能问答平台.html）
3. 测试功能：
   - 文件上传、预览、下载和搜索
   - 智能问答提问和快速问题

## 故障排查
- 如果无法连接后端API，请确认服务器是否已启动
- 检查网络连接和防火墙设置
- 查看控制台错误信息以获取详细信息

## 开发说明

- 主要文件结构：
  - `app.js`：应用主文件，配置中间件和路由
  - `routes/fileRoutes.js`：文件管理相关路由
  - `routes/chatRoutes.js`：智能问答相关路由
  - `.env`：环境变量配置文件
  - `start.js`：服务启动脚本

## 联系我们
如有任何问题或建议，请联系项目维护人员。
