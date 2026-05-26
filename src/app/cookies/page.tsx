export default function CookiesPage() {
  return (
    <main className="min-h-dvh bg-[#070812] px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-2xl sm:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/40">
          Antiques Lens
        </p>

        <h1 className="text-3xl font-semibold">Cookies Policy</h1>

        <p className="mt-5 text-sm leading-8 text-white/65">
          Antiques Lens may use cookies and similar technologies to improve the
          user experience, remember basic preferences, support security, and
          understand how visitors interact with the platform.
        </p>

        <h2 className="mt-8 text-lg font-semibold">What cookies may be used for</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Cookies may help us remember language preferences, keep the interface
          stable, improve performance, and support basic analytics. Some cookies
          may be necessary for the platform to function properly.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Managing cookies</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Visitors can control or delete cookies through their browser settings.
          Disabling cookies may affect some features or reduce the quality of the
          experience.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Updates</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          This policy may be updated as the platform develops or as new features
          are added.
        </p>
      </section>
    </main>
  );
}