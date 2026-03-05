import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import EnterPage from "./pages/EnterPage";
import HomePage from "./pages/HomePage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import StudentLookupPage from "./pages/StudentLookupPage";

type Page = "enter" | "home" | "student" | "staff-login" | "staff-dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("enter");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const handleStaffLogin = (token: string) => {
    setSessionToken(token);
    setPage("staff-dashboard");
  };

  const handleStaffLogout = () => {
    setSessionToken(null);
    setPage("home");
  };

  return (
    <div className="min-h-screen flex flex-col font-body">
      <Toaster richColors position="top-right" />

      {page === "enter" && <EnterPage onEnter={() => setPage("home")} />}

      {page === "home" && (
        <HomePage
          onStaffClick={() => setPage("staff-login")}
          onStudentClick={() => setPage("student")}
        />
      )}

      {page === "student" && (
        <StudentLookupPage onBack={() => setPage("home")} />
      )}

      {page === "staff-login" && (
        <StaffLoginPage
          onLogin={handleStaffLogin}
          onBack={() => setPage("home")}
        />
      )}

      {page === "staff-dashboard" && sessionToken && (
        <StaffDashboardPage token={sessionToken} onLogout={handleStaffLogout} />
      )}
    </div>
  );
}
