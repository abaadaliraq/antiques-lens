# تقرير مراجعة SQL للمرحلة الأمنية الأولى

تاريخ المراجعة: 2026-07-06  
النطاق: مراجعة وتجهيز Staging فقط. لم يُنفذ أي SQL، ولم يُعدل Production، ولم يتم نشر أو رفع أي تغيير.

## القرار المختصر

- **SQL الأصلي `202607060001...`: يحتاج تعديل قبل التشغيل.**
- **SQL المراجع `202607060002...`: آمن للتطبيق المشروط على Staging فقط** بعد تشغيل استعلام الفحص، مطابقة النتائج، وأخذ backup حقيقي.
- **غير مصرح به للإنتاج.**
- سبب عدم اعتماد الملف الأصلي مباشرة: كان يفتقر إلى preflight للسكيمة الفعلية، والتحقق من جدول موجود مسبقاً، وpostconditions، وrollback واضح، كما أن REVOKE على دالة مفقودة كان سيوقف الملف.
- يوجد خطر منتج متبقٍ: الرصيد المجاني يُخصم قبل AI ولا يُعاد تلقائياً عند فشل المزود. لذلك النسخة المراجعة مناسبة لاختبارات الأمان في Staging، وليست موافقة Production.

## الملفات الناتجة

- `supabase/proposals/PHASE_1_SCHEMA_INSPECTION.sql`
  - read-only بالكامل.
  - يجلب الجداول، الأعمدة، القيود، الفهارس، RLS، policies، grants، functions، triggers وإجماليات غير شخصية.
- `supabase/proposals/202607060002_phase_1_analysis_security_reviewed.sql`
  - النسخة المراجعة للتطبيق المشروط على Staging.
- `supabase/proposals/202607060002_phase_1_analysis_security_rollback.sql`
  - rollback غير متلف وfail-closed.
- `PHASE_1_SQL_REVIEW_REPORT.md`
  - هذا التقرير.

## مقارنة السكيمة الموجودة في المشروع

المصدران النشطان ذوا الصلة:

1. `supabase/migrations/202606180001_user_usage_limits.sql`
2. `supabase/migrations/202606180002_lifetime_free_usage_access.sql`

السكيمة المتوقعة من الملفات:

| الحقل | النوع المتوقع | ملاحظة |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | unique وFK إلى auth.users |
| free_limit | integer | default 5، لا يقل عن صفر |
| used_count | integer | default 0، لا يقل عن صفر |
| subscription_status | text | default inactive |
| subscription_plan | text nullable | لا تعدله المرحلة |
| subscription_started_at | timestamptz nullable | لا تعدله المرحلة |
| subscription_ends_at | timestamptz nullable | يستخدم للتحقق من الانتهاء |
| created_at / updated_at | timestamptz | لا تصفرها المرحلة |
| access_type | text | free_trial/paid_monthly/paid_yearly/lifetime_free/admin |
| is_lifetime_free | boolean | يحفظ lifetime الحالي |
| lifetime_reason | text nullable | لا تعدله المرحلة |

ملفات المشروع لا تثبت أن Staging المنشور مطابق 100% للمigrations. لذلك لا تخمن النسخة المراجعة: تنفذ preflight وتفشل داخل transaction إذا كان جدول أو حقل أو نوع أو unique/FK أساسياً غير مطابق.

## الاختلافات بين SQL الأصلي والمراجع

| الجانب | الأصلي | المراجع |
|---|---|---|
| فحص وجود user_usage_limits | غير موجود | موجود، ويوقف التنفيذ قبل التغيير |
| فحص أنواع الأعمدة | غير موجود | فحص صريح للأنواع المطلوبة |
| فحص unique وFK لـuser_id | غير موجود | موجود |
| الدالة القديمة قد تكون مفقودة | REVOKE مباشر قد يفشل | `to_regprocedure` وREVOKE شرطي |
| جدول reservations موجود مسبقاً | IF NOT EXISTS فقط وقد يخفي تعارضاً | فحص أعمدة/not-null/PK أو unique/FK |
| Policies غير متوقعة على الجدول الداخلي | لا تزال محتملة | إزالة كل policies من الجدول الداخلي |
| Postconditions | غير موجودة | تحقق من منع client write ومن صلاحيات RPC |
| التشغيل المتزامن للملف | بلا قفل | advisory transaction lock |
| التعليقات والتحذيرات | محدودة | أقسام واضحة ومتطلبات توقف |
| rollback | غير موجود | ملف مستقل غير متلف وfail-closed |
| إعادة التشغيل | غالباً ممكنة | مصممة لتكون idempotent وتفشل عند التعارض بدل تخمينه |

## مراجعة سلامة البيانات

النسخة المراجعة عند تطبيقها:

- لا تحتوي `DROP TABLE`.
- لا تحتوي `DELETE FROM` أو `TRUNCATE TABLE`.
- لا تنفذ `UPDATE` جماعياً على مستخدمين حاليين.
- لا تصفر `used_count` أو `free_limit`.
- لا تغير lifetime flags أو `access_type`.
- لا تغير status/plan/start/end لأي اشتراك قائم.
- لا تلمس `evaluations` أو الصور أو التقارير.
- إنشاء صف usage افتراضي يحدث فقط وقت أول طلب لمستخدم لا يملك صفاً، وبـ`ON CONFLICT DO NOTHING`؛ الصف الحالي لا يُستبدل.
- جدول `analysis_access_reservations` جديد ومستقل، وFK الحذف المتسلسل يعمل فقط عند حذف auth user نفسه، وليس أثناء تطبيق المرحلة.

**الخطر على بيانات المستخدمين الحاليين عند مجرد تطبيق SQL: منخفض، بشرط نجاح preflight ومطابقة Staging.** الخطر التشغيلي الأكبر هو احتساب محاولة AI فاشلة، لا تلف البيانات القائمة.

## نتيجة مراجعة RLS والصلاحيات

### user_usage_limits

- تبقى RLS مفعلة.
- تبقى قراءة المستخدم لصفه معتمدة على policy الحالية `Users can read own usage limits`.
- تُحذف policy الإدخال المباشر الضعيفة.
- تُسحب INSERT/UPDATE/DELETE/TRUNCATE من anon وauthenticated.
- يُسحب EXECUTE للدالة القديمة `increment_analysis_usage()` من client roles.
- لا يتم منح العميل أي طريق لتعديل الرصيد أو الاشتراك أو lifetime.

### analysis_access_reservations

- RLS مفعلة.
- جميع policies الموجودة على هذا الجدول الداخلي تُحذف.
- public/anon/authenticated بلا صلاحيات.
- service_role فقط يملك DML.
- الدالة الجديدة EXECUTE لـservice_role فقط.
- service role لا يظهر في SQL كقيمة؛ SQL يذكر اسم الدور فقط، ولا يحتوي المفتاح السري.

**النتيجة: تصميم RLS المراجع صحيح للمرحلة، لكن يجب إثبات grants/policies الفعلية في Staging باستعلام الفحص وبعد التطبيق.**

## نتيجة مراجعة atomic decrement

التسلسل داخل دالة واحدة ومعاملة PostgreSQL:

1. حجز `request_id` الفريد.
2. إنشاء صف usage افتراضي فقط عند غيابه.
3. `SELECT ... FOR UPDATE` على صف المستخدم.
4. lifetime أولاً.
5. اشتراك active مع `subscription_ends_at > now()` ثانياً.
6. إن لم يوجد استحقاق، فحص `used_count < free_limit`.
7. زيادة `used_count = used_count + 1` داخل القفل.
8. تسجيل القرار والرصيد المتبقي.

طلبان مختلفان للمستخدم نفسه يتسلسلان على قفل الصف؛ لا يمكنهما استهلاك الرصيد الأخير معاً.

**النتيجة: الخصم ذري وآمن ضد race condition.**

## نتيجة مراجعة idempotency

- `request_id uuid` هو primary key.
- إعادة نفس UUID لا تخصم رصيداً ثانياً.
- استخدام نفس UUID لمستخدم مختلف يعيد `REQUEST_CONFLICT`.
- إدخال placeholder والحسم النهائي داخل transaction واحدة؛ الفشل يلغي الاثنين.

قيد مهم: الدالة تعيد القرار المسموح عند replay. هذا يمنع **الخصم المكرر** لكنه لا يمنع التطبيق من إعادة تشغيل AI إذا أعاد العميل نفس الطلب بعد ضياع الاستجابة. لا يوجد حالياً result cache مرتبط بالـrequest ID.

**النتيجة: idempotency مالية/رصيدية جيدة، لكن idempotency الكاملة لتشغيل AI جزئية.**

## الخصم وفشل مزود الذكاء الاصطناعي

- الخصم يحدث **قبل التحليل**، بعد توثيق الجلسة وقبول الطلب ذرياً.
- إذا فشل OpenAI/Gemini/DeepSeek بعد الخصم، يبقى `used_count` مرتفعاً.
- لا توجد دالة finalize أو refund متصلة بمسار التطبيق.
- لا يعاد الرصيد تلقائياً.
- لا توجد حماية حالية تمنع احتساب تقييم فشل بعد الحجز.

سبب عدم نقل الخصم لما بعد النجاح هو أن ذلك يعيد race condition ما لم يُبن نظام reservation/finalize/release كامل. هذا غير منفذ في هذه المراجعة حتى لا يتوسع النطاق إلى تعديل دورة التطبيق.

**القرار:** صالح لاختبارات Staging الأمنية، لكنه خطر معروف يجب حله قبل Production أو اعتماده صراحة كسياسة احتساب.

## خطة اختبار Staging

### إعداد بيانات اختبار معزولة

استخدم حسابات Staging فقط، ولا تستخدم مستخدمي Production:

1. مستخدم جديد بلا صف usage: يتوقع إنشاء صف 5/0 ثم أول طلب يصبح used=1.
2. مستخدم used=2/free=5: طلب ناجح يصبح used=3.
3. مستخدم used=5/free=5: HTTP 402 و`TRIAL_LIMIT_REACHED` بلا AI.
4. lifetime عبر `is_lifetime_free=true`: مسموح دون تغيير used_count.
5. lifetime عبر `access_type='lifetime_free'` أو admin: مسموح دون خصم.
6. اشتراك active ونهايته مستقبلية: مسموح دون خصم.
7. اشتراك active ونهايته ماضية: يعامل كمنتهٍ ويستخدم رصيداً أو يرفض.
8. بلا Authorization: 401 `AUTH_REQUIRED`.
9. token غير صالح/منتهي: 401 `INVALID_SESSION`.
10. طلبان متزامنان على used=4/free=5: واحد يحجز، والآخر 402.
11. نفس request ID مرتين: used_count يزيد مرة واحدة.
12. نفس request ID لمستخدمين مختلفين: الثاني `REQUEST_CONFLICT`.
13. INSERT/UPDATE مباشر عبر client على status/start/end/lifetime/free/used: مرفوض.
14. استدعاء `increment_analysis_usage()` عبر authenticated: مرفوض.
15. استدعاء `authorize_analysis_request` عبر authenticated: مرفوض.
16. فتح تقييمات وتقارير قديمة بعد used=free: يظل ناجحاً ولا يزيد used_count.
17. إجبار مزود AI على الفشل: توثيق أن الرصيد يبقى مخصوماً؛ لا تدّعِ وجود refund.
18. إعادة تشغيل ملف apply مرة ثانية: ينجح بلا صفوف/قيود مكررة.

## ترتيب التشغيل الواضح في Supabase

### الخطوة 1 — تأكيد البيئة

افتح SQL Editor في **مشروع Staging فقط**. تحقق يدوياً من Project Reference واسم المشروع.

ثم شغّل:

`supabase/proposals/PHASE_1_SCHEMA_INSPECTION.sql`

المتوقع:

- ظهور `public.user_usage_limits`.
- الأعمدة والأنواع المذكورة في جدول المقارنة.
- user_id فريد وFK إلى auth.users.
- RLS مفعلة.
- ظهور policy القراءة الذاتية.
- قد تظهر policy الإدخال القديمة؛ هذا متوقع قبل الإصلاح.
- ظهور دوال can/increment/grant lifetime وفق migrations.
- aggregate بلا قيم سالبة.

### متى تتوقف فوراً

لا تشغل ملف apply إذا:

- كنت غير متأكد أن المشروع Staging.
- جدول أو حقل مطلوب مفقود أو نوعه مختلف.
- user_id ليس uuid أو ليس unique أو لا يشير إلى auth.users.
- توجد قيم سالبة.
- توجد دوال/سياسات مختلفة جوهرياً عن التقرير.
- جدول reservations موجود من مصدر آخر أو سكيمته مختلفة.
- لا توجد نسخة backup/snapshot حديثة من Staging.
- نتائج الفحص لم تُحفظ للمقارنة.

### الخطوة 2 — Backup

خذ backup/snapshot حقيقياً لـStaging من أدوات Supabase المتاحة لحسابك. ملف rollback ليس بديلاً عن backup.

### الخطوة 3 — التطبيق المشروط على Staging

بعد مطابقة كل الشروط، شغّل **الملف كاملاً كوحدة واحدة**:

`supabase/proposals/202607060002_phase_1_analysis_security_reviewed.sql`

لا تشغّل أجزاء منفصلة. المتوقع نجاح transaction. إذا ظهر `PRECHECK FAILED` أو `POSTCHECK FAILED` فتوقف؛ المعاملة يفترض أن تُلغى بالكامل. لا تحاول تعديل السكيمة يدوياً لتجاوز الفحص.

### الخطوة 4 — الفحص بعد التطبيق

أعد تشغيل `PHASE_1_SCHEMA_INSPECTION.sql`.

المتوقع:

- جدول reservations بالحقول والقيود المطلوبة.
- RLS مفعلة ولا policies للعميل عليه.
- authenticated بلا write grants على usage/reservations.
- الدالة الجديدة security definer، search_path محدد، وACL لا يمنح authenticated.
- الدالة القديمة غير قابلة للتنفيذ من authenticated.
- أعداد lifetime/active وused_count الحالية لم تتغير بمجرد التطبيق.

قارن aggregate قبل/بعد. يجب أن تكون قيم usage نفسها مطابقة قبل بدء الاختبارات.

### الخطوة 5 — اختبارات التطبيق

شغّل سيناريوهات Staging السابقة. راقب `used_count` وreservations بعد كل حالة. لا تنتقل إلى Production بناءً على هذه المراجعة.

## خطوات rollback

إذا حدث خلل في Staging:

1. أوقف إرسال تقييمات جديدة إلى Staging إن أمكن.
2. احفظ logs ونتائج inspection.
3. شغّل الملف كاملاً:
   `supabase/proposals/202607060002_phase_1_analysis_security_rollback.sql`
4. أعد تشغيل inspection.
5. توقع:
   - اختفاء الدالة الجديدة.
   - بقاء جدول reservations وبياناته للتحقيق.
   - بقاء أرصدة المستخدمين وlifetime والاشتراكات والتقييمات كما هي.
   - استمرار منع client writes والدالة القديمة.
   - عودة API إلى fail-closed 503، وليس إلى السلوك القديم غير الآمن.

الـrollback لا يعيد المسار القديم عمداً لأنه يعيد الثغرة. استعادة backup الكامل قرار منفصل ولا يجب تنفيذه إلا عند تلف غير متوقع وبعد مراجعة بشرية.

## القرار النهائي

**هل يمكن تطبيق النسخة الأصلية على Staging؟ لا. تحتاج تعديل.**

**هل يمكن تطبيق النسخة المراجعة على Staging؟ نعم، بشكل مشروط فقط بعد:**

1. تشغيل inspection على Staging.
2. تطابق السكيمة والقيود والسياسات.
3. أخذ backup حقيقي.
4. قبول أن فشل AI سيستهلك الرصيد خلال هذه المرحلة.
5. الاستعداد للـrollback fail-closed.
6. تنفيذ خطة الاختبار كاملة.

**هل يمكن تطبيقها على Production الآن؟ لا.** يلزم أولاً نجاح Staging، وحسم/تنفيذ سياسة إعادة الرصيد عند فشل التحليل، ومراجعة idempotency الكاملة لتشغيل AI.

