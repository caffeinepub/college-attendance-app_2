import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { useActor } from "./hooks/useActor";
import { useInitSeedData } from "./hooks/useQueries";
import HomePage from "./pages/HomePage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import StudentLookupPage from "./pages/StudentLookupPage";

type Page = "home" | "student" | "staff-login" | "staff-dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { actor, isFetching } = useActor();
  const { mutate: initSeed } = useInitSeedData();

  // Seed data once actor is ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: initSeed is a stable mutation fn
  useEffect(() => {
    if (actor && !isFetching) {
      initSeed();
    }
  }, [actor, isFetching]);

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
