# College Attendance App

## Current State
New project. No existing backend or frontend code.

## Requested Changes (Diff)

### Add
- Full-stack attendance management app with two user roles: Staff and Student
- Staff authentication via username/password stored in backend
- Attendance recording per subject, date, and student
- Student lookup by registration number (no auth required)
- Attendance percentage calculations per subject and overall
- Predefined seed data: students (registration number + name) and subjects
- Homepage with role selection (Staff Login / Student Lookup)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan

### Backend (Motoko)
- Data types: Student (regNo, name), Subject (id, name), AttendanceRecord (regNo, subjectId, date, status: Present | Absent), StaffAccount (username, passwordHash)
- Stable storage for all records
- Seed data: 10 students, 5 subjects, 3 staff accounts
- Functions:
  - `loginStaff(username, password)` -> returns session token or error
  - `getStudents()` -> list of all students
  - `getSubjects()` -> list of all subjects
  - `markAttendance(token, subjectId, date, records: [(regNo, status)])` -> saves batch attendance
  - `getAttendanceByStaff(token)` -> returns records entered by that staff member
  - `getAttendanceByStudent(regNo)` -> returns all attendance records for a student
  - `getAttendanceSummary(regNo)` -> per-subject present/absent counts and percentages, plus overall

### Frontend (React + Tailwind)
- Homepage: two large role cards (Staff Login, Student Lookup)
- Staff flow:
  - Login form (username + password)
  - Dashboard: select subject and date, list of students with present/absent toggle per student, submit batch
  - View records tab: list of previously submitted attendance sessions
- Student flow:
  - Registration number input form
  - Results view: overall attendance percentage summary card, per-subject breakdown table (subject name, present days, absent days, percentage)
- Responsive mobile-friendly layout
