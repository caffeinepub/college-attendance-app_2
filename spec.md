# Attenly

## Current State
The app is a college attendance management system for Kathir College of Engineering. It has:
- An animated entry page with KCE logo and graduation cap animation
- A home page where users choose Staff or Student portal
- A department + year selection page (for both staff and students)
- Staff Portal: login with username/password, mark attendance (Present/Absent/On-Duty) per subject per date for 63+ students, manage subjects, view records
- Student Portal: enter registration number, view overall and subject-wise attendance percentage

**Critical problem:** All data is stored in browser localStorage/sessionStorage:
- Attendance records: `localStorage` key `attendance_records_v2`
- Staff accounts: `localStorage` key `staff_accounts_v1`
- Subjects per dept: `localStorage` key `subjects_{deptKey}`
- Sessions: `sessionStorage` key `staff_session_v1`

This means data is device-local -- staff marks attendance on one device but students on other Android/iOS devices see "No Records Yet".

## Requested Changes (Diff)

### Add
- Backend Motoko actor with persistent stable storage for:
  - Attendance records (regNo, subjectId, date, status, staffUsername, dept, year)
  - Subjects per department (deptKey → list of {id, name})
  - Staff accounts (username → hashed/plain password)
  - Session tokens (token → username mapping)
- Backend query/update functions:
  - `staffLogin(username, password)` → returns session token or error
  - `staffCreateAccount(username, password)` → creates new account
  - `staffLogout(token)` → destroys session
  - `markAttendance(token, subjectId, date, attendanceList, dept, year)` → saves records
  - `getAttendanceByStaff(token, dept, year)` → returns records marked by this staff
  - `getStudentAttendance(regNo, dept, year)` → returns all records for a student
  - `getSubjectsForDept(deptKey)` → returns subject list
  - `saveSubjectsForDept(token, deptKey, subjects)` → saves subject list
  - `clearSubjectsForDept(token, deptKey)` → clears subject list

### Modify
- `useQueries.ts` -- replace all localStorage/sessionStorage calls with backend canister calls using the generated `backend` actor
- `attendanceData.ts` -- remove localStorage-based `getSubjectsForDept` and `saveSubjectsForDept`; replace with backend calls (or keep as cache layer)
- `StaffDashboardPage.tsx` -- `ManageSubjectsTab` now calls backend hooks for adding/removing subjects
- `StudentLookupPage.tsx` -- subjects fetched from backend, not localStorage

### Remove
- All `localStorage.getItem/setItem` calls for attendance records, staff accounts, and subjects
- All `sessionStorage` calls for session management
- Local `loadRecords`, `saveRecords`, `loadAccounts`, `saveAccounts`, `getSession`, `createSession`, `destroySession` functions

## Implementation Plan
1. Write `spec.md` (this file)
2. Generate Motoko backend actor with stable storage for all data types, plus all required query/update endpoints
3. Update `useQueries.ts` to call backend actor methods instead of localStorage
4. Add new hooks: `useGetSubjectsForDept`, `useSaveSubjectsForDept` backed by canister
5. Update `StaffDashboardPage.tsx` ManageSubjectsTab to use backend subject hooks
6. Update `StudentLookupPage.tsx` to fetch subjects from backend
7. Validate build (typecheck + lint + build)
8. Deploy
