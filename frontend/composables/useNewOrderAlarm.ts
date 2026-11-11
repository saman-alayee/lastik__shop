/**
 * Polls for newly created orders in the admin panel.
 * Shows toast + banner + sound; unlocks audio after first user gesture.
 * Shared singleton state so header badge and settings toggle stay in sync.
 */
import { SITE_NAME } from '~/constants/site';

const STORAGE_KEY = 'admin-order-alarm-last-seen';
const ENABLED_KEY = 'admin-order-alarm-enabled';

const enabled = ref(true);
const lastSeenAt = ref<number | null>(null);
const pendingCount = ref(0);
const latestAlert = ref<{ orderNumber: string; id: string } | null>(null);
const audioUnlocked = ref(false);

let timer: ReturnType<typeof setInterval> | null = null;
let audioCtx: AudioContext | null = null;
let started = false;
let hydrated = false;

function readEnabled(): boolean {
  if (!import.meta.client) return true;
  const raw = localStorage.getItem(ENABLED_KEY);
  if (raw == null) return true;
  return raw === '1' || raw === 'true';
}

function writeEnabled(value: boolean) {
  if (!import.meta.client) return;
  localStorage.setItem(ENABLED_KEY, value ? '1' : '0');
}

function readStoredSeen(): number | null {
  if (!import.meta.client) return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function writeStoredSeen(ts: number) {
  if (!import.meta.client) return;
  sessionStorage.setItem(STORAGE_KEY, String(ts));
}

export function useNewOrderAlarm() {
  const api = useApi();
  const toast = useToast();
  const authStore = useAuthStore();
  const router = useRouter();

  if (!hydrated && import.meta.client) {
    enabled.value = readEnabled();
    hydrated = true;
  }

  function unlockAudio() {
    if (!import.meta.client || audioUnlocked.value) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = audioCtx ?? new Ctx();
      void audioCtx.resume().then(() => {
        audioUnlocked.value = true;
      });
    } catch {
      // ignore
    }
  }

  function playAlarm() {
    if (!enabled.value) return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtx ?? new Ctx();
      audioCtx = ctx;
      void ctx.resume();
      const now = ctx.currentTime;
      [0, 0.2, 0.4, 0.6].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = i % 2 === 0 ? 920 : 700;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
      });
    } catch {
      // ignore audio failures (autoplay policies)
    }
  }

  function showBrowserNotification(orderNumber: string) {
    if (!enabled.value) return;
    if (!import.meta.client || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      const n = new Notification(`سفارش جدید — ${SITE_NAME}`, {
        body: `شماره سفارش: ${orderNumber}`,
        tag: `order-${orderNumber}`,
        dir: 'rtl',
        lang: 'fa',
      });
      n.onclick = () => {
        window.focus();
        void router.push('/admin/orders');
        n.close();
      };
    } catch {
      // ignore
    }
  }

  async function requestNotificationPermission() {
    if (!import.meta.client || typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => undefined);
    }
  }

  async function refreshPendingCount() {
    if (!authStore.isLoggedIn || !authStore.isAdmin) return;
    try {
      const { data } = await api.get<{
        orders: { newOrders: number; reviewing: number };
      }>('/admin/stats');
      pendingCount.value = (data.orders?.newOrders ?? 0) + (data.orders?.reviewing ?? 0);
    } catch {
      // silent
    }
  }

  async function check() {
    if (!authStore.isLoggedIn || !authStore.isAdmin) return;
    try {
      await refreshPendingCount();

      const { data } = await api.get<{
        orders: { id: string; createdAt: string; orderNumber: string; status: string }[];
      }>('/admin/orders?limit=8');

      const orders = data.orders ?? [];

      if (!orders.length) {
        lastSeenAt.value ??= Date.now();
        writeStoredSeen(lastSeenAt.value);
        return;
      }

      const maxTs = Math.max(...orders.map((o) => new Date(o.createdAt).getTime()));
      const baseline = lastSeenAt.value ?? readStoredSeen();

      if (baseline == null) {
        lastSeenAt.value = maxTs;
        writeStoredSeen(maxTs);
        return;
      }

      const fresh = orders.filter((o) => new Date(o.createdAt).getTime() > baseline);
      if (fresh.length && enabled.value) {
        const newest = fresh[0];
        latestAlert.value = { orderNumber: newest.orderNumber, id: newest.id };
        playAlarm();
        toast.success(
          fresh.length === 1
            ? `سفارش جدید: ${newest.orderNumber}`
            : `${fresh.length} سفارش جدید ثبت شد`
        );
        showBrowserNotification(newest.orderNumber);
      }

      lastSeenAt.value = Math.max(baseline, maxTs);
      writeStoredSeen(lastSeenAt.value);
    } catch {
      // silent — panel may be offline briefly
    }
  }

  function dismissAlert() {
    latestAlert.value = null;
  }

  function openOrders() {
    dismissAlert();
    void navigateTo('/admin/orders?status=NEW');
  }

  function setEnabled(value: boolean) {
    enabled.value = value;
    writeEnabled(value);
    if (value) {
      unlockAudio();
      void requestNotificationPermission();
      void check();
    } else {
      latestAlert.value = null;
    }
  }

  function start() {
    if (!import.meta.client || started) return;
    started = true;
    enabled.value = readEnabled();
    lastSeenAt.value = readStoredSeen();
    void check();
    timer = setInterval(check, 8000);
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }

  function stop() {
    // Shared singleton — don't tear down on a single component unmount.
  }

  onMounted(start);

  watch(enabled, (on) => {
    writeEnabled(on);
    if (on) {
      unlockAudio();
      void requestNotificationPermission();
      void check();
    }
  });

  return {
    enabled,
    pendingCount,
    latestAlert,
    audioUnlocked,
    check,
    playAlarm,
    dismissAlert,
    openOrders,
    unlockAudio,
    requestNotificationPermission,
    setEnabled,
    stop,
  };
}
