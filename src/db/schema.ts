import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -----------------------------------------------------------------------------
// ENUMS (PostgreSQL Native Enums)
// -----------------------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["admin", "operator", "viewer"]);

export const projectTypeEnum = pgEnum("project_type", ["laboral", "personal", "infra"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "maintenance", "paused"]);

export const nodeRoleEnum = pgEnum("node_role", ["app", "db", "storage", "local"]);
export const nodeProviderEnum = pgEnum("node_provider", ["hetzner", "local"]);
export const nodeStatusEnum = pgEnum("node_status", ["online", "offline", "unreachable"]);

export const serviceTypeEnum = pgEnum("service_type", ["caddy", "uvicorn", "container", "systemd"]);
export const serviceStatusEnum = pgEnum("service_status", ["running", "stopped", "failed"]);

export const taskPriorityEnum = pgEnum("task_priority", ["p1", "p2", "p3", "p4"]);
export const taskStatusEnum = pgEnum("task_status", ["backlog", "in_progress", "review", "done"]);

export const webhookTypeEnum = pgEnum("webhook_type", ["inbound", "outbound"]);
export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", ["success", "failed", "pending"]);

// -----------------------------------------------------------------------------
// TABLAS
// -----------------------------------------------------------------------------

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Projects
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: projectTypeEnum("type").default("personal").notNull(),
  repoUrl: text("repo_url"),
  defaultBranch: text("default_branch").default("main"),
  status: projectStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Nodes (Infraestructura Hetzner / Local)
export const nodes = pgTable("nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  hostIp: text("host_ip").notNull(),
  privateIp: text("private_ip"),
  role: nodeRoleEnum("role").default("app").notNull(),
  provider: nodeProviderEnum("provider").default("hetzner").notNull(),
  status: nodeStatusEnum("status").default("online").notNull(),
});

// 4. Project Services (Puertos y procesos vinculados a nodos)
export const projectServices = pgTable("project_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  nodeId: uuid("node_id").references(() => nodes.id, { onDelete: "cascade" }).notNull(),
  port: integer("port").notNull(),
  internalPort: integer("internal_port"),
  protocol: text("protocol").default("tcp").notNull(),
  serviceType: serviceTypeEnum("service_type").default("systemd").notNull(),
  status: serviceStatusEnum("status").default("running").notNull(),
});

// 5. Tasks (Backlog y gestión de sprints)
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").default("p3").notNull(),
  status: taskStatusEnum("status").default("backlog").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. DevLogs (Bitácoras tácticas de ingeniería)
export const devlogs = pgTable("devlogs", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  markdownContent: text("markdown_content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Webhook Endpoints (Inbound & Outbound)
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: webhookTypeEnum("type").default("inbound").notNull(),
  url: text("url").notNull(), // Endpoint slug para inbound o destino URL para outbound
  secret: text("secret").notNull(), // HMAC SHA-256 secret
  events: jsonb("events").$type<string[]>().default([]).notNull(), // ['service.status_change', 'deploy.finished', etc.]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Webhook Deliveries (Auditoría e historial de entregas)
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpointId: uuid("endpoint_id").references(() => webhookEndpoints.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  status: webhookDeliveryStatusEnum("status").default("pending").notNull(),
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
});

// -----------------------------------------------------------------------------
// RELACIONES DRIZZLE
// -----------------------------------------------------------------------------
export const projectsRelations = relations(projects, ({ many }) => ({
  services: many(projectServices),
  tasks: many(tasks),
  devlogs: many(devlogs),
}));

export const nodesRelations = relations(nodes, ({ many }) => ({
  services: many(projectServices),
}));

export const projectServicesRelations = relations(projectServices, ({ one }) => ({
  project: one(projects, {
    fields: [projectServices.projectId],
    references: [projects.id],
  }),
  node: one(nodes, {
    fields: [projectServices.nodeId],
    references: [nodes.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const devlogsRelations = relations(devlogs, ({ one }) => ({
  project: one(projects, {
    fields: [devlogs.projectId],
    references: [projects.id],
  }),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({ many }) => ({
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  endpoint: one(webhookEndpoints, {
    fields: [webhookDeliveries.endpointId],
    references: [webhookEndpoints.id],
  }),
}));
