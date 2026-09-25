# 域名解析

`http` 类型隧道按域名转发，需要把域名解析到节点 IP。

```toml
[[proxies]]
name = "blog"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
customDomains = ["blog.example.com"]
```

把 `blog.example.com` 解析到节点 IP，访问时就不用带端口。

## 解析步骤

1. 在域名服务商处添加 A 记录，指向节点 IP
2. 等待解析生效（通常几分钟）
3. 用浏览器访问 `http://blog.example.com` 验证