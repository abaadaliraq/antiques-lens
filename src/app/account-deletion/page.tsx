export default function AccountDeletionPage() {
  return (
    <main className="min-h-dvh bg-[#F4EBDD] px-5 py-10 text-[#234236]">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-[#D8C7AA] bg-[#FFF8EC]/85 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#9A7A3D]">
          KISHIB
        </p>

        <h1 className="font-serif text-3xl font-semibold text-[#234236]">
          Account Deletion Request
        </h1>

        <div className="mt-6 space-y-4 text-sm leading-8 text-[#4F4437]">
          <p>
            KISHIB users can delete their account from inside the app by
            opening the user menu and selecting &quot;Delete account&quot;.
          </p>

          <p>
            If you can no longer access your account, you can request account
            deletion by contacting us at:{" "}
            <a
              href="mailto:kishib.app@gmail.com"
              className="font-semibold text-[#8A5A24] underline-offset-4 hover:underline"
            >
              kishib.app@gmail.com
            </a>
          </p>

          <p>
            Please include the email address used to create your KISHIB account.
          </p>

          <p>
            After receiving your request, we will delete your account and
            associated data including profile information, uploaded images,
            evaluation history, and user notes, unless retention is required for
            legal, security, or fraud-prevention reasons.
          </p>

          <p>Deletion requests are processed within 30 days.</p>
        </div>

        <div className="mt-8 border-t border-[#D8C7AA] pt-8" dir="rtl">
          <h2 className="font-serif text-2xl font-semibold text-[#234236]">
            طلب حذف الحساب
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-8 text-[#4F4437]">
            <p>
              يمكن لمستخدمي KISHIB حذف الحساب من داخل التطبيق عبر قائمة
              المستخدم ثم اختيار &quot;حذف الحساب&quot;.
            </p>

            <p>
              إذا لم تتمكن من الدخول إلى حسابك، يمكنك طلب حذف الحساب عبر
              البريد:{" "}
              <a
                href="mailto:kishib.app@gmail.com"
                className="font-semibold text-[#8A5A24] underline-offset-4 hover:underline"
              >
                kishib.app@gmail.com
              </a>
            </p>

            <p>يرجى ذكر البريد الإلكتروني المستخدم في إنشاء الحساب.</p>

            <p>
              سيتم حذف الحساب والبيانات المرتبطة به، بما في ذلك بيانات الملف
              الشخصي والصور المرفوعة وسجل التقييمات والملاحظات، ما لم يكن
              الاحتفاظ ببعض البيانات مطلوبًا لأسباب قانونية أو أمنية أو لمنع
              الاحتيال.
            </p>

            <p>تتم معالجة طلبات الحذف خلال 30 يومًا.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
