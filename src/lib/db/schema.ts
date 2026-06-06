import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";

/**
 * users — one row per CAIRN account. The unit of partitioning: everything a
 * user owns (nodes, links) carries their `ownerId`.
 *
 * `ponchoKeyEnc` is the user's BYO Poncho key, stored AES-256-GCM encrypted
 * (never plaintext). `passwordHash` is scrypt (salt embedded).
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  ponchoKeyEnc: text("poncho_key_enc"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * nodes — the whole vault tree. Unified model: every node can nest children
 * AND hold its own content. `kind` is a presentation hint:
 *   - "folder": render children as cards (+ optional overview content)
 *   - "entry":  render content (may still have children)
 *
 * `path` is the materialized list of ancestor ids (root → parent), enabling
 * cheap "everything under X" queries and instant breadcrumbs.
 * `parentId` null = a top-level category.
 */
export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    kind: text("kind", { enum: ["folder", "entry"] })
      .notNull()
      .default("entry"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    path: uuid("path")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    depth: integer("depth").notNull().default(0),
    position: integer("position").notNull().default(0),
    content: text("content").notNull().default(""),
    fields: jsonb("fields")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id] }).onDelete(
      "cascade"
    ),
    index("nodes_owner_parent_idx").on(t.ownerId, t.parentId),
    index("nodes_path_idx").using("gin", t.path),
    unique("nodes_owner_parent_slug_uq").on(t.ownerId, t.parentId, t.slug),
  ]
);

/**
 * links — cross-references between nodes (the [[wikilink]] graph).
 * Backlinks = "who targets me" is a single indexed query.
 */
export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    type: text("type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("links_target_idx").on(t.targetId),
    index("links_source_idx").on(t.sourceId),
    unique("links_source_target_type_uq").on(t.sourceId, t.targetId, t.type),
  ]
);

/** invites — single-use codes for invite-only signup. */
export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  usedBy: uuid("used_by").references(() => users.id, { onDelete: "set null" }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
