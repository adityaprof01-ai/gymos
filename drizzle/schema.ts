import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const gyms = mysqlTable("gyms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerId: int("ownerId").notNull(),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  status: mysqlEnum("status", ["active", "paused", "expired"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  gymId: int("gymId").notNull(),
  plan: varchar("plan", { length: 120 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "pending", "expired", "cancelled"]).default("active").notNull(),
});

export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  gymId: int("gymId").notNull(),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
  method: varchar("method", { length: 40 }).default("front-desk").notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  gymId: int("gymId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["paid", "pending", "failed", "refunded"]).default("paid").notNull(),
  reference: varchar("reference", { length: 120 }),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
});

export const workoutPlans = mysqlTable("workoutPlans", {
  id: int("id").autoincrement().primaryKey(),
  gymId: int("gymId").notNull(),
  memberId: int("memberId"),
  trainerId: int("trainerId"),
  title: varchar("title", { length: 160 }).notNull(),
  focus: varchar("focus", { length: 120 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Gym = typeof gyms.$inferSelect;
export type InsertGym = typeof gyms.$inferInsert;
export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
