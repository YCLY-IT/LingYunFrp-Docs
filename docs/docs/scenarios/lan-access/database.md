# 家庭数据库端口开放

在家里 NAS / 小主机上跑数据库（记账、Home Assistant、自建服务的后端），人在外面想连回去查询或维护。

## 核心原则：数据库端口绝不直接上公网

::: danger 🔥 3306 / 5432 / 6379 / 27017 不要用普通 tcp 暴露
公网上针对数据库端口的扫描是 7×24 不间断的：弱密码爆破、未授权访问漏洞、勒索删库是最常见的后果。历史上 Redis（6379）未授权访问导致服务器被写入 SSH 公钥、MySQL 被勒索删库的案例极多。
**远程连数据库只用 stcp（或 VPN/SSH 隧道），没有例外。**
:::

## 常见数据库默认端口

| 数据库 | 默认端口 | 连接前需要确认 |
| --- | --- | --- |
| MySQL / MariaDB | TCP 3306 | 账号允许远程主机、已设密码 |
| PostgreSQL | TCP 5432 | `pg_hba.conf` 放行了来源、`listen_addresses` 正确 |
| Redis | TCP 6379 | **必须设置 requirepass**，新版默认只监听 127.0.0.1 |
| MongoDB | TCP 27017 | 已开启鉴权（authorization: enabled） |
| SQL Server | TCP 1433 | 使用强密码的 SQL 认证或域认证 |
| SQLite | 无网络端口 | 它是文件数据库，不需要映射，远程通过应用层访问 |
| InfluxDB（1.x / 2.x） | 8086 | 2.x 默认带 token 鉴权，仍建议 stcp |

## 配置 stcp

家里 frpc（proxy），以 MySQL 为例：

```toml
[[proxies]]
name = "home-mysql"
type = "stcp"
secretKey = "强随机密钥"
localIP = "192.168.1.10"     # 数据库主机的局域网 IP
localPort = 3306
```

外出电脑（visitor）：

```toml
[[visitors]]
name = "home-mysql-visitor"
type = "stcp"
serverName = "home-mysql"
secretKey = "强随机密钥"
bindAddr = "127.0.0.1"
bindPort = 13306             # 故意避开本地常用端口，防止与本机数据库冲突
```

之后数据库客户端（Navicat、DBeaver、DataGrip、命令行）连接的是**本机地址**：

```bash
mysql -h 127.0.0.1 -P 13306 -u youruser -p
```

```mermaid
flowchart LR
    A["DBeaver/Navicat<br/>连 127.0.0.1:13306"] --> B["visitor frpc"]
    B --> N["节点"] --> C["家里 proxy frpc"]
    C --> D["MySQL 192.168.1.10:3306"]
```

## 数据库侧的必要配置

隧道解决了「谁能连到端口」，数据库自身的账号安全同样不能省：

1. **监听地址**：数据库只需监听局域网/本地。Redis、较新版本 MySQL 默认 `127.0.0.1`，如果与 frpc 不在同一台机器，改为监听局域网 IP 即可，**不要**因为「方便」改成 `0.0.0.0` 后直接裸奔（stcp 场景下 frpc 从局域网访问，监听内网网卡足够）；
2. **强密码 + 最小权限**：远程账号只授予需要的库权限，不用 root 远程登录；
3. MySQL 远程授权示例（按实际替换）：

   ```sql
   CREATE USER 'appuser'@'192.168.1.%' IDENTIFIED BY '强密码';
   GRANT SELECT, INSERT, UPDATE, DELETE ON appdb.* TO 'appuser'@'192.168.1.%';
   FLUSH PRIVILEGES;
   ```

4. PostgreSQL 需在 `postgresql.conf` 设置 `listen_addresses = 'localhost,192.168.x.x'`，并在 `pg_hba.conf` 放行对应内网来源；
5. Redis 写入 `requirepass 你的强密码`，并关闭 `CONFIG` 等危险命令的滥用（重命名或禁用）；
6. 重要数据库开启定期备份（mysqldump / pg_dump / 数据库自带快照），备份文件离线保存。

## 比「远程直连数据库」更好的方式

多数时候你不需要把数据库端口挂在外面：

| 实际需求 | 更推荐的方式 |
| --- | --- |
| 在外面用图形客户端查数据 | stcp（本页方案），用完可停掉 visitor |
| 让公网网站/App 使用这个库 | **不要**让公网应用直连家庭数据库；应把应用也部署到数据库附近，或用带鉴权的 API（HTTPS）中转 |
| 临时排查一次问题 | 先 SSH/RDP 进内网机器（stcp），再在机器本机连 127.0.0.1 的数据库，多一层跳板、少一个暴露面 |
| 多人协作开发 | 数据库放到云服务器或托管数据库服务，配合白名单/VPN，不用家庭宽带承载 |

## 常见问题

| 现象 | 排查 |
| --- | --- |
| 客户端连接被拒绝 | visitor 是否在运行、bindPort 是否被本机其他程序占用（换一个如 13306） |
| 提示 Access denied | 数据库账号的允许主机/权限问题，不是隧道问题 |
| MySQL 报 2003/10060 | 数据库监听地址不含 frpc 所在网卡，或局域网防火墙拦截 3306 |
| Redis 连上但无响应/报 NOAUTH | 正常，先 `AUTH 密码`；没有密码说明配置不完整，立即补上 |
| 担心密钥泄露 | 立即更换 stcp `secretKey` 并修改数据库密码，重启双方 frpc |
