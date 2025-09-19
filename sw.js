// Service Worker for 小手机 PWA
const CACHE_NAME = 'xiaoshouji-v1.0.0';
const urlsToCache = [
  './mobile-chat.html',
  './mobile-chat.js',
  './manifest.json',
  './示例角色卡片.json',
  './示例世界书.json'
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('所有文件已缓存');
        return self.skipWaiting();
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 已激活');
      return self.clients.claim();
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有，直接返回
        if (response) {
          return response;
        }

        // 否则发起网络请求
        return fetch(event.request).then((response) => {
          // 检查是否是有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          // 添加到缓存
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // 网络请求失败时的降级处理
          if (event.request.destination === 'document') {
            return caches.match('./mobile-chat.html');
          }
        });
      })
  );
});

// 处理消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('后台同步触发');
    // 这里可以处理离线时的数据同步
  }
});

// 推送通知
self.addEventListener('push', (event) => {
  console.log('收到推送消息');
  
  const options = {
    body: event.data ? event.data.text() : '你有新消息',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="%23667eea" rx="20"/><text y="140" font-size="120" text-anchor="middle" x="96" fill="white">📱</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="%23667eea" rx="10"/><text y="65" font-size="60" text-anchor="middle" x="48" fill="white">📱</text></svg>',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看消息',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      },
      {
        action: 'close',
        title: '关闭',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('小手机', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  console.log('通知被点击');
  event.notification.close();

  if (event.action === 'explore') {
    // 打开应用
    event.waitUntil(
      clients.openWindow('./mobile-chat.html')
    );
  } else if (event.action === 'close') {
    // 关闭通知
    event.notification.close();
  } else {
    // 默认行为：打开应用
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === './mobile-chat.html' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./mobile-chat.html');
        }
      })
    );
  }
});

// 处理通知关闭
self.addEventListener('notificationclose', (event) => {
  console.log('通知被关闭');
});

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker 错误:', event.error);
});

// 未处理的Promise拒绝
self.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});

console.log('Service Worker 已加载');
