import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertMember, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


import { and, desc, sql } from "drizzle-orm";
import { attendance, gyms, members, memberships, payments, workoutPlans } from "../drizzle/schema";

export async function getPrimaryGym(ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(gyms).where(eq(gyms.ownerId, ownerId)).limit(1);
  return rows[0];
}

export async function getGymSummary(gymId: number) {
  const db = await getDb();
  if (!db) return { members: 0, attendanceToday: 0, revenue: "0", activePlans: 0 };
  const [memberCount, attendanceCount, revenue, activePlans] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(members).where(and(eq(members.gymId, gymId), eq(members.status, "active"))),
    db.select({ count: sql<number>`count(*)` }).from(attendance).where(eq(attendance.gymId, gymId)),
    db.select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(and(eq(payments.gymId, gymId), eq(payments.status, "paid"))),
    db.select({ count: sql<number>`count(*)` }).from(workoutPlans).where(and(eq(workoutPlans.gymId, gymId), eq(workoutPlans.isActive, true))),
  ]);
  return {
    members: Number(memberCount[0]?.count ?? 0),
    attendanceToday: Number(attendanceCount[0]?.count ?? 0),
    revenue: String(revenue[0]?.total ?? "0"),
    activePlans: Number(activePlans[0]?.count ?? 0),
  };
}

export async function listMembers(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).where(eq(members.gymId, gymId)).orderBy(desc(members.joinedAt));
}

export async function createMember(input: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(members).values(input);
  const rows = await db.select().from(members).where(and(eq(members.gymId, input.gymId), eq(members.email, input.email ?? ""))).orderBy(desc(members.id)).limit(1);
  return rows[0];
}

export async function listWorkoutPlans(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workoutPlans).where(eq(workoutPlans.gymId, gymId)).orderBy(desc(workoutPlans.createdAt));
}


export async function listMemberships(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memberships).where(eq(memberships.gymId, gymId)).orderBy(desc(memberships.endDate));
}

export async function listPayments(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.gymId, gymId)).orderBy(desc(payments.paidAt));
}

export async function listAttendance(gymId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attendance).where(eq(attendance.gymId, gymId)).orderBy(desc(attendance.checkedInAt));
}
