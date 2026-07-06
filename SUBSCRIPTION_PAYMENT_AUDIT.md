# تدقيق منظومة الاشتراكات والدفع في KISHIB

تاريخ التدقيق: 2026-07-06  
النطاق: مراجعة ساكنة للملفات الموجودة في `C:\HOA-SYSTEM\antique-ai-evaluator` فقط، من دون تعديل الكود أو قاعدة البيانات أو تنفيذ مدفوعات.

## الملخص التنفيذي

**القرار: غير جاهز للربط أو الإطلاق مع بوابة دفع.**

المنظومة الحالية تعرض خططاً وأسعاراً، لكنها لا تنفذ Checkout أو دفعاً إلكترونياً؛ الإجراء الفعلي يفتح WhatsApp للتفعيل اليدوي. لا توجد داخل المشروع جداول مدفوعات/اشتراكات مستقلة، ولا API لإنشاء جلسة دفع، ولا callback/webhook، ولا تحقق توقيع، ولا idempotency أو سجل معاملات. توجد منظومة جيدة مبدئياً لحد الاستخدام المجاني في Supabase، لكن فرضها يجري من العميل قبل استدعاء API غير محمي، ثم يُخصم الرصيد من العميل بعد انتهاء التحليل، ولذلك يمكن تجاوز الحد أو خلق حالات سباق. الأخطر أن سياسة INSERT الحالية على `user_usage_limits` تقيد `user_id` فقط ولا تقيد حقول الاشتراك، ما يسمح نظرياً لمستخدم جديد بإدخال صفه بقيم اشتراك يختارها.

**الجاهزية التقريبية: 20%**

أخطر ثلاث مشكلات:

1. `/api/analyze` لا يثبت هوية المستخدم ولا يفرض حد الاستخدام على السيرفر؛ الحماية الحالية client-side وقابلة للتجاوز (`src/app/api/analyze/route.ts:2625`، `src/components/antique-ai/useAntiqueLens.ts:1240-1264,1455-1458,1648-1649`).
2. سياسة RLS للـINSERT تسمح للمستخدم بإدخال صفه مع حقول اشتراك قابلة للتزوير؛ الشرط الوحيد هو تطابق `auth.uid()` مع `user_id` (`supabase/migrations/202606180001_user_usage_limits.sql:44-49`).
3. لا توجد منظومة دفع فعلية أو webhook أو سجلات معاملات؛ الموجود هو تحويل إلى WhatsApp وتفعيل يدوي (`src/components/antique-ai/SubscriptionModal.tsx:6-7,35-38,120-123`).

> ملاحظة تحقق: ملفات migrations تثبت التصميم المقصود، لكنها لا تثبت أن نفس المخطط والسياسات مطبقة حالياً في مشروع Supabase المنشور. لا توجد داخل المستودع dump حديث أو metadata منشورة تسمح بالتحقق من الحالة الفعلية، لذلك لا أفترض تطابق البيئة البعيدة.

## جدول نتائج التدقيق

| الرقم | النقطة | الحالة | الملفات أو المسارات المرتبطة | شرح المشكلة | الخطورة | الإجراء المطلوب |
|---:|---|---|---|---|---|---|
| 1 | وجود شاشة اشتراك | جاهز جزئياً | `src/components/antique-ai/SubscriptionModal.tsx`، `src/components/antique-ai/UserMenu.tsx:1281-1313` | توجد شاشتان/واجهتان للخطط، لكنهما غير موحدتين ولا تمثلان Checkout فعلياً. | متوسط | توحيد مصدر الخطط والأسعار وربطه بكتالوج server-side. |
| 2 | اتساق الأسعار | خطر | `SubscriptionModal.tsx:43-67,84-108`، `UserMenu.tsx:1284-1312` | شاشة تعرض شهري `$7` وسنوي `$50`، وأخرى تعرض `$5` و`$45` وباقة 150 تقريراً بـ`$20`. | عالٍ | اعتماد Price IDs وقيم من السيرفر ومنع hard-code المتكرر. |
| 3 | انتقال الخطة المختارة للدفع | غير موجود | `SubscriptionModal.tsx:120-123` | الخطة لا تنتقل إلى بوابة؛ كل الخطط المدفوعة تفتح رابط WhatsApp نفسه بلا plan id موثوق. | حرج | إنشاء Checkout server-side يختار المنتج والسعر من قائمة مسموحة. |
| 4 | منع النقر/الدفع المتكرر | ناقص | `SubscriptionModal.tsx:216-232` | لا توجد حالة processing للخطط المدفوعة؛ يمكن فتح الطلب عدة مرات. لا توجد أصلاً معاملة يمكن قفلها. | متوسط | loading lock + idempotency key على السيرفر عند إضافة الدفع. |
| 5 | حالات نجاح/فشل/إلغاء/انتهاء/pending | غير موجود | لا توجد routes دفع في `src/app/api` | لا يوجد state machine أو صفحات/رسائل نتيجة دفع. | حرج | تعريف حالات واضحة وربطها بنتيجة موثوقة من المزود. |
| 6 | Webhook وتحقق التوقيع | غير موجود | لا يوجد ملف webhook في `src/app/api` ولا Edge Function | لا يوجد endpoint أو secret أو signature validation أو replay protection. | حرج | Webhook server-side يتحقق من raw body والتوقيع ويكون idempotent. |
| 7 | تفعيل الاشتراك من السيرفر | خطر | `usageLimitsSupabase.ts:70-101`، migration الاستخدام | العميل يقرأ RPC، لكن لا توجد عملية دفع موثوقة تعدل الاشتراك من السيرفر. | حرج | جعل التفعيل حصراً من webhook/service role بعد تحقق الدفع. |
| 8 | سجل المعاملة | غير موجود | مجلد `supabase/migrations` | لا يوجد جدول payments أو transaction id أو provider response أو event id. | حرج | تصميم سجل معاملات وقيود uniqueness قبل الربط. |
| 9 | نموذج الاشتراك | ناقص | `202606180001_user_usage_limits.sql:3-16`، `202606180002_lifetime_free_usage_access.sql:1-16` | يوجد status/plan/start/end/access، لكن لا provider/transaction/amount/currency/canceled_at/metadata ولا فصل بين الاستحقاق والمعاملة. | عالٍ | فصل subscriptions عن payments وإضافة الحقول والقيود المطلوبة. |
| 10 | منع تكرار المستخدم | جاهز | `202606180001_user_usage_limits.sql:5,76-78,136-138` | `user_id` فريد وعمليات الإنشاء تستخدم `on conflict`. | منخفض | الإبقاء عليه مع اختبارات تزامن. |
| 11 | RLS قراءة الاستخدام | جاهز | `202606180001_user_usage_limits.sql:35-42` | المستخدم يستطيع قراءة صفه فقط. | منخفض | التحقق من تطبيق السياسة فعلياً في البيئة المنشورة. |
| 12 | RLS إدخال الاستخدام | خطر | `202606180001_user_usage_limits.sql:44-49` | `with check` يتحقق من user_id فقط؛ يمكن إرسال status/plan/end/access_type/is_lifetime_free في INSERT إن كانت صلاحيات الجدول تسمح. | حرج | منع INSERT المباشر أو تقييد الأعمدة والقيم، والإنشاء عبر دالة محكمة فقط. |
| 13 | منح lifetime | جاهز تصميمياً | `202606180002_lifetime_free_usage_access.sql:201-275` | الدالة SECURITY DEFINER ومسحوبة من public/anon/authenticated وممنوحة لـservice_role فقط. | منخفض | تدقيق صلاحيات EXECUTE الفعلية وكتابة سجل audit للمنح/الإلغاء. |
| 14 | فرض التجارب من السيرفر | خطر | `useAntiqueLens.ts:1246-1264,1648-1649`، `/api/analyze` | الفحص والخصم كلاهما من العميل؛ استدعاء API مباشرة يتجاوزهما. | حرج | نقل check-and-consume إلى بداية route على السيرفر كعملية ذرية. |
| 15 | race condition في الرصيد | خطر | `useAntiqueLens.ts:1246,1455,1648`، migration `103-199` | عدة طلبات متوازية يمكنها اجتياز check قبل أن يخصم أي منها؛ الخصم يحدث بعد استهلاك موارد AI. | عالٍ | حجز/خصم ذري قبل العمل المكلف، مع تسوية آمنة عند الفشل. |
| 16 | سلامة عداد Supabase | جاهز جزئياً | `202606180002_lifetime_free_usage_access.sql:137-174` | الدالة نفسها تستخدم `FOR UPDATE`، وهو جيد، لكن موقع استدعائها المتأخر ومن العميل يبددان الحماية. | متوسط | استدعاؤها من route موثق وتعديل semantics لإرجاع قرار الطلب الحالي بوضوح. |
| 17 | تجاوز الحد بتحديث الصفحة/جهاز آخر | جاهز جزئياً | `usageLimitsSupabase.ts:61-101`، `supabaseClient.ts:18-29` | الحالة الأساسية مخزنة بـSupabase ومربوطة بـauth.uid، لا localStorage للعداد؛ لكنها قابلة للتجاوز باستدعاء API مباشرة. | عالٍ | فرضها server-side، ثم اختبار multi-device وتزامن الطلبات. |
| 18 | الوصول للتقارير القديمة | جاهز | `src/lib/evaluationsSupabase.ts`، مكونات الأرشيف/النتائج | عرض نتيجة محفوظة منفصل عن بدء تقييم جديد بحسب بنية الواجهة؛ لم يظهر خصم عند مجرد فتح نتيجة قديمة. | منخفض | اختبار تكاملي يؤكد عدم استدعاء increment عند القراءة/الطباعة. |
| 19 | استعادة الاشتراك | ناقص | `supabaseClient.ts:18-29`، RPCs في migrations | جلسة Supabase تستعاد، والحالة تقرأ حسب `auth.uid()`؛ لكن لا مزود دفع ولا reconciliation/restore purchase. | عالٍ | بعد اختيار المزود: مزامنة server-side وإعادة تحقق دورية عند login/device change. |
| 20 | سياسة الاسترجاع | غير موجود | `src/app/terms/page.tsx:256-276` | توجد عبارة عامة تحيل للمزود، ولا توجد Refund Policy مستقلة أو مدد وشروط قبول/رفض. | عالٍ | نشر سياسة استرجاع دقيقة ومتطابقة مع المزود والمتجر. |
| 21 | الشروط والخصوصية | جاهز جزئياً | `/terms`، `/privacy`، `/cookies` وروابط `UserMenu.tsx:1236-1243` | موجودة وروابطها ظاهرة، وتتضمن disclaimer، لكنها تصف ميزات دفع مستقبلية ولا توثق السعر/المدة/التجديد/الإلغاء الفعليين. | متوسط | تحديثها بعد تثبيت نموذج الدفع وقبل الإطلاق. |
| 22 | Disclaimer التقييم | جاهز | `terms/page.tsx:59-64,78-90`، `privacy/page.tsx:422-436` | توضيح صريح أن النتائج تقديرية وليست appraisal معتمدة. | منخفض | مراجعة قانونية محلية قبل النشر التجاري. |
| 23 | Sandbox/Production | غير موجود | `.env.local` (أسماء المتغيرات فقط)، لا متغير دفع | لا توجد مفاتيح دفع أو mode أو فصل sandbox/production أو runbook انتقال. | عالٍ | بيئتان منفصلتان، secrets server-only، ورفض خلط mode/price IDs. |
| 24 | الأسرار | جاهز جزئياً | `.gitignore`، `.env.local` غير متتبع، `supabaseClient.ts:8-10` | لم يظهر secret دفع أو service role داخل client؛ مفاتيح NEXT_PUBLIC تخص Supabase العام. يوجد service role server-side لطرق أخرى. | متوسط | فحص build/secret scanning مستمر وعدم تمرير أي payment secret للعميل. |
| 25 | حماية API التحليل | خطر | `src/app/api/analyze/route.ts:2625` | POST يقبل الطلب ويشغل خدمات مكلفة دون auth/entitlement check واضح. | حرج | تحقق Bearer/session، rate limiting، validation، وحد استهلاك server-side. |
| 26 | اختبارات الدفع | غير موجود | `package.json` لا يحتوي test script | لا توجد اختبارات وحدة/تكامل/Webhook/Sandbox لمنظومة دفع. | عالٍ | إضافة test matrix قبل أي Production key. |

## 1. المشكلات الحرجة قبل الإطلاق

1. **لا توجد بوابة دفع أصلاً:** لا Checkout ولا callback ولا webhook ولا تحقق دفع. واجهة الاشتراك تقول صراحة إن الدفع قادم لاحقاً وتفتح WhatsApp.
2. **حد الاستخدام قابل للتجاوز:** `/api/analyze` لا يربط الطلب بمستخدم Supabase ولا يستدعي check/consume؛ أي عميل يستطيع تجاوز React واستدعاء route مباشرة.
3. **تصعيد اشتراك محتمل عبر INSERT:** سياسة الإدخال الحالية لا تفرض defaults الآمنة على حقول الاشتراك. يجب اعتبارها ثغرة حتى يثبت العكس باختبار الصلاحيات المنشورة.
4. **لا يوجد مصدر حقيقة للمعاملة:** غياب payments/events يجعل تأكيد النجاح، منع callback المكرر، الاسترداد، النزاعات والمحاسبة غير ممكنة.
5. **لا توجد حالات دفع أو idempotency:** لا يمكن التعامل بأمان مع pending/canceled/expired/retry أو وصول webhook مرتين.

## 2. المشكلات المهمة لكن غير المانعة وحدها

- الأسعار غير متطابقة بين واجهتي الاشتراك.
- لا توجد سياسة Refund مستقلة ومحددة.
- شروط الاشتراك الحالية عامة ومكتوبة أيضاً للميزات المخططة؛ لا تحدد آلية الإلغاء أو التجديد الفعلية.
- لا توجد بيئة Sandbox دفع أو توثيق انتقال Production.
- لا توجد اختبارات آلية للدفع أو لاستعادة الاشتراك.
- خصم الرصيد بعد نجاح التحليل يخلق race ويستهلك موارد قبل تثبيت الاستحقاق.
- لا توجد سجلات audit لتعديلات الاشتراك اليدوية، باستثناء إمكانية تخزين `lifetime_reason`.

## 3. الأمور الجاهزة

- شاشة خطط واضحة بصرياً وزر إجراء لكل خطة؛ الخطة المجانية معطلة عن الشراء.
- حد مجاني معلن ومطبق افتراضياً بقيمة 5 في UI وmigration.
- تخزين حد الاستخدام مركزياً في Supabase حسب `user_id`، وليس في localStorage وحده.
- RPC تستخدم `auth.uid()`، و`increment_analysis_usage` تستخدم قفل صف `FOR UPDATE`.
- unique على `user_id` ومنع العدادات السالبة.
- حالة الاشتراك النشط تفحص `subscription_ends_at > now()`.
- منح lifetime مصمم ليكون service-role only في migration.
- Terms وPrivacy وCookies موجودة ومربوطة داخل التطبيق.
- disclaimer واضح بأن النتائج تقديرية وليست تقرير خبرة رسمي.
- `.env.local` غير متتبع في Git، ولم تظهر مفاتيح حساسة hard-coded في الملفات المفحوصة.

## 4. الجداول والحقول الموجودة في Supabase وفق ملفات المشروع

### `public.user_usage_limits`

المصدر: `supabase/migrations/202606180001_user_usage_limits.sql` و`202606180002_lifetime_free_usage_access.sql`.

- `id uuid` primary key
- `user_id uuid` foreign key إلى `auth.users(id)` مع cascade وunique
- `free_limit integer` default 5
- `used_count integer` default 0
- `subscription_status text` default inactive
- `subscription_plan text nullable`
- `subscription_started_at timestamptz nullable`
- `subscription_ends_at timestamptz nullable`
- `created_at`, `updated_at`
- `access_type text` بقيم: free_trial / paid_monthly / paid_yearly / lifetime_free / admin
- `is_lifetime_free boolean`
- `lifetime_reason text nullable`

الدوال: `can_user_analyze()`, `increment_analysis_usage()`, `grant_lifetime_access_by_email()`.

الجداول الأخرى ذات الصلة الجزئية: `app_notifications`, `app_notification_reads`, `similar_image_usage_logs`. لا تمثل مدفوعات أو اشتراكات.

## 5. الجداول أو الحقول الناقصة

لا توجد في migrations النشطة جداول مستقلة باسم `subscriptions`, `payments`, `payment_events`, `webhook_events` أو ما يعادلها. المحتوى داخل `_archived-marketplace-for-tohfa` مؤرشف وخارج التطبيق الحالي ولا يعد منظومة الدفع الحالية.

الحقول الناقصة أو غير الممثلة بشكل مناسب:

- provider/customer_id/provider_subscription_id
- transaction_id/payment_intent_id/checkout_session_id
- webhook event id الفريد
- amount/currency/tax/fee
- payment status والفشل/سبب الفشل
- canceled_at/cancel_at_period_end/renewal status
- refunded_at/refund amount/refund reason
- raw provider reference أو metadata آمنة
- created_by/updated_by/audit trail
- قيود unique على IDs الخارجية

## 6. API routes والـWebhooks الحالية

لا توجد route دفع أو اشتراك أو webhook. routes الحالية تخص التحليل، رفع الصور، البحث، أسعار المعادن، نشاط المستخدم، وحذف الحساب. لا يوجد endpoint يستقبل provider callback ولا endpoint يستعلم عن transaction.

`/api/analyze` مرتبط مباشرة بالاشتراكات لأنه المورد المدفوع، لكنه لا يطبق authentication/entitlement server-side. هذه مشكلة أمنية وتكلفة حتى قبل إضافة بوابة الدفع.

## 7. خطة تنفيذ مرتبة حسب الأولوية

1. إغلاق تجاوز `/api/analyze`: تحقق session على السيرفر وقرار ذري check-and-consume قبل أي رفع/AI مكلف.
2. إغلاق RLS INSERT على `user_usage_limits` ومنع العميل من كتابة أي entitlement؛ إبقاء القراءة الذاتية فقط، والكتابة عبر دوال محكمة.
3. اختيار مزود الدفع ونموذج المنتجات النهائي، وتوحيد الأسعار والعملات والميزات في مصدر server-side واحد.
4. تصميم subscriptions/payments/webhook_events مع IDs فريدة وسجل تدقيق، ثم مراجعة SQL/RLS منفصلة قبل التطبيق.
5. تنفيذ Checkout server-side؛ لا تثق بـplan/amount/currency/user_id القادمة من العميل.
6. تنفيذ webhook بتوقيع صحيح، raw body، idempotency، replay protection، ومعالجة out-of-order events.
7. بناء state machine ورسائل UI لحالات success/failed/canceled/expired/pending، مع polling/reconciliation عند العودة المبكرة.
8. بناء restore/reconciliation عند login وتغيير الجهاز وانتهاء session، وربط الاستحقاق بـuser_id وprovider customer id.
9. توحيد واجهتي الخطط والأسعار، وإضافة loading ومنع النقر المتكرر.
10. نشر Refund Policy وتحديث Terms/Privacy/Cookies وفق المزود والتجديد والإلغاء الحقيقيين.
11. فصل Sandbox وProduction بالمفاتيح وPrice IDs وقاعدة تحقق تمنع الخلط.
12. تنفيذ اختبارات Sandbox كاملة ومراجعة أمنية قبل إدخال مفاتيح Production.

## 8. قائمة اختبارات Sandbox المطلوبة

- شراء شهري وسنوي ناجحان والتحقق من المبلغ والعملة والخطة.
- رفض البطاقة، 3DS/OTP إن وجد، إلغاء المستخدم، انتهاء الجلسة، وpending طويل.
- callback/webhook مكرر، متأخر، خارج الترتيب، بتوقيع خاطئ، وبـevent id مستخدم.
- تحديث الصفحة والعودة للتطبيق قبل وصول webhook؛ يجب ألا يتفعل الاشتراك من query params.
- ضغط زر الشراء عدة مرات وفتح نافذتين متوازيتين.
- تزوير plan/amount/currency/user_id في طلب Checkout.
- محاولة مستخدم كتابة subscription_status/access_type/is_lifetime_free مباشرة عبر anon key.
- خمسة تقييمات مجانية بالضبط، ثم السادس؛ طلبان متزامنان عند آخر رصيد.
- استدعاء `/api/analyze` مباشرة بلا session وبsession منتهي وبحساب بلا رصيد.
- فشل التحليل بعد حجز الرصيد وسياسة التعويض، ومنع مضاعفة الخصم عند retry.
- login/logout، تغيير جهاز، حذف التطبيق وإعادة تثبيته، تدوير access token، وتأخر تحميل الحالة.
- تجديد ناجح وفاشل، إلغاء فوري/نهاية المدة، انتهاء الاشتراك، refund كلي/جزئي، chargeback.
- عدم تأثير Sandbox على مستخدمي Production، ورفض Price ID من البيئة الأخرى.
- مطابقة الإيصال، قاعدة البيانات، لوحة الإدارة، وحالة المستخدم بعد كل سيناريو.
- التحقق من عدم تسريب secrets أو provider payload حساس في logs/client bundle.

## 9. القرار النهائي

**غير جاهز.**

الواجهة وحد الاستخدام يمثلان أساساً أولياً، لكن الربط الآمن يحتاج أولاً إلى إغلاق ثغرتي فرض الرصيد وRLS، ثم بناء طبقة معاملات وWebhook واستعادة اشتراك وسياسات واختبارات. إدخال مفاتيح Production قبل ذلك سيعرض المنظومة لتفعيل مزور، تجاوز الاستخدام، اختلاف الأسعار، تكرار المعاملات، وحالات مستخدم غير قابلة للمصالحة.

## حدود التحقق

- لم تُنفذ أي كتابة على Supabase ولم يُنشأ SQL، التزاماً بنطاق التدقيق.
- لم تُنفذ عملية دفع تجريبية لعدم وجود مزود أو Sandbox في المشروع.
- حالة schema/RLS الفعلية في Supabase البعيد غير قابلة للإثبات من ملفات المشروع وحدها؛ النتائج المتعلقة بها مستندة إلى migrations الموجودة فقط.
- لم أعتبر ملفات `_archived-marketplace-for-tohfa` جزءاً من منظومة الدفع النشطة.
