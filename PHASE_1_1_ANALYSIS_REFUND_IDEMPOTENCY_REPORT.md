# تقرير مرحلة 1.1: Refund وIdempotency لتحليل KISHIB

تاريخ التنفيذ: 2026-07-06  
النطاق: دورة محاولة التحليل فقط. لم يُنفذ SQL، ولم يُعدل Production، ولم تُضف بوابة دفع أو Webhook، ولم تتغير الأسعار أو واجهات الاشتراك.

## القرار التنفيذي

تم تصميم دورة كاملة للحجز والنجاح والفشل والاسترجاع مع نتيجة مخزنة مرتبطة بنفس `request_id`. الكود وSQL المقترحان يمنعان الخصم والاسترجاع المكرر وتشغيل AI مرة ثانية لنفس المفتاح بعد نجاح محفوظ.

**المرحلة جاهزة لاختبار Staging بعد تطبيق SQL المقترح هناك فقط، وليست جاهزة لـProduction قبل اختبارات PostgreSQL الحية.**

## الملفات المعدلة أو المنشأة

- `src/app/api/analyze/route.ts`
  - يحجز قبل AI.
  - يعيد نتيجة cached عند replay ناجح.
  - يتحقق من صلاحية النتيجة.
  - يحفظ التقييم قبل تثبيت النجاح.
  - يمرر كل فشل إلى refund.
- `src/lib/analysisAccessServer.ts`
  - lifecycle server-only.
  - حفظ التقييم عبر service role.
  - complete/fail/refund RPCs.
- `src/components/antique-ai/useAntiqueLens.ts`
  - request ID ثابت للمحاولة.
  - يستخدم evaluation ID القادم من السيرفر.
  - أوقف الحفظ المكرر من العميل.
- `scripts/phase1-1-refund-idempotency.test.mjs`
- `supabase/proposals/202607060003_phase_1_1_analysis_refund_idempotency.sql`
- `supabase/proposals/202607060003_phase_1_1_analysis_refund_idempotency_rollback.sql`
- تحديث `supabase/proposals/PHASE_1_SCHEMA_INSPECTION.sql`.
- هذا التقرير: `PHASE_1_1_ANALYSIS_REFUND_IDEMPOTENCY_REPORT.md`.

## SQL المقترح

لم يُنفذ. يعتمد على تطبيق SQL المرحلة الأولى المراجع قبله.

يوسع `analysis_access_reservations` بحقول:

- status: reserved / processing / succeeded / failed / refunded
- failure_reason
- evaluation_id
- result_payload
- lease_expires_at
- started_at / completed_at / refunded_at / updated_at

ويضيف:

- `complete_analysis_request(...)`
- `fail_analysis_request(...)`
- نسخة lifecycle-aware من `authorize_analysis_request(...)`

الملف يتوقف إذا وجد حجوزات مرحلة أولى موجودة، لأنها تحتاج reconciliation يدوياً ولا يجوز تخمين حالتها.

## دورة الرصيد

1. السيرفر يوثق المستخدم.
2. الدالة تقفل صف usage بـ`FOR UPDATE`.
3. تخصم رصيداً واحداً قبل AI للحساب المجاني.
4. تسجل processing مع lease لمدة 15 دقيقة.
5. بعد نتيجة صالحة، يحفظ السيرفر evaluation بمعرف يساوي request ID.
6. بعد نجاح الحفظ فقط، complete تحول الحالة إلى succeeded وتخزن cached result.
7. عند أي فشل قبل الحفظ، fail تعيد الرصيد مرة واحدة وتحول الحالة إلى refunded.
8. اشتراك/lifetime لا يستهلك رصيداً؛ فشله يسجل failed بلا refund عددي.

## منع refund المكرر

`fail_analysis_request` تقفل صف المستخدم وصف المحاولة. الاسترجاع مسموح فقط عندما تكون الحالة reserved/processing و`consumed_credit=true`. بعد أول استرجاع تصبح refunded؛ أي استدعاء لاحق لا ينقص used_count مجدداً.

## منع تشغيل AI مرتين

- request ID هو المفتاح الأساسي.
- processing يعيد `ANALYSIS_IN_PROGRESS`.
- succeeded يعيد `cachedResult` و`evaluationId` بلا AI.
- failed/refunded يعيد محاولة مغلقة، ويلزم مفتاح جديد.
- نفس المفتاح لمستخدم آخر يعيد `REQUEST_CONFLICT`.

## فشل الحفظ والـcrash

- فشل AI أو timeout أو malformed response: refund.
- فشل حفظ evaluation: refund.
- نجاح insert ثم فشل finalize/crash: fail/cleanup يجد evaluation بنفس request ID، ويستعيد succeeded بدلاً من refund.
- crash بعد الحجز وقبل AI أو قبل الحفظ: lease منتهية تُعالج عند طلب المستخدم التالي ويعاد الرصيد مرة واحدة.
- crash بعد نجاح كامل وقبل وصول response للهاتف: إعادة نفس المفتاح تعيد cached result.
- cleanup كسول عند الطلب التالي للمستخدم؛ لا يوجد cron عالمي في هذا النطاق، لذلك قد يبقى الصف ظاهرياً processing حتى نشاط المستخدم التالي.

## مزودو AI

- فشل OpenAI الأساسي أو timeout: العملية تفشل وتُسترجع التجربة.
- Gemini وDeepSeek آراء ثانوية best-effort. إذا فشلا وبقيت نتيجة OpenAI الأساسية صالحة وكاملة، يمكن نجاح التقييم؛ لا يعد ذلك تقييماً فاشلاً.
- إذا أصبحت النتيجة النهائية ناقصة أو malformed، لا تحفظ ولا تثبت وتُسترجع التجربة.
- network failure من الهاتف بعد اكتمال السيرفر لا يعيد الرصيد، لأن النتيجة محفوظة ويمكن استرجاعها بنفس المفتاح.

## نتائج الاختبارات

- `npx tsc --noEmit`: ناجح.
- `npm run build`: ناجح.
- lint المحدد لملفات المرحلة: ناجح.
- 14 اختباراً: 14 ناجحة، 0 فاشلة.

اختبارات 1.1 تثبت رقمياً:

- النجاح يرفع used_count مرة ويبقيه.
- provider failure يرفع الرصيد عند الحجز ثم يعيده للقيمة السابقة.
- refund ثانٍ لا يغير الرصيد.
- timeout يعيد الرصيد.
- processing duplicate لا يشغل AI.
- succeeded duplicate يعيد cached result وعدد AI runs يبقى 1.
- failed/refunded duplicate لا يخصم ثانية.
- save failure يعيد الرصيد.
- النجاح المحفوظ لا يقبل refund متأخراً.
- malformed result يعيد الرصيد ولا يصبح succeeded.

هذه اختبارات state machine محلية تغير الرصيد الفعلي داخل مخزن الاختبار وتتحقق من قيمته قبل/بعد؛ ليست بديلاً عن اختبار PostgreSQL في Staging لأن SQL لم يُنفذ حسب التعليمات.

## خطة Staging الإلزامية

1. تطبيق `202607060002_phase_1_analysis_security_reviewed.sql` على Staging بعد inspection/backup.
2. التأكد أن reservations فارغ.
3. تطبيق `202607060003_phase_1_1_analysis_refund_idempotency.sql`.
4. اختبار نجاح طبيعي ومراقبة used_count + succeeded + evaluation_id.
5. إجبار OpenAI error وtimeout والتأكد أن used_count عاد فعلياً.
6. استدعاء fail مرتين والتأكد أن refund حدث مرة.
7. إرسال نفس المفتاح أثناء processing: AI run واحد.
8. إعادة نفس المفتاح بعد succeeded: نفس evaluation/result بلا AI.
9. إعادة نفس المفتاح بعد refunded: رفض بلا خصم.
10. محاكاة insert failure: refund.
11. محاكاة crash بعد insert وقبل complete: retry يستعيد success ولا يعيد الرصيد.
12. محاكاة lease منتهية بلا evaluation: الطلب التالي يعيد الرصيد.
13. التأكد أن النتائج القديمة ما زالت قابلة للقراءة.

## المخاطر المتبقية

- SQL غير مطبق أو مختبر على PostgreSQL فعلياً.
- cleanup للـprocessing المنتهي يحدث عند النشاط التالي للمستخدم، وليس عبر job عالمي.
- تخزين result_payload يكرر جزءاً من بيانات evaluation ويحتاج retention ومراقبة حجم.
- آراء Gemini/DeepSeek الثانوية قد تفشل مع نجاح النتيجة الأساسية؛ هذا قرار مقصود.
- الحفظ server-side يفترض أعمدة evaluations الحالية؛ preflight Staging إلزامي.
- full lint للمشروع يحتوي أخطاء قديمة خارج النطاق، بينما lint المحدد ناجح.

## القرار النهائي

**جاهز لـStaging بشكل مشروط بعد inspection وbackup وتطبيق SQL 002 ثم 003 واختبارات قاعدة حية.**  
**غير جاهز لـProduction حالياً.**

