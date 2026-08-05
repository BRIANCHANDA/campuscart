import { useCallback, useEffect, useState, type FormEvent, type JSX } from "react";
import {
  adminApi, ApiError, formatKwacha, hasToken,
  type CourierRow, type PayoutRow, type ShopRow,
} from "./api";

type Page = "shops" | "couriers" | "payouts";

export function App(): JSX.Element {
  const [authed, setAuthed] = useState(hasToken());
  const [page, setPage] = useState<Page>("shops");

  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">🛒</span> CampusCart
        </div>
        <button className={`nav-item ${page === "shops" ? "active" : ""}`} onClick={() => setPage("shops")}>
          🏪 Shops
        </button>
        <button className={`nav-item ${page === "couriers" ? "active" : ""}`} onClick={() => setPage("couriers")}>
          🛡️ Couriers
        </button>
        <button className={`nav-item ${page === "payouts" ? "active" : ""}`} onClick={() => setPage("payouts")}>
          💸 Payouts
        </button>
        <div className="nav-spacer" />
        <button className="nav-item" onClick={() => { adminApi.logout(); setAuthed(false); }}>
          ↩ Sign out
        </button>
        <div className="nav-user">Platform console</div>
      </aside>
      <main className="main">
        {page === "shops" && <ShopsPage />}
        {page === "couriers" && <CouriersPage />}
        {page === "payouts" && <PayoutsPage />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Login({ onAuthed }: { onAuthed: () => void }): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError(err instanceof ApiError ? err.message : "Sign-in failed — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={(e) => void submit(e)}>
        <div className="login-logo">🛒</div>
        <h1 className="login-title">CampusCart Admin</h1>
        <p className="login-sub">Manage shops, verify couriers and settle payouts.</p>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn primary" style={{ width: "100%", padding: 12 }} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

type OwnerMode = "none" | "new" | "existing";
type ShopDraft = {
  name: string; description: string; address: string; imageUrl: string;
  lat: string; lng: string;
  ownerMode: OwnerMode;
  adminEmail: string;                       // "existing" mode
  ownerName: string; ownerEmail: string; ownerPhone: string; ownerPassword: string; // "new" mode
};
const baseDraft = {
  name: "", description: "", address: "", imageUrl: "", lat: "", lng: "",
  adminEmail: "", ownerName: "", ownerEmail: "", ownerPhone: "", ownerPassword: "",
};

function ShopsPage(): JSX.Element {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; shop: ShopRow } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((): void => {
    void adminApi.shops().then(setShops).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const toggleBlock = async (shop: ShopRow): Promise<void> => {
    setNotice(null);
    try {
      await adminApi.updateShop(shop.id, { isActive: !shop.isActive });
      setNotice(shop.isActive ? `${shop.name} blocked — hidden from shoppers.` : `${shop.name} is live again.`);
      load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Shops</h1>
          <p className="page-sub" style={{ margin: "4px 0 0" }}>
            {shops.length} shop{shops.length === 1 ? "" : "s"} · blocked shops disappear from the app instantly
          </p>
        </div>
        <button className="btn primary" onClick={() => setModal({ mode: "create" })}>+ New shop</button>
      </div>

      {notice && <p className="ok-text">{notice}</p>}

      <div className="card">
        {loading ? (
          <div className="empty">Loading…</div>
        ) : shops.length === 0 ? (
          <div className="empty">No shops yet — create the first one.</div>
        ) : (
          shops.map((shop, i) => (
            <div className="shop-row" key={shop.id} style={{ animationDelay: `${i * 40}ms` }}>
              {shop.imageUrl ? (
                <img className="shop-cover" src={shop.imageUrl} alt={shop.name} />
              ) : (
                <div className={`shop-avatar ${shop.isActive ? "" : "blocked"}`}>{initials(shop.name)}</div>
              )}
              <div className="shop-info">
                <div className="shop-name">
                  {shop.name}
                  <span className={`badge ${shop.isActive ? "open" : "blocked"}`}>
                    {shop.isActive ? "live" : "blocked"}
                  </span>
                  <span className="badge count">{shop.productCount} products</span>
                </div>
                <div className="shop-meta">
                  {shop.address ?? "No address"} ·{" "}
                  {shop.admins.length > 0
                    ? `run by ${shop.admins.map((a) => a.fullName).join(", ")}`
                    : "no admin attached yet"}
                </div>
              </div>
              <div className="actions">
                <button className="btn ghost sm" onClick={() => setModal({ mode: "edit", shop })}>Edit</button>
                <button
                  className={`btn sm ${shop.isActive ? "danger" : "primary"}`}
                  onClick={() => void toggleBlock(shop)}
                >
                  {shop.isActive ? "Block" : "Unblock"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <ShopModal
          shop={modal.mode === "edit" ? modal.shop : null}
          onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); if (msg) setNotice(msg); load(); }}
        />
      )}
    </>
  );
}

function ShopModal({
  shop, onClose, onSaved,
}: {
  shop: ShopRow | null;
  onClose: () => void;
  onSaved: (message?: string) => void;
}): JSX.Element {
  const [draft, setDraft] = useState<ShopDraft>(
    shop
      ? {
          ...baseDraft,
          name: shop.name, description: shop.description ?? "", address: shop.address ?? "",
          imageUrl: shop.imageUrl ?? "",
          lat: shop.location.lat ? String(shop.location.lat) : "",
          lng: shop.location.lng ? String(shop.location.lng) : "",
          // Existing shops usually already have an owner → default to no change.
          ownerMode: shop.admins.length > 0 ? "none" : "new",
        }
      : { ...baseDraft, ownerMode: "new" }, // new shops: provision the owner up front
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof ShopDraft) => (e: FormEvent<HTMLInputElement>) =>
    setDraft({ ...draft, [k]: e.currentTarget.value });

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
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        address: draft.address.trim() || null,
        imageUrl: draft.imageUrl.trim() || null,
        ...(location ? { location } : {}),
        // "existing" attach can ride along with the shop upsert.
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
      onSaved(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const mode = draft.ownerMode;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => void save(e)}>
        <h3>{shop ? `Edit ${shop.name}` : "Onboard a new shop"}</h3>
        <div className="field">
          <label>Name</label>
          <input value={draft.name} onInput={set("name")} required />
        </div>
        <div className="field">
          <label>Description</label>
          <input value={draft.description} onInput={set("description")} placeholder="What does this shop sell?" />
        </div>
        <div className="field">
          <label>Address (shown to shoppers)</label>
          <input value={draft.address} onInput={set("address")} placeholder="e.g. Food Court, Great East Rd, CBU" />
        </div>
        <div className="field">
          <label>Cover image URL</label>
          <input value={draft.imageUrl} onInput={set("imageUrl")} placeholder="https://…" />
          {draft.imageUrl.trim() && (
            <img className="cover-preview" src={draft.imageUrl} alt="cover preview" onError={(e) => (e.currentTarget.style.display = "none")} onLoad={(e) => (e.currentTarget.style.display = "block")} />
          )}
        </div>
        <div className="field-row">
          <div className="field">
            <label>Latitude</label>
            <input value={draft.lat} onInput={set("lat")} placeholder="-12.808" />
          </div>
          <div className="field">
            <label>Longitude</label>
            <input value={draft.lng} onInput={set("lng")} placeholder="28.238" />
          </div>
        </div>

        {/* --- Owner provisioning --- */}
        <div className="owner-section">
          <label className="owner-label">Shop owner</label>
          {shop && shop.admins.length > 0 && (
            <p className="owner-current">
              Current: {shop.admins.map((a) => `${a.fullName} (${a.email})`).join(", ")}
            </p>
          )}
          <div className="seg">
            <button type="button" className={`seg-btn ${mode === "new" ? "active" : ""}`} onClick={() => setDraft({ ...draft, ownerMode: "new" })}>Create account</button>
            <button type="button" className={`seg-btn ${mode === "existing" ? "active" : ""}`} onClick={() => setDraft({ ...draft, ownerMode: "existing" })}>Attach existing</button>
            <button type="button" className={`seg-btn ${mode === "none" ? "active" : ""}`} onClick={() => setDraft({ ...draft, ownerMode: "none" })}>{shop ? "No change" : "Later"}</button>
          </div>

          {mode === "new" && (
            <div className="owner-fields">
              <p className="owner-hint">You create the owner's login; hand them the email + password and they sign in themselves.</p>
              <div className="field"><label>Owner full name</label><input value={draft.ownerName} onInput={set("ownerName")} placeholder="e.g. Bwalya Chanda" /></div>
              <div className="field-row">
                <div className="field"><label>Email (login)</label><input type="email" value={draft.ownerEmail} onInput={set("ownerEmail")} placeholder="owner@example.com" /></div>
                <div className="field"><label>Phone</label><input value={draft.ownerPhone} onInput={set("ownerPhone")} placeholder="+260…" /></div>
              </div>
              <div className="field"><label>Temporary password (min 8 chars)</label><input value={draft.ownerPassword} onInput={set("ownerPassword")} placeholder="Share this with the owner" /></div>
            </div>
          )}
          {mode === "existing" && (
            <div className="field" style={{ marginTop: 10 }}>
              <label>Existing account email</label>
              <input type="email" value={draft.adminEmail} onInput={set("adminEmail")} placeholder="owner@example.com — already registered" />
            </div>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        <div className="actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving…" : shop ? "Save changes" : "Create shop"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
function CouriersPage(): JSX.Element {
  const [filter, setFilter] = useState<string>("pending");
  const [rows, setRows] = useState<CourierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((): void => {
    setLoading(true);
    void adminApi.couriers(filter === "all" ? undefined : filter)
      .then(setRows).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);
  useEffect(load, [load]);

  const decide = async (row: CourierRow, status: "verified" | "rejected" | "suspended"): Promise<void> => {
    setNotice(null);
    try {
      await adminApi.setCourierVerification(row.id, status);
      setNotice(`${row.fullName} → ${status}`);
      load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Decision failed");
    }
  };

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Couriers</h1>
          <p className="page-sub" style={{ margin: "4px 0 0" }}>Identity checks happen off-app; record the outcome here.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="btn ghost">
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="all">All</option>
        </select>
      </div>

      {notice && <p className="ok-text">{notice}</p>}

      <div className="card">
        {loading ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">Nothing here — all clear.</div>
        ) : (
          rows.map((row, i) => (
            <div className="shop-row" key={row.id} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="shop-avatar">{initials(row.fullName)}</div>
              <div className="shop-info">
                <div className="shop-name">
                  {row.fullName}
                  <span className={`badge ${row.verificationStatus === "verified" ? "open" : row.verificationStatus === "pending" ? "pending" : "blocked"}`}>
                    {row.verificationStatus}
                  </span>
                </div>
                <div className="shop-meta">
                  {row.phone} · {row.vehicleType} · NRC {row.nrcNumber ?? "not provided"}
                </div>
              </div>
              <div className="actions">
                {row.verificationStatus !== "verified" && (
                  <button className="btn primary sm" onClick={() => void decide(row, "verified")}>Verify</button>
                )}
                {row.verificationStatus === "pending" && (
                  <button className="btn danger sm" onClick={() => void decide(row, "rejected")}>Reject</button>
                )}
                {row.verificationStatus === "verified" && (
                  <button className="btn danger sm" onClick={() => void decide(row, "suspended")}>Suspend</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
function PayoutsPage(): JSX.Element {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((): void => {
    void adminApi.pendingPayouts().then(setRows).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const settle = async (row: PayoutRow): Promise<void> => {
    setNotice(null);
    try {
      const res = await adminApi.settlePayouts(row.courierId);
      setNotice(
        res.transferred
          ? `Sent ${formatKwacha(res.settledMinor)} to ${row.fullName} via MoMo (${res.settlementRef.slice(0, 8)})`
          : `Recorded manual payout of ${formatKwacha(res.settledMinor)} for ${row.fullName}`,
      );
      load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Settlement failed");
    }
  };

  const total = rows.reduce((s, r) => s + r.pendingMinor, 0);

  return (
    <>
      <h1 className="page-title">Payouts</h1>
      <p className="page-sub">
        {rows.length === 0 ? "Nothing pending." : `${formatKwacha(total)} owed across ${rows.length} courier${rows.length === 1 ? "" : "s"}.`}
      </p>

      {notice && <p className="ok-text">{notice}</p>}

      <div className="card">
        {loading ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">Everyone's been paid. 🎉</div>
        ) : (
          rows.map((row, i) => (
            <div className="shop-row" key={row.courierId} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="shop-avatar">{initials(row.fullName)}</div>
              <div className="shop-info">
                <div className="shop-name">{row.fullName}</div>
                <div className="shop-meta">
                  {row.entries} deliver{row.entries === 1 ? "y" : "ies"} · {row.phone}
                </div>
              </div>
              <button className="btn primary sm" onClick={() => void settle(row)}>
                Pay {formatKwacha(row.pendingMinor)}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
