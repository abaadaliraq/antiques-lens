# KISHIB Phase 1 — خطة تنفيذ Staging الدقيقة

هذه خطة تشغيل بشرية فقط. لا تنفذ أي SQL على Production، ولا تشغّل 002 و003 بالتوازي، ولا تنشر التطبيق قبل نجاح فحوص قاعدة Staging.

## قرار التوافق

SQL 002 و003 متوافقان عند تشغيلهما بهذا الترتيب حصراً:

1. inspection
2. backup
3. SQL 002
4. postcheck مرحلي
5. التأكد أن جدول reservations فارغ
6. SQL 003
7. inspection + postcheck نهائي
8. اختبارات Staging

Dependencies:

- 003 يحتاج جداول `user_usage_limits`, `evaluations`, و`analysis_access_reservations`.
- 003 يحتاج دالة `authorize_analysis_request(uuid,uuid)` المنشأة بواسطة 002.
- 003 يستبدل دالة authorize ولا ينشئ overload متضارباً.
- 003 يضيف complete/fail ودورة الحالات ولا يضيف trigger.
- أسماء القيود والفهارس مختلفة وغير متعارضة.
- 002 قابل لإعادة التشغيل.
- 003 قابل لإعادة التشغيل فقط قبل وجود attempts؛ بعد أول طلب، preflight يوقفه عمداً. لا تعاود تشغيله بعد الاختبارات.
- الملفان يستخدمان advisory locks مختلفين؛ لذلك لا تعتمد على القفل لمنع التشغيل المتوازي. التشغيل التسلسلي إلزامي. إذا بدأ 003 قبل commit لـ002 فسيفشل preflight ولا يفترض أن يسبب تغييراً.

## ما يجب حفظه قبل البدء

أنشئ مجلد أدلة خارج Git باسم زمني، واحفظ فيه:

- لقطة تبين Project Name وProject Ref وأنه Staging.
- export كامل لكل result grid من inspection.
- وقت التنفيذ واسم المشغل.
- backup ID/وقت snapshot.
- نص نجاح أو خطأ كل ملف SQL.
- export postcheck بعد 002 وبعد 003.
- request IDs وHTTP responses لكل اختبار.
- صف usage وصف attempt وصف evaluation للحسابات التجريبية فقط.

لا تنسخ access tokens أو service-role key أو secrets في الصور.

## نقاط التوقف الحرجة — 10

1. Project Ref لا يثبت أنه Staging.
2. لا يوجد backup حديث قابل للاستعادة.
3. user_usage_limits مفقود أو أنواعه/unique/FK تختلف.
4. evaluations.id/user_id/analysis_result ليست uuid/uuid/jsonb.
5. توجد أرصدة سالبة أو بيانات entitlement غير مفهومة.
6. SQL 002 يعرض PRECHECK/POSTCHECK FAILED.
7. بعد 002، reservations غير فارغ قبل 003.
8. grants أو RLS تسمح للعميل بالكتابة أو تنفيذ RPCs الحساسة.
9. SQL 003 يعرض أي خطأ أو يُنفذ جزئياً خارج transaction.
10. postcheck النهائي يعرض anomaly غير صفرية أو تغيراً غير مبرر في بيانات ما قبل الاختبارات.

عند أي نقطة: توقف، احفظ المخرجات، لا “تصلح” يدوياً، ولا تنتقل للخطوة التالية.

## الخطوة 0 — نافذة التغيير

- اختر Staging بلا مستخدمين نشطين.
- أوقف أي job أو تطبيق Staging قد يرسل /api/analyze.
- لا تنشر كود التطبيق بعد.
- سجل counts الأساسية من inspection.

## الخطوة 1 — Schema inspection

شغّل الملف كاملاً:

`supabase/proposals/PHASE_1_SCHEMA_INSPECTION.sql`

المتوقع:

- user_usage_limits وevaluations موجودان.
- reservations قد لا يكون موجوداً قبل 002.
- user_usage_limits مطابق للأنواع المنشورة في التقرير.
- user_id unique وFK إلى auth.users.
- RLS مفعلة على usage.
- policy القراءة الذاتية موجودة.
- قد توجد policy الإدخال القديمة قبل 002.
- can/increment/grant lifetime موجودة حسب migrations.
- القيم السالبة = 0.

صوّر/انسخ:

- environment identity.
- columns للجدولين.
- constraints + policies + grants + functions.
- aggregate usage/lifetime/subscriptions.

## الخطوة 2 — Backup

خذ snapshot/backup فعلياً من Staging.

سجل:

- backup ID.
- created_at.
- project ref.
- طريقة الاستعادة المجربة أو الموثقة.

توقف إن لم تستطع إثبات وجود backup.

## الخطوة 3 — تطبيق SQL 002

شغّل الملف كاملاً كوحدة واحدة:

`supabase/proposals/202607060002_phase_1_analysis_security_reviewed.sql`

المتوقع:

- transaction ناجحة.
- إنشاء reservations الأساسي والفهرس.
- إزالة client INSERT policy.
- سحب write grants والـlegacy increment من authenticated.
- authorize RPC لـservice_role فقط.
- لا تغير في used_count/lifetime/subscriptions.

إذا ظهر PRECHECK/POSTCHECK FAILED: توقف. transaction يجب أن rollback.

## الخطوة 4 — تحقق بعد 002 وقبل 003

شغّل inspection، ثم الأجزاء B–I وR من postcheck.

تحقق:

- reservations موجود وRLS مفعلة.
- request_id PK/unique وuser_id FK.
- authenticated بلا صلاحيات عليه.
- authorize موجود وservice-only.
- complete/fail غير موجودتين بعد؛ هذا متوقع.
- counts الأصلية للأرصدة/lifetime/subscriptions لم تتغير.
- `select count(*) from public.analysis_access_reservations;` يجب أن يساوي 0.

هذه آخر نقطة آمنة قبل 003. لا تسمح بأي طلب تحليل بين 002 و003.

## الخطوة 5 — تطبيق SQL 003

شغّل الملف كاملاً:

`supabase/proposals/202607060003_phase_1_1_analysis_refund_idempotency.sql`

المتوقع:

- أعمدة lifecycle تضاف.
- status check وevaluation FK يضافان.
- stale partial index يضاف.
- authorize يُستبدل.
- complete/fail تُنشآن.
- صلاحيات الدوال الثلاث service_role فقط.

أي خطأ يعني التوقف وعدم تشغيل جزء منفرد.

## الخطوة 6 — Postcheck نهائي

شغّل:

`supabase/proposals/PHASE_1_STAGING_POSTCHECK.sql`

ثم أعد تشغيل inspection.

المتوقع:

- كل anomaly counts = 0.
- استعلامات duplicate/refund/deduction/linkage/expired تعيد 0 rows.
- auth privilege booleans كلها false.
- service privilege booleans الثلاثة true.
- reservations RLS=true وبلا client policies.
- الأرصدة/lifetime/subscriptions مطابقة baseline قبل بدء الاختبارات.

صوّر/انسخ كل grids، خصوصاً J–R.

## الخطوة 7 — تفعيل تطبيق Staging فقط

بعد نجاح SQL، انشر/شغّل نسخة التطبيق المعدلة على بيئة Staging فقط وفق آلية الفريق. هذه الخطة لا تنفذ النشر.

تحقق أن environment الخاصة بالتطبيق تشير إلى Staging، وأن service role لا يظهر في client bundle أو logs.

## الخطوة 8 — اختبارات Staging

نفذ الحالات في `PHASE_1_STAGING_TEST_CASES.md` بالترتيب. بعد كل حالة:

- احفظ request ID وHTTP status/code.
- افحص صف usage.
- افحص صف attempt.
- عند النجاح افحص evaluation بنفس ID.
- أعد تشغيل أقسام K–Q من postcheck.

لا تستخدم بيانات Production.

## مقارنة البيانات قبل/بعد

قبل الاختبارات يجب أن تبقى هذه القيم متطابقة قبل 002 وبعد 003:

- عدد user_usage_limits.
- مجموع used_count.
- عدد lifetime.
- عدد الاشتراكات الفعالة والمنتهية.
- عدد evaluations.
- أقدم/أحدث evaluation timestamp.

بعد الاختبارات، أي فرق يجب أن يخص حسابات الاختبار فقط ومفسراً بطلبات موثقة.

## خطة rollback

### متى نستخدمه

- خطأ متكرر في authorize/complete/fail.
- خصم بلا attempt.
- refund مكرر أو رصيد سالب.
- succeeded بلا evaluation.
- RLS/grants غير آمنة.
- ارتفاع 5xx أو processing عالق لا يُستعاد.

### إذا فشل 002 أو 003 داخل transaction

لا تشغّل rollback تلقائياً. أثبت أولاً أن transaction أُلغيت عبر inspection. إن لم تتغير السكيمة، يكفي التوقف.

### rollback بعد نجاح 003

1. أوقف طلبات التحليل.
2. احفظ كل processing rows وusage counts.
3. لا تحذف attempts.
4. شغّل أولاً:
   `202607060003_phase_1_1_analysis_refund_idempotency_rollback.sql`
5. ثم، إذا كان المطلوب تعطيل المرحلة الأولى كلها، شغّل:
   `202607060002_phase_1_analysis_security_rollback.sql`
6. أعد postcheck/inspection.

مهم: rollback 002 وحده ليس rollback كاملاً لـ003؛ قد يترك complete/fail. ترتيب 003 rollback ثم 002 rollback هو الصحيح.

### ماذا يعيد وما لا يعيد

- يعطل الدوال الجديدة ويجعل API fail-closed.
- لا يعيد client write policy الضعيفة.
- لا يعيد legacy increment permission.
- لا يحذف reservations أو evaluations أو usage rows.
- لا يعيد تلقائياً processing credits.

### معالجة processing أثناء rollback

قبل rollback صنف كل processing:

- إذا evaluation بنفس request ID موجود وanalysis_result صالح: سجله كنجاح للتحقيق، ولا ترد الرصيد يدوياً بلا مراجعة.
- إذا لا evaluation والlease انتهت: استخدم مسار fail/refund قبل إسقاط الدوال، أو وثق reconciliation يدوياً بعد موافقة.
- إذا lease لم تنته: انتظر أو أوقف worker ثم احسم الحالة.
- لا تعدل used_count مباشرة دون ربط التعديل بـrequest ID ودليل.

بعد rollback قارن baseline وتأكد أن لا جدول أو صف مستخدم حُذف.

## قرار الجاهزية

المرحلة جاهزة لبدء تجربة Staging فقط إذا نجحت جميع نقاط preflight والbackup و002/003/postcheck. ليست جاهزة لـProduction.

