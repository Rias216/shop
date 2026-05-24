import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLoginAction } from "@/lib/admin-login-actions";
import { getAdminSession } from "@/lib/admin-session-server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function errorMessage(code: string | undefined): string | null {
  if (code === "invalid") return "Wrong login or password.";
  if (code === "rate") return "Too many attempts. Wait a minute and try again.";
  if (code === "session") return "Please sign in to continue.";
  return null;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const { error, callbackUrl } = await searchParams;
  const returnTo =
    callbackUrl?.startsWith("/admin") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/admin";
  const message = errorMessage(error);

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <article className="glass-strong rounded-3xl p-8">
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your admin login and password.
        </p>

        <form action={adminLoginAction} className="mt-8 space-y-4">
          <input type="hidden" name="callbackUrl" value={returnTo} />
          <p>
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              name="login"
              type="text"
              required
              autoComplete="username"
              placeholder="admin"
              className="mt-1"
            />
          </p>
          <p>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1"
            />
          </p>
          {message && <p className="text-sm text-red-600">{message}</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-accent">
            ← Back to store
          </Link>
        </p>
      </article>
    </section>
  );
}
