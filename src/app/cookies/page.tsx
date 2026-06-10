export default function CookiesPage() {
  const lastUpdated = "June 10, 2026";

  return (
    <main className="min-h-dvh bg-[#F4EBDD] px-5 py-10 text-[#234236]">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-[#D8C7AA] bg-[#FFF8EC]/85 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#9A7A3D]">
          KISHIB
        </p>

        <h1 className="font-serif text-3xl font-semibold text-[#234236]">
          Cookies Policy
        </h1>

        <p className="mt-3 text-sm text-[#7A6042]">
          Last updated: {lastUpdated}
        </p>

        <p className="mt-6 text-sm leading-8 text-[#4F4437]">
          This Cookies Policy explains how KISHIB uses cookies, local storage,
          session storage, and similar technologies on our website and
          application. These technologies help the platform work correctly,
          remember user preferences, support account sessions, improve security,
          and provide a smoother experience.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          1. What Are Cookies and Similar Technologies?
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          Cookies are small files stored on your browser or device. KISHIB may
          also use local storage or session storage, which work in a similar way
          and allow the platform to remember certain information while you use
          the service.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          2. Why KISHIB Uses Cookies
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          KISHIB may use cookies and similar technologies for the following
          purposes:
        </p>

        <ul className="mt-4 list-disc space-y-3 ps-5 text-sm leading-8 text-[#4F4437]">
          <li>Keeping you signed in and maintaining your account session.</li>
          <li>Remembering your selected language and interface preferences.</li>
          <li>Supporting security and preventing misuse of the platform.</li>
          <li>Keeping the app stable while navigating between pages.</li>
          <li>Saving temporary information needed during evaluation or report generation.</li>
          <li>Improving loading, performance, and user experience.</li>
          <li>Understanding basic usage patterns and diagnosing technical issues.</li>
        </ul>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          3. Essential Cookies
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          Some cookies or local storage items are necessary for KISHIB to work
          properly. Without them, login, saved sessions, language preferences,
          archive access, reports, or other core features may not function
          correctly.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          4. Preference and Performance Cookies
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          KISHIB may use preference and performance technologies to remember how
          you prefer to use the platform, improve page loading, reduce repeated
          actions, and make the experience more consistent across visits.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          5. Analytics and Technical Diagnostics
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          KISHIB may use basic analytics or technical diagnostic tools to
          understand how the platform is used, detect errors, improve features,
          and maintain reliability. These tools are used to improve the service,
          not to sell your personal information.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          6. Third-Party Technologies
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          Some cookies or similar technologies may be provided by third-party
          services used by KISHIB, such as hosting, authentication, cloud
          storage, analytics, security, or other technical service providers.
          These providers may process limited technical information as needed to
          provide their services.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          7. Managing Cookies
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          You can control, block, or delete cookies through your browser or
          device settings. However, disabling cookies, local storage, or session
          storage may affect important features, including login, saved sessions,
          language settings, archive access, report creation, and overall app
          stability.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          8. Updates to This Policy
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          KISHIB may update this Cookies Policy as the platform develops, new
          features are added, or technical and legal requirements change. The
          updated version will be posted on this page with a new “Last updated”
          date.
        </p>

        <h2 className="mt-8 font-serif text-xl font-semibold text-[#234236]">
          9. Contact
        </h2>

        <p className="mt-3 text-sm leading-8 text-[#4F4437]">
          If you have questions about this Cookies Policy, please contact KISHIB
          through the support or contact method provided inside the app or on the
          official KISHIB website.
        </p>
      </section>
    </main>
  );
}