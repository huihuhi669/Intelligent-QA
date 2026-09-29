const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// 配置属性：控制是否使用模拟数据回答问题
// 可以从环境变量读取，默认为true
const USE_MOCK_RESPONSES = process.env.USE_MOCK_RESPONSES !== undefined ? 
    process.env.USE_MOCK_RESPONSES.toLowerCase() === 'true' : true;

// 模拟问答数据，用于快速响应测试
const mockResponses = {
    '什么是电力安全规程？': '电力安全规程是为了保障电力生产和电力供应的安全，防止人身伤害、设备损坏和电力事故而制定的一系列规则和标准。它包括电力设备的安装、运行、维护、检修等方面的安全要求。',
    '如何处理电力设备故障？': '处理电力设备故障的基本步骤包括：1. 立即停止设备运行并切断电源；2. 记录故障现象和相关参数；3. 进行故障诊断，确定故障原因；4. 制定维修方案并实施；5. 修复后进行测试，确保设备正常运行；6. 记录维修过程和结果，分析故障原因以防止再次发生。',
    '电力系统由哪些部分组成？': '电力系统主要由发电、输电、变电、配电和用电五个部分组成。发电部分包括各种类型的发电厂；输电部分负责将电力远距离传输；变电部分通过变压器改变电压等级；配电部分负责将电力分配到各用户；用电部分则是各种电力用户。',
    '什么是智能电网？': '智能电网是一种现代化的电力网络，它融合了先进的信息技术、通信技术、自动化控制技术和电力设备，实现了电力系统的智能化运行、监测、控制和管理。智能电网具有自愈、互动、高效、兼容等特点。',
    '如何节约用电？': '节约用电的方法包括：1. 使用节能电器；2. 合理设置空调温度；3. 及时关闭不使用的电器；4. 充分利用自然光；5. 定期清洁电器设备；6. 优化用电时间，避开高峰时段；7. 推广使用新能源等。',
    '电力设备的日常维护包括哪些内容？': '电力设备的日常维护主要包括：1. 定期检查设备运行状态和参数；2. 清洁设备表面和内部灰尘；3. 检查和紧固连接螺栓；4. 检查绝缘材料是否老化；5. 测试保护装置的灵敏度；6. 检查冷却系统是否正常运行；7. 记录设备运行日志等。',
    '电力行业有哪些常见的安全事故类型？': '电力行业常见的安全事故类型包括：1. 触电事故；2. 电弧灼伤；3. 高空坠落；4. 设备爆炸；5. 火灾；6. 机械伤害；7. 中毒窒息；8. 电气误操作事故；9. 自然灾害引发的电力事故等。',
    '什么是电力负荷预测？': '电力负荷预测是根据历史用电数据、天气情况、社会经济发展状况等因素，对未来一段时间内的电力需求量进行预测的技术。它是电力系统规划、调度和运行的重要依据，可以帮助电力企业合理安排发电计划，提高电力供应的可靠性和经济性。',
    '电力设备的接地有什么作用？': '电力设备的接地主要有以下作用：1. 保护人身安全，防止触电事故；2. 保护设备安全，防止设备因过电压而损坏；3. 保障电力系统的正常运行；4. 防止静电积累和电磁干扰；5. 作为电力系统的工作回路等。',
    '如何进行电力安全培训？': '电力安全培训应包括以下内容：1. 电力安全法律法规和规章制度；2. 电力安全基本知识和原理；3. 电力设备的安全操作规范；4. 事故案例分析和应急处理；5. 安全防护用品的使用方法；6. 安全检查和隐患排查方法等。培训方式可以采用课堂教学、现场实操、模拟演练等多种形式。',
    '电力调度的主要职责是什么？': '电力调度的主要职责包括：1. 确保电力系统的安全、稳定、经济运行；2. 平衡电力供需，合理安排发电计划；3. 指挥电力系统的运行操作和故障处理；4. 协调电网、发电厂和用户之间的关系；5. 优化电力资源配置，提高电力系统的经济效益；6. 制定和实施电力系统的运行方式和应急预案等。',
    '什么是电力需求侧管理？': '电力需求侧管理是指通过采取有效的激励措施，引导电力用户改变用电方式和用电习惯，提高用电效率，优化用电负荷特性，从而减少电力消耗和电力系统的峰值负荷，实现电力资源的优化配置和可持续利用的管理活动。',
};

// 调用外部大模型API的函数
async function callModelAPI(prompt) {
    try {
        // 如果配置为使用模拟数据，直接返回模拟回答
        if (USE_MOCK_RESPONSES) {
            return getMockResponse(prompt);
        }
        
        const apiUrl = process.env.MODEL_API_URL;
        const apiKey = process.env.MODEL_API_KEY;
        
        // 如果没有配置API地址，返回模拟数据
        if (!apiUrl || !apiKey) {
            return getMockResponse(prompt);
        }
        
        const isHttps = apiUrl.startsWith('https');
        const client = isHttps ? https : http;
        
        // 解析URL
        const url = new URL(apiUrl);
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            }
        };
        
        // 准备请求体
        const requestBody = JSON.stringify({
            model: 'gpt-3.5-turbo', // 根据实际API调整
            messages: [
                { role: 'system', content: '你是一个电力行业专家，负责解答电力相关问题。' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });
        
        // 发送请求
        return new Promise((resolve, reject) => {
            const req = client.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        // 解析响应，根据实际API返回格式调整
                        if (response.choices && response.choices.length > 0) {
                            resolve(response.choices[0].message.content);
                        } else {
                            resolve('抱歉，我无法回答这个问题。');
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.write(requestBody);
            req.end();
        });
    } catch (error) {
        console.error('调用大模型API失败:', error);
        // 如果API调用失败，返回模拟数据
        return getMockResponse(prompt);
    }
}

// 获取模拟响应
function getMockResponse(prompt) {
    // 检查是否有精确匹配的问题
    for (const [question, answer] of Object.entries(mockResponses)) {
        if (prompt.includes(question) || question.includes(prompt)) {
            return answer;
        }
    }
    
    // 如果没有精确匹配，返回通用回答
    return `感谢您的提问！关于"${prompt}"，建议您参考相关电力行业标准或咨询专业技术人员。如有更具体的问题，我会尽力为您解答。`;
}

// 处理问答请求
router.post('/ask', async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question || typeof question !== 'string' || question.trim() === '') {
            return res.status(400).json({ error: '请输入有效的问题' });
        }
        
        // 调用大模型API获取回答
        const answer = await callModelAPI(question);
        
        // 返回回答
        res.status(200).json({
            success: true,
            question: question,
            answer: answer,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('处理问答请求失败:', error);
        res.status(500).json({
            success: false,
            error: '服务器处理请求失败，请稍后再试',
            timestamp: new Date().toISOString()
        });
    }
});

// 获取快速问题列表
router.get('/quick-questions', (req, res) => {
    try {
        const quickQuestions = Object.keys(mockResponses);
        res.status(200).json({
            success: true,
            questions: quickQuestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取快速问题列表失败'
        });
    }
});

module.exports = router;