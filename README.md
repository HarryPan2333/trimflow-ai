# TrimFlow AI

TrimFlow AI（服装辅料外贸销售助手）是一个面向中国服装辅料外贸销售人员的客户项目管理网页原型。项目以拉链、纽扣等服装辅料业务为场景，集中展示客户需求、样品与报价进度、沟通记录、待办事项、项目周报和 AI 项目助手。

当前版本仅为产品原型，所有客户数据均为虚构数据，不代表任何真实客户、公司、订单或内部价格。

## 技术栈

- Next.js 16（App Router）
- TypeScript
- React 19
- Tailwind CSS
- OpenAI Node SDK（仅在服务器端 API Route 中使用）
- 本地 Mock Data

## 本地运行

需要 Node.js `22.13.0` 或更高版本。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

OpenAI API Key 是可选项。没有 Key 时，AI 助手会自动使用内置模拟结果，其他原型功能不受影响。如需启用真实模型，只在 `.env.local` 中填写：

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-5.6
```

不要将 `.env.local`、API Key 或其他凭据提交到 Git。浏览器端代码不应使用 `NEXT_PUBLIC_OPENAI_API_KEY`。

## 质量检查

```bash
pnpm lint
pnpm build
```

`pnpm build` 使用标准 Next.js production build，可直接用于 Vercel。

## 部署到 Vercel

### 通过 GitHub

1. 将项目上传到私有或公开 GitHub 仓库。
2. 在 Vercel 中选择 **Add New → Project**，导入该仓库。
3. Framework Preset 选择 **Next.js**，Build Command 使用默认的 `pnpm build`。
4. 如果只演示模拟 AI，无需配置环境变量。
5. 如需真实 AI，在 Vercel 项目的 **Settings → Environment Variables** 中添加 `OPENAI_API_KEY`，可选添加 `OPENAI_MODEL`。Key 只能配置在服务器端环境变量中。
6. 点击 Deploy。

### 通过 Vercel CLI

```bash
pnpm dlx vercel
pnpm dlx vercel --prod
```

部署完成后，Vercel 会返回预览地址和生产地址。

## 数据与安全说明

- 所有客户名称、联系人、邮件地址、价格、数量、样品、交期和沟通内容均为虚构或脱敏的演示数据。
- AI API Route 只读取服务器端 `OPENAI_API_KEY`，并且只向模型提供当前模拟项目材料。
- AI 返回结果经过结构化 JSON 校验；没有 API Key 或请求失败时保留模拟模式。
- `.env`、`.env.local`、`.env.production` 等环境文件由 `.gitignore` 排除，只有不含密钥的 `.env.example` 可以提交。
- 当前版本没有用户登录、权限控制、数据库、真实 CRM、邮箱同步或文件解析服务，不应存放真实业务数据。

## 常用命令

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```
