import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Lock,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import FloatingDotsBackground from "../components/FloatingDotsBackground";
import { useActor } from "../hooks/useActor";
import { useCreateStaffAccount, useLogin } from "../hooks/useQueries";

interface StaffLoginPageProps {
  onLogin: (token: string) => void;
  onBack: () => void;
}

type Mode = "login" | "create";

export default function StaffLoginPage({
  onLogin,
  onBack,
}: StaffLoginPageProps) {
  const [mode, setMode] = useState<Mode>("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);

  // Create account state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const { actor, isFetching: isConnecting } = useActor();
  const isReady = !!actor && !isConnecting;
  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { mutate: createAccount, isPending: isCreating } =
    useCreateStaffAccount();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser || !trimmedPass) return;

    setHasError(false);
    login(
      { username: trimmedUser, password: trimmedPass },
      {
        onSuccess: (token) => {
          toast.success("Logged in successfully");
          onLogin(token);
        },
        onError: () => {
          setHasError(true);
          toast.error("Login failed", {
            description: isConnecting
              ? "Still connecting to server, please wait a moment and try again."
              : "Check your username and password and try again.",
          });
        },
      },
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const trimmedUser = newUsername.trim();
    const trimmedPass = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (accessCode.trim() !== "KCESTAFF") {
      setCreateError(
        "Invalid staff access code. Please contact your administrator.",
      );
      return;
    }

    if (!trimmedUser || !trimmedPass || !trimmedConfirm) {
      setCreateError("All fields are required.");
      return;
    }
    if (trimmedUser.length < 3) {
      setCreateError("Username must be at least 3 characters.");
      return;
    }
    if (trimmedPass !== trimmedConfirm) {
      setCreateError("Passwords do not match.");
      return;
    }
    if (trimmedPass.length < 4) {
      setCreateError("Password must be at least 4 characters.");
      return;
    }

    createAccount(
      { username: trimmedUser, password: trimmedPass },
      {
        onSuccess: () => {
          toast.success("Account created", {
            description: `Staff account "${trimmedUser}" is ready. You can now log in.`,
          });
          setNewUsername("");
          setNewPassword("");
          setConfirmPassword("");
          setAccessCode("");
          setMode("login");
          setUsername(trimmedUser);
        },
        onError: (err: Error) => {
          const msg = err.message?.includes("Not connected")
            ? "Still connecting to server. Please wait a few seconds and try again."
            : err.message?.includes("already taken")
              ? err.message
              : err.message || "Could not create account. Please try again.";
          setCreateError(msg);
          toast.error("Account creation failed", {
            description: msg,
          });
        },
      },
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <FloatingDotsBackground />
      {/* Nav bar */}
      <header className="sticky top-0 z-20 bg-sky-600/80 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center gap-3 relative">
        <Button
          variant="ghost"
          size="icon"
          data-ocid="stafflogin.back_button"
          onClick={onBack}
          className="shrink-0 rounded-lg"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-base">
            Staff Portal
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mode toggle tabs */}
          <div
            data-ocid="stafflogin.mode_tab"
            className="flex rounded-xl bg-secondary border border-border p-1 mb-6"
          >
            <button
              type="button"
              data-ocid="stafflogin.login_tab"
              onClick={() => {
                setMode("login");
                setHasError(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Login
            </button>
            <button
              type="button"
              data-ocid="stafflogin.create_tab"
              onClick={() => {
                setMode("create");
                setCreateError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "create"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-elevated">
                    <Lock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                    Staff Login
                  </h1>
                  <p className="text-black text-sm">
                    Enter your username and password to continue.
                  </p>
                </div>

                {/* Login form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="login-username"
                        className="text-sm font-medium text-black"
                      >
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-username"
                          data-ocid="stafflogin.username_input"
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            setHasError(false);
                          }}
                          placeholder="Enter username"
                          autoComplete="username"
                          autoFocus
                          className={`pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary ${
                            hasError
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="login-password"
                        className="text-sm font-medium text-black"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          data-ocid="stafflogin.password_input"
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setHasError(false);
                          }}
                          placeholder="Enter password"
                          autoComplete="current-password"
                          className={`pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary ${
                            hasError
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                        />
                      </div>
                      {hasError && (
                        <p
                          data-ocid="stafflogin.login_error"
                          className="text-destructive text-xs font-medium"
                        >
                          Invalid username or password. Please try again.
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      data-ocid="stafflogin.submit_button"
                      disabled={
                        isLoggingIn ||
                        !isReady ||
                        !username.trim() ||
                        !password.trim()
                      }
                      className="w-full h-11 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card mt-1"
                    >
                      {!isReady ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting…
                        </>
                      ) : isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    {!isReady && (
                      <p
                        data-ocid="stafflogin.connecting_state"
                        className="text-center text-xs text-muted-foreground mt-2"
                      >
                        Connecting to server, please wait…
                      </p>
                    )}
                  </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  No account yet?{" "}
                  <button
                    type="button"
                    data-ocid="stafflogin.go_create_link"
                    onClick={() => setMode("create")}
                    className="text-primary font-medium hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-elevated">
                    <UserPlus className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                    Create Account
                  </h1>
                  <p className="text-black text-sm">
                    Set up a new staff account to access the portal.
                  </p>
                </div>

                {/* Create account form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <form onSubmit={handleCreate} className="space-y-4">
                    {/* Staff Access Code */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="access-code"
                        className="text-sm font-medium text-black"
                      >
                        Staff Access Code
                      </Label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="access-code"
                          data-ocid="stafflogin.access_code_input"
                          type="password"
                          value={accessCode}
                          onChange={(e) => {
                            setAccessCode(e.target.value);
                            setCreateError("");
                          }}
                          placeholder="Enter staff access code"
                          autoComplete="off"
                          autoFocus
                          className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contact your administrator for the access code
                      </p>
                    </div>

                    {/* New username */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="create-username"
                        className="text-sm font-medium text-black"
                      >
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="create-username"
                          data-ocid="stafflogin.new_username_input"
                          type="text"
                          value={newUsername}
                          onChange={(e) => {
                            setNewUsername(e.target.value);
                            setCreateError("");
                          }}
                          placeholder="Choose a username (min. 3 chars)"
                          autoComplete="username"
                          className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum 3 characters
                      </p>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="create-password"
                        className="text-sm font-medium text-black"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="create-password"
                          data-ocid="stafflogin.new_password_input"
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setCreateError("");
                          }}
                          placeholder="Choose a password"
                          autoComplete="new-password"
                          className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="confirm-password"
                        className="text-sm font-medium text-black"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          data-ocid="stafflogin.confirm_password_input"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setCreateError("");
                          }}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    {createError && (
                      <p
                        data-ocid="stafflogin.create_error"
                        className="text-destructive text-xs font-medium"
                      >
                        {createError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      data-ocid="stafflogin.create_submit_button"
                      disabled={
                        isCreating ||
                        !isReady ||
                        !accessCode.trim() ||
                        !newUsername.trim() ||
                        !newPassword.trim() ||
                        !confirmPassword.trim()
                      }
                      className="w-full h-11 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card mt-1"
                    >
                      {!isReady ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting…
                        </>
                      ) : isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                    {!isReady && (
                      <p
                        data-ocid="stafflogin.create_connecting_state"
                        className="text-center text-xs text-muted-foreground mt-2"
                      >
                        Connecting to server, please wait…
                      </p>
                    )}
                  </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    data-ocid="stafflogin.go_login_link"
                    onClick={() => setMode("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center relative z-10">
        <p className="text-white/80 text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
