# 星罗618品牌PK看板

Next.js 全栈项目，部署到腾讯云 CloudBase，线上运行，无需本地 localhost。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 14.2 | React 全栈框架 |
| React | 18.3 | UI 框架 |
| TypeScript | 5.5 | 类型系统 |
| Tailwind CSS | 3.4 | 样式框架 |
| 飞书 API | OpenAPI | 数据源 |

## 项目架构

```
├── app/
│   ├── api/rank/route.ts     # 服务端 API：读取飞书表格、排序、计算排名
│   ├── page.tsx               # 主页面：排行榜、金银铜、轮询
│   ├── layout.tsx             # 根布局
│   └── globals.css            # 全局样式
├── lib/
│   └── feishu.ts              # 飞书 API 封装（服务端执行，密钥不暴露）
├── package.json               # 项目配置
├── next.config.js              # Next.js 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── cloudbaserc.json            # CloudBase 部署配置
└── .env.example                # 环境变量模板
```

## 安装与本地开发

```bash
# 1. 安装依赖
npm install

# 2. 创建环境变量文件
cp .env.example .env.local

# 3. 编辑 .env.local 填入你的飞书配置

# 4. 本地开发
npm run dev
# 访问 http://localhost:3000

# 5. 构建
npm run build
# 输出在 dist/ 目录
```

## 接入飞书多维表格 API

### 步骤1：获取飞书配置

1. 打开 [飞书开放平台](https://open.feishu.cn/app)
2. 创建自建应用（企业自建应用）
3. 进入应用 → 凭证与基础信息
4. 复制 **App ID** 和 **App Secret**

### 步骤2：获取表格信息

1. 打开你的飞书多维表格
2. 复制链接，格式如：
   ```
   https://example.feishu.cn/base/APP_TOKEN?table=TABLE_ID
   ```
3. 提取 `APP_TOKEN` 和 `TABLE_ID`

### 步骤3：配置环境变量

在 CloudBase 控制台 → 环境管理 → 添加以下变量：

| 变量名 | 说明 | 示例 |
|---------|------|-------|
| `FEISHU_APP_ID` | 飞书 App ID | cli_a95c9f901db91bde |
| `FEISHU_APP_SECRET` | 飞书 App Secret | xxxxxxxxxx |
| `FEISHU_APP_TOKEN` | 多维表格 App Token | FgHFbKrmCa4BYis... |
| `FEISHU_TABLE_ID` | 表格 ID | tblNOZbnQEOHsyF... |
| `FIELD_BRAND` | 品牌字段名 | 品牌 |
| `FIELD_GMV` | GMV字段名 | GMV |
| `FIELD_TIME` | 时间字段名 | 时间 |

### 步骤4：发布部署

CloudBase 控制台 → 点击发布。

## 飞书表格格式要求

表格必须包含以下列：

| 品牌 | GMV | 时间 |
|-------|-----|------|
| LA MER海蓝之谜 | 266980 | 2026-05-22 |
| 雅漾喷雾 | 194538 | 2026-05-22 |
| 雅漾-抗痘 | 158618 | 2026-05-22 |
| ... | ... | ... |

- 品牌列：文本类型
- GMV 列：数字类型
- 时间列：日期类型（可选，为空则使用当前时间）

## 实现的功能

| 功能 | 说明 |
|------|------|
| 服务端 API | `/api/rank` 读取飞书表格，按 GMV 排序 |
| 密钥安全 | App ID / Secret 在环境变量中，前端不可见 |
| 自动刷新 | 前端每 5 分钟自动调用 `/api/rank` |
| 排名变化 | 与上次对比，显示 ↑ 上升 / ↓ 下降 / — 不变 |
| 金银铜 | 前三名大卡片，渐变背景 |
| GMV 动画 | 数字滚动计数效果（亿/万/千分位） |
| CloudBase | 一键部署到腾讯云 CloudBase |
| Node.js 18 | 兼容 Node.js 18+ |

## CloudBase 部署

### 方式一：命令行部署（推荐）

**1. 安装 CloudBase CLI**

```bash
npm i -g @cloudbase/cli
```

**2. 登录 CloudBase**

```bash
cloudbase login
```

**3. 初始化项目**

```bash
cd xingluo-618-pk
cloudbase framework:init
```

**4. 配置环境变量**

在 CloudBase 控制台 → 环境管理 中添加 `FEISHU_APP_ID`, `FEISHU_APP_SECRET`, `FEISHU_APP_TOKEN`, `FEISHU_TABLE_ID`。

**5. 部署**

```bash
cloudbase framework deploy
```

### 方式二：控制台部署

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建环境
3. 进入 → Web 应用托管
4. 选择 → 新建应用 → 导入现有项目
5. 上传项目文件
6. 在环境变量中配置飞书参数
7. 点击部署

## API 文档

### GET /api/rank

返回飞书表格中的品牌排行榜。

**响应示例：**

```json
{
  "items": [
    {
      "rank": 1,
      "name": "LA MER海蓝之谜",
      "gmv": 266980,
      "updatedAt": "2026-05-22T10:00:00.000Z",
      "trend": "same"
    },
    {
      "rank": 2,
      "name": "雅漾喷雾",
      "gmv": 194538,
      "updatedAt": "2026-05-22T10:00:00.000Z",
      "trend": "up"
    }
  ],
  "totalGmv": 958590,
  "totalBrands": 21,
  "updatedAt": "2026-05-22T10:00:00.000Z",
  "source": "飞书多维表格"
}
```

## 常见问题

**Q: 部署后页面显示"获取数据失败"**
A: 检查 CloudBase 环境变量是否正确配置了 `FEISHU_APP_ID`, `FEISHU_APP_SECRET`, `FEISHU_APP_TOKEN`, `FEISHU_TABLE_ID`。

**Q: 排行榜显示为空**
A: 检查飞书表格中品牌名和 GMV 列是否有数据，字段名是否与环境变量中的 `FIELD_BRAND` / `FIELD_GMV` 一致。

**Q: 更新了飞书数据但排行榜没变**
A: 前端每 5 分钟自动刷新，或点击页面右上角的"刷新"按钮。

## 版权

星罗 618 品牌PK看板
