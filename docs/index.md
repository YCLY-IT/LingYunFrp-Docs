---
layout: home

hero:
  name: LingYunFrp
  text: 内网穿透
  tagline: 免费、易用、安全、稳定、快速、极低占用
  image:
    src: /logo.svg
    alt: LingYunFrp
    width: 200
    height: 200
  actions:
    - theme: brand
      text: 快速开始
      link: /docs/quick-start
    - theme: alt
      text: 开发文档
      link: /develop/api

features:
  - title: 高性能
    details: 我们采用Go作为后端，采用了高性能并发的框架来优化延迟和性能。
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'

  - title: 安全可靠
    details: 隧道可开启传输加密，Token 随时重置。
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>'

  - title: 简单易用
    details: 在客户端上创建完隧道就可以直接启动隧道。
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>'

  - title: 实时监控
    details: 节点负载、隧道是否在线、流量曲线，在面板上直接看。
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'

  - title: 多协议支持
    details: TCP、UDP、HTTP、HTTPS、STCP、XTCP 都能建，按场景选。
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'

  - title: 多平台兼容
    details: frpc 支持 Windows、Linux、macOS，也能跑在 Docker 和路由器上。
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="13" height="9" rx="1.5"/><path d="M5 18h7M9 14v4"/><rect x="17" y="9" width="5" height="9" rx="1.5"/><path d="M19.5 20.5h.01"/></svg>'
---

<Stats />
