/* @ds-bundle: {"format":3,"namespace":"HealthChainDesignSystem_9f6dff","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ListRow","sourcePath":"components/feedback/ListRow.jsx"},{"name":"SectionHeader","sourcePath":"components/feedback/SectionHeader.jsx"},{"name":"VitalStat","sourcePath":"components/feedback/VitalStat.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"PermissionChip","sourcePath":"components/forms/PermissionChip.jsx"},{"name":"ScreenHeader","sourcePath":"components/navigation/ScreenHeader.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"LockState","sourcePath":"components/status/LockState.jsx"},{"name":"PriorityPill","sourcePath":"components/status/PriorityPill.jsx"},{"name":"StatusPill","sourcePath":"components/status/StatusPill.jsx"},{"name":"TrustBadge","sourcePath":"components/status/TrustBadge.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"cb176fa7207a","components/core/Button.jsx":"f59981aa4d41","components/core/Card.jsx":"9003e10c646e","components/core/Icon.jsx":"e6906df20549","components/core/IconButton.jsx":"9fde9dac8a0b","components/feedback/EmptyState.jsx":"b46cf0dd9a07","components/feedback/ListRow.jsx":"c38cba8faf20","components/feedback/SectionHeader.jsx":"5f3b36e9e59c","components/feedback/VitalStat.jsx":"246b2bea16c0","components/forms/Input.jsx":"65b088cd89c7","components/forms/PermissionChip.jsx":"0063930d456d","components/navigation/ScreenHeader.jsx":"da71b3692c18","components/navigation/TabBar.jsx":"a5d6c1a44879","components/status/LockState.jsx":"da78395b89cc","components/status/PriorityPill.jsx":"193278cefe70","components/status/StatusPill.jsx":"11b771d7b65a","components/status/TrustBadge.jsx":"caa5e9f55909","ui_kits/patient-app/android-frame.jsx":"70c8c3059eeb","ui_kits/patient-app/app.jsx":"8351ce629662","ui_kits/patient-app/data.js":"09f4ecf3374f","ui_kits/patient-app/screens/AccessCenter.jsx":"1d00ce2db07f","ui_kits/patient-app/screens/HealthTrends.jsx":"060ea01e4639","ui_kits/patient-app/screens/HospitalId.jsx":"f42ef89ed2e2","ui_kits/patient-app/screens/Login.jsx":"0286d9e983ed","ui_kits/patient-app/screens/Profile.jsx":"6aca4ff0b1f1","ui_kits/patient-app/screens/RecordsHome.jsx":"fedb6e4a545a","ui_kits/patient-app/screens/Referrals.jsx":"0107ab98e215","ui_kits/patient-app/screens/VisitDetail.jsx":"f04a350ac0f8"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HealthChainDesignSystem_9f6dff = window.HealthChainDesignSystem_9f6dff || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}
const SIZES = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72
};
const TONES = {
  brand: {
    bg: 'var(--brand-fill)',
    fg: 'var(--brand-deep)'
  },
  info: {
    bg: 'var(--info-tint)',
    fg: 'var(--info-ink)'
  },
  accent: {
    bg: 'var(--accent-tint)',
    fg: 'var(--accent-ink)'
  },
  neutral: {
    bg: 'var(--surface-inset)',
    fg: 'var(--text-secondary)'
  }
};
function Avatar({
  name,
  size = 'md',
  tone = 'brand',
  src,
  style,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const t = TONES[tone] || TONES.brand;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: dim,
      height: dim,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: t.bg,
      color: t.fg,
      overflow: 'hidden',
      font: `var(--fw-semibold) ${Math.round(dim * 0.36)}px/1 var(--font-sans)`,
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PADS = {
  sm: 'var(--sp-3)',
  md: 'var(--sp-4)',
  lg: 'var(--sp-5)'
};
const ELEV = {
  flat: 'none',
  low: 'var(--elev-1)',
  raised: 'var(--elev-2)'
};
function Card({
  children,
  padding = 'md',
  elevation = 'low',
  interactive = false,
  accent,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    role: onClick ? 'button' : undefined,
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: PADS[padding] || PADS.md,
      boxShadow: ELEV[elevation] ?? ELEV.low,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
      overflow: 'hidden',
      ...style
    },
    onMouseDown: interactive ? e => {
      e.currentTarget.style.transform = 'scale(0.99)';
    } : undefined,
    onMouseUp: interactive ? e => {
      e.currentTarget.style.transform = 'scale(1)';
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = 'scale(1)';
    } : undefined
  }, rest), accent && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      background: accent,
      borderTopLeftRadius: 'var(--r-lg)',
      borderBottomLeftRadius: 'var(--r-lg)'
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* HealthChain icon set. Path data mirrors Lucide (ISC-licensed, 24px, 2px stroke).
   Kept inline so the design system has no runtime dependency. In production,
   prefer `lucide-react` with the same names. */
const PATHS = {
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
  'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
  'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'alert-triangle': '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'alert-octagon': '<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9Z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  'heart-pulse': '<path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5c0 2.1 1.5 4 3 5.5l7 7Z"/><path d="M3.2 12h4.3l1.5-3 3 6 1.5-3h4.3"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 4 12 2C11.5 4 10 6 8 7.5S5 13 5 15a7 7 0 0 0 7 7Z"/>',
  'qr-code': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3"/><path d="M21 14v.01"/><path d="M14 21h3"/><path d="M21 17v4"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  flask: '<path d="M9 3h6"/><path d="M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3"/><path d="M7.5 14h9"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  stethoscope: '<path d="M4 3v6a4 4 0 0 0 8 0V3"/><path d="M4 3H2"/><path d="M12 3h2"/><path d="M8 15a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="10" r="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M10.7 5.1A9 9 0 0 1 12 5c6.5 0 10 7 10 7a13 13 0 0 1-2.2 2.9"/><path d="M6.6 6.6A13 13 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 4.4-1.1"/><path d="m9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/>',
  fingerprint: '<path d="M12 10a2 2 0 0 0-2 2c0 1.5.5 3 .5 3"/><path d="M14 13.1c0 2.6-.4 4-.8 5.4"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .2-4-.4-6"/><path d="M5 19.5C5.5 18 6 16 6 12a6 6 0 0 1 .4-2"/><path d="M8.6 20.8c.4-1.2.7-2.5.8-3.8"/><path d="M12 6a6 6 0 0 1 6 6c0 1-.1 2-.2 3"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M12 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/>',
  'trending-up': '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  'trending-down': '<path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  'help-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
};
function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  style,
  ...rest
}) {
  const d = PATHS[name];
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    },
    "aria-hidden": "true"
  }, rest, {
    dangerouslySetInnerHTML: {
      __html: d || ''
    }
  }));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 38,
    fontSize: 14,
    padding: '0 14px',
    gap: 7,
    icon: 16
  },
  md: {
    height: 48,
    fontSize: 15,
    padding: '0 18px',
    gap: 8,
    icon: 18
  },
  lg: {
    height: 54,
    fontSize: 16,
    padding: '0 22px',
    gap: 9,
    icon: 20
  }
};
const VARIANTS = {
  primary: {
    background: 'var(--brand)',
    color: 'var(--on-brand)',
    border: '1px solid var(--brand)',
    boxShadow: 'var(--elev-brand)'
  },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--elev-1)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--brand-deep)',
    border: '1px solid transparent',
    boxShadow: 'none'
  },
  tint: {
    background: 'var(--brand-fill)',
    color: 'var(--brand-deep)',
    border: '1px solid transparent',
    boxShadow: 'none'
  },
  destructive: {
    background: 'var(--critical)',
    color: '#fff',
    border: '1px solid var(--critical)',
    boxShadow: 'none'
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: isDisabled ? undefined : onClick,
    disabled: isDisabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      minHeight: s.height,
      padding: s.padding,
      width: fullWidth ? '100%' : undefined,
      font: `var(--fw-semibold) ${s.fontSize}px/1 var(--font-sans)`,
      borderRadius: 'var(--r-md)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'transform var(--dur-fast) var(--ease-standard), filter var(--dur-fast) var(--ease-standard)',
      WebkitTapHighlightColor: 'transparent',
      whiteSpace: 'nowrap',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "activity",
    size: s.icon
  }) : iconLeft && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }), children && /*#__PURE__*/React.createElement("span", null, children), !loading && iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 36,
  md: 44,
  lg: 48
};
function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  label,
  onClick,
  badge = false,
  style,
  ...rest
}) {
  const dim = SIZES[size] || SIZES.md;
  const variants = {
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    },
    surface: {
      background: 'var(--surface-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)'
    },
    tint: {
      background: 'var(--brand-fill)',
      color: 'var(--brand-deep)',
      border: '1px solid transparent'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    "aria-label": label,
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: 'var(--r-md)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast) var(--ease-standard)',
      WebkitTapHighlightColor: 'transparent',
      ...(variants[variant] || variants.ghost),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 18 : 20
  }), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--critical)',
      border: '2px solid var(--surface-card)'
    }
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Empty / loading / error states. One component, three modes. */
function EmptyState({
  mode = 'empty',
  icon = 'file-text',
  title,
  body,
  action,
  style,
  ...rest
}) {
  const tone = mode === 'error' ? 'var(--critical)' : 'var(--text-muted)';
  const bg = mode === 'error' ? 'var(--critical-tint)' : 'var(--surface-inset)';
  const showIcon = mode === 'loading' ? 'activity' : mode === 'error' ? 'alert-triangle' : icon;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: 'var(--sp-10) var(--sp-6)',
      gap: 'var(--sp-2)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 'var(--r-xl)',
      marginBottom: 'var(--sp-2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: bg,
      color: tone,
      animation: mode === 'loading' ? 'hc-pulse 1.4s var(--ease-standard) infinite' : 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: showIcon,
    size: 28,
    strokeWidth: 1.8
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--text-secondary)',
      maxWidth: 280,
      textWrap: 'pretty'
    }
  }, body), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--sp-3)'
    }
  }, action), /*#__PURE__*/React.createElement("style", null, `@keyframes hc-pulse{0%,100%{opacity:1}50%{opacity:.45}}`));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tappable list row — settings, grant lists, navigation. Leading icon tile,
   title + meta, optional right content + chevron. */
function ListRow({
  icon,
  iconTone = 'neutral',
  title,
  meta,
  right,
  chevron = false,
  destructive = false,
  onClick,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      bg: 'var(--surface-inset)',
      fg: 'var(--text-secondary)'
    },
    brand: {
      bg: 'var(--brand-tint)',
      fg: 'var(--brand-deep)'
    },
    info: {
      bg: 'var(--info-tint)',
      fg: 'var(--info-ink)'
    },
    accent: {
      bg: 'var(--accent-tint)',
      fg: 'var(--accent-ink)'
    },
    critical: {
      bg: 'var(--critical-tint)',
      fg: 'var(--critical-ink)'
    }
  };
  const t = tones[destructive ? 'critical' : iconTone] || tones.neutral;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    disabled: !onClick,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      minHeight: 56,
      padding: 'var(--sp-3) var(--sp-4)',
      textAlign: 'left',
      background: 'var(--surface-card)',
      border: 'none',
      cursor: onClick ? 'pointer' : 'default',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 'var(--r-md)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: t.bg,
      color: t.fg
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 19,
    strokeWidth: 2.1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.3 var(--font-sans)',
      color: destructive ? 'var(--critical-ink)' : 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, meta)), right && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      color: 'var(--text-secondary)',
      font: 'var(--text-meta)'
    }
  }, right), chevron && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 20,
    color: "var(--text-muted)",
    style: {
      flexShrink: 0
    }
  }));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Section header inside a screen — small overline + count, optional action. */
function SectionHeader({
  title,
  count,
  icon,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      margin: '0 0 var(--sp-3)',
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 'var(--r-sm)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--brand-tint)',
      color: 'var(--brand-deep)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    strokeWidth: 2.2
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 22,
      height: 22,
      padding: '0 7px',
      borderRadius: 'var(--r-pill)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-inset)',
      color: 'var(--text-secondary)',
      font: 'var(--fw-bold) 12px/1 var(--font-sans)'
    }
  }, count), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, action));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/feedback/VitalStat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* A single vital reading: label, value + unit, optional delta vs previous,
   and a critical flag (color + icon + position, never color alone). */
function VitalStat({
  label,
  value,
  unit,
  delta,
  deltaDir,
  critical = false,
  icon,
  compact = false,
  style,
  ...rest
}) {
  const dirColor = deltaDir === 'up' ? 'var(--critical-ink)' : deltaDir === 'down' ? 'var(--success-ink)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: compact ? 'var(--sp-3)' : 'var(--sp-4)',
      borderRadius: 'var(--r-md)',
      background: critical ? 'var(--critical-tint)' : 'var(--surface-card)',
      border: `1px solid ${critical ? 'color-mix(in srgb, var(--critical) 26%, transparent)' : 'var(--border)'}`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: critical ? 'var(--critical-ink)' : 'var(--text-muted)',
    strokeWidth: 2.2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      color: critical ? 'var(--critical-ink)' : 'var(--text-muted)'
    }
  }, label), critical && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-triangle",
    size: 14,
    color: "var(--critical)",
    strokeWidth: 2.4,
    style: {
      marginLeft: 'auto'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-bold) ${compact ? 22 : 26}px/1 var(--font-sans)`,
      color: critical ? 'var(--critical-ink)' : 'var(--text-primary)',
      letterSpacing: '-0.02em'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 13px/1 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, unit)), delta != null && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      font: 'var(--fw-semibold) 12px/1 var(--font-sans)',
      color: dirColor
    }
  }, deltaDir && deltaDir !== 'flat' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: deltaDir === 'up' ? 'trending-up' : 'trending-down',
    size: 14,
    strokeWidth: 2.2
  }), delta));
}
Object.assign(__ds_scope, { VitalStat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/VitalStat.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Text input with label, optional leading icon, helper/error text.
   For passwords pass type="password" with an icon — toggle is built in. */
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  error,
  helper,
  disabled = false,
  inputMode,
  maxLength,
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? show ? 'text' : 'password' : type;
  const borderColor = error ? 'var(--critical)' : focus ? 'var(--brand)' : 'var(--border)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
      color: 'var(--text-secondary)',
      marginBottom: 7
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 52,
      padding: '0 14px',
      borderRadius: 'var(--r-md)',
      background: disabled ? 'var(--surface-inset)' : 'var(--surface-card)',
      border: `1.5px solid ${borderColor}`,
      boxShadow: focus && !error ? '0 0 0 4px var(--focus-ring)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 19,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: inputType,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    inputMode: inputMode,
    maxLength: maxLength,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--fw-medium) 16px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, rest)), isPassword && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShow(s => !s),
    "aria-label": show ? 'Hide' : 'Show',
    style: {
      display: 'flex',
      padding: 4,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: show ? 'eye-off' : 'eye',
    size: 19
  }))), (error || helper) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 7,
      font: 'var(--text-meta)',
      fontWeight: 500,
      color: error ? 'var(--critical-ink)' : 'var(--text-muted)'
    }
  }, error && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-triangle",
    size: 13,
    strokeWidth: 2.2
  }), error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/PermissionChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Permission scopes a clinician can request / a patient can grant.
   Used as multi-select chips in access requests and grant summaries. */
const SCOPES = {
  visits: {
    label: 'Visits',
    icon: 'file-text'
  },
  vitals: {
    label: 'Vitals',
    icon: 'activity'
  },
  diagnoses: {
    label: 'Diagnoses',
    icon: 'stethoscope'
  },
  prescriptions: {
    label: 'Prescriptions',
    icon: 'pill'
  },
  'lab-results': {
    label: 'Lab results',
    icon: 'flask'
  },
  imaging: {
    label: 'Imaging',
    icon: 'scan'
  }
};
function PermissionChip({
  scope,
  label,
  icon,
  selected = false,
  readOnly = false,
  onToggle,
  style,
  ...rest
}) {
  const cfg = SCOPES[scope] || {
    label: label || scope,
    icon: icon || 'check'
  };
  const interactive = !readOnly && onToggle;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: interactive ? () => onToggle(scope) : undefined,
    "aria-pressed": selected,
    disabled: readOnly,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      height: 36,
      padding: '0 13px 0 11px',
      borderRadius: 'var(--r-pill)',
      cursor: interactive ? 'pointer' : 'default',
      background: selected ? 'var(--brand-fill)' : 'var(--surface-card)',
      color: selected ? 'var(--brand-deep)' : 'var(--text-secondary)',
      border: `1.5px solid ${selected ? 'var(--green-300)' : 'var(--border)'}`,
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
      transition: 'all var(--dur-fast) var(--ease-standard)',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: selected ? 'check' : cfg.icon,
    size: 15,
    strokeWidth: 2.2
  }), label || cfg.label);
}
Object.assign(__ds_scope, { PermissionChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/PermissionChip.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ScreenHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Screen header. Large title by default; pass onBack for a detail/back header.
   `right` slot takes IconButtons or a TrustBadge. */
function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  large = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'flex',
      alignItems: large ? 'flex-end' : 'center',
      gap: 'var(--sp-3)',
      padding: large ? 'var(--sp-5) var(--screen-pad) var(--sp-3)' : '0 var(--screen-pad)',
      minHeight: large ? undefined : 56,
      background: 'var(--surface-bg)',
      ...style
    }
  }, rest), onBack && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    "aria-label": "Back",
    style: {
      width: 40,
      height: 40,
      marginLeft: -8,
      flexShrink: 0,
      borderRadius: 'var(--r-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-left",
    size: 22,
    strokeWidth: 2.2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: large ? 'var(--text-h1)' : 'var(--text-h2)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--ls-tight)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      color: 'var(--text-secondary)',
      marginTop: 2,
      fontWeight: 400
    }
  }, subtitle)), right && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-1)',
      flexShrink: 0
    }
  }, right));
}
Object.assign(__ds_scope, { ScreenHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ScreenHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Primary bottom navigation. Four sections + a central floating action (Appointments).
   The FAB sits above the bar; tabs split around it. */
const DEFAULT_TABS = [{
  id: 'records',
  label: 'Records',
  icon: 'file-text'
}, {
  id: 'access',
  label: 'Access',
  icon: 'shield-check'
}, {
  id: 'history',
  label: 'History',
  icon: 'activity'
}, {
  id: 'referrals',
  label: 'Referrals',
  icon: 'send'
}];
function Tab({
  tab,
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onSelect(tab.id),
    "aria-label": tab.label,
    "aria-current": active,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      height: '100%',
      minHeight: 44,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: active ? 'var(--brand)' : 'var(--text-muted)',
      WebkitTapHighlightColor: 'transparent',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: tab.icon,
    size: 23,
    strokeWidth: active ? 2.4 : 2
  }), tab.badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -5,
      right: -8,
      minWidth: 16,
      height: 16,
      padding: '0 4px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--critical)',
      color: '#fff',
      font: 'var(--fw-bold) 10px/16px var(--font-sans)',
      textAlign: 'center',
      border: '1.5px solid var(--surface-card)'
    }
  }, tab.badge) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} 11px/1 var(--font-sans)`
    }
  }, tab.label));
}
function TabBar({
  active = 'records',
  onSelect = () => {},
  tabs = DEFAULT_TABS,
  onFab = () => {},
  fabIcon = 'plus',
  style,
  ...rest
}) {
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      height: 'var(--tabbar-h)',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border)',
      boxShadow: '0 -2px 12px rgba(10,14,26,0.05)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      ...style
    }
  }, rest), left.map(t => /*#__PURE__*/React.createElement(Tab, {
    key: t.id,
    tab: t,
    active: active === t.id,
    onSelect: onSelect
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      flexShrink: 0,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onFab,
    "aria-label": "New appointment",
    style: {
      position: 'absolute',
      top: -22,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: '4px solid var(--surface-bg)',
      background: 'var(--brand)',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--elev-brand)',
      WebkitTapHighlightColor: 'transparent'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: fabIcon,
    size: 26,
    strokeWidth: 2.4
  }))), right.map(t => /*#__PURE__*/React.createElement(Tab, {
    key: t.id,
    tab: t,
    active: active === t.id,
    onSelect: onSelect
  })));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/status/LockState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The product's core metaphor for away-institution records and access:
   locked -> requested (pending) -> granted. Renders a tactile state tile. */
const PHASES = {
  locked: {
    icon: 'lock',
    tone: 'locked',
    title: 'Records locked',
    body: 'These records are held at another institution. Request access to unlock.',
    cta: 'Request access'
  },
  pending: {
    icon: 'clock',
    tone: 'urgent',
    title: 'Request pending',
    body: 'Waiting for approval. You can revoke this request at any time.',
    cta: null
  },
  granted: {
    icon: 'shield-check',
    tone: 'success',
    title: 'Access granted',
    body: 'You have approved access to these records.',
    cta: null
  },
  denied: {
    icon: 'x-circle',
    tone: 'critical',
    title: 'Access denied',
    body: 'This request was declined.',
    cta: 'Request again'
  }
};
const TONES = {
  locked: {
    bg: 'var(--locked-tint)',
    fg: 'var(--locked)',
    ring: 'var(--border)'
  },
  urgent: {
    bg: 'var(--urgent-tint)',
    fg: 'var(--urgent-ink)',
    ring: 'var(--urgent)'
  },
  success: {
    bg: 'var(--success-tint)',
    fg: 'var(--success-ink)',
    ring: 'var(--success)'
  },
  critical: {
    bg: 'var(--critical-tint)',
    fg: 'var(--critical-ink)',
    ring: 'var(--critical)'
  }
};
function LockState({
  phase = 'locked',
  title,
  body,
  onAction,
  actionLabel,
  style,
  ...rest
}) {
  const cfg = PHASES[phase] || PHASES.locked;
  const tone = TONES[cfg.tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 'var(--sp-3)',
      alignItems: 'flex-start',
      padding: 'var(--sp-4)',
      borderRadius: 'var(--r-lg)',
      background: tone.bg,
      border: `1px solid color-mix(in srgb, ${tone.ring} 26%, transparent)`,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--r-md)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-card)',
      color: tone.fg,
      boxShadow: 'var(--elev-1)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: cfg.icon,
    size: 20,
    strokeWidth: 2.2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.3 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, title || cfg.title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      color: 'var(--text-secondary)',
      marginTop: 3,
      fontWeight: 400
    }
  }, body || cfg.body), (actionLabel || cfg.cta) && onAction && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      marginTop: 'var(--sp-3)',
      height: 38,
      padding: '0 14px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--surface-card)',
      color: tone.fg,
      border: `1px solid color-mix(in srgb, ${tone.ring} 40%, transparent)`,
      borderRadius: 'var(--r-md)',
      cursor: 'pointer',
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: phase === 'locked' ? 'unlock' : 'arrow-right',
    size: 15,
    strokeWidth: 2.2
  }), actionLabel || cfg.cta)));
}
Object.assign(__ds_scope, { LockState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/LockState.jsx", error: String((e && e.message) || e) }); }

// components/status/PriorityPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Priority escalates: routine -> urgent -> emergency -> critical.
   Icon weight + fill escalate with severity so it reads without color too. */
const PRIORITY = {
  routine: {
    label: 'Routine',
    tone: 'neutral',
    icon: 'check'
  },
  urgent: {
    label: 'Urgent',
    tone: 'urgent',
    icon: 'alert-triangle'
  },
  emergency: {
    label: 'Emergency',
    tone: 'critical',
    icon: 'alert-octagon'
  },
  critical: {
    label: 'Critical',
    tone: 'critical',
    icon: 'alert-octagon'
  }
};
const TONES = {
  neutral: {
    bg: 'var(--locked-tint)',
    fg: 'var(--locked)',
    solid: 'var(--locked)'
  },
  urgent: {
    bg: 'var(--urgent-tint)',
    fg: 'var(--urgent-ink)',
    solid: 'var(--urgent)'
  },
  critical: {
    bg: 'var(--critical-tint)',
    fg: 'var(--critical-ink)',
    solid: 'var(--critical)'
  }
};
function PriorityPill({
  priority,
  size = 'md',
  style,
  ...rest
}) {
  const cfg = PRIORITY[priority] || PRIORITY.routine;
  const tone = TONES[cfg.tone];
  const critical = priority === 'critical';
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sm ? 4 : 5,
      height: sm ? 22 : 26,
      padding: sm ? '0 8px' : '0 10px',
      borderRadius: 'var(--r-pill)',
      background: critical ? tone.solid : tone.bg,
      color: critical ? '#fff' : tone.fg,
      border: critical ? 'none' : `1px solid ${tone.bg}`,
      font: `var(--fw-bold) ${sm ? 11 : 12}px/1 var(--font-sans)`,
      letterSpacing: '0.01em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: cfg.icon,
    size: sm ? 12 : 14,
    strokeWidth: critical ? 2.6 : 2.2
  }), cfg.label);
}
Object.assign(__ds_scope, { PriorityPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/PriorityPill.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* One status vocabulary, reused across visits, prescriptions, labs, referrals
   and access grants. Always color + icon + label — never color alone (a11y). */
const STATUS = {
  // visit / referral lifecycle
  'in-progress': {
    label: 'In progress',
    tone: 'info',
    icon: 'activity'
  },
  completed: {
    label: 'Completed',
    tone: 'success',
    icon: 'check-circle'
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    icon: 'x-circle'
  },
  pending: {
    label: 'Pending',
    tone: 'urgent',
    icon: 'clock'
  },
  accepted: {
    label: 'Accepted',
    tone: 'info',
    icon: 'check'
  },
  rejected: {
    label: 'Rejected',
    tone: 'critical',
    icon: 'x-circle'
  },
  // prescriptions
  prescribed: {
    label: 'Prescribed',
    tone: 'info',
    icon: 'pill'
  },
  dispensing: {
    label: 'Dispensing',
    tone: 'urgent',
    icon: 'clock'
  },
  dispensed: {
    label: 'Dispensed',
    tone: 'success',
    icon: 'check-circle'
  },
  // labs / imaging
  ordered: {
    label: 'Ordered',
    tone: 'info',
    icon: 'clock'
  },
  resulted: {
    label: 'Resulted',
    tone: 'success',
    icon: 'check-circle'
  },
  // access / records
  locked: {
    label: 'Locked',
    tone: 'neutral',
    icon: 'lock'
  },
  granted: {
    label: 'Granted',
    tone: 'success',
    icon: 'shield-check'
  },
  revoked: {
    label: 'Revoked',
    tone: 'critical',
    icon: 'x-circle'
  },
  expired: {
    label: 'Expired',
    tone: 'neutral',
    icon: 'clock'
  },
  approved: {
    label: 'Approved',
    tone: 'success',
    icon: 'check-circle'
  },
  denied: {
    label: 'Denied',
    tone: 'critical',
    icon: 'x-circle'
  }
};
const TONES = {
  success: {
    bg: 'var(--success-tint)',
    fg: 'var(--success-ink)'
  },
  info: {
    bg: 'var(--info-tint)',
    fg: 'var(--info-ink)'
  },
  urgent: {
    bg: 'var(--urgent-tint)',
    fg: 'var(--urgent-ink)'
  },
  critical: {
    bg: 'var(--critical-tint)',
    fg: 'var(--critical-ink)'
  },
  neutral: {
    bg: 'var(--locked-tint)',
    fg: 'var(--locked)'
  }
};
function StatusPill({
  status,
  size = 'md',
  solid = false,
  style,
  ...rest
}) {
  const cfg = STATUS[status] || {
    label: status,
    tone: 'neutral',
    icon: 'info'
  };
  const tone = TONES[cfg.tone];
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sm ? 4 : 5,
      height: sm ? 22 : 26,
      padding: sm ? '0 8px' : '0 10px',
      borderRadius: 'var(--r-pill)',
      background: solid ? tone.fg : tone.bg,
      color: solid ? '#fff' : tone.fg,
      font: `var(--fw-semibold) ${sm ? 11 : 12}px/1 var(--font-sans)`,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: cfg.icon,
    size: sm ? 12 : 13,
    strokeWidth: 2.4
  }), cfg.label);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/status/TrustBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Trust signals around consent + blockchain audit. Use purposefully, not gratuitously. */
const KINDS = {
  blockchain: {
    label: 'Logged to blockchain',
    icon: 'link',
    tone: 'accent'
  },
  verified: {
    label: 'Verified',
    icon: 'shield-check',
    tone: 'success'
  },
  encrypted: {
    label: 'Encrypted',
    icon: 'lock',
    tone: 'info'
  },
  audited: {
    label: 'Audited',
    icon: 'shield',
    tone: 'accent'
  },
  'id-only': {
    label: 'ID only — no medical data',
    icon: 'shield-check',
    tone: 'success'
  }
};
const TONES = {
  success: {
    bg: 'var(--success-tint)',
    fg: 'var(--success-ink)'
  },
  info: {
    bg: 'var(--info-tint)',
    fg: 'var(--info-ink)'
  },
  accent: {
    bg: 'var(--accent-tint)',
    fg: 'var(--accent-ink)'
  }
};
function TrustBadge({
  kind = 'verified',
  label,
  size = 'md',
  style,
  ...rest
}) {
  const cfg = KINDS[kind] || KINDS.verified;
  const tone = TONES[cfg.tone];
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: sm ? 24 : 28,
      padding: sm ? '0 9px' : '0 11px',
      borderRadius: 'var(--r-pill)',
      background: tone.bg,
      color: tone.fg,
      font: `var(--fw-semibold) ${sm ? 11 : 12}px/1 var(--font-sans)`,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: cfg.icon,
    size: sm ? 13 : 14,
    strokeWidth: 2.2
  }), label || cfg.label);
}
Object.assign(__ds_scope, { TrustBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/TrustBadge.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/android-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// Android.jsx — Simplified Android (Material 3) device frame
// Status bar + top app bar + content + gesture nav + keyboard.
// Based on Figma M3 spec. No dependencies, no image assets.
// Exports (to window): AndroidDevice, AndroidStatusBar, AndroidAppBar, AndroidListItem, AndroidNavBar, AndroidKeyboard
//
// Usage — wrap your screen content in <AndroidDevice> to get the bezel, status
// bar and gesture nav (props: title, large, keyboard, dark):
//
//   <AndroidDevice title="Inbox" large>
//     ...your screen content...
//   </AndroidDevice>
//   <AndroidDevice title="Compose" keyboard>…</AndroidDevice>
/* END USAGE */

const MD_C = {
  surface: '#f4fbf8',
  surfaceVariant: '#dae5e1',
  inverseOnSurface: '#ecf2ef',
  secondaryContainer: '#cde8e1',
  primaryFixedDim: '#83d5c6',
  onSurface: '#171d1b',
  onSurfaceVar: '#49454f',
  onPrimaryContainer: '#00201c',
  primary: '#006a60',
  frameBorder: 'rgba(116,119,117,0.5)'
};

// ─────────────────────────────────────────────────────────────
// Status bar (time left, wifi/cell/battery right)
// ─────────────────────────────────────────────────────────────
function AndroidStatusBar({
  dark = false
}) {
  const c = dark ? '#fff' : MD_C.onSurface;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'relative',
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 128,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 400,
      letterSpacing: 0.25,
      lineHeight: '20px',
      color: c
    }
  }, "9:30")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 8,
      transform: 'translateX(-50%)',
      width: 24,
      height: 24,
      borderRadius: 100,
      background: '#2e2e2e'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      paddingRight: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    style: {
      marginRight: -2
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    style: {
      marginRight: -2
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14.67 14.67V1.33L1.33 14.67h13.34z",
    fill: c
  }))), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3.75",
    y: "2",
    width: "8.5",
    height: "13",
    rx: "1.5",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "5.5",
    y: "0.9",
    width: "5",
    height: "2",
    rx: "0.5",
    fill: c
  }))));
}

// ─────────────────────────────────────────────────────────────
// Top app bar (Material 3 small/medium)
// ─────────────────────────────────────────────────────────────
function AndroidAppBar({
  title = 'Title',
  large = false
}) {
  const iconDot = /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: MD_C.onSurfaceVar,
      opacity: 0.3
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: MD_C.surface,
      padding: '4px 4px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, iconDot, !large && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 22,
      fontWeight: 400,
      color: MD_C.onSurface,
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, title), large && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), iconDot), large && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 20px',
      fontSize: 28,
      fontWeight: 400,
      color: MD_C.onSurface,
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// List item (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidListItem({
  headline,
  supporting,
  leading
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 16px',
      minHeight: 56,
      boxSizing: 'border-box',
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, leading && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: MD_C.primary,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      fontWeight: 500,
      flexShrink: 0
    }
  }, leading), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: MD_C.onSurface,
      lineHeight: '24px'
    }
  }, headline), supporting && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: MD_C.onSurfaceVar,
      lineHeight: '20px'
    }
  }, supporting)));
}

// ─────────────────────────────────────────────────────────────
// Gesture nav bar (pill)
// ─────────────────────────────────────────────────────────────
function AndroidNavBar({
  dark = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 108,
      height: 4,
      borderRadius: 2,
      background: dark ? '#fff' : MD_C.onSurface,
      opacity: 0.4
    }
  }));
}

// ─────────────────────────────────────────────────────────────
// Device frame — wraps everything
// ─────────────────────────────────────────────────────────────
function AndroidDevice({
  children,
  width = 412,
  height = 892,
  dark = false,
  title,
  large = false,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 18,
      overflow: 'hidden',
      background: dark ? '#1d1b20' : MD_C.surface,
      border: `8px solid ${MD_C.frameBorder}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(AndroidStatusBar, {
    dark: dark
  }), title !== undefined && /*#__PURE__*/React.createElement(AndroidAppBar, {
    title: title,
    large: large
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(AndroidKeyboard, null), /*#__PURE__*/React.createElement(AndroidNavBar, {
    dark: dark
  }));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — Gboard (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidKeyboard() {
  let _k = 0;
  const key = (l, {
    flex = 1,
    bg = MD_C.surface,
    r = 6,
    minW,
    fs = 21
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: _k++,
    style: {
      height: 46,
      borderRadius: r,
      flex,
      minWidth: minW,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Roboto, system-ui',
      fontSize: fs,
      color: MD_C.onPrimaryContainer
    }
  }, l);
  const row = (keys, style = {}) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      ...style
    }
  }, keys.map(l => key(l)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: MD_C.inverseOnSurface,
      padding: '0 8px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], {
    padding: '0 20px'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, key('', {
    bg: MD_C.surfaceVariant
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flex: 7,
      minWidth: 274
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l))), key('', {
    bg: MD_C.surfaceVariant
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, key('?123', {
    bg: MD_C.secondaryContainer,
    r: 100,
    minW: 58,
    fs: 14
  }), key(',', {
    bg: MD_C.surfaceVariant
  }), key('', {
    flex: 3,
    minW: 154
  }), key('.', {
    bg: MD_C.surfaceVariant
  }), key('', {
    bg: MD_C.primaryFixedDim,
    r: 100,
    minW: 58
  }))));
}
Object.assign(window, {
  AndroidDevice,
  AndroidStatusBar,
  AndroidAppBar,
  AndroidListItem,
  AndroidNavBar,
  AndroidKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/android-frame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/app.jsx
try { (() => {
/* App shell — navigation, tab bar, modals. */
const HCA = window.HealthChainDesignSystem_9f6dff;
function Sheet({
  title,
  onClose,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(10,14,26,0.45)',
      animation: 'hcFade var(--dur-base) var(--ease-standard)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      borderTopLeftRadius: 'var(--r-xl)',
      borderTopRightRadius: 'var(--r-xl)',
      padding: '10px var(--screen-pad) 24px',
      boxShadow: '0 -8px 40px rgba(10,14,26,0.2)',
      animation: 'hcSlide var(--dur-slow) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: 'var(--border-200)',
      margin: '0 auto 16px'
    }
  }), title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)',
      marginBottom: 16
    }
  }, title), children), /*#__PURE__*/React.createElement("style", null, `@keyframes hcFade{from{opacity:0}to{opacity:1}}@keyframes hcSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}`));
}
function ChangePassword({
  onClose
}) {
  const [cur, setCur] = React.useState('');
  const [nw, setNw] = React.useState('');
  const [cf, setCf] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const err = nw && nw.length < 8 ? 'Must be at least 8 characters' : cf && cf !== nw ? 'Passwords do not match' : undefined;
  const ok = cur && nw.length >= 8 && cf === nw;
  return /*#__PURE__*/React.createElement(Sheet, {
    title: "Change password",
    onClose: onClose
  }, saved ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '12px 0 8px'
    }
  }, /*#__PURE__*/React.createElement(HCA.Icon, {
    name: "check-circle",
    size: 44,
    color: "var(--success)",
    style: {
      margin: '0 auto 12px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, "Password updated")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(HCA.Input, {
    label: "Current password",
    type: "password",
    icon: "lock",
    value: cur,
    onChange: e => setCur(e.target.value)
  }), /*#__PURE__*/React.createElement(HCA.Input, {
    label: "New password",
    type: "password",
    icon: "lock",
    value: nw,
    onChange: e => setNw(e.target.value),
    helper: !err ? 'Minimum 8 characters' : undefined,
    error: nw && nw.length < 8 ? err : undefined
  }), /*#__PURE__*/React.createElement(HCA.Input, {
    label: "Confirm new password",
    type: "password",
    icon: "lock",
    value: cf,
    onChange: e => setCf(e.target.value),
    error: cf && cf !== nw ? 'Passwords do not match' : undefined
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(HCA.Button, {
    variant: "secondary",
    fullWidth: true,
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement(HCA.Button, {
    variant: "primary",
    fullWidth: true,
    disabled: !ok,
    onClick: () => setSaved(true)
  }, "Update"))));
}
function SignOut({
  onClose,
  onConfirm
}) {
  return /*#__PURE__*/React.createElement(Sheet, {
    title: "Sign out?",
    onClose: onClose
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--text-secondary)',
      margin: '0 0 18px'
    }
  }, "You'll need your National ID and password to sign back in."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(HCA.Button, {
    variant: "secondary",
    fullWidth: true,
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement(HCA.Button, {
    variant: "destructive",
    fullWidth: true,
    iconLeft: "log-out",
    onClick: onConfirm
  }, "Sign out")));
}
function Appointment({
  onClose
}) {
  return /*#__PURE__*/React.createElement(Sheet, {
    title: "Book an appointment",
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      padding: 14,
      borderRadius: 'var(--r-md)',
      background: 'var(--brand-tint)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(HCA.Icon, {
    name: "calendar",
    size: 20,
    color: "var(--brand-deep)",
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--brand-deep)',
      textWrap: 'pretty'
    }
  }, "Choose an institution you've granted access to and request a time. Your doctor confirms the slot.")), /*#__PURE__*/React.createElement(HCA.Button, {
    variant: "primary",
    fullWidth: true,
    iconLeft: "plus",
    onClick: onClose
  }, "Request appointment"));
}
function App() {
  const [screen, setScreen] = React.useState('login');
  const [params, setParams] = React.useState({});
  const [modal, setModal] = React.useState(null);
  const nav = (s, pr = {}) => {
    setScreen(s);
    setParams(pr);
  };
  const TAB_OF = {
    records: 'records',
    access: 'access',
    trends: 'history',
    referrals: 'referrals'
  };
  const onTab = id => nav({
    records: 'records',
    access: 'access',
    history: 'trends',
    referrals: 'referrals'
  }[id]);
  const showTabs = ['records', 'access', 'trends', 'referrals', 'profile'].includes(screen);
  let content;
  if (screen === 'login') content = /*#__PURE__*/React.createElement(LoginScreen, {
    onLogin: () => nav('records')
  });else if (screen === 'records') content = /*#__PURE__*/React.createElement(RecordsHome, {
    nav: nav
  });else if (screen === 'visit') content = /*#__PURE__*/React.createElement(VisitDetail, {
    visitId: params.id,
    nav: nav
  });else if (screen === 'hospitalId') content = /*#__PURE__*/React.createElement(HospitalId, {
    nav: nav
  });else if (screen === 'access') content = /*#__PURE__*/React.createElement(AccessCenter, null);else if (screen === 'trends') content = /*#__PURE__*/React.createElement(HealthTrends, {
    nav: nav
  });else if (screen === 'referrals') content = /*#__PURE__*/React.createElement(Referrals, null);else if (screen === 'profile') content = /*#__PURE__*/React.createElement(Profile, {
    nav: nav,
    setModal: setModal
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto'
    }
  }, content), showTabs && /*#__PURE__*/React.createElement(HCA.TabBar, {
    active: TAB_OF[screen] || (screen === 'profile' ? '' : ''),
    tabs: [{
      id: 'records',
      label: 'Records',
      icon: 'file-text'
    }, {
      id: 'access',
      label: 'Access',
      icon: 'shield-check',
      badge: window.HC.pendingRequests.length
    }, {
      id: 'history',
      label: 'History',
      icon: 'activity'
    }, {
      id: 'referrals',
      label: 'Referrals',
      icon: 'send'
    }],
    onSelect: onTab,
    onFab: () => setModal('appointment')
  }), modal === 'password' && /*#__PURE__*/React.createElement(ChangePassword, {
    onClose: () => setModal(null)
  }), modal === 'signout' && /*#__PURE__*/React.createElement(SignOut, {
    onClose: () => setModal(null),
    onConfirm: () => {
      setModal(null);
      nav('login');
    }
  }), modal === 'appointment' && /*#__PURE__*/React.createElement(Appointment, {
    onClose: () => setModal(null)
  }));
}
window.HCApp = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/data.js
try { (() => {
/* HealthChain — sample patient data for the UI kit (fictional). */
window.HC = {
  patient: {
    fullName: 'Mwila Banda',
    nationalId: '123456/78/9',
    gender: 'Female',
    dob: '12 Mar 1991',
    age: 35,
    phone: '+260 97 123 4567',
    bloodType: 'O+',
    maritalStatus: 'Married',
    occupation: 'Secondary school teacher',
    allergies: ['Penicillin', 'Sulfa drugs']
  },
  visits: [{
    id: 'VIS-2026-A3F2',
    visitType: 'inpatient',
    priority: 'urgent',
    status: 'in-progress',
    admissionDate: '12 Jun 2026',
    dischargeDate: null,
    chiefComplaint: 'Shortness of breath and chest tightness for 3 days',
    institution: 'University Teaching Hospital',
    counts: {
      diagnoses: 2,
      prescriptions: 3,
      labs: 4,
      imaging: 1
    },
    away: false,
    vitals: {
      temperature: 38.9,
      bpSys: 138,
      bpDia: 88,
      pulse: 102,
      resp: 22,
      spo2: 94,
      weight: 68,
      height: 164,
      pain: 4,
      recorded: '14 Jun 2026, 08:10'
    },
    consultation: {
      chiefComplaint: 'Shortness of breath and chest tightness for 3 days',
      hpi: 'Progressive dyspnoea on exertion, worse at night. Dry cough. No fever until today. No leg swelling.',
      exam: 'Mild respiratory distress. Bilateral wheeze. SpO₂ 94% on room air.',
      findings: 'Reduced air entry at both bases, expiratory wheeze.',
      assessment: 'Acute exacerbation of asthma, likely viral trigger.',
      plan: 'Nebulised salbutamol, oral prednisolone, monitor SpO₂. Chest X-ray.',
      followUp: 'Review in 48 hours; step-down if SpO₂ stable >95%.',
      nextAppointment: '16 Jun 2026'
    },
    diagnoses: [{
      icd: 'J45.909',
      name: 'Unspecified asthma with exacerbation',
      type: 'confirmed',
      severity: 'Moderate',
      notes: 'Responsive to bronchodilators.'
    }, {
      icd: 'J06.9',
      name: 'Acute upper respiratory infection',
      type: 'provisional',
      severity: 'Mild',
      notes: 'Likely viral trigger.'
    }],
    prescriptions: [{
      number: 'RX-2026-7741',
      status: 'dispensing',
      meds: [{
        name: 'Salbutamol',
        generic: 'Salbutamol sulfate',
        strength: '5 mg/mL',
        form: 'Nebuliser solution',
        dose: '2.5 mg',
        frequency: 'Every 6 hours',
        route: 'Inhaled',
        duration: '5 days',
        quantity: '20 vials',
        instructions: 'Via nebuliser. Stop if palpitations.',
        dispensed: true
      }, {
        name: 'Prednisolone',
        generic: 'Prednisolone',
        strength: '5 mg',
        form: 'Tablet',
        dose: '40 mg',
        frequency: 'Once daily (morning)',
        route: 'Oral',
        duration: '5 days',
        quantity: '40 tablets',
        instructions: 'Take with food.',
        dispensed: false
      }, {
        name: 'Paracetamol',
        generic: 'Paracetamol',
        strength: '500 mg',
        form: 'Tablet',
        dose: '1 g',
        frequency: 'Every 6 hours as needed',
        route: 'Oral',
        duration: '5 days',
        quantity: '24 tablets',
        instructions: 'Max 4 g per day.',
        dispensed: false
      }]
    }],
    labs: [{
      test: 'Full blood count',
      code: 'FBC',
      specimen: 'Whole blood',
      status: 'resulted',
      interpretation: 'Mild leukocytosis',
      abnormal: 'WBC 12.4 ×10⁹/L (high)',
      values: 'Hb 12.8 · WBC 12.4 · Plt 280'
    }, {
      test: 'C-reactive protein',
      code: 'CRP',
      specimen: 'Serum',
      status: 'resulted',
      interpretation: 'Raised',
      abnormal: 'CRP 48 mg/L (high)',
      values: 'CRP 48 mg/L'
    }, {
      test: 'Malaria RDT',
      code: 'mRDT',
      specimen: 'Whole blood',
      status: 'resulted',
      interpretation: 'Negative',
      abnormal: null,
      values: 'Negative'
    }, {
      test: 'Arterial blood gas',
      code: 'ABG',
      specimen: 'Arterial blood',
      status: 'ordered',
      interpretation: null,
      abnormal: null,
      values: null
    }],
    imaging: [{
      modality: 'x-ray',
      bodyPart: 'Chest',
      indication: 'Dyspnoea, rule out consolidation',
      status: 'resulted',
      findings: 'Hyperinflated lung fields. No focal consolidation or effusion.',
      impression: 'No acute consolidation. Findings consistent with airway disease.',
      recommendations: 'Clinical correlation; repeat if symptoms persist.'
    }],
    discharge: null
  }, {
    id: 'VIS-2026-91C7',
    visitType: 'outpatient',
    priority: 'routine',
    status: 'completed',
    admissionDate: '02 May 2026',
    dischargeDate: '02 May 2026',
    chiefComplaint: 'Routine antenatal review',
    institution: 'Chilenje Clinic',
    counts: {
      diagnoses: 1,
      prescriptions: 1,
      labs: 2,
      imaging: 0
    },
    away: false,
    vitals: {
      temperature: 36.7,
      bpSys: 118,
      bpDia: 76,
      pulse: 78,
      resp: 16,
      spo2: 99,
      weight: 67,
      height: 164,
      pain: 0,
      recorded: '02 May 2026, 10:20'
    },
    consultation: {
      chiefComplaint: 'Routine antenatal review',
      hpi: 'Well, no complaints. Good fetal movements.',
      exam: 'Fundal height appropriate. FHR 142 bpm.',
      findings: 'Normal antenatal examination.',
      assessment: 'Uncomplicated pregnancy at 28 weeks.',
      plan: 'Continue iron and folate. Routine bloods.',
      followUp: 'Review in 4 weeks.',
      nextAppointment: '30 May 2026'
    },
    diagnoses: [{
      icd: 'Z34.8',
      name: 'Supervision of normal pregnancy',
      type: 'confirmed',
      severity: '—',
      notes: '28 weeks gestation.'
    }],
    prescriptions: [{
      number: 'RX-2026-6620',
      status: 'dispensed',
      meds: [{
        name: 'Ferrous + Folic acid',
        generic: 'Ferrous fumarate / folic acid',
        strength: '200 mg / 0.4 mg',
        form: 'Tablet',
        dose: '1 tablet',
        frequency: 'Once daily',
        route: 'Oral',
        duration: '30 days',
        quantity: '30 tablets',
        instructions: 'Take with food.',
        dispensed: true
      }]
    }],
    labs: [{
      test: 'Haemoglobin',
      code: 'Hb',
      specimen: 'Whole blood',
      status: 'resulted',
      interpretation: 'Normal',
      abnormal: null,
      values: 'Hb 11.6 g/dL'
    }, {
      test: 'HIV screen',
      code: 'HIV',
      specimen: 'Serum',
      status: 'resulted',
      interpretation: 'Non-reactive',
      abnormal: null,
      values: 'Non-reactive'
    }],
    imaging: [],
    discharge: {
      diagnosis: 'Normal antenatal review',
      summary: 'Reviewed and well at 28 weeks. No concerns.',
      instructions: 'Continue supplements. Return if reduced fetal movements.',
      followUp: '30 May 2026'
    }
  }, {
    id: 'VIS-2025-44B8',
    visitType: 'emergency',
    priority: 'emergency',
    status: 'completed',
    admissionDate: '18 Nov 2025',
    dischargeDate: '20 Nov 2025',
    chiefComplaint: 'Road traffic accident — left forearm injury',
    institution: 'Ndola Teaching Hospital',
    counts: {
      diagnoses: 1,
      prescriptions: 2,
      labs: 1,
      imaging: 1
    },
    away: true,
    vitals: {
      temperature: 36.9,
      bpSys: 126,
      bpDia: 80,
      pulse: 96,
      resp: 18,
      spo2: 98,
      weight: 66,
      height: 164,
      pain: 7,
      recorded: '18 Nov 2025, 19:42'
    }
  }],
  trends: {
    bp: [{
      v: '118/76',
      s: 118,
      d: 76,
      date: '02 May',
      visit: 'VIS-2026-91C7'
    }, {
      v: '124/80',
      s: 124,
      d: 80,
      date: '28 May',
      visit: 'VIS-2026-91C7'
    }, {
      v: '132/86',
      s: 132,
      d: 86,
      date: '12 Jun',
      visit: 'VIS-2026-A3F2'
    }, {
      v: '138/88',
      s: 138,
      d: 88,
      date: '14 Jun',
      visit: 'VIS-2026-A3F2'
    }],
    pulse: [{
      s: 78,
      date: '02 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 80,
      date: '28 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 98,
      date: '12 Jun',
      visit: 'VIS-2026-A3F2'
    }, {
      s: 102,
      date: '14 Jun',
      visit: 'VIS-2026-A3F2'
    }],
    temp: [{
      s: 36.7,
      date: '02 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 36.8,
      date: '28 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 38.4,
      date: '12 Jun',
      visit: 'VIS-2026-A3F2'
    }, {
      s: 38.9,
      date: '14 Jun',
      visit: 'VIS-2026-A3F2'
    }],
    spo2: [{
      s: 99,
      date: '02 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 98,
      date: '28 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 95,
      date: '12 Jun',
      visit: 'VIS-2026-A3F2'
    }, {
      s: 94,
      date: '14 Jun',
      visit: 'VIS-2026-A3F2'
    }],
    weight: [{
      s: 67,
      date: '02 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 67.5,
      date: '28 May',
      visit: 'VIS-2026-91C7'
    }, {
      s: 68,
      date: '12 Jun',
      visit: 'VIS-2026-A3F2'
    }, {
      s: 68,
      date: '14 Jun',
      visit: 'VIS-2026-A3F2'
    }]
  },
  pendingRequests: [{
    id: 'req1',
    doctor: 'Dr. Chanda Mulenga',
    institution: 'Levy Mwanawasa Hospital',
    reason: 'Cardiology referral review — need prior asthma and BP history before consultation.',
    permissions: ['visits', 'vitals', 'diagnoses'],
    timestamp: '2 hours ago'
  }, {
    id: 'req2',
    doctor: 'Dr. Grace Tembo',
    institution: 'Chainama Hills Hospital',
    reason: 'Medication reconciliation for new prescription.',
    permissions: ['prescriptions', 'diagnoses'],
    timestamp: 'Yesterday'
  }],
  granted: [{
    id: 'g1',
    name: 'Dr. Joseph Phiri',
    institution: 'University Teaching Hospital',
    permissions: ['visits', 'vitals', 'diagnoses', 'prescriptions', 'lab-results', 'imaging'],
    granted: '12 Jun 2026',
    expiry: 'Expires 12 Sep 2026'
  }, {
    id: 'g2',
    name: 'Chilenje Clinic',
    institution: 'Antenatal team',
    permissions: ['visits', 'vitals'],
    granted: '02 May 2026',
    expiry: 'Expires 02 Aug 2026'
  }],
  overrides: [{
    id: 'o1',
    name: 'Dr. Emmanuel Zulu',
    institution: 'Ndola Teaching Hospital — Emergency',
    reason: 'Patient unconscious on arrival after RTA; emergency access used to retrieve blood type and allergies.',
    when: '18 Nov 2025, 19:38',
    tx: '0x7a3f…e91c'
  }],
  referrals: [{
    number: 'REF-2026-0312',
    institution: 'Levy Mwanawasa Hospital',
    reason: 'Cardiology assessment for persistent tachycardia',
    urgency: 'urgent',
    status: 'pending',
    date: '13 Jun 2026'
  }, {
    number: 'REF-2026-0298',
    institution: 'Cancer Diseases Hospital',
    reason: 'Routine screening referral',
    urgency: 'routine',
    status: 'accepted',
    date: '05 Jun 2026'
  }, {
    number: 'REF-2026-0110',
    institution: 'Eye Clinic, UTH',
    reason: 'Diabetic retinopathy screening',
    urgency: 'routine',
    status: 'completed',
    date: '20 Apr 2026'
  }, {
    number: 'REF-2025-0904',
    institution: 'Physiotherapy, Ndola',
    reason: 'Post-fracture rehabilitation',
    urgency: 'routine',
    status: 'rejected',
    date: '22 Nov 2025'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/AccessCenter.jsx
try { (() => {
/* Screen 5 — Access control center (signature). Approve/deny, grants, overrides. */
const HC5 = window.HealthChainDesignSystem_9f6dff;
function Segmented({
  tabs,
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: 4,
      background: 'var(--surface-inset)',
      borderRadius: 'var(--r-pill)'
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => onChange(t.id),
    style: {
      flex: 1,
      height: 38,
      border: 'none',
      borderRadius: 'var(--r-pill)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      background: active === t.id ? 'var(--surface-card)' : 'transparent',
      boxShadow: active === t.id ? 'var(--elev-1)' : 'none',
      color: active === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)'
    }
  }, t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 18,
      height: 18,
      padding: '0 5px',
      borderRadius: 'var(--r-pill)',
      background: t.tone || 'var(--brand)',
      color: '#fff',
      font: 'var(--fw-bold) 10px/18px var(--font-sans)',
      textAlign: 'center'
    }
  }, t.count))));
}
function RequestCard({
  req,
  onApprove,
  onDeny
}) {
  const [status, setStatus] = React.useState('idle'); // idle|approving|denying|approved|denied
  const act = kind => {
    setStatus(kind === 'approve' ? 'approving' : 'denying');
    setTimeout(() => {
      setStatus(kind === 'approve' ? 'approved' : 'denied');
      setTimeout(() => kind === 'approve' ? onApprove(req) : onDeny(req), 900);
    }, 1000);
  };
  const settled = status === 'approved' || status === 'denied';
  return /*#__PURE__*/React.createElement(HC5.Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      opacity: settled ? 0.7 : 1,
      transition: 'opacity var(--dur-base)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(HC5.Avatar, {
    name: req.doctor,
    tone: "info"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, req.doctor), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(HC5.Icon, {
    name: "building",
    size: 13,
    color: "var(--text-muted)"
  }), req.institution)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, req.timestamp)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-inset)',
      font: 'var(--text-body)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, "\u201C", req.reason, "\u201D"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 8
    }
  }, "Requested access"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, req.permissions.map(p => /*#__PURE__*/React.createElement(HC5.PermissionChip, {
    key: p,
    scope: p,
    readOnly: true,
    selected: true
  })))), settled ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: '6px 0'
    }
  }, /*#__PURE__*/React.createElement(HC5.StatusPill, {
    status: status
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(HC5.Button, {
    variant: "secondary",
    fullWidth: true,
    iconLeft: "x",
    loading: status === 'denying',
    onClick: () => act('deny')
  }, "Deny"), /*#__PURE__*/React.createElement(HC5.Button, {
    variant: "primary",
    fullWidth: true,
    iconLeft: "shield-check",
    loading: status === 'approving',
    onClick: () => act('approve')
  }, "Approve")));
}
function GrantCard({
  grant,
  onRevoke
}) {
  const [confirming, setConfirming] = React.useState(false);
  return /*#__PURE__*/React.createElement(HC5.Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(HC5.Avatar, {
    name: grant.name,
    tone: "brand"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, grant.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, grant.institution)), /*#__PURE__*/React.createElement(HC5.StatusPill, {
    status: "granted",
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, grant.permissions.map(p => /*#__PURE__*/React.createElement(HC5.PermissionChip, {
    key: p,
    scope: p,
    readOnly: true,
    selected: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(HC5.Icon, {
    name: "clock",
    size: 13
  }), "Granted ", grant.granted, " \xB7 ", grant.expiry), confirming ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(HC5.Button, {
    variant: "secondary",
    fullWidth: true,
    onClick: () => setConfirming(false)
  }, "Keep access"), /*#__PURE__*/React.createElement(HC5.Button, {
    variant: "destructive",
    fullWidth: true,
    iconLeft: "x-circle",
    onClick: () => onRevoke(grant)
  }, "Revoke")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirming(true),
    style: {
      alignSelf: 'flex-start',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--critical-ink)',
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(HC5.Icon, {
    name: "x-circle",
    size: 15,
    strokeWidth: 2.2
  }), "Revoke access"));
}
function OverrideCard({
  o
}) {
  return /*#__PURE__*/React.createElement(HC5.Card, {
    padding: "md",
    accent: "var(--critical)",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      borderColor: 'color-mix(in srgb, var(--critical) 26%, transparent)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(HC5.Icon, {
    name: "alert-octagon",
    size: 18,
    color: "var(--critical)",
    strokeWidth: 2.3
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) 12px/1 var(--font-sans)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--critical-ink)'
    }
  }, "Emergency override"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, o.when)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, o.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: -4
    }
  }, o.institution), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, o.reason), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 'var(--r-md)',
      background: 'var(--accent-tint)'
    }
  }, /*#__PURE__*/React.createElement(HC5.Icon, {
    name: "link",
    size: 15,
    color: "var(--accent-ink)",
    strokeWidth: 2.2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-meta)',
      color: 'var(--accent-ink)',
      flex: 1
    }
  }, "Permanently logged to blockchain \xB7 tx ", o.tx)), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, "Shown to you for transparency. This access was audited and cannot be undone."));
}
function AccessCenter() {
  const [tab, setTab] = React.useState('requests');
  const [requests, setRequests] = React.useState(window.HC.pendingRequests);
  const [grants, setGrants] = React.useState(window.HC.granted);
  const overrides = window.HC.overrides;
  const approve = req => {
    setGrants(g => [{
      id: 'g-' + req.id,
      name: req.doctor,
      institution: req.institution,
      permissions: req.permissions,
      granted: 'Just now',
      expiry: 'Expires in 90 days'
    }, ...g]);
    setRequests(r => r.filter(x => x.id !== req.id));
  };
  const deny = req => setRequests(r => r.filter(x => x.id !== req.id));
  const revoke = grant => setGrants(g => g.filter(x => x.id !== grant.id));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement(HC5.ScreenHeader, {
    large: true,
    title: "Access",
    subtitle: "Control who sees your records"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px var(--screen-pad) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    active: tab,
    onChange: setTab,
    tabs: [{
      id: 'requests',
      label: 'Requests',
      count: requests.length || null,
      tone: 'var(--urgent)'
    }, {
      id: 'granted',
      label: 'Access',
      count: grants.length || null
    }, {
      id: 'overrides',
      label: 'Overrides',
      count: overrides.length || null,
      tone: 'var(--critical)'
    }]
  }), tab === 'requests' && (requests.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, requests.map(r => /*#__PURE__*/React.createElement(RequestCard, {
    key: r.id,
    req: r,
    onApprove: approve,
    onDeny: deny
  }))) : /*#__PURE__*/React.createElement(HC5.Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement(HC5.EmptyState, {
    icon: "shield-check",
    title: "No pending access requests",
    body: "When a clinician requests access to your records, it will appear here for your approval."
  }))), tab === 'granted' && (grants.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, grants.map(g => /*#__PURE__*/React.createElement(GrantCard, {
    key: g.id,
    grant: g,
    onRevoke: revoke
  }))) : /*#__PURE__*/React.createElement(HC5.Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement(HC5.EmptyState, {
    icon: "lock",
    title: "No one has access",
    body: "You haven't granted anyone access to your records yet."
  }))), tab === 'overrides' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(HC5.Icon, {
    name: "info",
    size: 15,
    color: "var(--text-muted)"
  }), "Emergency access used without your prior approval, logged for transparency."), overrides.map(o => /*#__PURE__*/React.createElement(OverrideCard, {
    key: o.id,
    o: o
  })))));
}
window.AccessCenter = AccessCenter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/AccessCenter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/HealthTrends.jsx
try { (() => {
/* Screen 6 — Health Trends. Line charts of vitals over time. */
const HC6 = window.HealthChainDesignSystem_9f6dff;
const METRICS = [{
  id: 'bp',
  label: 'Blood pressure',
  unit: 'mmHg',
  dual: true,
  icon: 'heart-pulse'
}, {
  id: 'pulse',
  label: 'Pulse',
  unit: 'bpm',
  icon: 'activity'
}, {
  id: 'temp',
  label: 'Temperature',
  unit: '°C',
  icon: 'alert-triangle'
}, {
  id: 'spo2',
  label: 'SpO₂',
  unit: '%',
  icon: 'activity'
}, {
  id: 'weight',
  label: 'Weight',
  unit: 'kg',
  icon: 'activity'
}];
function LineChart({
  data,
  dual,
  color = 'var(--brand)'
}) {
  const W = 320,
    H = 150,
    padX = 14,
    padY = 18;
  const series = dual ? [data.map(d => d.s), data.map(d => d.d)] : [data.map(d => d.s)];
  const all = series.flat();
  const min = Math.min(...all),
    max = Math.max(...all);
  const range = max - min || 1;
  const x = i => padX + i * (W - padX * 2) / (data.length - 1);
  const y = v => padY + (H - padY * 2) * (1 - (v - min) / range);
  const colors = dual ? ['var(--brand)', 'var(--accent)'] : [color];
  return /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${W} ${H}`,
    style: {
      display: 'block'
    }
  }, [0.25, 0.5, 0.75].map(g => /*#__PURE__*/React.createElement("line", {
    key: g,
    x1: padX,
    x2: W - padX,
    y1: padY + (H - padY * 2) * g,
    y2: padY + (H - padY * 2) * g,
    stroke: "var(--border-faint)",
    strokeWidth: "1"
  })), series.map((s, si) => {
    const pts = s.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const area = `${padX},${H - padY} ${pts} ${W - padX},${H - padY}`;
    return /*#__PURE__*/React.createElement("g", {
      key: si
    }, !dual && /*#__PURE__*/React.createElement("polygon", {
      points: area,
      fill: color,
      opacity: "0.08"
    }), /*#__PURE__*/React.createElement("polyline", {
      points: pts,
      fill: "none",
      stroke: colors[si],
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }), s.map((v, i) => /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x(i),
      cy: y(v),
      r: i === s.length - 1 ? 5 : 3.5,
      fill: "var(--surface-card)",
      stroke: colors[si],
      strokeWidth: "2.5"
    })));
  }));
}
function HealthTrends({
  nav
}) {
  const [metric, setMetric] = React.useState('bp');
  const m = METRICS.find(x => x.id === metric);
  const data = window.HC.trends[metric];
  const last = data[data.length - 1],
    prev = data[data.length - 2];
  const latestVal = m.dual ? last.v : last.s;
  const delta = m.dual ? last.s - prev.s : +(last.s - prev.s).toFixed(1);
  const up = delta > 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement(HC6.ScreenHeader, {
    large: true,
    title: "Health Trends",
    subtitle: "Your vitals over time",
    right: /*#__PURE__*/React.createElement(HC6.IconButton, {
      icon: "arrow-left",
      label: "Back",
      variant: "ghost",
      onClick: () => nav('records')
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px var(--screen-pad) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4
    }
  }, METRICS.map(x => /*#__PURE__*/React.createElement("button", {
    key: x.id,
    onClick: () => setMetric(x.id),
    style: {
      flexShrink: 0,
      height: 36,
      padding: '0 14px',
      borderRadius: 'var(--r-pill)',
      cursor: 'pointer',
      border: `1.5px solid ${metric === x.id ? 'var(--green-300)' : 'var(--border)'}`,
      background: metric === x.id ? 'var(--brand-fill)' : 'var(--surface-card)',
      color: metric === x.id ? 'var(--brand-deep)' : 'var(--text-secondary)',
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)'
    }
  }, x.label))), /*#__PURE__*/React.createElement(HC6.Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "Latest \xB7 ", m.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) 30px/1 var(--font-sans)',
      color: 'var(--text-primary)',
      letterSpacing: '-0.02em'
    }
  }, latestVal), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 14px/1 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, m.unit))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      height: 26,
      padding: '0 10px',
      borderRadius: 'var(--r-pill)',
      background: up ? 'var(--critical-tint)' : 'var(--success-tint)',
      color: up ? 'var(--critical-ink)' : 'var(--success-ink)',
      font: 'var(--fw-semibold) 12px/1 var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(HC6.Icon, {
    name: up ? 'trending-up' : 'trending-down',
    size: 14,
    strokeWidth: 2.3
  }), up ? '+' : '', delta, " since last")), /*#__PURE__*/React.createElement(LineChart, {
    data: data,
    dual: m.dual
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, d.date))), m.dual && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-meta)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--brand)'
    }
  }), "Systolic"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-meta)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  }), "Diastolic"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(HC6.SectionHeader, {
    title: "Readings",
    icon: "activity",
    count: data.length
  }), /*#__PURE__*/React.createElement(HC6.Card, {
    padding: "sm",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, [...data].reverse().map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 16px',
      borderTop: i ? '1px solid var(--border-faint)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-bold) 16px/1 var(--font-sans)',
      color: 'var(--text-primary)',
      minWidth: 64
    }
  }, m.dual ? d.v : d.s, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 11px/1 var(--font-sans)',
      color: 'var(--text-muted)',
      marginLeft: 3
    }
  }, m.unit)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, d.date), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: 'var(--fw-medium) 11px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, d.visit)))))));
}
window.HealthTrends = HealthTrends;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/HealthTrends.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/HospitalId.jsx
try { (() => {
/* Screen 4 — My Hospital ID. Secure digital ID card with QR. */
const HC4 = window.HealthChainDesignSystem_9f6dff;

/* Stylized QR matrix (illustrative — encodes the shape of {t:'hc-patient',id}).
   Real builds use a QR library; this is a visual mock for the design system. */
function qrMatrix(payload, n = 25) {
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) % 1000 / 1000;
  };
  const g = Array.from({
    length: n
  }, () => Array(n).fill(0));
  const finder = (r, c) => {
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const rr = r + i,
        cc = c + j;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      const edge = i === 0 || i === 6 || j === 0 || j === 6;
      const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      g[rr][cc] = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (edge || core) ? 1 : 0;
    }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const inFinder = r < 8 && c < 8 || r < 8 && c >= n - 8 || r >= n - 8 && c < 8;
    if (!inFinder && rand() > 0.5) g[r][c] = 1;
  }
  return g;
}
function QR({
  payload,
  size = 200
}) {
  const m = React.useMemo(() => qrMatrix(payload), [payload]);
  const n = m.length,
    cell = size / n;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("rect", {
    width: size,
    height: size,
    fill: "#fff"
  }), m.map((row, r) => row.map((on, c) => on ? /*#__PURE__*/React.createElement("rect", {
    key: `${r}-${c}`,
    x: c * cell,
    y: r * cell,
    width: cell + 0.5,
    height: cell + 0.5,
    fill: "var(--ink-900)",
    rx: cell * 0.18
  }) : null)));
}
function HospitalId({
  nav
}) {
  const {
    patient
  } = window.HC;
  const payload = JSON.stringify({
    t: 'hc-patient',
    id: patient.nationalId
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement(HC4.ScreenHeader, {
    title: "My Hospital ID",
    onBack: () => nav('records')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px var(--screen-pad) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--elev-3)',
      background: 'var(--brand-deep)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--brand)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    width: "30",
    height: "30",
    alt: "",
    style: {
      filter: 'brightness(0) invert(1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) 17px/1 var(--font-display)',
      color: '#fff'
    }
  }, "HealthChain Zambia"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: 'var(--fw-bold) 10px/1 var(--font-sans)',
      letterSpacing: '0.1em',
      color: '#fff',
      background: 'rgba(255,255,255,0.18)',
      padding: '5px 9px',
      borderRadius: 'var(--r-pill)'
    }
  }, "PATIENT")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      margin: '20px',
      padding: 16,
      borderRadius: 'var(--r-lg)',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(QR, {
    payload: payload,
    size: 196
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 22px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-bold) 22px/1.1 var(--font-sans)',
      color: '#fff'
    }
  }, patient.fullName), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-medium) 13px/1 var(--font-mono)',
      color: 'rgba(255,255,255,0.7)',
      marginTop: 6
    }
  }, "NRC ", patient.nationalId))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      padding: 'var(--sp-4)',
      borderRadius: 'var(--r-lg)',
      background: 'var(--success-tint)',
      border: '1px solid color-mix(in srgb, var(--success) 22%, transparent)'
    }
  }, /*#__PURE__*/React.createElement(HC4.Icon, {
    name: "shield-check",
    size: 22,
    color: "var(--success-ink)",
    strokeWidth: 2.1,
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--success-ink)',
      textWrap: 'pretty'
    }
  }, "This code contains only your patient ID \u2014 ", /*#__PURE__*/React.createElement("strong", null, "no medical information"), ". Staff still need your permission to view your records.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(HC4.TrustBadge, {
    kind: "id-only"
  }))));
}
window.HospitalId = HospitalId;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/HospitalId.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/Login.jsx
try { (() => {
/* Screen 1 — Login. National ID + password, idle/loading/error. */
const {
  Button: HCButton,
  Input: HCInput,
  TrustBadge: HCTrust
} = window.HealthChainDesignSystem_9f6dff;
function LoginScreen({
  onLogin
}) {
  const [nid, setNid] = React.useState('123456/78/9');
  const [pw, setPw] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | loading | error
  const submit = () => {
    if (state === 'loading') return;
    setState('loading');
    setTimeout(() => {
      if (pw && pw.length >= 4) {
        onLogin();
      } else {
        setState('error');
      }
    }, 1100);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      padding: '8px var(--screen-pad) 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      paddingTop: 40,
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      height: 84,
      borderRadius: 24,
      background: 'var(--brand-tint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    width: "56",
    height: "56",
    alt: "HealthChain"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 30px/1.1 var(--font-display)',
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em'
    }
  }, "Health", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand)'
    }
  }, "Chain")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--text-secondary)',
      marginTop: 8,
      maxWidth: 260,
      textWrap: 'pretty'
    }
  }, "Your medical records, owned by you and unlocked only with your permission.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(HCInput, {
    label: "National ID",
    icon: "fingerprint",
    value: nid,
    inputMode: "text",
    onChange: e => {
      setNid(e.target.value);
      if (state === 'error') setState('idle');
    },
    placeholder: "000000/00/0"
  }), /*#__PURE__*/React.createElement(HCInput, {
    label: "Password",
    type: "password",
    icon: "lock",
    value: pw,
    onChange: e => {
      setPw(e.target.value);
      if (state === 'error') setState('idle');
    },
    placeholder: "Enter your password",
    error: state === 'error' ? 'Invalid credentials. Please try again.' : undefined
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: -4
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-link)',
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
      cursor: 'pointer'
    }
  }, "Forgot password?")), /*#__PURE__*/React.createElement(HCButton, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    loading: state === 'loading',
    onClick: submit
  }, state === 'loading' ? 'Signing in…' : 'Sign in')), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(HCTrust, {
    kind: "encrypted",
    label: "Protected by blockchain-secured records",
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)',
      marginTop: 14
    }
  }, "HealthChain \xB7 Zambia \xB7 v1.0.0"));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/Profile.jsx
try { (() => {
/* Screen 8 — Profile. Demographics, account, support, sign out. */
const HC8 = window.HealthChainDesignSystem_9f6dff;
function DemoItem({
  label,
  value,
  critical
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 40%',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 3
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      font: `${critical ? 'var(--fw-bold)' : 'var(--fw-semibold)'} 15px/1.2 var(--font-sans)`,
      color: critical ? 'var(--critical-ink)' : 'var(--text-primary)'
    }
  }, critical && /*#__PURE__*/React.createElement(HC8.Icon, {
    name: "droplet",
    size: 15,
    color: "var(--critical)",
    strokeWidth: 2.3
  }), value));
}
function Profile({
  nav,
  setModal
}) {
  const p = window.HC.patient;
  const hr = {
    borderTop: '1px solid var(--border-faint)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement(HC8.ScreenHeader, {
    large: true,
    title: "Profile"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px var(--screen-pad) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(HC8.Avatar, {
    name: p.fullName,
    tone: "brand",
    size: "xl"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-h2)',
      color: 'var(--text-primary)'
    }
  }, p.fullName), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-medium) 13px/1 var(--font-mono)',
      color: 'var(--text-secondary)',
      marginTop: 4
    }
  }, "NRC ", p.nationalId), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(HC8.TrustBadge, {
    kind: "verified",
    label: "Verified patient",
    size: "sm"
  })))), /*#__PURE__*/React.createElement(HC8.Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      borderColor: 'color-mix(in srgb, var(--critical) 22%, transparent)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(DemoItem, {
    label: "Blood type",
    value: p.bloodType,
    critical: true
  }), /*#__PURE__*/React.createElement(DemoItem, {
    label: "Allergies",
    value: p.allergies.join(', '),
    critical: true
  }))), /*#__PURE__*/React.createElement(HC8.Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(DemoItem, {
    label: "Gender",
    value: p.gender
  }), /*#__PURE__*/React.createElement(DemoItem, {
    label: "Date of birth",
    value: `${p.dob} · ${p.age}y`
  }), /*#__PURE__*/React.createElement(DemoItem, {
    label: "Phone",
    value: p.phone
  }), /*#__PURE__*/React.createElement(DemoItem, {
    label: "Marital status",
    value: p.maritalStatus
  }), /*#__PURE__*/React.createElement(DemoItem, {
    label: "Occupation",
    value: p.occupation
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(HC8.SectionHeader, {
    title: "Account",
    icon: "user"
  }), /*#__PURE__*/React.createElement(HC8.Card, {
    padding: "sm",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(HC8.ListRow, {
    icon: "lock",
    iconTone: "brand",
    title: "Change password",
    chevron: true,
    onClick: () => setModal('password')
  }), /*#__PURE__*/React.createElement(HC8.ListRow, {
    style: hr,
    icon: "bell",
    iconTone: "info",
    title: "Notification settings",
    right: "On",
    chevron: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(HC8.ListRow, {
    style: hr,
    icon: "shield-check",
    iconTone: "accent",
    title: "Privacy & security",
    chevron: true,
    onClick: () => {}
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(HC8.SectionHeader, {
    title: "Support",
    icon: "help-circle"
  }), /*#__PURE__*/React.createElement(HC8.Card, {
    padding: "sm",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(HC8.ListRow, {
    icon: "help-circle",
    title: "Help & FAQs",
    chevron: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(HC8.ListRow, {
    style: hr,
    icon: "info",
    title: "About HealthChain",
    meta: "Version 1.0.0",
    chevron: true,
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(HC8.ListRow, {
    style: hr,
    icon: "log-out",
    title: "Sign out",
    destructive: true,
    onClick: () => setModal('signout')
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, "HealthChain \xB7 Zambia \xB7 v1.0.0")));
}
window.Profile = Profile;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/Profile.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/RecordsHome.jsx
try { (() => {
/* Screen 2 — Records home. Quick actions + visit list. */
const HC2 = window.HealthChainDesignSystem_9f6dff;
function CountChip({
  icon,
  n,
  label
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'var(--fw-semibold) 12px/1 var(--font-sans)',
      color: 'var(--text-secondary)'
    },
    title: label
  }, /*#__PURE__*/React.createElement(HC2.Icon, {
    name: icon,
    size: 14,
    color: "var(--text-muted)",
    strokeWidth: 2.1
  }), n);
}
const TYPE_LABEL = {
  outpatient: 'Outpatient',
  inpatient: 'Inpatient',
  emergency: 'Emergency',
  consultation: 'Consultation'
};
function VisitCard({
  visit,
  onOpen
}) {
  return /*#__PURE__*/React.createElement(HC2.Card, {
    interactive: true,
    onClick: onOpen,
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 12px/1 var(--font-mono)',
      color: 'var(--text-muted)',
      letterSpacing: '0.02em'
    }
  }, visit.id), visit.away && /*#__PURE__*/React.createElement(HC2.Icon, {
    name: "lock",
    size: 13,
    color: "var(--locked)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(HC2.StatusPill, {
    status: visit.status,
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 16px/1.35 var(--font-sans)',
      color: 'var(--text-primary)',
      textWrap: 'pretty'
    }
  }, visit.chiefComplaint), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(HC2.Icon, {
    name: "building",
    size: 14,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, visit.institution)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(HC2.Icon, {
    name: "calendar",
    size: 14,
    color: "var(--text-muted)"
  }), visit.admissionDate, visit.dischargeDate ? ` – ${visit.dischargeDate}` : ' · ongoing'), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-faint)',
      margin: '2px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: 24,
      padding: '0 9px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--surface-inset)',
      font: 'var(--fw-semibold) 11px/1 var(--font-sans)',
      color: 'var(--text-secondary)'
    }
  }, TYPE_LABEL[visit.visitType]), /*#__PURE__*/React.createElement(HC2.PriorityPill, {
    priority: visit.priority,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(CountChip, {
    icon: "stethoscope",
    n: visit.counts.diagnoses,
    label: "Diagnoses"
  }), /*#__PURE__*/React.createElement(CountChip, {
    icon: "pill",
    n: visit.counts.prescriptions,
    label: "Prescriptions"
  }), /*#__PURE__*/React.createElement(CountChip, {
    icon: "flask",
    n: visit.counts.labs,
    label: "Lab orders"
  }), /*#__PURE__*/React.createElement(CountChip, {
    icon: "scan",
    n: visit.counts.imaging,
    label: "Imaging"
  }))));
}
function QuickAction({
  icon,
  title,
  sub,
  tone,
  onClick
}) {
  const tones = {
    brand: ['var(--brand-tint)', 'var(--brand-deep)'],
    accent: ['var(--accent-tint)', 'var(--accent-ink)']
  };
  const [bg, fg] = tones[tone] || tones.brand;
  return /*#__PURE__*/React.createElement(HC2.Card, {
    interactive: true,
    onClick: onClick,
    padding: "md",
    elevation: "low",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--r-md)',
      background: bg,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(HC2.Icon, {
    name: icon,
    size: 21,
    strokeWidth: 2.1
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: 2
    }
  }, sub)));
}
function RecordsHome({
  nav
}) {
  const {
    patient,
    visits
  } = window.HC;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(HC2.ScreenHeader, {
    large: true,
    title: "Records",
    subtitle: `Welcome back, ${patient.fullName.split(' ')[0]}`,
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(HC2.IconButton, {
      icon: "bell",
      label: "Alerts",
      badge: true
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => nav('profile'),
      style: {
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: 'pointer'
      },
      "aria-label": "Profile"
    }, /*#__PURE__*/React.createElement(HC2.Avatar, {
      name: patient.fullName,
      tone: "brand"
    })))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px var(--screen-pad) 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 'var(--r-md)',
      background: 'var(--critical-tint)',
      border: '1px solid color-mix(in srgb, var(--critical) 24%, transparent)'
    }
  }, /*#__PURE__*/React.createElement(HC2.Icon, {
    name: "alert-triangle",
    size: 18,
    color: "var(--critical)",
    strokeWidth: 2.3
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) 13px/1.3 var(--font-sans)',
      color: 'var(--critical-ink)'
    }
  }, "Allergies: Penicillin, Sulfa drugs"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: 'var(--fw-bold) 12px/1 var(--font-sans)',
      color: 'var(--critical-ink)'
    }
  }, "Blood ", patient.bloodType)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(QuickAction, {
    icon: "qr-code",
    title: "My Hospital ID",
    sub: "Show at reception",
    tone: "brand",
    onClick: () => nav('hospitalId')
  }), /*#__PURE__*/React.createElement(QuickAction, {
    icon: "trending-up",
    title: "Health Trends",
    sub: "Vitals over time",
    tone: "accent",
    onClick: () => nav('trends')
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(HC2.SectionHeader, {
    title: "Medical visits",
    icon: "file-text",
    count: visits.length
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, visits.map(v => /*#__PURE__*/React.createElement(VisitCard, {
    key: v.id,
    visit: v,
    onOpen: () => nav('visit', {
      id: v.id
    })
  }))))));
}
window.RecordsHome = RecordsHome;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/RecordsHome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/Referrals.jsx
try { (() => {
/* Screen 7 — Referrals. Active first, with count badge. */
const HC7 = window.HealthChainDesignSystem_9f6dff;
function ReferralCard({
  r
}) {
  return /*#__PURE__*/React.createElement(HC7.Card, {
    padding: "md",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 12px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, r.number), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(HC7.StatusPill, {
    status: r.status,
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 'var(--r-md)',
      background: 'var(--brand-tint)',
      color: 'var(--brand-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(HC7.Icon, {
    name: "building",
    size: 19,
    strokeWidth: 2.1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.25 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, r.institution), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: 3,
      textWrap: 'pretty'
    }
  }, r.reason))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-faint)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(HC7.PriorityPill, {
    priority: r.urgency,
    size: "sm"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(HC7.Icon, {
    name: "calendar",
    size: 14
  }), r.date)));
}
function Referrals() {
  const order = {
    pending: 0,
    accepted: 1,
    completed: 2,
    rejected: 3,
    cancelled: 4
  };
  const refs = [...window.HC.referrals].sort((a, b) => order[a.status] - order[b.status]);
  const active = refs.filter(r => r.status === 'pending' || r.status === 'accepted').length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement(HC7.ScreenHeader, {
    large: true,
    title: "Referrals",
    subtitle: "Referrals to other institutions",
    right: active ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 12px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--brand-fill)',
        color: 'var(--brand-deep)',
        font: 'var(--fw-bold) 12px/1 var(--font-sans)'
      }
    }, active, " active") : null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px var(--screen-pad) 28px'
    }
  }, refs.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, refs.map(r => /*#__PURE__*/React.createElement(ReferralCard, {
    key: r.number,
    r: r
  }))) : /*#__PURE__*/React.createElement(HC7.Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement(HC7.EmptyState, {
    icon: "send",
    title: "No referrals yet",
    body: "When your doctor refers you to another hospital, it'll appear here."
  }))));
}
window.Referrals = Referrals;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/Referrals.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-app/screens/VisitDetail.jsx
try { (() => {
/* Screen 3 — Visit detail. Collapsible clinical sections. */
const HC3 = window.HealthChainDesignSystem_9f6dff;
function Section({
  icon,
  title,
  count,
  defaultOpen,
  accent,
  children
}) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 'var(--sp-4)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 'var(--r-sm)',
      background: accent || 'var(--brand-tint)',
      color: 'var(--brand-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(HC3.Icon, {
    name: icon,
    size: 17,
    strokeWidth: 2.1
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-h3)',
      color: 'var(--text-primary)'
    }
  }, title), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 20,
      height: 20,
      padding: '0 6px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--surface-inset)',
      color: 'var(--text-secondary)',
      font: 'var(--fw-bold) 11px/20px var(--font-sans)',
      textAlign: 'center'
    }
  }, count), /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "chevron-down",
    size: 20,
    color: "var(--text-muted)",
    style: {
      marginLeft: 'auto',
      transform: open ? 'rotate(180deg)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-standard)'
    }
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--sp-4) var(--sp-4)'
    }
  }, children));
}
function Field({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-body)',
      color: 'var(--text-primary)',
      textWrap: 'pretty'
    }
  }, children));
}
const DXTYPE = {
  confirmed: 'success',
  provisional: 'info',
  'ruled out': 'neutral',
  differential: 'accent'
};
function DxTypePill({
  type
}) {
  const tones = {
    success: ['var(--success-tint)', 'var(--success-ink)'],
    info: ['var(--info-tint)', 'var(--info-ink)'],
    neutral: ['var(--locked-tint)', 'var(--locked)'],
    accent: ['var(--accent-tint)', 'var(--accent-ink)']
  };
  const [bg, fg] = tones[DXTYPE[type] || 'neutral'];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      height: 22,
      padding: '0 9px',
      alignItems: 'center',
      borderRadius: 'var(--r-pill)',
      background: bg,
      color: fg,
      font: 'var(--fw-semibold) 11px/1 var(--font-sans)',
      textTransform: 'capitalize'
    }
  }, type);
}
function MedRow({
  m
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 'var(--r-sm)',
      background: 'var(--brand-tint)',
      color: 'var(--brand-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "pill",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 14px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, m.name, " ", m.strength), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, m.dose, " \xB7 ", m.frequency)), m.dispensed ? /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "check-circle",
    size: 18,
    color: "var(--success-ink)"
  }) : /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "clock",
    size: 18,
    color: "var(--urgent-ink)"
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 12px 12px',
      borderTop: '1px solid var(--border-faint)',
      paddingTop: 12
    }
  }, [['Generic', m.generic], ['Form', m.form], ['Route', m.route], ['Duration', m.duration], ['Quantity', m.quantity]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 5,
      font: 'var(--text-meta)',
      fontWeight: 400
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)',
      textAlign: 'right'
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: 10,
      borderRadius: 'var(--r-sm)',
      background: 'var(--surface-inset)',
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, m.instructions)));
}
function VitalsGrid({
  v
}) {
  const items = [{
    label: 'Temperature',
    value: v.temperature,
    unit: '°C',
    icon: 'alert-triangle',
    critical: v.temperature >= 38
  }, {
    label: 'Blood pressure',
    value: `${v.bpSys}/${v.bpDia}`,
    unit: 'mmHg',
    icon: 'heart-pulse',
    critical: v.bpSys >= 140
  }, {
    label: 'Pulse',
    value: v.pulse,
    unit: 'bpm',
    icon: 'activity',
    critical: v.pulse > 100
  }, {
    label: 'Resp. rate',
    value: v.resp,
    unit: '/min',
    icon: 'activity',
    critical: v.resp > 20
  }, {
    label: 'SpO₂',
    value: v.spo2,
    unit: '%',
    icon: 'activity',
    critical: v.spo2 < 95
  }, {
    label: 'Weight',
    value: v.weight,
    unit: 'kg',
    icon: 'activity',
    critical: false
  }, {
    label: 'Height',
    value: v.height,
    unit: 'cm',
    icon: 'activity',
    critical: false
  }, {
    label: 'Pain',
    value: `${v.pain}/10`,
    unit: '',
    icon: 'activity',
    critical: v.pain >= 7
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, items.map(it => /*#__PURE__*/React.createElement(HC3.VitalStat, {
    key: it.label,
    compact: true,
    label: it.label,
    value: it.value,
    unit: it.unit,
    critical: it.critical,
    icon: it.critical ? 'alert-triangle' : undefined
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)',
      marginTop: 10
    }
  }, "Recorded ", v.recorded));
}
function VisitDetail({
  visitId,
  nav
}) {
  const visit = window.HC.visits.find(x => x.id === visitId);
  const [phase, setPhase] = React.useState('locked');
  if (!visit) return null;
  const TYPE_LABEL = {
    outpatient: 'Outpatient',
    inpatient: 'Inpatient',
    emergency: 'Emergency',
    consultation: 'Consultation'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--surface-bg)'
    }
  }, /*#__PURE__*/React.createElement(HC3.ScreenHeader, {
    title: visit.id,
    onBack: () => nav('records'),
    right: /*#__PURE__*/React.createElement(HC3.TrustBadge, {
      kind: "encrypted",
      size: "sm"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px var(--screen-pad) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: 24,
      padding: '0 9px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--surface-inset)',
      font: 'var(--fw-semibold) 11px/1 var(--font-sans)',
      color: 'var(--text-secondary)'
    }
  }, TYPE_LABEL[visit.visitType]), /*#__PURE__*/React.createElement(HC3.PriorityPill, {
    priority: visit.priority,
    size: "sm"
  }), /*#__PURE__*/React.createElement(HC3.StatusPill, {
    status: visit.status,
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 18px/1.35 var(--font-sans)',
      color: 'var(--text-primary)',
      textWrap: 'pretty'
    }
  }, visit.chiefComplaint), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "building",
    size: 14,
    color: "var(--text-muted)"
  }), visit.institution, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-300)'
    }
  }, "\u2022"), visit.admissionDate, visit.dischargeDate ? ` – ${visit.dischargeDate}` : ''), visit.away ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(HC3.LockState, {
    phase: phase,
    onAction: phase === 'locked' ? () => setPhase('pending') : phase === 'denied' ? () => setPhase('pending') : undefined,
    title: phase === 'locked' ? 'Records held at another hospital' : undefined,
    body: phase === 'locked' ? `Full clinical detail for this visit is stored at ${visit.institution}. Request access to unlock it here.` : undefined
  }), phase === 'granted' && /*#__PURE__*/React.createElement(Section, {
    icon: "heart-pulse",
    title: "Vitals",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(VitalsGrid, {
    v: visit.vitals
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, visit.vitals && /*#__PURE__*/React.createElement(Section, {
    icon: "heart-pulse",
    title: "Vitals",
    defaultOpen: true
  }, /*#__PURE__*/React.createElement(VitalsGrid, {
    v: visit.vitals
  })), visit.consultation && /*#__PURE__*/React.createElement(Section, {
    icon: "stethoscope",
    title: "Consultation"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "History of present illness"
  }, visit.consultation.hpi), /*#__PURE__*/React.createElement(Field, {
    label: "Physical examination"
  }, visit.consultation.exam), /*#__PURE__*/React.createElement(Field, {
    label: "Clinical findings"
  }, visit.consultation.findings), /*#__PURE__*/React.createElement(Field, {
    label: "Assessment"
  }, visit.consultation.assessment), /*#__PURE__*/React.createElement(Field, {
    label: "Plan"
  }, visit.consultation.plan), /*#__PURE__*/React.createElement(Field, {
    label: "Follow-up"
  }, visit.consultation.followUp), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 'var(--r-sm)',
      background: 'var(--brand-tint)'
    }
  }, /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "calendar",
    size: 16,
    color: "var(--brand-deep)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
      color: 'var(--brand-deep)'
    }
  }, "Next appointment \xB7 ", visit.consultation.nextAppointment))), visit.diagnoses && /*#__PURE__*/React.createElement(Section, {
    icon: "stethoscope",
    title: "Diagnoses",
    count: visit.diagnoses.length
  }, visit.diagnoses.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.icd,
    style: {
      padding: '12px 0',
      borderTop: '1px solid var(--border-faint)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 12px/1 var(--font-mono)',
      color: 'var(--accent-ink)',
      background: 'var(--accent-tint)',
      padding: '3px 7px',
      borderRadius: 6
    }
  }, d.icd), /*#__PURE__*/React.createElement(DxTypePill, {
    type: d.type
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--fw-semibold) 15px/1.3 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, d.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)',
      marginTop: 3
    }
  }, "Severity: ", d.severity, " \xB7 ", d.notes)))), visit.prescriptions && /*#__PURE__*/React.createElement(Section, {
    icon: "pill",
    title: "Prescriptions",
    count: visit.prescriptions.reduce((a, p) => a + p.meds.length, 0)
  }, visit.prescriptions.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.number,
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-medium) 12px/1 var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, p.number), /*#__PURE__*/React.createElement(HC3.StatusPill, {
    status: p.status,
    size: "sm"
  })), p.meds.map((m, i) => /*#__PURE__*/React.createElement(MedRow, {
    key: i,
    m: m
  }))))), visit.labs && /*#__PURE__*/React.createElement(Section, {
    icon: "flask",
    title: "Lab orders",
    count: visit.labs.length
  }, visit.labs.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '12px 0',
      borderTop: '1px solid var(--border-faint)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) 14px/1.2 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, l.test), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, l.code), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(HC3.StatusPill, {
    status: l.status,
    size: "sm"
  }))), l.status === 'resulted' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: 10,
      borderRadius: 'var(--r-sm)',
      background: l.abnormal ? 'var(--critical-tint)' : 'var(--surface-inset)'
    }
  }, l.abnormal && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--fw-semibold) 12px/1.2 var(--font-sans)',
      color: 'var(--critical-ink)',
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement(HC3.Icon, {
    name: "alert-triangle",
    size: 14,
    color: "var(--critical)",
    strokeWidth: 2.4
  }), "Abnormal: ", l.abnormal), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, l.interpretation, " \xB7 ", l.values))))), visit.imaging && visit.imaging.length > 0 && /*#__PURE__*/React.createElement(Section, {
    icon: "scan",
    title: "Imaging",
    count: visit.imaging.length
  }, visit.imaging.map((im, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '12px 0',
      borderTop: '1px solid var(--border-faint)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--fw-semibold) 14px/1.2 var(--font-sans)',
      color: 'var(--text-primary)',
      textTransform: 'uppercase'
    }
  }, im.modality), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-meta)',
      fontWeight: 400,
      color: 'var(--text-secondary)'
    }
  }, im.bodyPart), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(HC3.StatusPill, {
    status: im.status,
    size: "sm"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Findings"
  }, im.findings), /*#__PURE__*/React.createElement(Field, {
    label: "Impression"
  }, im.impression)))), visit.discharge && /*#__PURE__*/React.createElement(Section, {
    icon: "file-text",
    title: "Discharge summary",
    accent: "var(--success-tint)"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Discharge diagnosis"
  }, visit.discharge.diagnosis), /*#__PURE__*/React.createElement(Field, {
    label: "Summary"
  }, visit.discharge.summary), /*#__PURE__*/React.createElement(Field, {
    label: "Instructions"
  }, visit.discharge.instructions), /*#__PURE__*/React.createElement(Field, {
    label: "Follow-up date"
  }, visit.discharge.followUp)))));
}
window.VisitDetail = VisitDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-app/screens/VisitDetail.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.VitalStat = __ds_scope.VitalStat;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.PermissionChip = __ds_scope.PermissionChip;

__ds_ns.ScreenHeader = __ds_scope.ScreenHeader;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.LockState = __ds_scope.LockState;

__ds_ns.PriorityPill = __ds_scope.PriorityPill;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.TrustBadge = __ds_scope.TrustBadge;

})();
