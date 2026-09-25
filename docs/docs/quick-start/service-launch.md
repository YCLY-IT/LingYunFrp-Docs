# frpc 服务启动

此类服务一般只在没有图形化界面不作为个人电脑使用时使用。一般是通过SSH连接本地服务器进行下载并启动。

## 下载SSH工具并连接服务器

### 选择SSH工具

- 关于SSH工具的选择有多种.如果您有且使用习惯的SSH服务则可以跳过本小节.

- 如果您没有的话可以根据自己的需求去选择合适的SSH工具。

- 这边选择举例的SSH工具为hexhub。

### 关于 hexhub

[HexHub](https://www.hexhub.cn/) 是一款国产跨平台 SSH/SFTP 客户端，支持 Windows、macOS、Linux 三端，社区版永久免费。

核心能力：

- **SSH 终端**：支持密钥/密码认证、跳板机、X11 转发、SSH 隧道
- **SFTP 文件传输**：内置文件管理器，支持拖拽传输、lrzsz/ZMODEM 协议
- **命令广播**：可同时向多台服务器发送命令，批量运维
- **实时面板**：CPU、内存、网速、磁盘等服务器状态一目了然
- **Docker 管理**：可视化查看容器、镜像、日志和资源占用

对于 LingYunFrp 用户来说，使用 HexHub 连接服务器后，可以直接在终端里下载 frpc、编辑配置文件、启动隧道，同时用 SFTP 管理配置和日志文件。

::: tip 其他 SSH 工具
除了 HexHub，你也可以使用 Xshell、MobaXterm、FinalShell、Termius 等工具，功能类似，选择自己习惯的即可。
:::

### 下载hexhub

- hexhub官网 https://www.hexhub.cn/
- Windows下载链接：XXX
- Linux下载链接：XXX
- Mac OS下载链接：XXX
- 根据你所使用的操作系统选择合适的安装包进行下载并安装。

### 连接服务器

- 1.打开 hexhub 应用

![初始界面](XXX)

- 2.依次点击"创建资产" -> "远程连接" -> "SSH"

![创建资产](XXX)

- 3.填写"SSH配置编辑"

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| 名称 | 此连接在资产列表中的显示名 | `my-server` |
| host | 服务器公网 IP :端口号 | `123.45.67.89:22` |
| 用户名 | 登录用户名 | `root` |
| 密码 | 用户名密码 | `••••••••` |

![SSH配置编辑](XXX)

- 4.点击已创建隧道并查看链接是否正常

![连接正常界面](XXX)

## 在ssh中为服务器安装frpc并启动

### 确认服务器使用的架构并选择对应的安装包

在已连接的SSH服务器上输入以下命令:
```bash
uname -m
```

![确认架构](XXX)

根据输出的架构名称，从下表中选择对应的 frp 安装包。

| `uname -m` 输出 | CPU 架构 | 适用系统 | 文件后缀 |
| --- | --- | --- | --- |
| `x86_64` | AMD64 / Intel 64 | Linux | `_linux_amd64.tar.gz` |
| `aarch64` | ARM64 | Linux | `_linux_arm64.tar.gz` |
| `i686` / `i386` | 386 (32位) | Linux | `_linux_386.tar.gz` |
| `armv7l` | ARM (32位) | Linux | `_linux_arm.tar.gz` |

![架构示例](XXX)

::: ⚠️ 注意
以下所展示的所有方法均以 amd（X86_64）为例
:::

### 安装方式一: 从本电脑上下载压缩包并上传到服务器解压

- 1.打开"frpc GitHub官网"并选择安装包进行下载：

打开此链接并选择合适或最新版本：https://github.com/fatedier/frp/releases/tag

![选择版本](XXX)

下滑找到"Assets"部分，并选择对应的安装包进行安装。

![选择安装包](XXX)

- 2.将下载的安装包通过ssh上传到服务器上并解压

在Hexhub中直接在右侧文件列表中拖入安装包就行

![上传安装包](XXX)

解压安装包命令：

```bash
# 进入你上传压缩包的目录（根据实际情况选择，例如 /root 或 /opt）
cd /root

![进入目录](XXX)

# 解压压缩包
tar -zxvf frp_0.61.1_linux_amd64.tar.gz
```

参数解释：

| 参数 | 含义 |
| --- | --- |
| `-z` | 通过 gzip 解压（对应 `.tar.gz` 格式） |
| `-x` | 提取（extract）文件 |
| `-v` | 显示解压过程中的文件列表（verbose） |
| `-f` | 指定要解压的文件名（file），后面跟文件名 |

![解压安装包](XXX)

解压后会得到一个同名文件夹 `frp_0.61.1_linux_amd64/`，进入后可以找到 `frpc` 可执行文件：

| 文件 | 用途 |
| --- | --- |
| `frpc` | frp 客户端可执行文件（我们需要用的） |
| `frpc.toml` | frpc 的配置文件模板 |
| `frps` | frp 服务端可执行文件（节点方使用，你不需要） |
| `frps.toml` | frps 的配置文件模板 |
| `LICENSE` | 开源协议 |

::: tip 建议的安装路径
解压后建议把 `frpc` 和配置文件放到统一目录方便管理，例如：

```bash
mkdir -p /etc/frp
cp frpc /etc/frp/
cp frpc.toml /etc/frp/
```
:::

- 3.编辑配置文件

由于配置文件相关的内容比较复杂，因此请参考[frpc配置文件](https://github.com/fatedier/frp/blob/master/frpc.toml)进行编辑。

编写/修改文件命令行：
```bash
# 编辑配置文件（路径以实际为准）
vi /etc/frp/frpc.toml
```
解释：
- `vi` 是 vi 编辑器的命令行，用于编辑文件。
- `/etc/frp/frpc.toml` 是 frpc 配置文件的路径，根据实际情况修改。

![编辑配置文件](XXX)

保存和退出：
- 保存：`Ctrl + O`
- 退出：`Ctrl + Q`

![保存退出](XXX)

- 4.启动frpc

```bash
# 启动 frpc 服务（路径以实际为准）
frpc -c /etc/frp/frpc.toml
```

![启动frpc](XXX)

- 5.当然在Hexhub不止有这一种方法你还可以通过Hexhub直接右键解压等操作和配置。你还可以通过在Hexhub中配置ai来给出相关命令来管理和下载frpc。

### 安装方法二: 使用下载命令

- 1.通过wget下载frpc安装包：

```bash
# 进入 /opt 目录
cd /opt
# 下载 frpc 安装包
wget https://github.com/fatedier/frp/releases/download/v0.61.0/frp_0.61.0_linux_amd64.tar.gz
```

参数解释：

| 参数 | 含义 |
| --- | --- |
| `wget` | 命令行下载工具，支持 HTTP/HTTPS/FTP 协议 |
| URL | 要下载文件的完整地址 |

![wget下载](XXX)

- 2.通过curl命令下载安装包（wget不存在时使用）：

```bash
# 进入 /opt 目录
cd /opt
# 下载 frpc 安装包
curl -L -O https://github.com/fatedier/frp/releases/download/v0.61.0/frp_0.61.0_linux_amd64.tar.gz
```

参数解释：

| 参数 | 含义 |
| --- | --- |
| `curl` | 命令行数据传输工具，支持多种协议 |
| `-L` | 跟随重定向（GitHub 会跳转到 CDN，不加会下载到 HTML 页面） |
| `-O` | 使用远程文件名保存到本地（大写字母 O） |
| URL | 要下载文件的完整地址 |

![curl下载](XXX)

- 3.更换镜像源（ GitHub访问慢/下载失败）

国内服务器访问 GitHub 经常很慢或超时，可以在下载链接前加上镜像加速地址。

```bash
# 使用镜像加速下载（以 wget 为例）
wget https://ghproxy.com/https://github.com/fatedier/frp/releases/download/v0.61.0/frp_0.61.0_linux_amd64.tar.gz
```

链接结构说明：

| 部分 | 含义 |
| --- | --- |
| `https://ghproxy.com/` | 镜像加速地址前缀 |
| `https://github.com/fatedier/frp/...` | 原始 GitHub 下载链接 |

::: tip 常用镜像加速地址
镜像加速地址不固定，以下列出常见的几个，任选一个可用即可：

| 镜像地址 | 说明 |
| --- | --- |
| `https://ghproxy.com/` | 最常用，直接加在原链接前面 |
| `https://gh-proxy.com/` | 备用 |
| `https://ghfast.top/` | 备用 |
:::

::: warning 注意
- 镜像加速地址可能随时失效，如果某个不可用就换另一个试试。
- 如果所有镜像都不可用，建议在本地电脑下载后通过 SFTP 上传到服务器，参考[安装方式一](#安装方式一-从本电脑上下载压缩包并上传到服务器解压)。
:::

- 4.其余步骤同上"安装方式一"的解压步骤及以下