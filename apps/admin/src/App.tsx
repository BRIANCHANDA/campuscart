import {
  useCallback, useEffect, useMemo, useState,
  type FormEvent, type JSX, type ReactNode,
} from "react";
import {
  adminApi, ApiError, formatKwacha, hasToken,
  type CourierRow, type PayoutRow, type ShopRow,
} from "./api";

/* ============================================================ icons ====== */
type IconProps = { size?: number; stroke?: number };
const svg = (d: ReactNode, { size = 18, stroke = 2 }: IconProps = {}): JSX.Element => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >{d}</svg>
);

const IconCart = (p?: IconProps): JSX.Element => svg(
  <>
    <path d="M2 3h2.2l2.1 12.4a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6" />
    <circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" />
    <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" />
  </>, p);
const IconGrid = (p?: IconProps): JSX.Element => svg(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>, p);
const IconStore = (p?: IconProps): JSX.Element => svg(<path d="M3 9l1.5-5h15L21 9M4 9v10h16V9M4 9h16" />, p);
const IconShield = (p?: IconProps): JSX.Element => svg(
  <><path d="M9 12l2 2 4-4" /><path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6z" /></>, p);
const IconCard = (p?: IconProps): JSX.Element => svg(
  <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>, p);
const IconMail = (p?: IconProps): JSX.Element => svg(
  <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>, p);
const IconLock = (p?: IconProps): JSX.Element => svg(
  <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>, p);
const IconEye = (p?: IconProps): JSX.Element => svg(
  <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>, p);
const IconEyeOff = (p?: IconProps): JSX.Element => svg(
  <><path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 4.1-.9" /><path d="M3 3l18 18" /></>, p);
const IconSearch = (p?: IconProps): JSX.Element => svg(
  <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, p);
const IconPlus = (p?: IconProps): JSX.Element => svg(<path d="M12 5v14M5 12h14" />, p);
const IconX = (p?: IconProps): JSX.Element => svg(<path d="M18 6 6 18M6 6l12 12" />, p);
const IconCheck = (p?: IconProps): JSX.Element => svg(<path d="M20 6 9 17l-5-5" />, p);
const IconWarn = (p?: IconProps): JSX.Element => svg(
  <>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </>, p);
const IconClock = (p?: IconProps): JSX.Element => svg(
  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p);
const IconUserPlus = (p?: IconProps): JSX.Element => svg(
  <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /><path d="M16 3l2 2-2 2" /></>, p);
const IconStoreOff = (p?: IconProps): JSX.Element => svg(
  <><path d="M3 9l1.5-5h15L21 9M4 9v10h16V9M4 9h16" /><path d="M18 6 6 18" strokeWidth={1.8} /></>, p);
const IconSun = (p?: IconProps): JSX.Element => svg(
  <>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </>, p);
const IconMoon = (p?: IconProps): JSX.Element => svg(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />, p);
const IconSignOut = (p?: IconProps): JSX.Element => svg(
  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>, p);
const IconId = (p?: IconProps): JSX.Element => svg(
  <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7" /></>, p);
const IconBike = (p?: IconProps): JSX.Element => svg(
  <><circle cx="6" cy="17" r="3.5" /><circle cx="18" cy="17" r="3.5" /><path d="M6 17 10 7h4l3 10M9 7h6" /></>, p);
const IconInbox = (p?: IconProps): JSX.Element => svg(
  <><path d="M4 13h4l2 3h4l2-3h4" /><path d="M5 5h14l2 8v6H3v-6z" /></>, p);

/* =========================================================== helpers ===== */
const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

/** Deterministic avatar tint so the same person keeps the same colour. */
const TONES = [
  { bg: "var(--amber-100)", color: "var(--amber-600)" },
  { bg: "var(--blue-100)", color: "var(--blue-600)" },
  { bg: "var(--violet-100)", color: "var(--violet-600)" },
  { bg: "var(--green-100)", color: "var(--success-ink)" },
  { bg: "var(--coral-100)", color: "var(--critical-ink)" },
];
const tone = (key: string): { bg: string; color: string } => {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length]!;
};
const Avatar = ({ name, large }: { name: string; large?: boolean }): JSX.Element => {
  const t = tone(name);
  return (
    <div className={`avatar${large ? " lg" : ""}`} style={{ background: t.bg, color: t.color }}>
      {initials(name)}
    </div>
  );
};

const errText = (e: unknown, fallback: string): string =>
  e instanceof ApiError ? e.message : fallback;

const Banner = ({ kind, text }: { kind: "ok" | "err"; text: string }): JSX.Element => (
  <div className={`banner ${kind}`} role="status">
    {kind === "ok" ? <IconCheck size={16} stroke={2.4} /> : <IconWarn size={16} />}
    <span>{text}</span>
  </div>
);

const Empty = ({ icon, title, body }: { icon: JSX.Element; title: string; body?: string }): JSX.Element => (
  <div className="empty">
    <div className="empty-mark">{icon}</div>
    <div className="empty-title">{title}</div>
    {body && <div>{body}</div>}
  </div>
);

const SkeletonRows = ({ count = 4 }: { count?: number }): JSX.Element => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div className="skel-row" key={i}>
        <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 11 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: `${40 + ((i * 13) % 30)}%`, height: 12 }} />
          <div className="skeleton" style={{ width: "25%", height: 10, marginTop: 7 }} />
        </div>
        <div className="skeleton" style={{ width: 76, height: 24, borderRadius: 999 }} />
      </div>
    ))}
  </>
);

type Screen = "overview" | "shops" | "couriers" | "payouts";

/* =============================================================== app ===== */
export function App(): JSX.Element {
  const [authed, setAuthed] = useState(hasToken());
  const [screen, setScreen] = useState<Screen>("overview");
  const [dark, setDark] = useState<boolean>(
    () => localStorage.getItem("cc_admin_theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("cc_admin_theme", dark ? "dark" : "light");
  }, [dark]);

  // Shared across the shell: drives the sidebar badges and the overview, and
  // keeps a page's mutation visible everywhere without a second round trip.
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [pending, setPending] = useState<CourierRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [s, c, p] = await Promise.all([
        adminApi.shops(),
        adminApi.couriers("pending"),
        adminApi.pendingPayouts(),
      ]);
      setShops(s); setPending(c); setPayouts(p);
    } catch {
      /* per-page banners carry the error; the shell stays quiet */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void refresh();
  }, [authed, refresh]);

  if (!authed) return <SignIn onAuthed={() => setAuthed(true)} />;

  const blocked = shops.filter((s) => !s.isActive).length;
  const orphaned = shops.filter((s) => s.admins.length === 0).length;

  return (
    <div className="shell">
      <Sidebar
        screen={screen} onNavigate={setScreen}
        shopsBadge={blocked + orphaned}
        courierBadge={pending.length}
        payoutBadge={payouts.length}
        dark={dark} onToggleTheme={() => setDark((d) => !d)}
        onSignOut={() => { adminApi.logout(); setAuthed(false); }}
      />
      <main className="main">
        {screen === "overview" && (
          <Overview
            shops={shops} pending={pending} payouts={payouts}
            loading={loading} onNavigate={setScreen}
          />
        )}
        {screen === "shops" && <Shops shops={shops} loading={loading} onChanged={refresh} />}
        {screen === "couriers" && <Couriers onChanged={refresh} />}
        {screen === "payouts" && <Payouts rows={payouts} loading={loading} onChanged={refresh} />}
      </main>
    </div>
  );
}

/* ============================================================ sign in ==== */
function SignIn({ onAuthed }: { onAuthed: () => void }): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(email.trim(), password);
      onAuthed();
    } catch (err) {
      setError(errText(err, "Sign-in failed — try again"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin">
      <form className="signin-form" onSubmit={(e) => void submit(e)}>
        <div className="signin-brand">
          <div className="signin-mark" style={{ color: "#fff" }}><IconCart size={26} /></div>
          <div>
            <div className="signin-word">CampusCart</div>
            <div className="signin-role">Platform console</div>
          </div>
        </div>

        <h1 className="signin-title">Sign in</h1>
        <p className="signin-sub">Platform operators only. Use your admin credentials.</p>

        <div className="field">
          <label htmlFor="email">Email address</label>
          <div className="input-wrap">
            <span style={{ display: "flex", color: "var(--cc-muted)" }}><IconMail /></span>
            <input
              id="email" type="email" value={email} autoFocus required autoComplete="username"
              placeholder="admin@campuscart.co.zm"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 24 }}>
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <span style={{ display: "flex", color: "var(--cc-muted)" }}><IconLock /></span>
            <input
              id="password" type={show ? "text" : "password"} value={password} required
              autoComplete="current-password" placeholder="••••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button" className="icon-btn-inline" onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
            >{show ? <IconEyeOff /> : <IconEye />}</button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn primary tall block" disabled={busy} style={{ marginBottom: 16 }}>
          {busy ? <><span className="spinner" />Signing in…</> : "Sign in"}
        </button>
        <p className="signin-foot">Contact engineering if you've lost access.</p>
      </form>

      <div className="signin-aside">
        <div className="signin-aside-inner">
          <div style={{ opacity: 0.7, marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <IconCart size={80} stroke={1.4} />
          </div>
          <div className="signin-aside-title">CampusCart</div>
          <div className="signin-aside-sub">Operations console for<br />Copperbelt University, Kitwe</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ sidebar ==== */
function Sidebar({
  screen, onNavigate, shopsBadge, courierBadge, payoutBadge, dark, onToggleTheme, onSignOut,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  shopsBadge: number; courierBadge: number; payoutBadge: number;
  dark: boolean; onToggleTheme: () => void; onSignOut: () => void;
}): JSX.Element {
  const item = (
    key: Screen, label: string, icon: JSX.Element,
    badge?: number, badgeTone: "amber" | "coral" = "amber",
  ): JSX.Element => (
    <button
      className={`nav-item${screen === key ? " active" : ""}`}
      onClick={() => onNavigate(key)}
      aria-current={screen === key ? "page" : undefined}
    >
      {icon}{label}
      {badge ? <span className={`nav-badge ${badgeTone}`}>{badge}</span> : null}
    </button>
  );

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark" style={{ color: "#fff" }}><IconCart size={20} /></div>
        <div>
          <div className="sidebar-word">CampusCart</div>
          <div className="sidebar-tag">Console</div>
        </div>
      </div>

      <div className="nav-heading">Navigation</div>
      {item("overview", "Overview", <IconGrid />)}
      {item("shops", "Shops", <IconStore />, shopsBadge, "coral")}
      {item("couriers", "Couriers", <IconShield />, courierBadge)}
      {item("payouts", "Payouts", <IconCard />, payoutBadge)}

      <div className="sidebar-foot">
        <button className="nav-item" onClick={onToggleTheme}>
          {dark ? <IconSun size={17} /> : <IconMoon size={17} />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        <button className="nav-item" onClick={onSignOut}>
          <IconSignOut size={17} />Sign out
        </button>
      </div>
    </nav>
  );
}

/* =========================================================== overview ==== */
function Overview({
  shops, pending, payouts, loading, onNavigate,
}: {
  shops: ShopRow[]; pending: CourierRow[]; payouts: PayoutRow[];
  loading: boolean; onNavigate: (s: Screen) => void;
}): JSX.Element {
  const owed = payouts.reduce((sum, p) => sum + p.pendingMinor, 0);
  const deliveries = payouts.reduce((sum, p) => sum + p.entries, 0);
  const blocked = shops.filter((s) => !s.isActive).length;
  const orphaned = shops.filter((s) => s.admins.length === 0).length;
  const products = shops.reduce((sum, s) => sum + s.productCount, 0);

  const card = (
    onClick: () => void, icon: JSX.Element, iconBg: string, iconColor: string,
    pill: JSX.Element | null, value: string, label: string, amber?: boolean,
  ): JSX.Element => (
    <button className="queue-card" onClick={onClick}>
      <div className="queue-top">
        <div className="queue-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        {pill}
      </div>
      <div className={`queue-value${amber ? " amber" : ""}`}>{value}</div>
      <div className="queue-label">{label}</div>
    </button>
  );

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Overview</h1>
        <p className="page-sub">What needs you right now.</p>
      </div>

      {loading ? (
        <div className="queue-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="skeleton" key={i} style={{ height: 128, borderRadius: 14 }} />
          ))}
        </div>
      ) : (
        <div className="queue-grid">
          {card(
            () => onNavigate("couriers"), <IconShield size={20} />, "var(--amber-050)", "var(--amber-600)",
            pending.length ? <span className="pill amber">{pending.length} pending</span> : null,
            String(pending.length), "Couriers awaiting verification",
          )}
          {card(
            () => onNavigate("payouts"), <IconCard size={20} />, "var(--green-050)", "var(--brand)",
            payouts.length ? <span className="pill amber">{payouts.length} courier{payouts.length === 1 ? "" : "s"}</span> : null,
            formatKwacha(owed), "Total owed in pending payouts", true,
          )}
          {card(
            () => onNavigate("shops"), <IconStoreOff size={20} />, "var(--coral-050)", "var(--coral-500)",
            blocked ? <span className="pill coral">{blocked} blocked</span> : null,
            String(blocked), `Shop${blocked === 1 ? "" : "s"} currently blocked`,
          )}
          {card(
            () => onNavigate("shops"), <IconUserPlus size={20} />, "var(--blue-050)", "var(--blue-500)",
            orphaned ? <span className="pill blue">needs owner</span> : null,
            String(orphaned), `Shop${orphaned === 1 ? "" : "s"} with no admin attached`,
          )}
        </div>
      )}

      <h2 className="section-title">Platform at a glance</h2>
      <div className="card">
        {loading ? <SkeletonRows count={3} /> : (
          <>
            <GlanceRow
              icon={<IconStore size={16} />} tint="var(--green-100)" ink="var(--success-ink)"
              label="Registered shops"
              value={`${shops.length - blocked} live of ${shops.length}`}
            />
            <GlanceRow
              icon={<IconInbox size={16} />} tint="var(--blue-050)" ink="var(--blue-500)"
              label="Products listed across all shops" value={String(products)}
            />
            <GlanceRow
              icon={<IconCard size={16} />} tint="var(--amber-050)" ink="var(--amber-600)"
              label="Unsettled deliveries" value={String(deliveries)} last
            />
          </>
        )}
      </div>
    </div>
  );
}

function GlanceRow({
  icon, tint, ink, label, value, last,
}: {
  icon: JSX.Element; tint: string; ink: string; label: string; value: string; last?: boolean;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        borderBottom: last ? "none" : "1px solid var(--cc-border-faint)",
      }}
    >
      <div
        style={{
          width: 34, height: 34, borderRadius: 9, background: tint, color: ink,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >{icon}</div>
      <span style={{ flex: 1, font: "var(--fw-medium) 13px/1.3 var(--font-sans)" }}>{label}</span>
      <span style={{ font: "var(--fw-bold) 14px/1 var(--font-sans)" }}>{value}</span>
    </div>
  );
}

/* ============================================================== shops ==== */
type ShopFilter = "all" | "active" | "blocked";

function Shops({
  shops, loading, onChanged,
}: { shops: ShopRow[]; loading: boolean; onChanged: () => Promise<void> }): JSX.Element {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShopFilter>("all");
  const [modal, setModal] = useState<{ shop: ShopRow | null } | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shops.filter((s) => {
      if (filter === "active" && !s.isActive) return false;
      if (filter === "blocked" && s.isActive) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.address ?? "").toLowerCase().includes(q) ||
        s.admins.some((a) => a.fullName.toLowerCase().includes(q))
      );
    });
  }, [shops, query, filter]);

  const toggleBlock = async (shop: ShopRow): Promise<void> => {
    setNotice(null);
    setBusyId(shop.id);
    try {
      await adminApi.updateShop(shop.id, { isActive: !shop.isActive });
      setNotice({
        kind: "ok",
        text: shop.isActive
          ? `${shop.name} blocked — hidden from shoppers immediately.`
          : `${shop.name} is live again.`,
      });
      await onChanged();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e, "Update failed") });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Shops</h1>
          <p className="page-sub">
            {shops.length} registered shop{shops.length === 1 ? "" : "s"} · blocked shops disappear from the app instantly
          </p>
        </div>
        <button className="btn primary" onClick={() => setModal({ shop: null })}>
          <IconPlus size={17} stroke={2.4} />Create shop
        </button>
      </div>

      {notice && <Banner kind={notice.kind} text={notice.text} />}

      <div className="filters">
        <div className="search">
          <span style={{ display: "flex", color: "var(--cc-muted)" }}><IconSearch size={17} /></span>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, location or owner…" aria-label="Search shops"
          />
        </div>
        <div className="chips">
          {(["all", "active", "blocked"] as const).map((f) => (
            <button
              key={f} className={`chip${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >{f === "all" ? "All" : f === "active" ? "Active" : "Blocked"}</button>
          ))}
        </div>
      </div>

      <div className="table">
        <div className="trow thead">
          <span>Shop</span><span>Location</span><span>Products</span>
          <span className="col-admin">Admin</span><span>Status</span><span />
        </div>

        {loading ? <SkeletonRows count={5} /> : visible.length === 0 ? (
          <Empty
            icon={<IconStore size={22} />}
            title={shops.length === 0 ? "No shops yet" : "Nothing matches that"}
            body={shops.length === 0
              ? "Create the first shop to get the marketplace started."
              : "Try a different search term or filter."}
          />
        ) : visible.map((shop) => (
          <div className="trow tbody-row" key={shop.id}>
            <div className="cell-main">
              <Avatar name={shop.name} />
              <div style={{ minWidth: 0 }}>
                <div className="cell-name">{shop.name}</div>
                <div className="cell-note">
                  Created {new Date(shop.createdAt).toLocaleDateString(undefined, {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
              </div>
            </div>
            <span className="cell-text">{shop.address ?? "No address"}</span>
            <span className="cell-num">{shop.productCount}</span>
            <div className="col-admin">
              {shop.admins.length > 0 ? (
                <span style={{ font: "var(--fw-medium) 13px/1.3 var(--font-sans)" }}>
                  {shop.admins.map((a) => a.fullName).join(", ")}
                </span>
              ) : (
                <span className="pill soft-amber"><IconWarn size={12} stroke={2.4} />No admin</span>
              )}
            </div>
            <span className={`status ${shop.isActive ? "live" : "blocked"}`}>
              <span className="dot" />{shop.isActive ? "Live" : "Blocked"}
            </span>
            <div className="row-actions">
              <button className="btn ghost sm" onClick={() => setModal({ shop })}>Edit</button>
              <button
                className={`btn sm ${shop.isActive ? "danger-outline" : "primary"}`}
                disabled={busyId === shop.id}
                onClick={() => void toggleBlock(shop)}
              >{shop.isActive ? "Block" : "Unblock"}</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ShopModal
          shop={modal.shop}
          onClose={() => setModal(null)}
          onSaved={async (msg) => {
            setModal(null);
            if (msg) setNotice({ kind: "ok", text: msg });
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

/* ========================================================= shop modal ==== */
type OwnerMode = "none" | "new" | "existing";
type ShopDraft = {
  name: string; description: string; address: string; imageUrl: string;
  lat: string; lng: string;
  ownerMode: OwnerMode;
  adminEmail: string;
  ownerName: string; ownerEmail: string; ownerPhone: string; ownerPassword: string;
};
const baseDraft = {
  name: "", description: "", address: "", imageUrl: "", lat: "", lng: "",
  adminEmail: "", ownerName: "", ownerEmail: "", ownerPhone: "", ownerPassword: "",
};

function ShopModal({
  shop, onClose, onSaved,
}: {
  shop: ShopRow | null;
  onClose: () => void;
  onSaved: (message?: string) => void | Promise<void>;
}): JSX.Element {
  const [draft, setDraft] = useState<ShopDraft>(
    shop
      ? {
        ...baseDraft,
        name: shop.name, description: shop.description ?? "", address: shop.address ?? "",
        imageUrl: shop.imageUrl ?? "",
        lat: String(shop.location?.lat ?? ""), lng: String(shop.location?.lng ?? ""),
        ownerMode: shop.admins.length > 0 ? "none" : "new",
      }
      : { ...baseDraft, ownerMode: "new" },
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ShopDraft>(k: K, v: ShopDraft[K]): void => setDraft({ ...draft, [k]: v });

  const save = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!draft.name.trim()) { setError("Shop needs a name"); return; }

    // Validate the owner section up front so we never create a shop then fail.
    if (draft.ownerMode === "new") {
      if (!draft.ownerName.trim() || !draft.ownerEmail.trim() || !draft.ownerPhone.trim()) {
        setError("New owner needs a name, email and phone");
        return;
      }
      if (draft.ownerPassword.length < 8) {
        setError("Owner password must be at least 8 characters");
        return;
      }
    }
    if (draft.ownerMode === "existing" && !draft.adminEmail.trim()) {
      setError("Enter the existing owner's account email");
      return;
    }

    const lat = parseFloat(draft.lat);
    const lng = parseFloat(draft.lng);
    const location = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;

    // The pickup point drives delivery quotes and courier assignment, so a new
    // shop can't go in without one. (0,0) is a real lat/lng but is what an
    // unset field looks like — the API rejects it either way; catching it here
    // gives a useful message instead of a validation error.
    if (!shop && !location) {
      setError("Latitude and longitude are required — they set the pickup point for deliveries");
      return;
    }
    if (location && location.lat === 0 && location.lng === 0) {
      setError("(0, 0) isn't a real location — enter the shop's actual coordinates");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        address: draft.address.trim() || null,
        imageUrl: draft.imageUrl.trim() || null,
        ...(location ? { location } : {}),
        ...(draft.ownerMode === "existing" && draft.adminEmail.trim()
          ? { adminEmail: draft.adminEmail.trim() } : {}),
      };
      const saved = shop
        ? await adminApi.updateShop(shop.id, payload)
        : await adminApi.createShop(payload);

      let message: string | undefined = shop ? "Shop updated" : `Created ${saved.name}`;
      if (draft.ownerMode === "new") {
        await adminApi.createShopAdmin({
          email: draft.ownerEmail.trim(),
          password: draft.ownerPassword,
          fullName: draft.ownerName.trim(),
          phone: draft.ownerPhone.trim(),
          shopId: saved.id,
        });
        message = `Owner account created — ${draft.ownerName.trim()} can now sign in with ${draft.ownerEmail.trim()}`;
      } else if (draft.ownerMode === "existing") {
        message = `${draft.adminEmail.trim()} attached as owner of ${saved.name}`;
      }
      await onSaved(message);
    } catch (err) {
      setError(errText(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal wide" onSubmit={(e) => void save(e)}>
        <div className="modal-bar">
          <div className="modal-title">{shop ? `Edit ${shop.name}` : "Create a new shop"}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <IconX size={18} stroke={2.4} />
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="subhead">Shop details</div>
        <div className="form-grid">
          <div>
            <label className="label" htmlFor="s-name">Shop name</label>
            <input
              id="s-name" className="control" value={draft.name} autoFocus
              placeholder="e.g. Riverside Grill" onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="s-addr">Campus location</label>
            <input
              id="s-addr" className="control" value={draft.address}
              placeholder="e.g. Food Court" onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="span2">
            <label className="label" htmlFor="s-desc">Description</label>
            <textarea
              id="s-desc" className="control" value={draft.description}
              placeholder="Brief shop description…" onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="s-lat">Latitude</label>
            <input
              id="s-lat" className="control mono" value={draft.lat} inputMode="decimal"
              placeholder="-12.8074" onChange={(e) => set("lat", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="s-lng">Longitude</label>
            <input
              id="s-lng" className="control mono" value={draft.lng} inputMode="decimal"
              placeholder="28.2132" onChange={(e) => set("lng", e.target.value)}
            />
          </div>
        </div>

        <div className="subhead">Shop owner</div>
        <div className="seg">
          <button
            type="button" className={draft.ownerMode === "new" ? "active" : ""}
            onClick={() => set("ownerMode", "new")}
          >Create new account</button>
          <button
            type="button" className={draft.ownerMode === "existing" ? "active" : ""}
            onClick={() => set("ownerMode", "existing")}
          >Attach existing</button>
          <button
            type="button" className={draft.ownerMode === "none" ? "active" : ""}
            onClick={() => set("ownerMode", "none")}
          >{shop ? "No change" : "Later"}</button>
        </div>

        {draft.ownerMode === "new" && (
          <div className="form-grid">
            <div>
              <label className="label" htmlFor="o-name">Full name</label>
              <input id="o-name" className="control" value={draft.ownerName}
                placeholder="Grace Zulu" onChange={(e) => set("ownerName", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="o-email">Email</label>
              <input id="o-email" className="control" type="email" value={draft.ownerEmail}
                placeholder="grace@mail.com" onChange={(e) => set("ownerEmail", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="o-phone">Phone</label>
              <input id="o-phone" className="control mono" value={draft.ownerPhone}
                placeholder="+260 955 720 118" onChange={(e) => set("ownerPhone", e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="o-pass">Temp. password</label>
              <input id="o-pass" className="control mono" type="password" value={draft.ownerPassword}
                placeholder="min 8 characters" onChange={(e) => set("ownerPassword", e.target.value)} />
            </div>
          </div>
        )}

        {draft.ownerMode === "existing" && (
          <div style={{ marginBottom: 20 }}>
            <label className="label" htmlFor="o-existing">Existing account email</label>
            <input
              id="o-existing" className="control" type="email" value={draft.adminEmail}
              placeholder="owner@mail.com" onChange={(e) => set("adminEmail", e.target.value)}
            />
          </div>
        )}

        {draft.ownerMode === "none" && (
          <p style={{ font: "var(--fw-regular) 13px/1.5 var(--font-sans)", color: "var(--cc-muted)", margin: "0 0 20px" }}>
            {shop
              ? "Owner assignment stays as it is."
              : "The shop will have no admin until one is attached — it can still be created."}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn ghost lg" onClick={onClose}>Cancel</button>
          <button className="btn primary lg" disabled={busy}>
            {busy ? <><span className="spinner" />Saving…</>
              : shop ? "Save changes"
                : draft.ownerMode === "new" ? "Create shop & owner account" : "Create shop"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================== couriers ==== */
const COURIER_FILTERS = ["pending", "verified", "rejected", "suspended"] as const;
type CourierFilter = (typeof COURIER_FILTERS)[number];

function Couriers({ onChanged }: { onChanged: () => Promise<void> }): JSX.Element {
  const [filter, setFilter] = useState<CourierFilter>("pending");
  const [rows, setRows] = useState<CourierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback((): void => {
    setLoading(true);
    void adminApi.couriers(filter)
      .then(setRows)
      .catch((e: unknown) => setNotice({ kind: "err", text: errText(e, "Could not load couriers") }))
      .finally(() => setLoading(false));
  }, [filter]);
  useEffect(load, [load]);

  const decide = async (row: CourierRow, status: "verified" | "rejected" | "suspended"): Promise<void> => {
    setNotice(null);
    setBusyId(row.id);
    try {
      await adminApi.setCourierVerification(row.id, status);
      setNotice({ kind: "ok", text: `${row.fullName} → ${status}` });
      load();
      await onChanged();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e, "Decision failed") });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Courier verification</h1>
        <p className="page-sub">
          Identity checks happen off-app — record the outcome here. Only verified couriers can take jobs.
        </p>
      </div>

      {notice && <Banner kind={notice.kind} text={notice.text} />}

      <div className="chips" style={{ marginBottom: 20 }}>
        {COURIER_FILTERS.map((f) => (
          <button
            key={f}
            className={`chip sm${filter === f ? ` active${f === "pending" ? " amber" : ""}` : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "pending" && <IconClock size={14} stroke={2.4} />}
            {f[0]!.toUpperCase() + f.slice(1)}
            {f === "pending" && rows.length > 0 && filter === "pending" ? ` · ${rows.length}` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="courier-list">
          {Array.from({ length: 2 }, (_, i) => (
            <div className="skeleton" key={i} style={{ height: 168, borderRadius: 16 }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <Empty
            icon={<IconShield size={22} />}
            title={filter === "pending" ? "Nothing awaiting review" : `No ${filter} couriers`}
            body={filter === "pending" ? "Every application has been decided." : undefined}
          />
        </div>
      ) : (
        <div className="courier-list">
          {rows.map((row) => (
            <div className="courier-card" key={row.id}>
              <div>
                <div className="courier-head">
                  <Avatar name={row.fullName} large />
                  <div>
                    <div className="courier-name">{row.fullName}</div>
                    <div className="courier-phone">{row.phone}</div>
                  </div>
                </div>
                <div className="deflist">
                  <div className="defrow">
                    <span className="defkey">Vehicle</span>
                    <span className="defval"><IconBike size={15} />{row.vehicleType}</span>
                  </div>
                  <div className="defrow">
                    <span className="defkey">Status</span>
                    <span className={`status ${row.verificationStatus}`}>
                      <span className="dot" />{row.verificationStatus}
                    </span>
                  </div>
                  <div className="defrow">
                    <span className="defkey">Availability</span>
                    <span className="defval">{row.isAvailable ? "Online" : "Offline"}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="subhead">Identity</div>
                <div className="deflist">
                  <div className="defrow">
                    <span className="defkey"><IconId size={14} /> NRC</span>
                    <span className="defval mono">{row.nrcNumber ?? "—"}</span>
                  </div>
                </div>
                {!row.nrcNumber && (
                  <div className="notice-amber">
                    <IconWarn size={16} />
                    <span>No NRC on file. Confirm identity off-app before verifying this courier.</span>
                  </div>
                )}
              </div>

              <div className="courier-actions">
                {row.verificationStatus !== "verified" && (
                  <button
                    className="btn primary" disabled={busyId === row.id}
                    onClick={() => void decide(row, "verified")}
                  ><IconShield size={15} stroke={2.4} />Approve</button>
                )}
                {row.verificationStatus === "pending" && (
                  <button
                    className="btn danger-outline" disabled={busyId === row.id}
                    onClick={() => void decide(row, "rejected")}
                  >Reject</button>
                )}
                {row.verificationStatus === "verified" && (
                  <button
                    className="btn ghost" disabled={busyId === row.id}
                    onClick={() => void decide(row, "suspended")}
                  >Suspend</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ payouts ==== */
type SettleResult = { settledMinor: number; entries: number; settlementRef: string; transferred: boolean };

function Payouts({
  rows, loading, onChanged,
}: { rows: PayoutRow[]; loading: boolean; onChanged: () => Promise<void> }): JSX.Element {
  const [target, setTarget] = useState<PayoutRow | null>(null);
  const [done, setDone] = useState<{ row: PayoutRow; result: SettleResult } | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const total = rows.reduce((s, r) => s + r.pendingMinor, 0);
  const deliveries = rows.reduce((s, r) => s + r.entries, 0);

  const confirm = async (): Promise<void> => {
    if (!target) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await adminApi.settlePayouts(target.courierId);
      setDone({ row: target, result });
      setTarget(null);
      await onChanged();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e, "Settlement failed") });
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Payouts</h1>
        <p className="page-sub">
          Settle courier earnings via MTN Mobile Money. Payments are irreversible.
        </p>
      </div>

      {notice && <Banner kind={notice.kind} text={notice.text} />}

      <div className="card pad payout-banner">
        <div style={{ flex: 1 }}>
          <div style={{ font: "var(--fw-regular) 13px/1 var(--font-sans)", color: "var(--cc-muted)" }}>
            Total outstanding
          </div>
          <div className="payout-total">{formatKwacha(total)}</div>
          <div style={{ font: "var(--fw-medium) 13px/1 var(--font-sans)", color: "var(--cc-muted)", marginTop: 2 }}>
            across {rows.length} courier{rows.length === 1 ? "" : "s"} · {deliveries} deliver{deliveries === 1 ? "y" : "ies"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="payout-list">
          {Array.from({ length: 3 }, (_, i) => (
            <div className="skeleton" key={i} style={{ height: 82, borderRadius: 14 }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <Empty
            icon={<IconCheck size={22} stroke={2.4} />}
            title="Everyone's been paid"
            body="No courier has unsettled earnings right now."
          />
        </div>
      ) : (
        <div className="payout-list">
          {rows.map((row) => (
            <div className="payout-row" key={row.courierId}>
              <Avatar name={row.fullName} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "var(--fw-semibold) 15px/1.2 var(--font-sans)" }}>{row.fullName}</div>
                <div style={{ font: "var(--fw-regular) 13px/1.3 var(--font-sans)", color: "var(--cc-muted)", marginTop: 3 }}>
                  {row.phone} · {row.entries} deliver{row.entries === 1 ? "y" : "ies"} · MTN MoMo
                </div>
              </div>
              <div style={{ textAlign: "right", marginRight: 4 }}>
                <div className="payout-amount">{formatKwacha(row.pendingMinor)}</div>
                <div className="payout-amount-note">pending</div>
              </div>
              <button className="btn primary" style={{ height: 44, borderRadius: 11 }} onClick={() => setTarget(row)}>
                <IconCard size={17} />Settle
              </button>
            </div>
          ))}
        </div>
      )}

      {target && (
        <SettleConfirm row={target} busy={busy} onCancel={() => setTarget(null)} onConfirm={() => void confirm()} />
      )}
      {done && <SettleSuccess row={done.row} result={done.result} onClose={() => setDone(null)} />}
    </div>
  );
}

function SettleConfirm({
  row, busy, onCancel, onConfirm,
}: { row: PayoutRow; busy: boolean; onCancel: () => void; onConfirm: () => void }): JSX.Element {
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="modal" role="alertdialog" aria-modal="true">
        <div className="modal-head">
          <div
            className="queue-icon" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--amber-050)", color: "var(--amber-600)" }}
          ><IconWarn size={26} /></div>
          <div>
            <div className="modal-title">Confirm payout</div>
            <div className="modal-sub">This sends a real MTN Mobile Money transfer and cannot be undone.</div>
          </div>
        </div>

        <div className="recap">
          <div className="recap-row"><span>Courier</span><span>{row.fullName}</span></div>
          <div className="recap-row"><span>Phone</span><span className="mono">{row.phone}</span></div>
          <div className="recap-row"><span>Deliveries</span><span>{row.entries}</span></div>
          <div className="recap-row"><span>Method</span><span>MTN Mobile Money</span></div>
          <div className="recap-total">
            <span>Amount</span><span>{formatKwacha(row.pendingMinor)}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost lg" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn primary lg" onClick={onConfirm} disabled={busy}>
            {busy ? <><span className="spinner" />Sending…</>
              : <><IconCard size={17} stroke={2.2} />Send {formatKwacha(row.pendingMinor)} now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettleSuccess({
  row, result, onClose,
}: { row: PayoutRow; result: SettleResult; onClose: () => void }): JSX.Element {
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal narrow" role="dialog" aria-modal="true">
        <div className="success-mark" style={{ color: "var(--success-ink)" }}>
          <IconCheck size={32} stroke={2.4} />
        </div>
        <div style={{ font: "var(--fw-bold) 20px/1.2 var(--font-sans)", marginBottom: 6 }}>
          {result.transferred ? "Payment sent" : "Payout recorded"}
        </div>
        <div style={{ font: "var(--fw-regular) 14px/1.5 var(--font-sans)", color: "var(--cc-muted)", marginBottom: 16 }}>
          {formatKwacha(result.settledMinor)} {result.transferred ? "transferred to" : "recorded for"} {row.fullName}
          {result.transferred ? "" : " — settle manually in the MoMo portal."}
        </div>

        <div className="ref-box">
          <div className="ref-label">
            {result.transferred ? "MoMo transfer reference" : "Settlement reference"}
          </div>
          <div className="ref-value">{result.settlementRef}</div>
        </div>

        <button className="btn primary block" style={{ height: 44 }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
