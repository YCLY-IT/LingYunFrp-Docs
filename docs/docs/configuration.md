# 配置参考

这一页讲两件事：frpc 的配置长什么样，以及创建隧道时可以填哪些参数。

一般不用手写配置，面板的「创建隧道」在你创建完隧道之后隧道配置这里可以生成好内容，复制下来到配置文件（frpc.toml）即可。

## frpc 配置

frp v0.5x 及以上用 toml 格式：

```toml title="frpc.toml"
serverAddr = "hz.example.com"
serverPort = 7000
user = "abcd1234efgh5678"       # 你的 FRP Token

# 心跳与重连
transport.heartbeatInterval = 30
transport.heartbeatTimeout = 90
transport.tcpMuxKeepaliveInterval = 30
transport.dialServerTimeout = 10

loginFailExit = false           # 登录失败不退出，持续重试

[auth]
method = "token"
token = "abcd1234efgh5678"

[[proxies]]
name = "web_tunnel"             # 隧道名，在你的账号下要唯一
type = "tcp"
localIP = "127.0.0.1"
localPort = 8080
remotePort = 13578
transport.useEncryption = true
transport.useCompression = true
transport.bandwidthLimit = "10MB"

[[proxies]]
name = "ssh_tunnel"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 13579
```

老版本 frp（≤ v0.4x）用 ini 格式：

```ini
[common]
server_addr = hz.example.com
server_port = 7000
user = abcd1234efgh5678
token = abcd1234efgh5678
login_fail_exit = false

[web_tunnel]
type = tcp
local_ip = 127.0.0.1
local_port = 8080
remote_port = 13578
use_encryption = true
use_compression = true
```

frpc 与节点的 frp 主版本号建议一致（例如同为 v0.61.x），否则可能会出现握手失败或报字段不识别。

## 隧道类型

| 类型 | 说明 | 必填字段 | 常见用途 |
| --- | --- | --- | --- |
| `tcp` | 通用 TCP 转发 | `remotePort` | SSH、数据库、任意 TCP 服务 |
| `udp` | 通用 UDP 转发 | `remotePort` | DNS、游戏服务器、QUIC |
| `http` | 按域名转发 HTTP | `domain` | 多个站点共用 80 端口 |
| `https` | 按域名转发 HTTPS | `domain` | 需要 SNI 路由的站点 |
| `stcp` | 加密 TCP，两端都要装 frpc | `secretKey` | 只给自己用的私密服务 |
| `xtcp` | 点对点打洞，流量不经节点 | `secretKey` | 大流量传输，成功率取决于 NAT 类型 |

`http` 类型的例子：

```toml
[[proxies]]
name = "blog"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
customDomains = ["blog.example.com"]
```

把 `blog.example.com` 解析到节点 IP，访问时不用带端口。

`stcp` 的例子 —— 只有持有相同密钥的 frpc 才能连：

```toml
# 请求方（你要玩MC的电脑）
[[proxies]]
name = "secret_mc"
type = "stcp"
secretKey = "a-strong-shared-key"
localIP = "127.0.0.1"
localPort = 25565   # MC服务端默认端口
```

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

配置生效后，您就可以在**请求方（你要玩MC的电脑）** 本地通过以下地址，连到**提供方（开MC服务器的电脑）** 的 MC 房间啦：

```bash
127.0.0.1:25566
```

在MC客户端里直接输入 `127.0.0.1:25566` 就能进入游戏。

## 带宽单位换算

面板上的带宽单位是 **Mbps**，frpc 配置里的 `bandwidthLimit` 默认是 **MB/s**。

```
8 Mbps = 1 MB/s
```

可以通过管理面板中编辑隧道或创建隧道的 `ipLimitIn（进站带宽）`、`ipLimitOut（出站带宽）`来限制每个IP的连接带宽限制。
