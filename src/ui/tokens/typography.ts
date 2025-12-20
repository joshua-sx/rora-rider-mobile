/**
 * Typography System
 * One font family. Two weights. Three sizes.
 */

export const type = {
  title: { fontSize: 20, lineHeight: 26, fontWeight: "600" as const },
  h2:    { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body:  { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  sub:   { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  cap:   { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
} as const;
