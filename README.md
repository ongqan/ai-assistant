# 旅伴 AI（Android）

## 网页端智能项目（真实 AI）

`web-demo` 是完整的前后端项目。默认启用无需密钥的 `mock` 功能测试模式；后续可通过一个配置项切换真实模型：

- OpenAI Responses API 生成严格结构化行程
- 支持在同一会话中用自然语言多轮修改
- 可选高德 Web 服务，核验真实地点、地址和经纬度
- API Key 仅存服务端，输入校验、限长与统一错误处理
- 响应式前端、浏览器本地保存、服务状态展示
- 领域 Schema、提示词、模型服务、地图服务、路由和会话存储分层

### 第一次启动

如果你不熟悉技术：直接双击 `启动旅伴AI.command`，程序会以演示测试模式自动启动并打开网页，不需要填写任何 Key。

1. 进入 `web-demo` 文件夹。
2. 将 `.env.example` 复制为 `.env`（双击启动器会自动完成）。
3. 保持 `AI_PROVIDER=mock` 即可无密钥测试；以后改为 `openai` 并填写 `OPENAI_API_KEY` 即可启用真实模型。
4. 在终端执行：

```bash
npm install
npm start
```

5. 浏览器打开 `http://localhost:8787`。注意：升级后不能再通过双击 HTML 使用真实 AI，因为 API Key 必须安全地放在服务端。

### 项目结构

```text
web-demo/
├── index.html / styles.css / app.js   # 前端应用
├── server/
│   ├── index.js                       # Web 服务与安全中间件
│   ├── routes/plans.js                # 生成/修改行程 API
│   ├── schemas/travelPlan.js          # 输入和模型输出结构校验
│   ├── prompts/travelPlanner.js       # 旅行规划系统规则
│   ├── services/openAiPlanner.js      # OpenAI Responses API
│   ├── services/amap.js               # 高德真实地点核验
│   └── store/sessionStore.js          # 多轮会话
└── tests/travelPlan.test.js
```

一个面向手机端的 AI 出行客服 MVP。用户用自然语言描述需求，应用识别出行意图，生成逐日路线与交通建议，并推荐住宿、门票、接送和餐饮服务。

## 已实现

- Kotlin + Jetpack Compose + Material 3 原生 Android UI
- 中文自然语言出行意图识别（目的地、天数、同行人、偏好）
- 1–7 天逐日行程和顺路交通方式规划
- 上下文相关服务推荐
- 加载、错误、空输入防护和响应式状态管理
- `TravelAssistant` 接口隔离演示引擎，方便接入真实 AI 后端

## 运行

1. 使用 Android Studio Ladybug 或更新版本打开项目。
2. 等待 Gradle 同步完成（JDK 17、Android SDK 35）。
3. 选择 Android 8.0（API 26）以上的模拟器或真机，运行 `app`。

## 生产服务接入

当前 `DemoTravelAssistant` 在本地完成轻量意图识别并返回演示数据。生产环境建议由应用仅调用自己的业务后端：

```text
Android App → 业务后端 → LLM 意图解析/行程生成
                      → 地图路线 API
                      → 酒店/票务/用车/餐饮服务 API
```

将 `TravelAssistant` 替换为网络实现即可保持 UI 不变。建议后端返回与 `TravelPlan` 对应的结构化 JSON，并负责密钥保管、内容审核、失败降级、缓存和供应商聚合。地图 SDK 可在 `DayPlanCard` 上方增加地图组件，并用路线 API 的真实耗时替代演示交通方式。

## 关键目录

```text
app/src/main/java/com/travelmate/ai/
├── MainActivity.kt
├── data/TravelAssistant.kt       # 领域模型、接口与演示引擎
└── ui/
    ├── TravelMateApp.kt          # Compose 页面与组件
    └── TravelViewModel.kt        # 单向状态与异步编排
```

## 下一阶段建议

- 接入定位授权与高德/Google Maps 路线规划
- 接入服务端 LLM，支持追问缺失信息与多轮修改行程
- 增加登录、收藏、订单、支付和出行提醒
- 对接真实服务供应商并标明价格、库存和佣金规则
- 增加埋点、无障碍、国际化、单元测试与 UI 测试
