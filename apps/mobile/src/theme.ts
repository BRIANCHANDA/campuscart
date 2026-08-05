/**
 * Design tokens ported from the CampusCart mobile UI design
 * (`# CampusCart Mobile UI Design/_ds/.../tokens/*.css`). Keep values in sync
 * with that source of truth rather than eyeballing new ones per screen.
 */

export const colors = {
  // Brand green
  green900: "#064E3B",
  green800: "#047857",
  green700: "#059669",
  green600: "#10B981",
  green300: "#6EE7B7",
  green200: "#A7F3D0",
  green100: "#D1FAE5",
  green050: "#ECFDF5",

  // Ink (text)
  ink900: "#0A0E1A",
  ink700: "#1F2733",
  ink500: "#4B5563",
  ink400: "#9CA3AF",
  ink300: "#D1D5DB",

  // Surfaces & lines
  white: "#FFFFFF",
  surfaceApp: "#FAFAFB",
  surfaceSunken: "#F4F4F6",
  border200: "#E5E7EB",
  border100: "#F0F1F3",

  // Semantic hues
  coral600: "#E13D3D",
  coral500: "#FF5757",
  coral100: "#FFE5E5",
  coral050: "#FFF1F1",

  amber600: "#B45309",
  amber500: "#F59E0B",
  amber100: "#FEF3C7",
  amber050: "#FFFBEB",

  blue600: "#2563EB",
  blue500: "#3B82F6",
  blue100: "#DBEAFE",
  blue050: "#EFF6FF",

  violet600: "#7C3AED",
  violet500: "#8B5CF6",
  violet100: "#EDE9FE",
  violet050: "#F5F3FF",

  slate500: "#64748B",
  slate100: "#F1F5F9",
} as const;

/** Semantic aliases — prefer these in components over raw palette values. */
export const theme = {
  brand: colors.green700,
  brandDeep: colors.green800,
  brandTint: colors.green050,
  brandFill: colors.green100,
  onBrand: colors.white,

  textPrimary: colors.ink900,
  textSecondary: colors.ink500,
  textMuted: colors.ink400,
  textDisabled: colors.ink300,
  textOnBrand: colors.white,
  textLink: colors.green700,

  surfaceCard: colors.white,
  surfaceBg: colors.surfaceApp,
  surfaceInset: colors.surfaceSunken,

  border: colors.border200,
  borderFaint: colors.border100,

  critical: colors.coral500,
  criticalInk: colors.coral600,
  criticalTint: colors.coral100,
  urgent: colors.amber500,
  urgentInk: colors.amber600,
  urgentTint: colors.amber100,
  info: colors.blue500,
  infoInk: colors.blue600,
  infoTint: colors.blue100,
  accent: colors.violet500,
  accentInk: colors.violet600,
  accentTint: colors.violet100,
  success: colors.green700,
  successInk: colors.green800,
  successTint: colors.green100,
  locked: colors.slate500,
  lockedTint: colors.slate100,
} as const;

/** 8pt grid, 4px half-steps. */
export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
  screenPad: 20,
  touchMin: 44,
  tabBarH: 64,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Mobile type scale (px) — pair with a fontWeight from `weights`. */
export const fontSize = {
  display: 34,
  h1: 26,
  h2: 21,
  h3: 18,
  bodyLg: 17,
  body: 15,
  sm: 13,
  xs: 11,
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
} as const;

export const letterSpacing = {
  tight: -0.4, // ~-0.02em @ 20px base
  normal: 0,
  wide: 0.6,
  caps: 0.9,
} as const;

export const weights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

/** RN shadow props — soft, low-spread, restrained (translated from box-shadow). */
export const elevation = {
  0: {},
  1: {
    shadowColor: colors.ink900, shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  2: {
    shadowColor: colors.ink900, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  3: {
    shadowColor: colors.ink900, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  brand: {
    shadowColor: colors.green700, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;
