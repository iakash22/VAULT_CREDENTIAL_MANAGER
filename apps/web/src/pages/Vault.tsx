import { useAuth } from "../auth/useAuth";

export function VaultPage() {
  const { session } = useAuth();

  return (
    <section className="grid gap-4">
      <div className="glass-panel rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-300">Signed in as {session?.user.username}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Personal vault</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          The encryption key is in this tab&apos;s memory only. It was derived here and was not sent
          to the API. Secret items arrive in Phase 4.
        </p>
      </div>

      <div className="glass-panel flex min-h-[280px] flex-col items-center justify-center rounded-3xl px-6 py-12 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent-400/15 text-accent-300">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 3l8 4.5v6.2c0 4.2-3.4 7.8-8 9.3-4.6-1.5-8-5.1-8-9.3V7.5L12 3z" />
            <path d="M9.5 12.2l1.8 1.8 3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-xl">Authenticated</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          JWT proves who you are. The vault key wrap (Phase 3) is what will open ciphertext.
        </p>
      </div>
    </section>
  );
}
