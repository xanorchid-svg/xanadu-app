/* Xanadu phone notifications. Loaded into the app's service worker (see vite.config.ts → workbox.importScripts). */
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'Xanadu', body: event.data ? event.data.text() : '' } }
  const title = data.title || 'Xanadu'
  event.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png?v=2',
      badge: '/icon-192.png?v=2',
      tag: data.tag || undefined,
      renotify: !!data.tag,
      data: { url: data.url || '/' },
    })
    if (typeof data.badge === 'number' && self.navigator && self.navigator.setAppBadge) {
      try { data.badge > 0 ? await self.navigator.setAppBadge(data.badge) : await self.navigator.clearAppBadge() } catch { /* not supported */ }
    }
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of wins) {
      if ('focus' in w) { await w.focus(); if ('navigate' in w) await w.navigate(url); return }
    }
    await self.clients.openWindow(url)
  })())
})
