/**
 * site-content.ts — Edit this file to customise your public landing page.
 * No deploy/rebuild is needed for content changes in development.
 */

export const SERVER_TAGLINE =
  "Cross-play Survival SMP";

/** Set to your Discord invite URL, e.g. "https://discord.gg/XXXXXXX" */
export const DISCORD_URL: string = "https://discord.gg/T85qE53QK";

// ---------------------------------------------------------------------------
// Server connection info
// Falls back to NEXT_PUBLIC_SERVER_IP env var, then "play.example.com"
// ---------------------------------------------------------------------------
export const DEFAULT_SERVER_IP =
  process.env.NEXT_PUBLIC_SERVER_IP ?? "play.example.com";

export const JAVA_PORT = 25565;
export const BEDROCK_PORT = 19132;

// ---------------------------------------------------------------------------
// Rules
// Each category can be expanded / collapsed on the /rules page.
// ---------------------------------------------------------------------------
export interface RuleCategory {
  category: string;
  items: string[];
}

export const RULES: RuleCategory[] = [
  {
    category: "General",
    items: [
      "Be respectful to all players and staff at all times.",
      "No harassment, hate speech, or discrimination of any kind.",
      "Impersonating staff or other players is strictly forbidden.",
      "Do not share personal information about other players.",
    ],
  },
  {
    category: "Gameplay",
    items: [
      "No hacking, cheats, or game-modifying clients.",
      "No griefing or destroying other players' builds without permission.",
      "No exploiting game-breaking bugs — report them to staff instead.",
      "PvP is allowed only in designated PvP zones unless both players consent.",
      "Do not claim excessive amounts of land you won't actively use.",
    ],
  },
  {
    category: "Chat",
    items: [
      "Keep chat English or use language-specific channels.",
      "No spam, excessive caps, or repetitive messages.",
      "No advertising other servers or services.",
      "Keep topics family-friendly in public channels.",
    ],
  },
  {
    category: "Builds",
    items: [
      "No obscene or offensive builds visible to other players.",
      "Builds must not cause significant server lag (e.g. large unchecked mob farms).",
      "Abandoned builds may be removed after 30 days of inactivity.",
    ],
  },
  {
    category: "Economy",
    items: [
      "No duplication glitches or exploits.",
      "Scamming other players in trades is not allowed.",
      "Shop prices must reflect the displayed item — no bait-and-switch.",
    ],
  },
];

// ---------------------------------------------------------------------------
// Staff
// avatarUrl: Minecraft avatar service URL, or null to use initials fallback.
// ---------------------------------------------------------------------------
export interface StaffMember {
  name: string;
  role: "Owner" | "Admin" | "Moderator" | "Builder";
  avatarUrl: string | null;
  bio: string;
}

export const STAFF: StaffMember[] = [
  {
    name: "Aki",
    role: "Owner",
    avatarUrl: "https://minotar.net/avatar/Aki/64",
    bio: "Server founder. Keeps the lights on and the blocks falling.",
  },
  {
    name: "Steve",
    role: "Admin",
    avatarUrl: "https://minotar.net/avatar/Steve/64",
    bio: "Head of community. Your first stop for disputes and suggestions.",
  },
  {
    name: "Alex",
    role: "Moderator",
    avatarUrl: "https://minotar.net/avatar/Alex/64",
    bio: "Keeps chat friendly and helps new players get settled.",
  },
  {
    name: "Notch",
    role: "Builder",
    avatarUrl: "https://minotar.net/avatar/Notch/64",
    bio: "Head of creative builds and world events.",
  },
];
