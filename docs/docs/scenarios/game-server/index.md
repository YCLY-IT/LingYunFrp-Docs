# 游戏开服联机

用 LingYunFrp 把本地游戏服务器发布到公网，供好友联机。典型场景是《我的世界》（Minecraft）开服。

## 常用方案

- **面板 / 客户端**：直接创建 `tcp` 或 `udp` 隧道，把游戏端口映射出去。
- **frpc 部署**：在服务器上装 frpc 常驻，适合长期开服，见 [frpc 部署示例](./frpc-demo)。
- **私密联机（stcp）**：只有持有相同密钥的双方才能连，见 [frpc 部署示例](./frpc-demo)。

## 子章节

- [面板工具使用](./panel-tool)
- [frpc 部署示例](./frpc-demo)
- [游戏配置样例](./game-example)
- [远程连接与 NAS](./other-usage)
- [安全防护](./security)