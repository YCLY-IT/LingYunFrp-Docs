# 家庭 NAS 远程访问

外地上传照片、查文件、看家里的 Jellyfin/Emby/Plex 影音库、管理下载任务，都可以通过 stcp 连回 NAS。

## 第一步：在 NAS 上跑 frpc（建议 Docker）

主流 NAS 都支持 Docker（群晖叫 Container Manager，威联通叫 Container Station，Unraid/飞牛直接支持），按 [Docker 部署](../../advanced/docker-deploy)安装 snowdreamtech/frpc，配置挂载进容器，重启策略设 always。

![图片占位：群晖 Container Manager 中 frpc 容器配置](./images/nas-docker-frpc.png)

如果 NAS 不能装容器，可以把 frpc 放在同局域网的树莓派/小主机上，`localIP` 填 NAS 的局域网 IP。

## 常见 NAS 服务端口表

以下是各品牌**默认**端口，改过设置的以实际为准。建议按需映射，不要一次裸露全部端口。

| 服务 | 群晖 Synology | 威联通 QNAP | 其他常见 |
| --- | --- | --- | --- |
| 网页后台（HTTP） | 5000 | 8080 | 飞牛 fnOS 5666、Unraid 80/443 |
| 网页后台（HTTPS） | 5001 | 443 | 飞牛 5667 |
| SMB 文件共享 | 445 | 445 | 445 |
| WebDAV | 5005/5006 | 80/443 或自定义 | 按服务设置 |
| 照片（Synology Photos） | 5001（共用后台） | —— | PhotoPrism 2342 |
| 影音 Jellyfin | 8096 | 8096 | 8096 |
| Emby / Plex | Emby 8096；Plex 32400 | 同左 | 同左 |
| 下载器（qBittorrent） | 8080 | 8080 | 8080 |
| 终端 SSH（一般不透） | 22 | 22 | 22 |

## 第二步：用 stcp 映射 web 类服务

家里 frpc（proxy）——映射 NAS 后台和 Jellyfin：

```toml
[[proxies]]
name = "nas-admin"
type = "stcp"
secretKey = "强随机密钥A"
localIP = "192.168.1.10"
localPort = 5000

[[proxies]]
name = "jellyfin"
type = "stcp"
secretKey = "强随机密钥B"
localIP = "192.168.1.10"
localPort = 8096
```

外出的电脑（visitor）：

```toml
[[visitors]]
name = "nas-admin-v"
type = "stcp"
serverName = "nas-admin"
secretKey = "强随机密钥A"
bindAddr = "127.0.0.1"
bindPort = 5000

[[visitors]]
name = "jellyfin-v"
type = "stcp"
serverName = "jellyfin"
secretKey = "强随机密钥B"
bindAddr = "127.0.0.1"
bindPort = 8096
```

启动 visitor 后：

- NAS 后台：浏览器开 `http://127.0.0.1:5000`
- Jellyfin：`http://127.0.0.1:8096`，官方手机/电视 App 在服务器地址里也填 `http://127.0.0.1:8096`（前提是该设备上运行着对应的 frpc visitor）

## 文件怎么传？SMB 445 要不要映射？

**不要把 445 用普通 tcp 暴露到公网**，SMB 协议历史漏洞多、扫描攻击最密集。异地传文件的安全选择：

| 需求 | 方案 |
| --- | --- |
| 电脑在外面存取文件 | stcp 映射 WebDAV 端口，资源管理器/Finder 挂载 WebDAV；或者给 NAS 后台的文件管理器 stcp |
| 手机看照片、查文档 | 用各品牌官方 App + stcp 网页端口，或影音用 Jellyfin/Emby 官方客户端连接 stcp 后的本地地址 |
| 大文件频繁同步 | 等回到家局域网再传，或者用 NAS 自带的 QuickConnect/myQNAPcloud 类官方远程（注意关闭/收紧其公网暴露面） |

## 第三步：NAS 自身的安全设置

即使走 stcp，NAS 账号仍是最后一道门：

1. **禁用 admin 默认账号或改名**，所有账号用强密码，开启两步验证（群晖 DSM、威联通 QTS 都支持 2FA）；
2. 关闭不用的服务和套件；
3. DSM/QTS 自动更新开启，警惕仿冒的勒索套件；
4. 开启登录通知（异地登录邮件/App 通知）和自动封锁（连续失败封 IP）；
5. 定期快照备份重要数据到第二块盘/异地（勒索软件不影响 stcp 安全性，但 NAS 是高发目标，别省备份）。

![图片占位：群晖自动封锁与 2FA 设置页](./images/nas-security.png)

## 其他家庭存储相关需求

| 需求 | 建议做法 |
| --- | --- |
| 想看 Plex 自动匹配外网播放 | Plex 自带远程访问机制（可独立启用或关闭），与 frp 二选一即可，不必叠加 |
| 家庭文档协作（Nextcloud 等） | stcp 或 http 隧道 + 域名 + HTTPS（参考[部署网站](../website-deploy/)）；仅自用首选 stcp |
| 容器管理面（Portainer 9000） | stcp 即可，不上公网 |
| 监控面板（Grafana 3000） | stcp 或加密码页 |
| CasaOS / Portainer 管理入口 | stcp，按敏感管理面对待，不上公网 |
