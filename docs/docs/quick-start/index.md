# 快速开始

首先，欢迎您使用 LingYunFrp
其次，作为frp工具，将从这篇文档开始将为您详细介绍LingYunFrp的安装、配置、使用。

市面上所有你见到的frp项目都是通过frp+多租客流量控制+web图形化界面来管理和监控隧道的。本质是是对frps和frpc的封装。因此在你会使用任何一款frp项目时，并不需要再去学习其他的frp项目。但更重要的是会解决在使用时所出现的问题。

## 开始前的准备

- 📌 一个可以正常联网的电脑或服务器
- 📌 明确自身需求并可以根据需求自主选择隧道
- 📌 明确端口暴露的后果

## 什么是frps/frpc

frp 分为服务端 **frps** 和客户端 **frpc**。frps 运行在有公网 IP 的节点上，frpc 运行在你内网的机器上。两者建立隧道后，公网用户就能通过 frps 访问到你内网的服务。

```mermaid
flowchart LR
    Visitor["🌐 公网访问者"]
    FRPS["🖥️ frps<br/>（服务端·公网节点）"]
    FRPC["💻 frpc<br/>（客户端·内网机器）"]
    Service["⚙️ 本地服务<br/>127.0.0.1:8080"]

    Visitor --"访问 节点域名:远程端口"--> FRPS
    FRPS --"隧道转发"--> FRPC
    FRPC --"转发到本地"--> Service
    Service --"响应"--> FRPC
    FRPC --"原路返回"--> FRPS
    FRPS --"响应"--> Visitor
```

整个连接建立的过程如下：

```mermaid
sequenceDiagram
    participant V as 🌐 公网访问者
    participant S as 🖥️ frps（服务端）
    participant C as 💻 frpc（客户端）
    participant L as ⚙️ 本地服务

    C->>S: 1. 建立连接（携带 Token 鉴权）
    S-->>C: 2. 鉴权通过，连接建立
    C->>S: 3. 注册隧道（本地端口 → 远程端口）
    S-->>C: 4. 隧道注册成功

    V->>S: 5. 访问 节点域名:远程端口
    S->>C: 6. 转发请求
    C->>L: 7. 转发到 127.0.0.1:本地端口
    L-->>C: 8. 响应数据
    C-->>S: 9. 原路返回
    S-->>V: 10. 响应数据
```

## 我们都做了什么

原生的 frp 只是一个命令行工具：你手写配置、手动启动、看不到面板。FRP 厂商在 frp 之上加了一整套 Web 服务，让普通用户也能轻松管理隧道。

```mermaid
flowchart TB
    subgraph 用户侧
        Browser["🌐 浏览器面板"]
        Client["💻 桌面客户端"]
        FRPC["⚙️ frpc"]
    end

    subgraph 厂商服务端
        Panel["🖥️ Web 后台<br/>用户/隧道/节点管理"]
        API["🔌 开放 API<br/>RESTful 接口"]
        Auth["🔐 认证系统<br/>登录/注册/实名/Token"]
        Traffic["📊 流量审计<br/>多租户计量/限速"]
        Monitor["📈 节点监控<br/>在线/负载/健康"]
        Pay["💳 订单支付<br/>套餐/续费"]
    end

    subgraph 节点集群
        FRPS1["frps 节点 A"]
        FRPS2["frps 节点 B"]
        FRPS3["frps 节点 C"]
    end

    Browser --> Panel
    Client --> Panel
    Panel --> API
    API --> Auth
    API --> Traffic
    Panel --> Monitor
    Panel --> Pay
    Monitor --> FRPS1
    Monitor --> FRPS2
    Monitor --> FRPS3
    FRPC -.->|连接| FRPS1
    FRPC -.->|连接| FRPS2
    FRPC -.->|连接| FRPS3
```

厂商在原生 frp 基础上增加了以下核心能力：

| 能力 | 说明 |
| --- | --- |
| **Web 面板** | 图形化创建/编辑/删除隧道，无需手写配置文件 |
| **多租户隔离** | 每个用户有自己的 Token、隧道配额、流量配额，互不干扰 |
| **流量计量与限速** | 按用户/隧道统计上下行流量，按用户组限制带宽 |
| **节点管理** | 统一监控多个 frps 节点的在线状态、负载、可用端口 |
| **认证体系** | 注册/登录/邮箱验证/实名认证/Token 签发 |
| **开放 API** | RESTful 接口，支持程序化创建隧道、查询状态、拉取配置 |
| **订单与支付** | 套餐购买、流量充值、到期续费 |

以 LingYunFrp 为例，开放 API 覆盖以下模块：

```mermaid
mindmap
  root((LingYunFrp API))
    公共
      首页统计数据
    认证
      登录/注册/登出
      密码找回
    验证码
      邮箱/手机验证码
    用户
      资料/头像/Token
      流量查询
    签到
      每日签到领积分
    实名认证
      三要素实名
    隧道
      创建/删除/编辑
      拉取 frpc 配置
    订单与支付
      下单/查询/回调
    公共信息
      公告/用户组/下载源
    我的日志
      操作日志
```

API 的完整文档见 [API 文档](/develop/api)，可通过侧边栏按模块浏览。

用户使用 LingYunFrp 的完整流程如下：

```mermaid
sequenceDiagram
    participant U as 用户
    participant P as 面板/API
    participant A as 认证系统
    participant T as 流量审计
    participant N as 节点监控
    participant F as frps 节点
    participant C as 本机 frpc

    U->>P: 1. 注册账号
    P->>A: 签发 Token
    A-->>U: 2. 获取 Token

    U->>P: 3. 创建隧道（选节点/端口/类型）
    P->>N: 检查节点可用性
    N-->>P: 节点在线、端口可用
    P-->>U: 4. 隧道创建成功

    U->>P: 5. 拉取 frpc 配置
    P-->>U: 6. 返回配置（含 Token/节点地址/端口）

    U->>C: 7. 写入配置并启动 frpc
    C->>F: 8. 携带 Token 连接 frps
    F->>A: 验证 Token
    A-->>F: 9. 鉴权通过
    F-->>C: 10. 隧道上线

    loop 运行期间
        F->>T: 上报流量数据
        T->>P: 更新用户流量统计
    end

    U->>P: 11. 查看隧道状态/流量
    P-->>U: 12. 返回实时数据
```

## 三种启动方式

| 方式 | 适用场景 |
| --- | --- |
| [网页启动隧道](./web-launch) | 在面板上创建隧道，本机仍需连接 frpc / 客户端 |
| [客户端启动隧道](./client-launch) | 桌面端下载客户端，图形界面直接管理 |
| [frpc 服务启动](./service-launch) | Linux 服务器、无图形界面，安装 frpc 常驻 |

## 阅读顺序

- 第一次用：[网页启动隧道](./web-launch) → [客户端启动隧道](./client-launch)
- 需要手写配置：[配置文件说明](../parameters/config-file)
- 拿不准名词：[术语对照表](../appendix/glossary)
