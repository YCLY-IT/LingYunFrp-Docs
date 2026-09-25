# 部署网站

把本地 Web 服务发布到公网，并绑定自己的域名。

常见步骤：

1. 本地起好 Web 服务（如 `127.0.0.1:8080`）
2. 创建 `http` 或 `https` 隧道，绑定域名
3. 把域名解析到节点 IP，见[域名解析](./dns-resolve)
4. 需要 HTTPS 时配置证书，见 [SSL 证书](./ssl-cert)

## 子章节

- [建站工具对接](./site-tool)
- [域名解析](./dns-resolve)
- [SSL 证书](./ssl-cert)