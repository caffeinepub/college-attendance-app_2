import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useLogin } from "../hooks/useQueries";

interface StaffLoginPageProps {
  onLogin: (token: string) => void;
  onBack: () => void;
}

export default function StaffLoginPage({
  onLogin,
  onBack,
}: StaffLoginPageProps) {
  const [pin, setPin] = useState("");
  const [hasError, setHasError] = useState(false);

  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();
    if (!trimmed) return;

    setHasError(false);
    login(
      { username: "staff", password: trimmed },
      {
        onSuccess: (token) => {
          toast.success("Logged in successfully");
          onLogin(token);
        },
        onError: () => {
          setHasError(true);
          toast.error("Invalid PIN", {
            description: "Please enter the correct staff PIN to continue.",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Nav bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-elevated">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Staff Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your PIN to access the attendance portal.
            </p>
          </div>

          {/* Login form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pin-input" className="text-sm font-medium">
                  Staff PIN
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pin-input"
                    data-ocid="stafflogin.pin_input"
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setHasError(false);
                    }}
                    placeholder="Enter PIN"
                    autoComplete="current-password"
                    autoFocus
                    className={`pl-10 h-12 rounded-xl border-border bg-background focus-visible:ring-primary text-center text-lg tracking-[0.5em] ${
                      hasError
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                </div>
                {hasError && (
                  <p
                    data-ocid="stafflogin.pin_error"
                    className="text-destructive text-xs font-medium"
                  >
                    Invalid PIN. Please try again.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                data-ocid="stafflogin.submit_button"
                disabled={isPending || !pin.trim()}
                className="w-full h-12 rounded-xl text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-card mt-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
