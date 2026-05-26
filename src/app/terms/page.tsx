export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#070812] px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-2xl sm:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/40">
          Antiques Lens
        </p>

        <h1 className="text-3xl font-semibold">Terms and Conditions</h1>

        <p className="mt-5 text-sm leading-8 text-white/65">
          By using Antiques Lens, visitors agree to use the platform for
          informational and indicative evaluation purposes only.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Indicative evaluation only</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          The platform provides AI-assisted preliminary observations about
          antiques, collectibles, artworks, and related items. Results are not
          professional certificates, legal appraisals, authentication documents,
          or final market valuations.
        </p>

        <h2 className="mt-8 text-lg font-semibold">User responsibility</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Visitors are responsible for the accuracy of the information and images
          they provide. Any buying, selling, insurance, restoration, or legal
          decision should be reviewed with a qualified human expert.
        </p>

        <h2 className="mt-8 text-lg font-semibold">No guarantee</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Antiques Lens does not guarantee authenticity, age, origin, condition,
          or exact value. AI results may be incomplete, uncertain, or incorrect.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Changes</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          These terms may be updated as the platform develops or new features are
          introduced.
        </p>
      </section>
    </main>
  );
}