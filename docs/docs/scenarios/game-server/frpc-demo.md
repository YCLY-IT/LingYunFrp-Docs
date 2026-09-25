# frpc 部署示例

《我的世界》私密联机的 stcp 示例 —— 只有持有相同密钥的 frpc 才能连。

## 请求方（你要玩 MC 的电脑）

```toml
# 请求方（你要玩MC的电脑）
[[proxies]]
name = "secret_mc"
type = "stcp"
secretKey = "a-strong-shared-key"
localIP = "127.0.0.1"
localPort = 25565   # MC服务端默认端口
```

## 提供方（开 MC 服务器的电脑）

```toml
# 提供方（开MC服务器的电脑）
[[visitors]]
name = "secret_mc_visitor"
type = "stcp"
serverName = "secret_mc"          # 对应请求方的 name
secretKey = "a-strong-shared-key" # 密钥必须完全一致
bindAddr = "127.0.0.1"
bindPort = 25566                  # 本地访问端口，可以随便改
```

配置生效后，在**请求方（你要玩 MC 的电脑）**本地访问：

```bash
127.0.0.1:25566
```

在 MC 客户端里直接输入 `127.0.0.1:25566` 就能进入游戏。

::: tip 通用 TCP/UDP
不需要私密、只想快速开服，直接用 `tcp` 或 `udp` 类型即可，见[服务端参数](../../parameters/server-params#隧道类型)。
:::