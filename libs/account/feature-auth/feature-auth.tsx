import { useState, type FormEvent } from "react";
import { changePassword, signIn, signUp } from "data-access";
import { Button, Input } from "ui";
import styles from "./feature-auth.module.css";

type AuthMode = "login" | "register";
type AccountProfile = { displayName: string; email: string };
type FeatureAuthProps = { view?: "auth" | "details" };

function readProfile(): AccountProfile {
  try {
    const value = window.localStorage.getItem("rustic.profile");
    return value ? (JSON.parse(value) as AccountProfile) : { displayName: "", email: "" };
  } catch {
    return { displayName: "", email: "" };
  }
}

function readReturnTo(): string {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  if (
    !returnTo ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    returnTo.startsWith("/account")
  ) {
    return "/";
  }
  return returnTo;
}

function RusticLogo() {
  return (
    <svg
      aria-label="Rustic"
      className={styles.brandLogo}
      role="img"
      viewBox="0 0 196 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="14" fill="var(--color-action-primary-default)" />
      <path
        d="M13 34V14h10.4c5.2 0 8.4 2.7 8.4 7.1 0 3-1.7 5.2-4.7 6.2L34 34h-7.2l-6-6.1h-1.5V34H13Zm6.3-11h3.8c1.7 0 2.6-.6 2.6-1.8s-.9-1.8-2.6-1.8h-3.8V23Z"
        fill="var(--color-action-primary-foreground)"
      />
      <path
        d="M39 17c-2.8.3-5.1 1.9-6.2 4.4 2.7.1 4.8-.8 6.2-2.7 1.2 1.9 3.4 2.8 6.1 2.7-1.1-2.5-3.4-4.1-6.1-4.4Z"
        fill="var(--color-status-warning-foreground)"
      />
      <text
        x="60"
        y="32"
        fill="var(--color-text-primary)"
        fontFamily="var(--font-family-sans)"
        fontSize="27"
        fontWeight="700"
        letterSpacing="-.7"
      >
        Rustic
      </text>
    </svg>
  );
}

export function FeatureAuth({ view = "auth" }: FeatureAuthProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (view === "details") return <AccountDetails />;

  const isRegister = mode === "register";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice("");
    setShowPassword(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (isRegister && data.get("password") !== data.get("confirmPassword")) {
      const confirmPassword = form.elements.namedItem("confirmPassword");
      if (confirmPassword instanceof HTMLInputElement) {
        confirmPassword.setCustomValidity("Passwords must match.");
        confirmPassword.reportValidity();
      }
      setNotice("Your passwords don’t match. Check them and try again.");
      return;
    }

    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setBusy(true);
    setNotice("");

    try {
      const response = isRegister
        ? await signUp({
            email,
            displayName: String(data.get("name") ?? ""),
            password,
          })
        : await signIn({ email, password });

      if (!response.ok) {
        setNotice(
          isRegister
            ? "We couldn’t create your account. Check your details and try again."
            : "We couldn’t sign you in. Check your email and password and try again.",
        );
        return;
      }

      if (isRegister) {
        window.localStorage.setItem(
          "rustic.profile",
          JSON.stringify({
            displayName: String(data.get("name") ?? ""),
            email,
          } satisfies AccountProfile),
        );
        form.reset();
        setNotice("Your account was created successfully. You can now sign in.");
      } else {
        const savedProfile = readProfile();
        window.localStorage.setItem(
          "rustic.profile",
          JSON.stringify({
            displayName: savedProfile.displayName || email.split("@")[0],
            email,
          } satisfies AccountProfile),
        );
        window.localStorage.setItem("rustic.session", "true");
        window.location.assign(readReturnTo());
      }
    } catch {
      setNotice("We couldn’t reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="auth-title" className={styles.screen}>
      <RusticLogo />
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Rustic marketplace</p>
        <h1 className={styles.title} id="auth-title">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className={styles.description}>
          {isRegister
            ? "Join Rustic to discover and share thoughtfully made goods."
            : "Sign in to continue to your Rustic account."}
        </p>
      </div>

      <div aria-label="Account access" className={styles.modeSwitch} role="group">
        <button
          aria-pressed={!isRegister}
          className={!isRegister ? styles.modeActive : styles.modeButton}
          onClick={() => switchMode("login")}
          type="button"
        >
          Sign in
        </button>
        <button
          aria-pressed={isRegister}
          className={isRegister ? styles.modeActive : styles.modeButton}
          onClick={() => switchMode("register")}
          type="button"
        >
          Create account
        </button>
      </div>

      <form key={mode} className={styles.form} onSubmit={handleSubmit}>
        {isRegister && (
          <label className={styles.field}>
            <span>Your name</span>
            <Input
              autoComplete="name"
              maxLength={80}
              name="name"
              placeholder="Alex Morgan"
              required
              disabled={busy}
            />
          </label>
        )}
        <label className={styles.field}>
          <span>Email address</span>
          <Input
            autoComplete="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
            disabled={busy}
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <span className={styles.passwordInput}>
            <Input
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type={showPassword ? "text" : "password"}
              disabled={busy}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={styles.passwordToggle}
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {isRegister && (
          <label className={styles.field}>
            <span>Confirm password</span>
            <Input
              autoComplete="new-password"
              minLength={8}
              name="confirmPassword"
              onChange={(event) => event.currentTarget.setCustomValidity("")}
              placeholder="Enter your password again"
              required
              type={showPassword ? "text" : "password"}
              disabled={busy}
            />
          </label>
        )}
        {!isRegister && (
          <div className={styles.formOptions}>
            <label className={styles.remember}>
              <input name="remember" type="checkbox" />
              <span>Remember me</span>
            </label>
            <button
              className={styles.textButton}
              onClick={() => setNotice("Password recovery isn’t available yet.")}
              type="button"
            >
              Forgot password?
            </button>
          </div>
        )}
        <Button className={styles.submit} disabled={busy} size="lg" type="submit">
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </Button>
        {notice && (
          <p aria-live="polite" className={styles.notice} role="status">
            {notice}
          </p>
        )}
      </form>
      <p className={styles.switchPrompt}>
        {isRegister ? "Already have an account?" : "New to Rustic?"}{" "}
        <button
          className={styles.textButton}
          onClick={() => switchMode(isRegister ? "login" : "register")}
          type="button"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}

function AccountDetails() {
  const [profile, setProfile] = useState<AccountProfile>(readProfile);
  const [profileNotice, setProfileNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const updated = {
      displayName: String(data.get("displayName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
    };
    window.localStorage.setItem("rustic.profile", JSON.stringify(updated));
    setProfile(updated);
    setProfileNotice("Your account details have been saved.");
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword !== data.get("confirmPassword")) {
      setPasswordNotice("Your new passwords don’t match.");
      return;
    }
    setPasswordBusy(true);
    setPasswordNotice("");
    try {
      const response = await changePassword({
        email: profile.email,
        password: currentPassword,
        newPassword,
      });
      if (!response.ok) {
        setPasswordNotice(
          "We couldn’t update your password. Check your current password and try again.",
        );
        return;
      }
      form.reset();
      setPasswordNotice("Your password has been updated.");
    } catch {
      setPasswordNotice("Password updates aren’t available right now. Please try again later.");
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <section aria-labelledby="account-title" className={`${styles.screen} ${styles.accountScreen}`}>
      <RusticLogo />
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Your Rustic account</p>
        <h1 className={styles.title} id="account-title">
          Account details
        </h1>
        <p className={styles.description}>Update your name and email, or change your password.</p>
      </header>
      <form className={styles.form} onSubmit={saveProfile}>
        <label className={styles.field}>
          <span>Your name</span>
          <Input
            autoComplete="name"
            maxLength={80}
            name="displayName"
            required
            defaultValue={profile.displayName}
          />
        </label>
        <label className={styles.field}>
          <span>Email address</span>
          <Input
            autoComplete="email"
            name="email"
            required
            type="email"
            defaultValue={profile.email}
          />
        </label>
        <Button className={styles.submit} size="lg" type="submit">
          Save account details
        </Button>
        {profileNotice && (
          <p aria-live="polite" className={styles.successNotice} role="status">
            {profileNotice}
          </p>
        )}
      </form>
      <form className={`${styles.form} ${styles.passwordForm}`} onSubmit={savePassword}>
        <h2 className={styles.sectionTitle}>Update password</h2>
        <label className={styles.field}>
          <span>Current password</span>
          <Input
            autoComplete="current-password"
            minLength={8}
            name="currentPassword"
            required
            type="password"
          />
        </label>
        <label className={styles.field}>
          <span>New password</span>
          <Input
            autoComplete="new-password"
            minLength={8}
            name="newPassword"
            required
            type="password"
          />
        </label>
        <label className={styles.field}>
          <span>Confirm new password</span>
          <Input
            autoComplete="new-password"
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
        </label>
        <Button className={styles.submit} disabled={passwordBusy} size="lg" type="submit">
          {passwordBusy ? "Updating…" : "Update password"}
        </Button>
        {passwordNotice && (
          <p
            aria-live="polite"
            className={passwordNotice.includes("updated.") ? styles.successNotice : styles.notice}
            role="status"
          >
            {passwordNotice}
          </p>
        )}
      </form>
    </section>
  );
}

export default FeatureAuth;
