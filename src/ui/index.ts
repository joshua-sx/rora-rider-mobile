/**
 * Rora UI Design System
 *
 * A Dieter Rams-inspired, mobile-first component library.
 *
 * Philosophy:
 * - Useful: Every component solves a real problem
 * - Understandable: No explanations required
 * - Unobtrusive: UI supports content, never competes
 * - Honest: Buttons look clickable, cards look tappable
 * - Minimal: As little design as possible, then less
 */

// Design Tokens
export { colors } from "./tokens/colors";
export { space } from "./tokens/spacing";
export { radius } from "./tokens/radius";
export { type } from "./tokens/typography";
export { theme } from "./tokens/theme";

// Primitives
export { Box } from "./primitives/Box";
export { Text } from "./primitives/Text";
export { Pressable } from "./primitives/Pressable";

// Components
export { Button } from "./components/Button";
export { IconButton } from "./components/IconButton";
export { Input } from "./components/Input";
export { SearchInput } from "./components/SearchInput";
export { Card } from "./components/Card";
export { ListItem } from "./components/ListItem";
export { Divider } from "./components/Divider";
export { Badge } from "./components/Badge";
export { Avatar } from "./components/Avatar";
export { Toast, ToastProvider, useToast } from "./components/Toast";
export { Sheet } from "./components/Sheet";
export { Skeleton } from "./components/Skeleton";
export { EmptyState } from "./components/EmptyState";
export { ErrorState } from "./components/ErrorState";

// Screen Templates
export {
	MapSheetTemplate,
	ListScreenTemplate,
	DetailScreenTemplate,
	StickyCtaButton,
} from "./templates";
