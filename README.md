# hamster-pet · 鼠鼠桌面小宠

Windows 桌面仓鼠与可互动的 3D 鼠鼠小镇。支持中文、English、Español。
A Windows hamster companion with a living 3D town, three visual forms and Chinese, English and Spanish interfaces.

![功能主页](assets/screenshots/home.png)

## 下载安装 / Download

打开 [最新发行版](https://github.com/lambily555/hamster-pet/releases/latest)：

- **hamster-pet-setup-版本.exe**：Windows 10/11 x64 安装包，可选择安装位置并创建快捷方式。
- **hamster-pet-portable-版本.exe**：免安装程序，双击运行。
- **SHA256SUMS.txt**：用于核对下载文件完整性。

安装包自带运行环境，不需要 Node.js、pnpm 或 Python。程序暂未购买代码签名证书，Windows 可能显示未知发布者。安装结束不会自动启动桌面宠物。
GitHub 的 **Code → Download ZIP** 是源代码，不是安装包。个人设置、居民、宠物和自定义图片保存在本机，不随下载包分发；已有存档不因更新而主动清除，建议升级前备份。

Download a setup or portable EXE from Releases; no developer tools are needed. Source ZIPs require the development setup below. Builds are currently unsigned. Personal saves are local and are not included in downloads.

## 当前功能

- 手机老虎机支持点击或下拉拉杆，也可点击“抽一次”；按现实每天限抽一次，奖励即时保存。

- 手机顶部下滑或点击箭头打开消息栏，可继续招募、结伴活动、聊天和继任选择，或进入当天抽奖；完成后自动移除待办。
- 居民少于15只，或本小镇年尚未招募，可挑选5位新邻居；候选鼠鼠以单张大卡片展示，左右箭头切换，9项属性用进度条呈现；翻页或关闭面板保留勾选和职业分配。成功招募计入当年次数，人数不足仍可再次招募。
- 手机聊天提供9个人设主题，完整话题24条消息，首次输入后用选项回复；电话有招呼和道别，居民动态使用第一人称口吻。


- 透明桌面仓鼠、系统托盘、快捷键；3D、真实动态和仿真形态，投喂、装扮、自定义动作、日记和聊天。
- 小镇上帝视角与随时切换的第一视角，建筑进出、家具互动、居民与宠物聚焦跟随。
- 小屋、学校、诊所、饭馆、零食铺、纪念馆、殡仪馆、名人堂、宠物之家，以及广场、菜园、跑轮公园和墓地。
- 小镇时间、天气、广播、居民资料、生日与忌日日历；成长、体力、疾病、衰老、死亡、继任与遗产。
- 居民交流、结伴剧情（下方姓名与问题、三个回答；点击或按键补全文字和推进）、伴侣、幼鼠与外来居民选择；居民人数不超过15时可挑选新居民。
- 24种 Cube Pets 模型，主鼠最多新领养3只宠物，NPC邀请领养、跟随、继承及免费领养区。
- 饭馆排队结账与收银效果；建筑、家具、地面与树木材质。

功能与建模仍在持续完善，文件检查和自动测试不等同于所有设备上的视觉、性能与安装验收。最新变更见[开发记录](docs/鼠鼠app开发记录.md)，历史设计文档不代表当前功能状态。

## 从源码运行 / Development

需要 Windows 10/11 x64、Node.js 22或更高版本、**pnpm 11.25.0**。首次安装依赖需联网。

```bash
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm test
pnpm start
```

`pnpm build` 生成语言字典和两份3D脚本包；`pnpm check` 检查语法、入口和运行素材；`pnpm test` 运行不启动 App 的回归测试。

```bash
pnpm dist
```

安装包输出到 `release/`。维护者必须从已审查的公开目录构建，不要将私人工作目录的原始素材打包。

## 自动检查与发行

`.github/workflows/check-release.yml` 是本项目维护的 GitHub Actions 配置：每次推送 main 或提交 PR，会在 GitHub 的 Windows 环境重新安装依赖、构建、检查素材和运行回归测试，并核对已提交的脚本包是否过时。推送与 package.json 版本一致的 `v版本号` 标签后，检查通过才制作并上传两个 EXE 和校验文件到 Releases。

## AI 聊天 API 兼容性

AI 聊天只支持采用 OpenAI **Chat Completions** 请求格式的接口。程序会向配置地址发送 `POST /chat/completions`，使用 `Authorization: Bearer <API Key>` 鉴权，并读取 `choices[0].message.content`。可以填写服务商提供的 API 根地址，也可以填写以 `/chat/completions` 结尾的完整接口地址。

| 服务 | API 地址示例 | 模型示例 | 状态 |
| --- | --- | --- | --- |
| Groq | `https://api.groq.com/openai/v1` | `openai/gpt-oss-20b` | 已实测 |
| 本地模拟接口 | `http://127.0.0.1:<端口>/v1` | 由本地服务决定 | 已用于自动测试 |
| OpenAI | `https://api.openai.com/v1` | 以服务商当前模型列表为准 | 按官方兼容协议支持，未在本项目中使用付费 Key 实测 |
| Gemini OpenAI 兼容层 | `https://generativelanguage.googleapis.com/v1beta/openai` | 以 Google 当前模型列表为准 | 按官方兼容协议支持，未实测 |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | 按官方兼容协议支持，未实测 |
| Ollama 本地服务 | `http://localhost:11434/v1` | 已在 Ollama 下载的模型名 | 按官方兼容协议支持，未实测 |

不支持直接填写 Anthropic Messages API、Gemini 原生 API、OpenAI Responses API 或其他非 Chat Completions 格式。第三方服务可能调整模型名、免费额度、地区限制或兼容行为，请以服务商当前文档为准。遇到 `401`/`403` 时检查 Key、账户权限和地区网络；遇到 `404` 时检查地址和模型名；遇到 `429` 时表示已达到服务商速率或额度限制。

相关官方文档：[OpenAI Chat Completions](https://platform.openai.com/docs/api-reference/chat)、[Groq OpenAI Compatibility](https://console.groq.com/docs/openai)、[Gemini OpenAI Compatibility](https://ai.google.dev/gemini-api/docs/openai)、[DeepSeek API](https://api-docs.deepseek.com/zh-cn/)、[Ollama OpenAI Compatibility](https://docs.ollama.com/api/openai-compatibility)。

API Key 保存在当前电脑的应用设置中，不会由本项目主动上传到其他位置。请勿在公共电脑保存 Key，也不要把配置文件、Key 或含 Key 的截图提交到 GitHub。

## 素材与贡献

代码采用 [MIT License](LICENSE)。模型、照片、动画与声音分别适用 [素材许可说明](ASSETS_LICENSE.md)，不能把代码许可当成所有素材的许可。名人堂图片的授权状态见该说明。自定义上传素材仅存于本机。

[模型说明](MODEL_SETUP.md) · [参与贡献](CONTRIBUTING.md) · [安全反馈](SECURITY.md) · [开发记录](docs/鼠鼠app开发记录.md)

居民拥有固定说话人设，可在居民资料中查看；主鼠与NPC的日常聊天支持中文、英语和西班牙语。

玩家聊天与结伴故事使用正经、抽象、离开三类选项。日常聊天回答后结算；结伴故事正经回答增进好感，抽象回答不增不减，离开不额外扣好感（不退还出发消耗）。

鼠鼠手机主页的“每日抽奖”提供拉杆老虎机：向下拉动或点击右侧拉杆，三个转轮依次揭晓奖品；现实每天一次，等概率获得体力卡×2、瓜子×10或长寿卡×1。体力卡手动回满体力；长寿卡保护当前主鼠3岁前不离世，仍会生病衰老，保护不传给下一代。

### 鼠鼠手机

在小镇底部睡觉按钮旁点击“鼠鼠手机”或按 **P** 拿出，向上滑动解锁，**Esc** 收起。横屏设备使用可点击入口和宽屏布局。

- **聊天鼠**：联系人自动更新，底部输入栏支持回车或点击发送预设台词，消息逐条配头像显示；打开联系人可邀请结伴活动。离世联系人保留为黑色离线。
- **电话鼠**：预设通话、三选一回答及通话记录，离世联系人不能拨号。
- **每日抽奖**：拉杆老虎机及体力卡、长寿卡的查看和使用，入口位于手机主页。
- **动态鼠**：生活记录、居民评论、点赞、预设评论、转发和收藏。阅读时不自动插入新动态，点击新动态提示后刷新。软件红点提示新联系人或新动态。

手机主页和锁屏完整适配屏幕，不显示滚动条；联系人、消息与动态按需滚动。居民头像按毛色、表情和配饰区分；主鼠休息时会提示暂不能发消息。

这是游戏内模拟手机，使用本地小镇数据，不发送真实短信或拨打现实电话。
