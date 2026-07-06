# تقرير سكيمة KISHIB الأساسية لـStaging

المشروع المستهدف: `hvjwjbomfsuwaauolgyh`  
الرابط: `https://hvjwjbomfsuwaauolgyh.supabase.co`  
الحالة: ملف SQL مُجهز للمراجعة اليدوية فقط. لم يتم تنفيذ SQL أو تعديل Supabase أو النشر.

## الملف

`supabase/proposals/202607060004_kishib_staging_base_schema.sql`

الملف ينشئ بنية فارغة فقط. لا يحتوي بيانات مستخدمين، ولا ينسخ `auth.users`، ولا ينشئ حسابات، ولا يحتوي secrets أو API keys.

## الجداول التي سيتم إنشاؤها

### 1. public.profiles

الغرض: بيانات ملف المستخدم التجريبي المطلوبة لإكمال التسجيل وتعبئة سجل التقييم.

أهم الحقول:

- id: مفتاح أساسي وFK إلى `auth.users(id)`.
- email/full_name/avatar_url/phone/provider.
- gender.
- country/country_code/country_name_en.
- city/province/province_code/province_name_en.
- app_language/device_locale.
- created_at/updated_at.

الأمان:

- RLS مفعلة.
- المستخدم يقرأ/ينشئ/يعدل صفه فقط.
- لا DELETE من العميل.
- trigger لتحديث updated_at.

### 2. public.user_usage_limits

الغرض: الأرصدة المجانية، الاشتراكات، lifetime access.

الحقول:

- id، user_id unique + FK.
- free_limit، used_count.
- subscription_status/plan/started_at/ends_at.
- access_type، is_lifetime_free، lifetime_reason.
- created_at/updated_at.

الأمان:

- RLS مفعلة.
- العميل يقرأ صفه فقط.
- لا INSERT/UPDATE/DELETE مباشر.
- `can_user_analyze()` متاحة للمستخدم المصادق للقراءة وإنشاء صف افتراضي آمن فقط.
- `grant_lifetime_access_by_email()` لـservice_role فقط.
- لا توجد دالة client-side لخصم الرصيد.

### 3. public.evaluations

الغرض: حفظ نتيجة التقييم وربطها بالمستخدم وrequest ID.

الحقول:

- id uuid primary key.
- user_id FK.
- بيانات المستخدم العامة اللازمة للتقرير.
- title/locale/item_type.
- image_url/cloudinary_public_id.
- analysis_result jsonb.
- created_at/updated_at.

الأمان:

- RLS مفعلة.
- المستخدم يقرأ تقييماته فقط.
- لا كتابة من العميل.
- الحفظ يتم من السيرفر عبر service role.
- indexes على user_id/created_at.

## الدوال والـtriggers

- `set_kishib_updated_at()`: trigger عام لـprofiles/evaluations.
- `set_user_usage_limits_updated_at()`: trigger مطابق للاسم المتوقع في migrations.
- `can_user_analyze()`: قراءة entitlement من auth.uid.
- `grant_lifetime_access_by_email()`: أداة إدارية محمية.

لا يتم إنشاء `authorize_analysis_request` في base؛ SQL 002 ينشئها. ولا يتم إنشاء complete/fail؛ SQL 003 ينشئهما.

## الجداول المستبعدة

تم استبعادها لأنها غير لازمة لاختبارات الاشتراك والتقييم الأساسية:

- app_notifications.
- app_notification_reads.
- similar_image_usage_logs.
- user_activity.
- subscriptions/payments المنفصلة: غير موجودة أصلاً في التطبيق الحالي.
- جداول السوق والمجموعة المؤرشفة.
- report_watchlist.
- discount_codes.
- payments.
- أي بيانات أو جداول House Supabase الخارجية.

النتيجة: بعض ميزات التطبيق غير المرتبطة بالمرحلة، مثل الإشعارات أو سجلات الصور المشابهة، قد لا تعمل في Staging الأساسي. هذا مقصود.

## auth.users

لا ينشئ الملف `auth.users` ولا ينسخ أي صف. Supabase يدير auth schema. المستخدمون التجريبيون يُنشؤون لاحقاً يدوياً داخل مشروع Staging الجديد فقط.

## التوافق مع SQL 002 و003

### SQL 002

متوافق لأن base يوفر:

- user_usage_limits بكل الأعمدة والأنواع المطلوبة.
- user_id uuid + unique + FK إلى auth.users.
- القيم غير السالبة.
- RLS وسياسة القراءة.
- لا يوجد reservations مسبقاً، فينشئه 002 فارغاً.
- عدم وجود `increment_analysis_usage()` آمن؛ 002 يستخدم `to_regprocedure` قبل REVOKE.

### SQL 003

متوافق بعد 002 لأن:

- evaluations.id uuid.
- evaluations.user_id uuid.
- evaluations.analysis_result jsonb.
- reservations موجود وفارغ.
- authorize من 002 موجود.
- 003 يضيف lifecycle وcomplete/fail.

قيد حرج: لا تسمح بأي طلب تحليل بين 002 و003، لأن 003 يتوقف إذا كان reservations غير فارغ.

## ترتيب التشغيل

1. شغّل base schema على مشروع Staging الجديد فقط.
2. شغّل `PHASE_1_SCHEMA_INSPECTION.sql`.
3. تحقق من الجداول والأعمدة/RLS/grants واحفظ النتائج.
4. شغّل SQL 002.
5. تحقق أن reservations فارغ.
6. شغّل SQL 003.
7. شغّل `PHASE_1_STAGING_POSTCHECK.sql`.
8. بعد نجاح القاعدة، ابدأ اختبارات Staging وفق الخطة.

لا تشغل migrations القديمة 202606180001/002 فوق base؛ محتواها مدمج ومؤمّن في base، وتشغيل القديمة قد يعيد policy الإدخال الضعيفة مؤقتاً.

## Dependencies

- مشروع Supabase جديد يحتوي auth schema والأدوار القياسية anon/authenticated/service_role.
- صلاحية SQL Editor لإنشاء public tables/functions/policies.
- extension `pgcrypto`، ويقوم الملف بإنشائها بـIF NOT EXISTS.
- PostgreSQL/Supabase يدعم RLS وgen_random_uuid.

## المخاطر والنواقص

1. السكيمة مستنتجة من كود التطبيق وmigrations؛ يجب إثباتها عبر inspection بعد التشغيل.
2. لا توجد بيانات اختبار أو حسابات؛ هذا مقصود.
3. لا تشمل كامل ميزات KISHIB، بل نطاق الاشتراك/التقييم فقط.
4. `grant_lifetime_access_by_email` حساس، لكنه service-role only ويجب عدم استدعائه من العميل.
5. لا يوجد جدول payments أو provider transactions؛ بوابة الدفع خارج النطاق.
6. الملف قابل لإعادة التشغيل من ناحية DDL الأساسية، لكنه لا يحاول إصلاح جدول موجود بسكيمة مختلفة؛ في مشروع جديد يجب تشغيله مرة ثم inspection.
7. لا يوجد immutable audit ledger لكل transition؛ reservations من 002/003 هي سجل الحالة الحالي.

## قرار الجاهزية

**نعم، الملف جاهز للمراجعة والتطبيق اليدوي المشروط على مشروع Staging الجديد المحدد، ثم inspection وSQL 002 و003.**

**لا توجد موافقة على Production، ولم يتم تنفيذ أي SQL.**

