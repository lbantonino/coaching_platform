// Service worker de Coory : alertes des séances (D-205). Il ne met RIEN en cache (pas de hors-ligne) :
// il reçoit une notification « push » et l'affiche ; un toucher ouvre la page de la séance.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Coory", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/coach" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Seulement une page de Coory.
  const target = new URL(event.notification.data?.url || "/coach", self.location.origin);
  const url = target.origin === self.location.origin ? target.href : self.location.origin;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
