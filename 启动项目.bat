@echo off

:: 检查Node.js是否安装
node -v >nul 2>&1
if %errorlevel% neq 0 (
echo 错误：未找到Node.js。请先安装Node.js。
pause
exit /b 1
)

:: 切换到backend目录
cd backend
if %errorlevel% neq 0 (
echo 错误：无法切换到backend目录。
pause
exit /b 1
)

:: 安装依赖（如果node_modules不存在）
if not exist node_modules (
echo 正在安装项目依赖...
npm install
if %errorlevel% neq 0 (
echo 错误：依赖安装失败。
pause
exit /b 1
)
)

:: 启动后端服务
echo 正在启动后端服务...
echo 服务启动后，请勿关闭此窗口。
echo 如需访问前端页面，请在浏览器中打开项目根目录下的HTML文件。
node start.js

pause