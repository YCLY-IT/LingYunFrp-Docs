# 常用服务与远程管理

远程桌面帮家里电脑处理问题、SSH 上服务器敲命令、在外面控制 Home Assistant 和智能家居——这些是内网映射中最常用、也最敏感的一类。

## 常用端口速查

| 需求 | 系统/服务 | 默认端口 · 协议 |
| --- | --- | --- |
| Windows 远程桌面 RDP | Windows 专业版/服务器 | 3389 · TCP |
| SSH 远程终端 | Linux / NAS | 22 · TCP |
| macOS 屏幕共享（VNC） | macOS | 5900 · TCP |
| Home Assistant 首页 | HAOS / HA Container | 8123 · TCP（HTTP） |
| 路由器管理后台 | OpenWrt/iStoreOS 等 | 80/443（如 192.168.1.1） |
| 网络摄像头/NVR | 各品牌 | 80/554(RTSP)/厂商私有 |
| 打印机管理页 | 网络打印机 | 80/631（IPP） |
| 开发服务临时联调 | Node/Vite 等 | 3000/5173 等自定义 |

全部建议用 `stcp`，原因与完整模板见[本类首页](./)。下面给出几个重点场景的配置。

## 远程桌面（Windows RDP）

家里 frpc（proxy）：

```toml
[[proxies]]
name = "home-rdp"
type = "stcp"
secretKey = "强随机密钥"
localIP = "127.0.0.1"   # frpc 就在被远程的电脑上；在别的设备上就填该电脑局域网 IP
localPort = 3389
```

外出电脑（visitor）：

```toml
[[visitors]]
name = "home-rdp-visitor"
type = "stcp"
serverName = "home-rdp"
secretKey = "强随机密钥"
bindAddr = "127.0.0.1"
bindPort = 13389
```

使用：visitor 启动后，打开「远程桌面连接（mstsc）」，计算机填 `127.0.0.1:13389`，再输入家里 Windows 的账号密码。

![图片占位：mstsc 连接 127.0.0.1:13389](./images/rdp-mstsc.png)

被远程电脑侧的设置：

- 系统为 Windows **专业版/企业版**（家庭版没有官方 RDP 服务端）；
- 「设置 → 系统 → 远程桌面」开启远程桌面；
- 账户设置密码（空密码默认禁止 RDP 登录），建议使用微软账户或强密码本地账户；
- 电源设置为「永不睡眠」，否则睡死后连不上。

## SSH（Linux / NAS）

```toml
# 家里 proxy
[[proxies]]
name = "home-ssh"
type = "stcp"
secretKey = "强随机密钥"
localIP = "192.168.1.20"
localPort = 22

# 外出 visitor：bindPort 用 2222 等
[[visitors]]
name = "home-ssh-visitor"
type = "stcp"
serverName = "home-ssh"
secretKey = "强随机密钥"
bindAddr = "127.0.0.1"
bindPort = 2222
```

连接：

```bash
ssh -p 2222 用户名@127.0.0.1
```

加固建议：禁用密码登录、只允许密钥登录（`PasswordAuthentication no` + `ssh-copy-id`）；不需要 root 直接登录。

## Home Assistant / 智能家居

```toml
[[proxies]]
name = "home-assistant"
type = "stcp"
secretKey = "强随机密钥"
localIP = "192.168.1.30"
localPort = 8123
```

外出电脑 visitor 绑定 18123 后，浏览器访问 `http://127.0.0.1:18123`，HA 手机 App 的服务器地址同样填它（需在运行 visitor 的设备/同机网络环境下使用）。

更省心的替代：HA 官方提供 **Nabu Suite（Home Assistant Cloud）** 付费远程服务，开箱即用、带语音云集成；不想自己维护 stcp 可以用它。摄像头管理同理——**优先厂商带端到端加密的官方远程（P2P 私有云）**，自建时务必 stcp 并改默认密码，摄像头画面是高度隐私内容。

## 路由器 / 打印机 / 其他 IoT

- 路由器后台（80/443）：只有刷固件、改配置时才需要，临时 stcp 映射、用完即停；不要长期开放；
- 打印机 631/80：几乎没有远程使用的必要，需要打印可走云打印（如各品牌 App）；
- 所有 IoT 设备统一原则：改默认密码、关闭 WAN 管理、能 stcp 不 tcp。

## 一条 frpc 管理所有内网服务

把常用访问整合成一份 visitor 配置，开机自启（[开机自启](../../advanced/auto-start)），外出办公体验和在家接近：

```toml
[[visitors]]
name = "rdp"
type = "stcp"
serverName = "home-rdp"
secretKey = "强随机密钥"
bindAddr = "127.0.0.1"
bindPort = 13389

[[visitors]]
name = "ssh"
type = "stcp"
serverName = "home-ssh"
secretKey = "强随机密钥"
bindAddr = "127.0.0.1"
bindPort = 2222

[[visitors]]
name = "ha"
type = "stcp"
serverName = "home-assistant"
secretKey = "强随机密钥"
bindAddr = "127.0.0.1"
bindPort = 18123
```

## stcp 与 xtcp 怎么选

| 类型 | 流量路径 | 特点 |
| --- | --- | --- |
| stcp | 访问者 → 节点 → 你家 | 稳定、穿透成功率高，流量经过节点，消耗节点流量 |
| xtcp（P2P） | 打洞成功后访问者 ↔ 你家直连 | 延迟低、不走节点流量；但双方 NAT 类型不好时打洞失败，会自动回退或无法连通 |

家里和外出地都是普通家宽、追求稳定 → stcp；两端网络条件好、想省延迟省流量 → 可以试 xtcp，配置字段的对应关系见[服务端参数](../../parameters/server-params)。

## 安全清单

- [ ] 3389/22/5900/8123/后台页面全部走 stcp，无普通 tcp
- [ ] visitor 用的电脑设置了开机密码/磁盘加密（笔记本丢失即等于泄露入口）
- [ ] secretKey 不写进聊天记录、不提交到 Git
- [ ] Windows/Linux/NAS 账户都是强密码、有更新补丁
- [ ] 不常用的映射用完即关（面板可一键停用隧道）
