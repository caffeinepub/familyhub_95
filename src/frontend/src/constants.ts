export const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😐", label: "Neutral" },
];

export const COLORS = [
  "#93C5FD", // Pastel blue
  "#F9A8D4", // Pastel pink
  "#C4B5FD", // Pastel purple
  "#86EFAC", // Pastel green
  "#FCD34D", // Pastel amber
  "#FCA5A5", // Pastel red
  "#67E8F9", // Pastel cyan
  "#BEF264", // Pastel lime
];

export const AVATARS = ["👨", "👩", "👧", "👦", "👴", "👵", "🧑", "👶"];

export const CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Bakery",
  "Pantry",
  "Beverages",
  "Frozen",
  "Other",
];

export type TabId =
  | "dashboard"
  | "family"
  | "mood"
  | "calendar"
  | "chores"
  | "meals"
  | "shopping"
  | "settings";

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "🏠" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { id: "chores", label: "Chores", icon: "✅" },
  { id: "mood", label: "Mood", icon: "😊" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "meals", label: "Meals", icon: "🍽️" },
  { id: "shopping", label: "Shopping", icon: "🛒" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];
