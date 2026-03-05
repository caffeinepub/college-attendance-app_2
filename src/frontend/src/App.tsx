import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import DepartmentYearPage from "./pages/DepartmentYearPage";
import EnterPage from "./pages/EnterPage";
import HomePage from "./pages/HomePage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import StudentLookupPage from "./pages/StudentLookupPage";

type Page =
  | "enter"
  | "home"
  | "dept-year-staff"
  | "dept-year-student"
  | "student"
  | "staff-login"
  | "staff-dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("enter");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>("AIML");
  const [selectedYear, setSelectedYear] = useState<number>(1);

  const handleStaffLogin = (token: string) => {
    setSessionToken(token);
    setPage("staff-dashboard");
  };

  const handleStaffLogout = () => {
    setSessionToken(null);
    setPage("home");
  };

  const handleDeptYearConfirmStaff = (deptKey: string, year: number) => {
    setSelectedDept(deptKey);
    setSelectedYear(year);
    setPage("staff-login");
  };

  const handleDeptYearConfirmStudent = (deptKey: string, year: number) => {
    setSelectedDept(deptKey);
    setSelectedYear(year);
    setPage("student");
  };

  return (
    <div className="min-h-screen flex flex-col font-body">
      <Toaster richColors position="top-right" />

      {page === "enter" && <EnterPage onEnter={() => setPage("home")} />}

      {page === "home" && (
        <HomePage
          onStaffClick={() => setPage("dept-year-staff")}
          onStudentClick={() => setPage("dept-year-student")}
        />
      )}

      {page === "dept-year-staff" && (
        <DepartmentYearPage
          mode="staff"
          onConfirm={handleDeptYearConfirmStaff}
          onBack={() => setPage("home")}
        />
      )}

      {page === "dept-year-student" && (
        <DepartmentYearPage
          mode="student"
          onConfirm={handleDeptYearConfirmStudent}
          onBack={() => setPage("home")}
        />
      )}

      {page === "student" && (
        <StudentLookupPage
          dept={selectedDept}
          year={selectedYear}
          onBack={() => setPage("dept-year-student")}
        />
      )}

      {page === "staff-login" && (
        <StaffLoginPage
          onLogin={handleStaffLogin}
          onBack={() => setPage("dept-year-staff")}
        />
      )}

      {page === "staff-dashboard" && sessionToken && (
        <StaffDashboardPage
          token={sessionToken}
          dept={selectedDept}
          year={selectedYear}
          onLogout={handleStaffLogout}
        />
      )}
    </div>
  );
}
