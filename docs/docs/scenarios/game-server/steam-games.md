# Steam 游戏开服

本页以 **CS2 / CS:GO** 为例讲解 Steam 专用服务器（Dedicated Server）的完整开服流程，并在末尾给出其他热门游戏的端口与要点速查表。

## 先理解两件事

### 1. 服务端用 SteamCMD 下载，不需要登录 Steam 账号

SteamCMD 是 Valve 官方的命令行工具，用于下载和更新各类游戏的专用服务端，匿名（`anonymous`）即可下载绝大多数游戏服。

- Windows / Linux 安装方法以 Valve 官方 Wiki 为准：[SteamCMD - Valve Developer Community](https://developer.valvesoft.com/wiki/SteamCMD)；
- 已装 Steam 客户端的 Windows 机器也可以用「工具」分类里的 *SteamCMD*。

### 2. 穿透后靠「直连」，不依赖服务器浏览器

经过内网穿透的服务器通常**不会出现在游戏内的公共服务器列表**（列表依赖服务端向 Steam 主服务器注册，需要标准公网端口）。好友统一用**直连**方式进入：

- CS2 / CS:GO：打开控制台输入 `connect 节点IP:远程端口`；
- 其他游戏：在「直连 / Direct Connect」输入框填 `节点IP:远程端口`。

![图片占位：CS2 控制台 connect 直连](./images/steam-cs2-connect.png)

## CS2 专用服务器

CS2 的专用服务端程序包含在游戏本体（App ID `730`）中，通过 SteamCMD 下载。

### Windows

1. 安装 SteamCMD 后，在 PowerShell / cmd 中执行（安装目录以 `D:\cs2-server` 为例）：

   ```bat
   steamcmd.exe +force_install_dir D:\cs2-server +login anonymous +app_update 730 validate +quit
   ```

2. 下载完成后启动服务器（在 `D:\cs2-server\game\bin\win64` 目录下执行）：

   ```bat
   cs2.exe -dedicated -usercon +map de_dust2
   ```

   首次启动会生成配置；默认游戏端口为 **UDP 27015**。

3. 想长期/公开运行，需要一个 **GSLT（游戏服务器登录令牌）**：用你的 Steam 账号在 [Steam 游戏服务器账号管理页](https://steamcommunity.com/dev/managegameservers) 为 App ID 730 创建令牌，启动时加上：

   ```bat
   cs2.exe -dedicated -usercon +map de_dust2 +sv_setsteamaccount "你的GSLT令牌"
   ```

   ::: warning ⚠️ GSLT 与账号封禁
   GSLT 绑定你的 Steam 账号，服务器被举报封禁会影响该令牌（可重新生成，一般不封主账号）。只给认识的人玩、不挂公共列表时也建议按官方要求使用，不要把令牌分享给别人。
   ::

### Linux

```bash
steamcmd.sh +force_install_dir ~/cs2-server +login anonymous +app_update 730 validate +quit
cd ~/cs2-server
./game/bin/linuxsteamrt64/cs2 -dedicated +map de_dust2 +sv_setsteamaccount "你的GSLT令牌"
```

Linux 是长期社区服的推荐环境；想在网页上点点鼠标就管理，见 [Linux 可视化面板](./panels)。

### 配置隧道

CS2 游戏流量走 **UDP**，创建 `udp` 隧道：

```toml
[[proxies]]
name = "cs2"
type = "udp"
localIP = "127.0.0.1"
localPort = 27015
remotePort = 32015   # 以面板分配为准
```

好友在 CS2 控制台（设置中开启「开发者控制台」，按 `~` 调出）输入：

```text
connect 节点IP:32015
```

![图片占位：面板创建 CS2 udp 隧道](./images/steam-panel-udp.png)

::: tip 需要在外面管理服务器（RCON）
不要把 RCON 端口暴露到公网。在服主电脑本地用 `-usercon` 管理即可；需要异地管理时，给 RCON 端口单独建 `stcp` 隧道（见 [Minecraft 页 stcp 示例](./mc#stcp-私密联机仅好友可连)，端口换成 RCON 端口）。
:::

## CS:GO（老版本）

CS:GO 专用服务端是独立的 App ID `740`，启动工具为 srcds：

```bash
# 下载（Linux 示例）
steamcmd.sh +force_install_dir ~/csgo-server +login anonymous +app_update 740 validate +quit

# 启动（竞技模式示例，GSLT 的 App ID 为 730）
~/csgo-server/srcds_run -game csgo -console -usercon \
  +game_type 0 +game_mode 0 +mapgroup mg_active +map de_dust2 \
  +sv_setsteamaccount "你的GSLT令牌"
```

隧道同样是 **UDP 27015**，好友 `connect 节点IP:远程端口`。

## 其他热门游戏速查表

> 端口为各服务端的**默认端口**，改过时以服务端配置文件为准。「查询端口」是服务器列表/状态探测使用的额外端口，需要它的游戏请再建一条隧道映射。

| 游戏 | 协议 · 游戏端口 | 查询/附加端口 | 开服要点 |
| --- | --- | --- | --- |
| CS2 | UDP 27015 | —— | SteamCMD App 730；公开服需 GSLT |
| CS:GO | UDP 27015 | —— | SteamCMD App 740（srcds） |
| 幻兽帕鲁 Palworld | UDP 8211 | UDP 25575（RCON，可选） | App 2394010；配置文件 `PalWorldSettings.ini`，至少 16GB 内存 |
| 泰拉瑞亚 Terraria | TCP 7777 | —— | 官方自带专用服务端；第三方 TShock 支持插件；有现成 Windows/Linux 服务端 |
| 饥荒联机版 DST | UDP 10999 | UDP 27016（Steam 查询） | 需要在游戏内「我的服务器」生成集群令牌（cluster token）放入存档目录 |
| 方舟生存进化 ARK | UDP 7777 | UDP 27015 | App 376030；内存需求高，建议 16GB+ |
| Valheim 英灵神殿 | UDP 2457 | 2456、2458 一并放行 | 无主界面的命令行服务端，首次启动后编辑配置再重启 |
| Rust 腐蚀 | UDP 28015 | UDP 28016 | App 258550；耗内存，建议 16GB+ |
| 7 日杀 7DTD | TCP 26900 | —— | 启动参数或 serverconfig.xml 指定端口 |
| 异星工厂 Factorio | UDP 34197 | —— | 官方提供 headless 版，存档可与单机互通 |
| 僵尸毁灭工程 PZ | UDP 16261 | UDP 16262 起（每个玩家） | Java 服务端，内存随人数增加 |
| 幸福工厂 Satisfactory | UDP 7777 | UDP 15777（查询） | 官方专用服务端需 Epic/Steam 版本更新到支持版本 |
| 战术小队 Squad | UDP 7787 | UDP 27165 | 服务器配置文件中分别设置游戏与查询端口 |
| 求生之路 2 L4D2 | UDP 27015 | —— | srcds，`-game left4dead2 +map 地图名` |

### 多端口游戏怎么建隧道

以需要「游戏端口 + 查询端口」的游戏为例，在一个 `frpc.toml` 里写两段（协议、端口都以具体游戏为准）：

```toml
[[proxies]]
name = "ark-game"
type = "udp"
localIP = "127.0.0.1"
localPort = 7777
remotePort = 30777

[[proxies]]
name = "ark-query"
type = "udp"
localIP = "127.0.0.1"
localPort = 27015
remotePort = 30778
```

让好友走直连地址；查询端口主要供服务器列表/状态工具使用，**仅朋友直连游玩时很多游戏只映射游戏端口就够**。

## 通用流程小结

1. 用 SteamCMD 下载服务端（或使用游戏自带的 dedicated server）；
2. 先在本机用游戏客户端直连 `127.0.0.1:端口` 验证；
3. 按游戏协议在面板建 tcp/udp 隧道，多端口就多建；
4. frpc 日志确认 `start proxy success`；
5. 好友控制台/直连框输入 `节点IP:远程端口`；
6. 长期开服用 [Linux 可视化面板](./panels) 或 [开机自启](../../advanced/auto-start)，更新游戏时重跑一次 SteamCMD 的 `app_update` 命令即可。

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 公共列表里搜不到服务器 | 穿透环境下正常，让好友用 `connect IP:端口` 直连 |
| 卡在「正在连接」后超时 | 协议选错（UDP 游戏建了 TCP）、端口号不对应、本机防火墙未放行 |
| 提示版本不一致 | 好友客户端与服务端版本不同，SteamCMD 重跑 `app_update <AppID>` 更新服务端 |
| CS2 提示未提供有效令牌 | 加 `+sv_setsteamaccount` 并使用有效的 GSLT |
| 好友能进但频繁丢包 | 上行带宽不足或晚高峰节点拥塞，见[节点线路选型](../../parameters/node-select) |
