import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createMember, getGymSummary, getPrimaryGym, listAttendance, listMembers, listMemberships, listPayments, listWorkoutPlans } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  gym: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const gym = await getPrimaryGym(ctx.user.id);
      if (!gym) return { gym: null, summary: { members: 0, attendanceToday: 0, revenue: "0", activePlans: 0 } };
      return { gym, summary: await getGymSummary(gym.id) };
    }),
    members: protectedProcedure.query(async ({ ctx }) => {
      const gym = await getPrimaryGym(ctx.user.id);
      return gym ? listMembers(gym.id) : [];
    }),
    addMember: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().email().optional(), phone: z.string().max(40).optional() }))
      .mutation(async ({ ctx, input }) => {
        const gym = await getPrimaryGym(ctx.user.id);
        if (!gym) throw new Error("Create a gym workspace first");
        return createMember({ gymId: gym.id, name: input.name, email: input.email, phone: input.phone });
      }),
    workouts: protectedProcedure.query(async ({ ctx }) => {
      const gym = await getPrimaryGym(ctx.user.id);
      return gym ? listWorkoutPlans(gym.id) : [];
    }),
    memberships: protectedProcedure.query(async ({ ctx }) => {
      const gym = await getPrimaryGym(ctx.user.id);
      return gym ? listMemberships(gym.id) : [];
    }),
    payments: protectedProcedure.query(async ({ ctx }) => {
      const gym = await getPrimaryGym(ctx.user.id);
      return gym ? listPayments(gym.id) : [];
    }),
    attendance: protectedProcedure.query(async ({ ctx }) => {
      const gym = await getPrimaryGym(ctx.user.id);
      return gym ? listAttendance(gym.id) : [];
    }),
  }),
});

export type AppRouter = typeof appRouter;
