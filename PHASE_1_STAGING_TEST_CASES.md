# KISHIB Phase 1 — حالات اختبار Staging اليدوية

استخدم حسابات Staging مخصصة. لكل حالة سجل: user ID التجريبي، request ID، وقت البدء، HTTP status/code، used_count قبل/بعد، صف attempt، evaluation ID، وعدد مرات استدعاء AI من logs.

## قواعد عامة

- لا تعِد استخدام request ID بين حالات مختلفة إلا في حالات replay المحددة.
- كل request ID يجب أن يكون UUID صالحاً.
- تجهيز حالات lifetime/subscription يتم بأداة admin/service-role الموثوقة على Staging، وليس من العميل.
- بعد كل حالة شغّل أقسام K–Q من postcheck.
- PASS يتطلب تطابق HTTP + قاعدة البيانات + logs، وليس واجهة المستخدم وحدها.

## TC01 — مستخدم جديد

- قبل: auth user جديد، لا صف في user_usage_limits، لا attempts/evaluations.
- الطلب: تقييم صالح بمفتاح K1.
- المتوقع: 200، evaluationId=K1، نتيجة صالحة.
- Supabase: صف usage ينشأ free_limit=5 وused_count=1؛ attempt K1=succeeded وconsumed=true؛ evaluation K1 موجود.
- PASS: AI runs=1 وكل الروابط متطابقة. FAIL: أكثر من صف أو used ليس 1.

## TC02 — مستخدم لديه كامل رصيد 5

- قبل: free_limit=5، used_count=0.
- الطلب: لا تنفذ AI؛ تحقق أولاً من can_user_analyze، ثم نفذ طلباً واحداً صالحاً K2.
- المتوقع: قبل الطلب remaining=5، بعد النجاح remaining=4.
- Supabase: used_count=1، attempt succeeded.
- PASS: خصم واحد. FAIL: خصم عند مجرد القراءة أو أكثر من واحد.

## TC03 — نجاح تقييم واحد

- قبل: سجل used_count=N، احفظ N.
- الطلب: تحليل صالح K3.
- المتوقع: HTTP 200.
- Supabase: used=N+1 للحساب المجاني؛ K3 succeeded؛ result_payload غير null؛ evaluation_id=K3؛ evaluation.analysis_result غير null.
- PASS: complete بعد الحفظ فقط. FAIL: succeeded بلا evaluation.

## TC04 — فشل OpenAI

- قبل: used=N.
- الطلب: استخدم إعداد Staging يجبر OpenAI على provider error مع K4.
- المتوقع: response خطأ منظم، لا نتيجة.
- Supabase: used يعود N؛ K4=refunded؛ failure_reason موجود؛ refunded_at موجود؛ لا evaluation صالح.
- PASS: logs AI run=1 وrefund=1. FAIL: used=N+1 أو succeeded.

## TC05 — Timeout

- قبل: used=N.
- الطلب: مهلة Staging قصيرة/مزود test بطيء، K5.
- المتوقع: timeout/5xx منظم.
- Supabase: used=N؛ K5 refunded؛ reason يدل timeout.
- PASS: الرصيد عاد فعلياً. FAIL: processing بعد انتهاء lease ونشاط لاحق أو رصيد مفقود.

## TC06 — فشل حفظ النتيجة

- قبل: used=N. جهز فشل insert على evaluation في Staging بصورة قابلة للإزالة.
- الطلب: AI صالح K6 لكن حفظ evaluation يفشل.
- المتوقع: العملية ليست نجاحاً.
- Supabase: used=N؛ K6 refunded؛ EVALUATION_SAVE_FAILED؛ لا succeeded.
- PASS: لا نتيجة يتيمة ناجحة. FAIL: 200 أو خصم دائم.

## TC07 — طلبان متزامنان على آخر رصيد

- قبل: free_limit=5، used_count=4.
- الطلب: أرسل K7A وK7B بالتزامن الحقيقي.
- المتوقع: طلب واحد يبدأ؛ الآخر TRIAL_LIMIT_REACHED.
- Supabase: used_count=5 فقط؛ محاولة واحدة consumed؛ لا خصمين.
- PASS: AI runs=1. FAIL: الاثنان شغلا AI أو used>5.

## TC08 — نفس request_id أثناء processing

- قبل: used=N؛ اجعل K8 بطيئاً.
- الطلب: أرسل K8 ثم أعد K8 قبل اكتماله.
- المتوقع: الثاني 409 ANALYSIS_IN_PROGRESS.
- Supabase: صف واحد K8، used=N+1، لا duplicate.
- PASS: AI runs=1. FAIL: تشغيلان أو صفان.

## TC09 — نفس request_id بعد succeeded

- قبل: K9 succeeded وevaluation K9 موجود.
- الطلب: أعد payload بنفس K9.
- المتوقع: 200 cached/replayed ونفس النتيجة/evaluation ID.
- Supabase: used لا يتغير؛ لا evaluation ثانية.
- PASS: AI runs يبقى 1. FAIL: استدعاء مزود جديد.

## TC10 — retry بمفتاح جديد بعد refunded

- قبل: K10A refunded وused عاد N.
- الطلب: أعد نفس المدخل بمفتاح K10B جديد.
- المتوقع: K10A لو أعيد يبقى closed؛ K10B يبدأ كمحاولة جديدة.
- Supabase: K10A بلا تغيير؛ K10B مستقل؛ عند نجاحه used=N+1.
- PASS: لا إعادة فتح للمفتاح القديم. FAIL: خصم جديد على K10A.

## TC11 — مستخدم انتهى رصيده

- قبل: used_count=free_limit=5، بلا اشتراك/lifetime.
- الطلب: K11.
- المتوقع: HTTP 402 TRIAL_LIMIT_REACHED، لا AI.
- Supabase: used=5؛ attempt failed/consumed=false أو قرار رفض موثق؛ لا evaluation.
- PASS: AI runs=0. FAIL: processing أو خصم.

## TC12 — مستخدم lifetime

- قبل: is_lifetime_free=true أو access_type lifetime_free/admin؛ used ثابت N.
- الطلب: K12 صالح.
- المتوقع: 200.
- Supabase: K12 succeeded، access_mode=lifetime، consumed=false، used=N.
- PASS: لا خصم. FAIL: used تغير.

## TC13 — اشتراك فعال

- قبل: status=active وsubscription_ends_at مستقبلية؛ used=N.
- الطلب: K13.
- المتوقع: 200.
- Supabase: mode=subscription، consumed=false، used=N، evaluation محفوظ.
- PASS: لا خصم. FAIL: استخدام trial.

## TC14 — اشتراك منتهي

- قبل: status=active لكن ends_at ماضية؛ used=N<limit أولاً.
- الطلب: K14.
- المتوقع: يعامل كغير مشترك ويستهلك trial واحد؛ عند used=limit يعيد 402.
- Supabase: mode=free_trial وused=N+1، أو رفض عند نفاد الرصيد.
- PASS: لا يمنح subscription access. FAIL: mode=subscription.

## TC15 — محاولة تعديل الرصيد من العميل

- قبل: احفظ صف usage.
- الطلب: عبر Supabase anon/authenticated client حاول INSERT/UPDATE free_limit/used_count.
- المتوقع: permission/RLS error.
- Supabase: الصف مطابق قبل/بعد؛ لا attempt.
- PASS: الرفض. FAIL: أي تغيير.

## TC16 — تزوير subscription status/lifetime

- قبل: حساب مجاني.
- الطلب: حاول تعديل status/start/end/access_type/is_lifetime_free من العميل، ثم أرسل body مزوراً إلى /api/analyze.
- المتوقع: الكتابة مرفوضة؛ body غير موثوق؛ القرار يعتمد على DB الحقيقية.
- Supabase: entitlement بلا تغيير.
- PASS: لا وصول مدفوع. FAIL: mode subscription/lifetime.

## TC17 — النتائج القديمة بعد نفاد الرصيد

- قبل: مستخدم used=free_limit وله evaluation قديم معروف.
- الطلب: افتح الأرشيف والتفاصيل/التقرير القديم فقط.
- المتوقع: القراءة تنجح، لا /api/analyze جديد.
- Supabase: used_count وattempt count لا يتغيران.
- PASS: النتيجة القديمة ظاهرة. FAIL: 402 على القراءة أو خصم.

## TC18 — crash قبل AI / lease recovery

- قبل: used=N.
- الطلب: احجز K18 ثم أوقف العملية قبل AI؛ انتظر انتهاء lease؛ نفذ طلباً جديداً للمستخدم.
- المتوقع: cleanup يعيد رصيد K18 مرة؛ K18 refunded بسبب PROCESSING_LEASE_EXPIRED.
- Supabase: used يعود N قبل خصم المحاولة الجديدة.
- PASS: refund واحد. FAIL: processing دائم أو refund مكرر.

## TC19 — crash بعد حفظ evaluation وقبل complete

- قبل: used=N.
- الطلب: K19؛ اسمح بحفظ evaluation K19 ثم أوقف قبل complete.
- المتوقع: retry/cleanup يجد evaluation صالحاً ويحول K19 إلى succeeded بلا refund وبلا AI جديد.
- Supabase: used=N+1، succeeded، evaluation_id=K19، result cached.
- PASS: لا refund ولا AI ثانٍ. FAIL: رصيد عاد رغم وجود نتيجة أو duplicate.

## سجل نتيجة موحد لكل حالة

انسخ هذا القالب:

- Case ID:
- Staging project ref:
- Test user ID:
- Request ID(s):
- Before used/free/entitlement:
- HTTP status/code:
- AI run count:
- After used/free:
- Attempt status/decision/consumed/refunded_at:
- Evaluation ID/result present:
- Postcheck anomaly counts:
- PASS/FAIL:
- Screenshot/export filenames:
- Notes:

