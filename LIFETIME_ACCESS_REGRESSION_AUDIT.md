# LIFETIME ACCESS REGRESSION AUDIT

تاريخ التدقيق: 2026-07-06  
النطاق: مراجعة ساكنة للكود، migrations، SQL proposals، وسجل Git المحلي فقط.  
لم يُنفذ أي SQL، ولم تُقرأ أو تُعدل Production، ولم يُغيّر أي مستخدم، ولم يحدث نشر.

## الخلاصة التنفيذية

المصدر الموثق لصلاحية lifetime في هذا المشروع هو صف المستخدم داخل `public.user_usage_limits` المرتبط بـ`auth.users.id`. الإيميل ليس مفتاح الاستحقاق وقت التحليل؛ استُخدم فقط للعثور على `user_id` عند المنح عبر `grant_lifetime_access_by_email()`.

البوابة الجديدة في `/api/analyze` تتحقق من جلسة Supabase، تستخرج `user.id` من التوكن على السيرفر، ثم تستدعي `authorize_analysis_request(target_user_id, request_id)`. منطق SQL المقترح يعتبر المستخدم lifetime فقط عندما:

```sql
is_lifetime_free = true
or access_type in ('lifetime_free', 'admin')
```

ولا يعتبر هذه الإشارات وحدها lifetime:

- `subscription_plan = 'lifetime_free'`
- `subscription_status = 'lifetime_free'`
- `subscription_status = 'active'` مع `subscription_ends_at is null`
- أي قيمة في `profiles`
- أي قيمة في `auth.users.raw_user_meta_data` أو `raw_app_meta_data`
- الإيميل أو قائمة إيميلات قديمة

لذلك السبب الجذري المرجح هو **عدم توحيد تمثيل الاستحقاق القديم قبل تفعيل بوابة السيرفر**: أي مستخدم مُنح lifetime يدوياً أو بنظام سابق ولم تُضبط له إحدى العلامتين canonical أعلاه سيُعامل كمنتهٍ بعد نفاد الرصيد. تفعيل الحماية لم يحذف بياناته، لكنه جعل قرار السيرفر النهائي يعتمد على تمثيل أضيق.

هذا الاستنتاج مؤكد على مستوى الكود، لكنه مشروط على مستوى بيانات المستخدمين: لا يمكن إثبات أي صف Production من المستودع وحده. يجب تشغيل استعلام القراءة المرفق بواسطة مسؤول مخول لتحديد شكل بيانات المستخدم المتضرر.

## 1. أين كانت تُحفظ صلاحية lifetime؟

### النتيجة حسب المصدر

| المصدر المحتمل | النتيجة |
|---|---|
| قائمة إيميلات ثابتة في الكود | لم توجد في الكود الحالي أو commits التي أدخلت lifetime |
| `profiles` | لا يوجد منطق استحقاق lifetime يقرأ منه |
| `public.user_usage_limits` | نعم، المصدر الرسمي والوحيد الموثق |
| `auth.users.user_metadata/app_metadata` | لا يوجد منطق lifetime يقرأها؛ استعمال metadata في المشروع لأمور الملف/اللغة/provider |
| جدول اشتراكات منفصل | غير موجود في نطاق المشروع؛ حقول الاشتراك داخل `user_usage_limits` |
| جدول lifetime منفصل | غير موجود |
| شرط client-side | الواجهة تقرأ RPC `can_user_analyze()` وتعرض الحالة، لكنها ليست مصدر البيانات |
| migration قديم | `202606180002_lifetime_free_usage_access.sql` هو migration الأساسي |

### الحقول canonical الموثقة

داخل `public.user_usage_limits`:

- `user_id uuid`: الرابط إلى `auth.users.id` والهوية الأساسية.
- `access_type text`: القيم المسموحة تشمل `lifetime_free` و`admin`.
- `is_lifetime_free boolean`: العلامة الصريحة.
- `lifetime_reason text`: سبب إداري اختياري.
- `subscription_status`, `subscription_plan`, `subscription_started_at`, `subscription_ends_at`: حقول اشتراك مساندة، لكنها ليست كافية وحدها في بوابة lifetime الحالية.

دالة المنح التاريخية `grant_lifetime_access_by_email()` تبحث عن المستخدم بالإيميل ثم تكتب جميع الإشارات التالية في صفه:

```text
is_lifetime_free = true
access_type = lifetime_free
subscription_status = active
subscription_plan = lifetime_free
subscription_ends_at = null
```

وهي لا تصفّر `used_count` عند تحديث صف موجود. قيمة `0` موجودة في مسار INSERT لمستخدم لا يملك صفاً فقط.

## 2. منطق `/api/analyze` الحالي

### الهوية

1. العميل يرسل Supabase access token في `Authorization: Bearer ...`.
2. السيرفر يتحقق منه عبر `admin.auth.getUser(token)`.
3. السيرفر يمرر `userData.user.id` إلى RPC باسم `target_user_id`.
4. أي `user_id` أو email أو lifetime يرسله body لا يشارك في القرار.

النتيجة: البوابة تعتمد على `user_id`، لا على email. هذا صحيح أمنياً، لكنه يتطلب أن يكون الاستحقاق القديم قد نُقل إلى صف `user_usage_limits` لنفس UUID.

### شروط الاستحقاق

في `authorize_analysis_request`:

1. Lifetime إذا `is_lifetime_free` أو `access_type` يساوي `lifetime_free/admin`.
2. اشتراك إذا `subscription_status='active'` و`subscription_ends_at` غير null وفي المستقبل.
3. رصيد مجاني إذا `used_count < free_limit`، مع حجز/خصم ذري.
4. خلاف ذلك `TRIAL_LIMIT_REACHED`.

لا توجد مقارنة email، ولا قراءة `subscription_plan`، ولا قراءة metadata أو profiles.

### اختلاف الواجهة والسيرفر

- RPC الواجهة `can_user_analyze()` في migration الموثق يستخدم نفس علامتي lifetime canonical.
- `EvaluationComposer` يخفي عرض الرصيد أيضاً عندما تكون `subscriptionStatus === 'lifetime_free'`، حتى لو لم تكن العلامات canonical موجودة. هذا اختلاف عرضي: الواجهة قد تبدو وكأنها تعرف حالة lifetime نصية، بينما قرار `canAnalyze` والبوابة لا يعترفان بها.
- قبل حماية route كان الخصم يتم من العميل بعد نجاح التحليل. الآن البوابة السيرفرية هي القرار النهائي وتمنع الوصول قبل تشغيل AI.
- إن كانت دالة `can_user_analyze()` المنشورة في البيئة تحتوي استثناءات يدوية غير الموجودة في المستودع، فلن تنتقل تلقائياً إلى `authorize_analysis_request()`.

## 3. نتائج البحث التاريخي

الكلمات المفحوصة: `lifetime`, `lifetime_access`, `free_forever`, `subscription_status`, `subscription_plan`, `unlimited`, `exempt`, free emails، وقوائم الإيميلات.

النتائج المهمة:

- إدخال نظام lifetime ظهر في commit `216351a`.
- لم يظهر `free_forever` أو allowlist/whitelist لإيميلات في منطق التحليل.
- لا يوجد شرط lifetime في `profiles` أو Auth metadata.
- توجد قوائم إيميلات في migration الإشعارات فقط لإرسال إشعار؛ ليست مصدر استحقاق.
- `similarImageUsageServer.ts` يقرأ أيضاً `user_usage_limits` ويستخدم العلامتين canonical نفسيهما.

## 4. مقارنة القديم بالجديد

| جانب | المنطق القديم | بوابة السيرفر الجديدة |
|---|---|---|
| مكان القرار | RPC عميل قبل التحليل، ثم increment من العميل بعد النجاح | RPC service-role قبل تشغيل التحليل |
| الهوية | `auth.uid()` داخل RPC العميل | توكن موثق ثم `auth.users.id` |
| lifetime canonical | `is_lifetime_free` أو `access_type` | العلامتان نفسيهما |
| plan/status النصي وحده | غير معترف به في migration المودع | غير معترف به |
| استثناءات خارج المستودع | قد تكون موجودة في دالة Production معدلة يدوياً؛ لا يمكن إثباتها محلياً | لن تُقرأ إلا إذا نُقلت صراحة إلى الدالة الجديدة |
| فرض الحد | قابل للتجاوز باستدعاء API مباشرة | مفروض على السيرفر |

التغيير الأمني صحيح من حيث موضع الفرض، لكن عملية الانتقال تفتقر إلى compatibility audit/backfill لكل تمثيلات lifetime الموجودة فعلياً.

## 5. السبب الجذري

### مؤكد من الكود

بوابة السيرفر تقبل تمثيلاً ضيقاً: `is_lifetime_free` أو `access_type`. لا يوجد fallback لـplan/status/metadata/email، ولا توجد migration في proposals تقوم بتوحيد legacy lifetime rows قبل التفعيل.

### مرجح في البيانات

المستخدمون المتضررون على الأرجح يملكون واحداً من الآتي:

1. `subscription_plan='lifetime_free'` فقط.
2. `subscription_status='lifetime_free'` فقط.
3. `subscription_status='active'` و`subscription_ends_at is null` كتمثيل قديم غير صريح.
4. إشارة في metadata أو profiles أضافها إجراء يدوي خارج migrations.
5. لا صف في `user_usage_limits` أصلاً، رغم منحهم بآلية خارج المستودع.
6. صف مربوط بـUUID قديم بعد حذف/إعادة إنشاء حساب بالإيميل نفسه؛ المنح مربوط بالـUUID وليس بالإيميل.
7. دالة `can_user_analyze()` الفعلية في البيئة تحتوي استثناءاً لا تحتويه `authorize_analysis_request()`.

### هل المشكلة من الكود أم قاعدة البيانات؟

- **الكود/SQL gate:** نعم؛ لا توجد طبقة توافق legacy ولا فحص migration completeness.
- **البيانات:** مرجح؛ إذا كانت كل الصفوف القديمة تحمل العلامات canonical فلن يفشل المستخدم بسبب هذا الشرط. ظهور المشكلة يعني غالباً أن بعض الصفوف غير موحدة، أو أن الدالة المنشورة تختلف عن الملفات.
- النتيجة العملية: **الاثنان في مسار الانتقال**، مع ضرورة إثبات شكل الصفوف باستعلام read-only.

## 6. هل بيانات المستخدمين الحالية ما زالت موجودة؟

لا يوجد في تغييرات البوابة ما يحذف صفوف `user_usage_limits` أو evaluations، ودوال `insert ... on conflict do nothing` لا تستبدل الصف الموجود. لذلك لا توجد قرينة كودية على حذف بيانات lifetime.

لكن لا يمكن الجزم بأن علامة lifetime ما زالت موجودة لكل مستخدم دون قراءة قاعدة البيانات. الاحتمال الأقوى هو أن البيانات باقية في حقل legacy لا تقرؤه البوابة، أو مرتبطة بـUUID سابق.

## 7. SQL قراءة فقط لمستخدم واحد بالإيميل

هذا الاستعلام لا يغيّر شيئاً. يُشغّل يدوياً من مسؤول مخول في البيئة المقصودة بعد استبدال الإيميل:

```sql
with target_user as (
  select
    id,
    email,
    created_at,
    raw_user_meta_data,
    raw_app_meta_data
  from auth.users
  where lower(email) = lower('USER@example.com')
)
select
  u.id as auth_user_id,
  u.email,
  u.created_at as auth_created_at,
  u.raw_user_meta_data,
  u.raw_app_meta_data,
  to_jsonb(p) as profile_row,
  to_jsonb(l) as usage_limit_row,
  case
    when l.is_lifetime_free = true then 'canonical:boolean'
    when l.access_type in ('lifetime_free', 'admin') then 'canonical:access_type'
    when lower(coalesce(l.subscription_plan, '')) = 'lifetime_free' then 'legacy:subscription_plan'
    when lower(coalesce(l.subscription_status, '')) = 'lifetime_free' then 'legacy:subscription_status'
    when l.subscription_status = 'active' and l.subscription_ends_at is null then 'ambiguous:active_without_end'
    when l.user_id is null then 'missing:user_usage_limits_row'
    else 'not_lifetime_by_known_fields'
  end as lifetime_diagnosis
from target_user u
left join public.profiles p on p.id = u.id
left join public.user_usage_limits l on l.user_id = u.id;
```

للتأكد من عدم وجود حسابات مكررة تاريخياً بنفس الإيميل:

```sql
select id, email, created_at, deleted_at
from auth.users
where lower(email) = lower('USER@example.com')
order by created_at;
```

## 8. Migration مقترح — لا يُنفذ الآن

المقترح الآمن هو migration منفصل بعد مراجعة نتائج القراءة ونسخة احتياطية. لا يحذف ولا يصفر usage/evaluations. يقوم فقط بتوحيد الإشارات النصية غير الملتبسة:

```sql
begin;

-- Preview يجب مراجعته قبل تحويل migration إلى approved.
select
  user_id,
  subscription_status,
  subscription_plan,
  access_type,
  is_lifetime_free,
  lifetime_reason,
  used_count,
  free_limit
from public.user_usage_limits
where is_lifetime_free is distinct from true
  and access_type not in ('lifetime_free', 'admin')
  and (
    lower(coalesce(subscription_plan, '')) = 'lifetime_free'
    or lower(coalesce(subscription_status, '')) = 'lifetime_free'
  );

-- Proposed backfill: يحفظ used_count/free_limit كما هما.
update public.user_usage_limits
set
  is_lifetime_free = true,
  access_type = 'lifetime_free',
  subscription_status = 'active',
  subscription_plan = 'lifetime_free',
  subscription_ends_at = null,
  lifetime_reason = coalesce(lifetime_reason, 'Legacy lifetime normalization'),
  updated_at = now()
where is_lifetime_free is distinct from true
  and access_type not in ('lifetime_free', 'admin')
  and (
    lower(coalesce(subscription_plan, '')) = 'lifetime_free'
    or lower(coalesce(subscription_status, '')) = 'lifetime_free'
  );

-- لا يشمل active + null end لأنه ambiguous وقد يكون اشتراكاً ناقص البيانات.
-- هؤلاء يراجعون يدوياً بقائمة موثقة قبل أي update.

commit;
```

بعد backfill يجب أن تستخدم `can_user_analyze()` و`authorize_analysis_request()` و`similarImageUsageServer` تعريفاً canonical واحداً. يفضل إنشاء دالة SQL صغيرة مثل `has_lifetime_analysis_access(user_usage_limits)` أو تكرار الشرط نفسه حرفياً مع اختبارات regression. لا يُنصح بقراءة email أو metadata في كل طلب؛ تُستخدم مرة واحدة في migration موثق لتحويل البيانات إلى canonical row.

أي migration يعتمد على metadata يحتاج أولاً إثبات اسم المفتاح والقيمة من الاستعلام. لا يجوز افتراض مفاتيح مثل `lifetime=true` ومنح صلاحيات بناء عليها دون قائمة مراجعة.

## 9. خطة إصلاح آمنة

1. تجميد نشر gate الجديد مؤقتاً أو إبقاؤه على Staging فقط حتى انتهاء reconciliation.
2. تشغيل استعلام القراءة على عينة من المستخدمين المتضررين، دون UPDATE.
3. استخراج counts مجمعة لكل تمثيل: canonical، plan/status legacy، active-null ambiguous، missing row، UUID mismatch.
4. مقارنة تعريف الدوال الفعلي في البيئة مع SQL الموجود في المستودع باستخدام `pg_get_functiondef` قراءة فقط.
5. بناء قائمة candidate محددة ومراجعتها إدارياً، خصوصاً `active + null end` وmetadata.
6. أخذ backup منطقي للجداول المعنية.
7. تطبيق migration توحيد على Staging فقط؛ لا تعديل `used_count`, `free_limit`, reservations أو evaluations.
8. اختبار مستخدم canonical، legacy-normalized، اشتراك مدفوع، رصيد مجاني، وحساب غير مستحق.
9. نشر SQL المعتمد قبل أو بالتزامن الذري مع route، ثم smoke test.
10. إضافة regression tests لكل تمثيل تاريخي معتمد ومراقبة `TRIAL_LIMIT_REACHED` للمستخدمين ذوي plan/status lifetime.

## 10. الملفات المرتبطة

- `src/app/api/analyze/route.ts`: نقطة فرض الحماية الجديدة.
- `src/lib/analysisAccessServer.ts`: توثيق التوكن واستدعاء RPC بالـuser ID.
- `src/lib/usageLimitsSupabase.ts`: فحص الواجهة عبر `can_user_analyze()`.
- `src/components/antique-ai/useAntiqueLens.ts`: pre-check وإرسال Bearer token ومعالجة `TRIAL_LIMIT_REACHED`.
- `src/components/antique-ai/EvaluationComposer.tsx`: منطق عرض/إخفاء حالة الاستخدام.
- `src/lib/similarImageUsageServer.ts`: بوابة مشابهة للصور المشابهة.
- `supabase/migrations/202606180001_user_usage_limits.sql`: إنشاء الجدول والاشتراك/الرصيد الأصلي.
- `supabase/migrations/202606180002_lifetime_free_usage_access.sql`: الحقول ودالة المنح lifetime.
- `supabase/proposals/202607060002_phase_1_analysis_security_reviewed.sql`: بوابة السيرفر الأولى المراجعة.
- `supabase/proposals/202607060003_phase_1_1_analysis_refund_idempotency.sql`: البوابة الحالية المقترحة مع lifecycle/refund.

## الحكم النهائي

لا توجد قرينة على أن تفعيل الحماية حذف lifetime أو evaluations. الانحدار ناتج على الأرجح عن **عدم توافق تمثيل entitlement القديم مع الشرط canonical الجديد**، أو اختلاف الدوال المنشورة عن ملفات المستودع. الإصلاح الآمن ليس تعطيل الحماية ولا تصفير usage؛ بل قراءة وتشخيص، توحيد legacy rows إلى `is_lifetime_free/access_type`، ثم جعل جميع البوابات تعتمد التعريف نفسه.
