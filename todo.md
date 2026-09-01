# Project TODO

- [x] Establish the GymOS visual foundation and responsive application shell
- [ ] Implement authentication and email-confirmation flow
- [ ] Define database models for gyms, staff, members, memberships, attendance, payments, and workouts
- [ ] Implement role-based access for owners, staff, trainers, and members
- [x] Build admin dashboard with gym overview metrics
- [x] Build admin member management workflow
- [ ] Build admin membership and payment workflow
- [ ] Build admin QR attendance workflow
- [ ] Build admin workout-program management workflow
- [ ] Build client/member dashboard
- [ ] Build client membership and attendance history views
- [ ] Build client workout-program view
- [ ] Add loading, empty, error, and unauthorized states to all data flows
- [ ] Add Vitest coverage for core server procedures and authorization rules
- [ ] Run production build and visual verification
- [ ] Save a checkpoint and document Supabase/Vercel connection steps
- [ ] Implement or explicitly scope authentication for the rebuilt project
- [ ] Add a staff assignment model for owner, staff, and trainer roles
- [ ] Add role-aware authorization checks to server procedures and UI
- [ ] Add create, edit, assign, and archive actions for workout programs
- [ ] Add explicit error and unauthorized UI states to all tRPC flows
- [ ] Write Vitest coverage for GymOS procedures and authorization failures
- [ ] Visually verify authenticated admin screens and client workflows

- [x] Confirm temporary use of the built-in Manus authentication and database backend, with future Supabase migration kept as a later integration
- [ ] Complete the built-in backend schema migration and verify database availability
- [ ] Add membership, payment, attendance, and staff/trainer procedures
- [ ] Add client-specific membership, attendance, and workout data procedures
- [ ] Add a documented migration boundary for a future Supabase adapter

- [x] Lock final scope: build and deliver the admin workspace and client/member portal using the current built-in backend without additional clarification requests
