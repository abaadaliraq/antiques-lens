export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#070812] px-5 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-2xl sm:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/40">
          Antiques Lens
        </p>

        <h1 className="text-3xl font-semibold">Privacy Policy</h1>

        <p className="mt-5 text-sm leading-8 text-white/65">
          Antiques Lens respects visitor privacy. This policy explains, in
          general terms, how information may be handled when using the platform.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Information provided by visitors</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Visitors may provide images, descriptions, and details about antique
          items for the purpose of receiving an AI-assisted preliminary
          evaluation.
        </p>

        <h2 className="mt-8 text-lg font-semibold">How information may be used</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Information may be used to generate evaluation results, improve the
          user experience, maintain platform functionality, and support future
          account or history features.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Storage</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          During early development, some evaluation history may be stored locally
          in the visitor’s browser. Future versions may use secure database and
          storage services for user accounts, images, and reports.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Important note</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          Visitors should avoid uploading sensitive personal documents or images
          that are not necessary for evaluating the item.
        </p>

        <h2 className="mt-8 text-lg font-semibold">Updates</h2>

        <p className="mt-3 text-sm leading-8 text-white/65">
          This policy may be updated as the platform grows and more features are
          added.
        </p>
      </section>
    </main>
  );
}