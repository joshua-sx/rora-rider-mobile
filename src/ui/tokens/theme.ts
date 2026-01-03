import { colors } from "./colors";
import { space } from "./spacing";
import { radius } from "./radius";
import { type } from "./typography";

export const theme = { colors, space, radius, type } as const;
export type Theme = typeof theme;

// Re-export for convenience
export { colors, space, radius, type };
