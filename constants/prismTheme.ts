export const PrismColors = {
  // Primary
  navy: "#0D1F3C",
  navyLight: "#162B52",
  navyMid: "#1A3260",

  // Accent
  gold: "#E6B215",
  goldLight: "#F5C842",
  goldDim: "rgba(230, 178, 21, 0.2)",

  // Status
  success: "#2ECC71",
  danger: "#E74C3C",
  warning: "#F39C12",

  // Neutrals
  white: "#FFFFFF",
  offWhite: "#F5F7FA",
  cardBg: "#FFFFFF",
  textPrimary: "#0D1F3C",
  textSecondary: "#7A8BA6",
  textLight: "rgba(255,255,255,0.7)",
  border: "#E8EDF5",

  // Overlays
  overlayDark: "rgba(13, 31, 60, 0.85)",
};

export const PrismTypography = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,

  regular: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
  extraBold: "800" as const,
};

export const PrismSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const PrismRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const PrismShadows = {
  card: {
    shadowColor: "#0D1F3C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: "#E6B215",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    shadowColor: "#0D1F3C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};
