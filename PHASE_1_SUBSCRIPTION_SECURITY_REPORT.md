# تقرير المرحلة الأمنية الأولى للاشتراكات

تاريخ التنفيذ: 2026-07-06  
النطاق: حماية إنشاء تقييم جديد وحدود التجارب فقط. لم تُغيّر الأسعار، ولم تُنشأ بوابة دفع أو Webhook، ولم يُنفذ SQL على Supabase، ولم يتم نشر أي شيء.

## النتيجة التنفيذية

تم نقل قرار السماح بالتقييم وخصم التجربة من الواجهة إلى السيرفر. `/api/analyze` أصبح يرفض الطلب قبل تشغيل OpenAI ما لم:

1. يحمل الطلب access token صالحاً؛
2. يثبت Supabase Auth المستخدم من الرمز؛
3. تسمح دالة ذرية مقترحة في Supabase بالطلب بسبب lifetime أو اشتراك نشط غير منتهٍ أو رصيد مجاني؛
4. يتم حجز الرصيد المجاني داخل transaction مع قفل صف وidempotency key.

أي `user_id` أو `subscription_status` أو `is_lifetime_free` يرسله العميل لا يُستخدم. مفتاح service role موجود في ملف server-only ولا يحمل بادئة `NEXT_PUBLIC_`.

**الحالة الإنتاجية: غير جاهز للإنتاج بعد.** الكود جاهز للمراجعة ويعمل بأسلوب fail-closed، لكن SQL المقترح لم يُطبق عمداً. قبل تطبيقه ستعود الطلبات المصادق عليها بـ`503 ACCESS_SERVICE_UNAVAILABLE`. يصبح المسار مرشحاً للإنتاج فقط بعد مراجعة SQL، أخذ backup فعلي لقاعدة البيانات، تطبيقه في staging، وتشغيل اختبارات التكامل الحية أدناه.

## الملفات المعدلة

- `src/app/api/analyze/route.ts`
  - استدعاء بوابة الصلاحية قبل فحص OpenAI key وقبل قراءة FormData أو تشغيل التحليل.
  - استجابات منظمة: `AUTH_REQUIRED`, `INVALID_SESSION`, `TRIAL_LIMIT_REACHED`, `ACCESS_SERVICE_UNAVAILABLE`.
  - رؤوس استجابة آمنة تبين سبب السماح والرصيد المتبقي.
- `src/lib/analysisAccessServer.ts` (جديد)
  - قراءة Bearer token والتحقق منه عبر `admin.auth.getUser(token)`.
  - اشتقاق `userId` من Supabase Auth حصراً.
  - استدعاء RPC الحساسة عبر service role من السيرفر فقط.
- `src/components/antique-ai/useAntiqueLens.ts`
  - إرسال access token وUUID idempotency مع طلب التحليل.
  - فتح شاشة الاشتراك عند `TRIAL_LIMIT_REACHED`.
  - إزالة خصم الرصيد من العميل، ثم تحديث حالة العرض بعد نجاح السيرفر.
  - كان الملف معدلاً محلياً قبل هذه المرحلة؛ تم الحفاظ على تعديلاته السابقة.
- `src/lib/usageLimitsSupabase.ts`
  - حذف export الذي كان يسمح للواجهة باستدعاء RPC الخصم.
  - إضافة قراءة access token فقط لإرساله للسيرفر.
- `scripts/phase1-security.test.mjs` (جديد)
  - اختبارات نموذج القرار والتزامن وidempotency والتزوير.
- `supabase/proposals/202607060001_phase_1_analysis_security.sql` (جديد، مقترح فقط)
- `supabase/proposals/backups/202607060001_phase_1_analysis_security.backup.sql` (نسخة احتياطية مطابقة)

## SQL المقترح

لم يُنفذ SQL. الملف موجود تحت `supabase/proposals` وليس `supabase/migrations` لمنع تطبيقه عرضياً مع migrations.

الجداول المتأثرة عند الموافقة المستقبلية:

- `public.user_usage_limits`
  - حذف سياسة INSERT المباشر للمستخدم.
  - سحب INSERT/UPDATE/DELETE/TRUNCATE من `anon` و`authenticated`.
  - إبقاء SELECT للمستخدم المصادق، مع RLS القراءة الذاتية الموجودة.
  - سحب EXECUTE على `increment_analysis_usage()` من العميل.
- `public.analysis_access_reservations` (جديد)
  - سجل server-only لمفاتيح idempotency وقرار الطلب وهل خُصم رصيد.
  - RLS مفعل ولا توجد سياسة وصول للعميل.
  - service role فقط يستطيع الإدارة.

الدالة الجديدة المقترحة:

- `public.authorize_analysis_request(target_user_id uuid, target_request_id uuid)`
  - EXECUTE لـservice_role فقط.
  - تقفل صف `user_usage_limits FOR UPDATE`.
  - تمنح lifetime أولاً، ثم الاشتراك الفعال غير المنتهي، ثم تخصم رصيداً واحداً، وإلا تعيد `TRIAL_LIMIT_REACHED`.
  - تمنع الخصم المكرر عبر primary key على `request_id`.
  - تمنع إعادة استخدام request id لمستخدم مختلف عبر `REQUEST_CONFLICT`.

تطابق النسخة الاحتياطية: SHA-256 للملفين متطابق:

`4AE1DD29E5294137DE69806841172E1EA5AF41259CD2D156260958C1A7C933BE`

## اختبارات النجاح والفشل

### اختبارات منفذة وناجحة

| السيناريو | النتيجة |
|---|---|
| مستخدم لديه رصيد | PASS نموذجياً: `TRIAL_CREDIT_RESERVED` وخصم واحد |
| مستخدم انتهى رصيده | PASS نموذجياً: `TRIAL_LIMIT_REACHED` |
| مستخدم lifetime | PASS نموذجياً: `LIFETIME_ACCESS` دون خصم |
| اشتراك فعال وغير منتهٍ | PASS نموذجياً: `SUBSCRIPTION_ACTIVE` دون خصم |
| طلبان متزامنان على آخر رصيد | PASS نموذجياً: واحد مسموح والآخر مرفوض |
| إعادة نفس request id | PASS نموذجياً: نفس القرار دون خصم ثانٍ |
| تزوير user_id/status/lifetime من body | PASS نموذجياً: القيم مهملة والهوية المعتمدة هي auth user |
| طلب فعلي محلي بلا Authorization | PASS: HTTP 401 و`AUTH_REQUIRED` |
| طلب فعلي محلي برمز مزور | PASS: HTTP 401 و`INVALID_SESSION` |

أمر الاختبار: `node --test scripts/phase1-security.test.mjs`  
النتيجة: 6 اختبارات، 6 ناجحة، 0 فاشلة.

### اختبارات البناء

- `npx tsc --noEmit`: ناجح.
- `npm run build`: ناجح، وRoute `/api/analyze` مبني ديناميكياً.
- `npm run lint`: فشل بسبب 13 خطأ سابق خارج نطاق المرحلة في ملفات مثل `AuthScreen.tsx`, `CompleteProfileModal.tsx`, `NotificationsButton.tsx`, `ProfileCompletionGate.tsx`, و`archiveStore.ts`. لم يظهر خطأ lint جديد عند أسطر الحماية المضافة.

### اختبارات لم تُنفذ عمداً

اختبارات Supabase التكاملية الحية للمستخدم ذي الرصيد، المنتهي، lifetime، الاشتراك الفعال، والتزامن لم تُنفذ لأن ذلك يتطلب تطبيق SQL المقترح، وقد طلب المستخدم صراحة عدم تنفيذ SQL على الإنتاج. الاختبارات الحالية نموذجية وتثبت منطق القرار، لكنها لا تستبدل اختبار PostgreSQL/RLS الحقيقي في staging.

## الوصول إلى النتائج القديمة

لم يُعدل أي استعلام قراءة للتقييمات أو الأرشيف أو التقارير. الحماية الجديدة موجودة فقط في `POST /api/analyze` لإنشاء تحليل جديد؛ لذلك انتهاء الرصيد لا يمنع فتح النتائج القديمة.

## مقاومة محاولات التجاوز

- تحديث الصفحة أو تغيير الجهاز لا يعيد الرصيد لأن المصدر هو Supabase حسب user id.
- العميل لا يحدد user id؛ السيرفر يستخرجه من access token بعد `getUser`.
- status/plan/lifetime الواردة من العميل غير مقروءة.
- الطلبات المتزامنة تتسلسل على `FOR UPDATE`، فلا يستهلك رصيدان نفس الرصيد الأخير.
- تكرار الطلب بنفس UUID يعيد القرار المسجل ولا يخصم مجدداً.
- غياب service role أو RPC أو فشل التحقق يعيد 503 ولا يشغل التحليل.
- غياب الجلسة أو انتهاؤها يعيد 401 قبل قراءة الصور أو استدعاء مزودي AI.

## المخاطر المتبقية

1. SQL غير مطبق؛ النظام سيغلق التقييمات المصادق عليها حتى تطبيقه.
2. يجب تدقيق SQL وتشغيله أولاً في staging مع backup حقيقي واختبارات RLS من anon/authenticated/service_role.
3. الرصيد يُحجز قبل التحليل. إذا فشل OpenAI بعد الحجز يبقى الرصيد مخصوماً حالياً؛ يلزم قرار منتج واضح أو آلية تسوية/إرجاع آمنة في مرحلة لاحقة.
4. `can_user_analyze()` القديم يبقى للقراءة وعرض UI. يجب التحقق في البيئة المنشورة أن صلاحياته لا تسمح بكتابة غير القيم الافتراضية.
5. رفع الصور وبعض طلبات التحضير يحدث في الواجهة قبل استدعاء `/api/analyze`؛ حماية موارد تلك endpoints تتطلب مرحلة أمنية منفصلة، ولم تُوسع هذه المرحلة إليها.
6. سجل idempotency يحتاج سياسة retention دورية مدروسة، دون التأثير على عداد المستخدم أو سجلات التقييم.
7. أخطاء lint السابقة ما زالت تمنع اعتبار المستودع كله نظيفاً، رغم نجاح TypeScript والبناء.

## خطوات التفعيل الآمن المقترحة

1. أخذ backup فعلي من Supabase production.
2. مراجعة SQL ومقارنته بالschema المنشور، لا بملفات migration فقط.
3. تطبيق المقترح في staging.
4. تشغيل اختبارات حية بهويات مستقلة: رصيد، منتهي، lifetime، اشتراك فعال، من دون جلسة.
5. تشغيل 10-50 طلباً متزامناً على آخر رصيد والتأكد من خصم واحد فقط.
6. محاولة INSERT/UPDATE مباشرة عبر anon/authenticated لكل حقول الاستحقاق والتأكد من رفضها.
7. التحقق من أن service role غير موجود في client chunks.
8. بعد نجاح ذلك فقط، تطبيق SQL في production ضمن نافذة مراقبة ثم اختبار smoke محدود.

## القرار النهائي

**حماية الكود: مكتملة ضمن نطاق المرحلة وتفشل بأمان.**  
**الجاهزية للإنتاج: لا، حتى مراجعة وتطبيق SQL واختباره تكاملياً في staging ثم production.**
