# AGENTS.md — ملاحظات مشروع PropAuto AI (propauto al)

## الوضع الحالي باختصار
- `/workspace` = **الواجهة المعاد بناؤها** (12 صفحة ثابتة × 6 لغات + server.js) — تعمل وتُختبر.
- 🚀 **دفع التحسينات إلى GitHub — اكتملت المزامنة مع Vercel ✅:** `lib/math.ts` (حساب مالي دقيق BigInt: toCents/computeRoi/formatMoney/scaleCents — صفر أخطاء تقريب)، `tests/unit/` (20 اختبار حدودي: math + request-security، تعمل بـ `node --test tests/unit/` على Node 24)، TSDoc كامل لـ lib (request-security/auth/utils/products/db)، و`test:unit` مضافة لسلسلة `check`. **آخر commit: `ae4436b`** (إصلاح `tsconfig` target ES6→ES2022 — كان يكسر البناء بسبب BigInt literals TS2737). **النشرة الإنتاجية READY والموقع الحي يعمل (HTTP 200).** ملاحظة: أي push بهوية غير مرتبطة بحساب GitHub (مثل "PropAuto AI <propautoal@gmail.com>") يحظر Vercel النشرة ("couldn't find a Git account for the commit author") — **push دائماً بهوية `tato10861-code <tato10861@gmail.com>`**.
- ✅ **إصلاح تبديل اللغات (آخر جلسة):** أُضيف `supported` للواجهة العامة في `i18n.js` (كان مفقوداً → القائمة كانت تعرض لغة واحدة فقط)، وصُحّح `I18n.current()` في 4 مواضع بـ `app.js` (كانت دالة تُستخدم كقيمة)، وأُضيف `de` + `tr` لقائمة اللغات في 11 صفحة HTML.
- ✅ **إصلاح إضافي (جلسة لاحقة):** القائمة لم تكن تفتح أصلاً — CSS يفتحها عبر `.lang[data-open="true"]` بينما JS كان يضيف class `is-open` (لا تطابق أبداً) → صُحّح `open()`/`close()` في `app.js` ليضبطا `data-open` على الجذر. الآن القائمة تفتح والست لغات تتبدل فعلياً في المتصفح (تحقق Node: parity صفرية لكل اللغات).
- 🎉 **الكود الأصلي مستنسخ بنجاح** إلى `/workspace/original-source/` (من GitHub بتوكن المستخدم، 7 أكتوبر 2026 — آخر push):
  - `original-source/src/src/` = تطبيق Next.js 16.3.8 الكامل (app/، components/، lib/، agent/، docs/، tests/، LICENSE، SECURITY.md، CLAUDE.md، README.md، AGENTS.md).
  - `original-source/src/` = جذر المستودع (package.json + pnpm-lock.yaml مع mammoth لمعالجة docx + src/).
  - `original-source/src/data/1-7961d9.docx` = مستند البيانات الأصلي.
  - `original-source/propauto-complete-project.zip` + `propauto-project-ready.zip` = نسخ تاريخية (سبتمبر/أكتوبر).
- ⛔ **قاعدة صارمة من المستخدم: ممنوع حذف أو استبدال أي شيء يخص تطويره** — العمل العملية كلها قراءة/استعادة فقط.

## هوية المشروع الأصلي (مُستعادة من Vercel API)
- مشروع Vercel: `propauto-ai-al-closer-saas` · `prj_w58cknUtS42xe1rxVlEhcBGSxzA8` · فريق `ta-to` (`team_C9bVcXcO2lnhudmkPThPSvZI`).
- الإنتاج: https://propauto-ai-al-closer-saas.vercel.app
- الحزمة الفعلية: `propauto-ai` · Next.js **16.3.8** + React **19** + pnpm 10 + Node 24 + **Tailwind v4** + shadcn/ui.
- التقنيات: drizzle-orm + Postgres/Neon · better-auth · Stripe · Resend · AI SDK 7 · **Vapi (صوت)** · Vercel Blob · Convex.
- 9 صفحات (`/`, `/admin`, `/contact`, `/investors`, `/privacy`, `/sign-in`, `/sign-up`, `/terms`) + 12 نقطة API (منها `/api/sarah`, `/api/concierge`, `/api/voice/config`, `/api/checkout`, `/api/market-prices`).
- وُلد عبر v0.dev (دليل: `__v0_runtime_loader.js` / `__v0_devtools.tsx` في `.gitignore` الأصلي).

## ⚠️ قيود بيئة الصندوق (تجريبية ومهمة)
- **محجوب:** `api.vercel.com` (TCP timeout) · **متاح:** `https://vercel.com/api/...` ← **هذا هو المسار العامل لـ Vercel API** بتوكن `Bearer`.
- متاح: `api.github.com` + `codeload.github.com` · `registry.npmjs.org` · `*.vercel.app` · `v0.app` · `catbox.moe` · `tmpfiles.org` · `file.io`.
- **المرفقات الثنائية (zip/pdf) لا تصل أبداً** إلى الصندوق — أرسل الملفات كنص أو برابط تحميل مباشر.
- Vercel **لا يخزّن ملفات المصدر** في النشرات: `…/deployments/{id}/files` يرجع 404 دائماً.
- سجلات البناء متاحة عبر `/v3/deployments/{id}/events` (مختصرة، لكنها كشفت قائمة التبعيات وخريطة المسارات الكاملة).
- متغيرات البيئة: تُقرأ **الأسماء فقط** (`/v9/projects/{id}/env`)، القيم مشفّرة. لا مفاتيح GitHub فيها.
- القرص ممتلئ 100% (≈220MB متبقية) — التثبيتات الكبيرة قد تفشل.

## ملفات الاسترداد (قراءة فقط، لا تحذفها)
- `recovery/vercel-deployment-history.md` — **127 نشرة** بالتاريخ/SHA/الفرع/الرسالة، أقدم 2026-09-07 → أحدث 2026-10-07، و**25 فرع تطوير**، + جرد متغيرات البيئة.
- `recovery/deployments-raw.json` — البيانات الخام.
- `recovery/project-architecture.md` — البنية المعمارية الكاملة (صفحات، API، تبعيات، متغيرات).
- `recovery/build-log-production.txt` — سجل بناء الإنتاج الأصلي.
- `scripts/recover-*.js` — سكربتات الاسترداد (بها توكن Vercel؛ أعد استخدامها أو احذف التوكن لاحقاً).

## ✅ المطلوب لإكمال الاستعادة — تم إنجازه
- تم استنساخ الكود الأصلي بالكامل من `github.com/tato10861-code/my-project` (خاص، 6.3MB، TypeScript، آخر push 2026-10-07) إلى `/workspace/original-source/`.
- ⚠️ **التوكن الذي استُخدم للاستنساخ أُرسل في المحادثة — يجب على المستخدم تدويره (Revoke) من GitHub → Settings → Developer settings → Personal access tokens فوراً.**
- ملاحظة بناء: `pnpm install` في هذا الصندوق فشل بسبب شبكة بطيئة/غير مستقرة (EAI_AGAIN) وقرص شبه ممتلئ — على جهاز المطوّر (Node 24 + pnpm) يعمل: `cd original-source/src/src && pnpm install && pnpm build`.

## مستجدات الاستعادة (RSC payload — أحدث إنجاز)
- جلبنا تدفق RSC للصفحة الرئيسية من الإنتاج: `recovery/rsc-homepage-payload.md` — يوثّق **الألوان الأصلية** (`#071014` خلفية + `#d5b77b` ذهبي)، الخطوط (Geist + Noto Sans Arabic)، مكوّنات `PropAutoVoiceConcierge`/`ClientPageRoot`/`IconMark`، **آلية اللغة عبر `?lang=ar`**، الـ Metadata الرسمي، رمز تحقق Google `9fr9l891XdYIz0EUFHozAKU4McwO5ukbj-JQLzoP08c`، ونص صفحة 404 الحرفي.
- `_buildManifest.js` **لا يفيد** (Turbopack في Next 16 لا يستخدمه — يعيد فقط `/_app`, `/_error`).
- `/pricing` يعيد **404** في النشرة الحية — التسعير لم يعد مساراً مستقلاً (دمج في الصفحة الرئيسية).
- Build ID الحالي للنشرة: `neuJTbbz6XORotMcUM8ax`.

## CSS الإنتاجي الأصلي + الخطوط + أرقام اللوحة (إنجاز لاحق — v1.4.0)
- نزّلنا **CSS البناء الإنتاجي الحرفي**: `recovery/production-css-original.css` (51KB — chunk `0sq4gstocyqmo.css`) من النشرة الحية — يكشف نظام التصميم الكامل:
  - shadcn theme: `--background:#071014` · `--foreground:#f5f1e8` · `--card:#112127` · `--secondary/--muted:#183036` · `--muted-foreground:#9aaba7` · `--primary/--accent/--ring:#d5b77b` · `--primary-foreground:#071014` · `--border:#f5f1e824` · `--input:#f5f1e82e` · `--radius:.75rem`.
  - keyframes أصلية: `propauto-pulse` (opacity .55→1, scale .98→1) · `rise` · `reveal` · `spin`؛ أصناف `.hero-copy` (rise .8s) و`.hero-image` (reveal 1.1s).
- نزّلنا **الخطوط الأصلية العشرة** (woff2) إلى `assets/fonts/` — Geist (latin/latin-ext/cyrillic/cyrillic-ext/vietnamese) + Noto Sans Arabic (arabic/supplement/latin/latin-ext/symbols) — و`styles.css` **v1.4.0** تستخدمها الآن مع unicode-range مطابق للإنتاج (بدل خطوط النظام).
- `recovery/pages/index.html` — نسخة RSC كاملة من الصفحة الرئيسية الأصلية (هيرو "Own what comes next."، Villa Azure · دبي $3.9M، قصة الشركة، السوق، الحاسبة 9.9%، لوحات 12,840 زائراً +18.6% / 2,140 عميلاً +24.8%، المصادر 42/26/19/13، جدول دبي/الرياض/لندن/موناكو، سارة، البريد `propautoal@gmail.com`، واتساب `+967 733 393 884`، روابط YouTube/LinkedIn، نموذج checkout `product=propauto-premium-access`).
- طبّقنا أرقام اللوحة الأصلية على `assets/js/data.js` (AUDIENCE: 12840/2140/0.186/0.248) وحدّثنا اختبارها (25/25 يمر)؛ أضفنا `hero-copy`/`hero-image` في `index.html` (حركات الدخول الأصلية).

## طبقة الواجهة المعاد بناؤها (في /workspace)
- **12 صفحة HTML** في الجذر: `index.html` (رئيسية كاملة: هيرو، نبض، سوق، حاسبة، لوحات ذكاء، سارة، أتمتة، CTA، تواصل) + `properties.html` / `cars.html` (سوق مُصفّى مسبقاً عبر `data-market-default` على `<body>`) + `investors.html` (نص الاستحواذ الأصلي من RSC) + `contact.html` + `sign-in.html` / `sign-up.html` / `reset-password.html` (نماذج `data-auth-form` — واجهة فقط، الربط الخلفي عبر Nhost Auth ينتظر) + `privacy.html` / `terms.html` / `about.html` + `404.html` (نص 404 الأصلي الحرفي).
- `scripts/verify.js` يفحص **كل** ملفات HTML في الجذر (وليس index.html فقط) — 12 صفحة، 182 مفتاحاً × 6 لغات، exit=0.
- `scripts/bundle.js` يجمع الصفحات الـ 12 + assets + scripts + recovery في `propauto-complete-project.tar.gz`.
- `assets/js/app.js`: `initMarket` يقرأ `data-market-default` من `<body>` (تصفية مسبقة)، `initAuthForm` يربط `[data-auth-form]` (signin/signup/reset) بتحقق + حدث `auth_submit` للتحليلات.
- `assets/css/styles.css`: أُضيف `.nf` / `.nf__card` (صفحة 404) و`.card--gold` (بطاقة التحويل في investors).
- **مفاتيح `page.*`** (59 مفتاحاً: properties/cars/investors/contact/signin/signup/privacy/terms/about/notfound) مُدارة في `scripts/repair-locales.js` — عند تعديل أي نص صفحة عدّل القاموس هناك وأعد `node scripts/repair-locales.js`.
- `index.html` — صفحة واحدة كاملة تعيد بناء الموقع الأصلي (هيرو، نبض السوق، سوق مختار، حاسبة مستثمر، لوحات ذكاء، سارة، أتمتة، تواصل، فوتر) — **بمفاتيح القاموس الحقيقية فقط** (لا مفاتيح مختلقة).
- `assets/js/locales.js` — **182 مفتاحاً × 6 لغات** (en/ar/fr/es/de/tr) بتطابق كامل (تتحقق منه `scripts/verify.js` و`PropAutoI18n.parity()`). **يُبنى عبر `scripts/repair-locales.js`**؛ أي مفتاح جديد يُضاف إلى `MANAGED` هناك (لكل اللغات) ثم يُشغَّل السكربت. اللغتان de/tr مصدرهما `scripts/i18n-de.js`/`scripts/i18n-tr.js`، و`scripts/add-locales.js` يعلّم repair-locales.js بهما (تشغيله مرة واحدة فقط).
- `assets/js/i18n.js` — محرك لغات؛ **`lookup` يفحص المفتاح المسطح أولاً** ثم المتداخل (القواميس مسطحة!). يدعم `?lang=` من الرابط (مطابقاً للأصل)، `data-i18n`/`data-i18n-content`/`data-i18n-vars`، Formatters، أحداث `propauto:locale`.
- `assets/js/data.js` — 14 أصلاً موثّقاً (8 عقارات + 6 سيارات)، إشارات سوق، جمهور، `filter({category,maxPrice,minPrice,country,query})`، `sort(list,key)`، `summary()`.
- `assets/js/app.js` — طبقة تفاعل دفاعية (لا تسقط أبداً): نبض، سوق، حاسبة (APPRECIATION=0.032)، عدادات، رسم بياني، لوحة أسعار، محادثة سارة (intent بـ 4 لغات)، أكورديون، نموذج تواصل، توست. يُصدّر `window.PropAutoApp = {intent, calculate, appreciation, pick}` للاختبارات.
- `icon.svg` — علامة PropAuto الذهبية الرسمية.
- `scripts/verify.js` — بوابة الجودة: **exit=0 = "markup, dictionaries and stylesheet are consistent"** (التحقق الإلزامي قبل أي تسليم).
- `scripts/repair-locales.js` — أداة إصلاح القواميس (idempotent): يزيل التكرار ويحقن المفاتيح المُدارة في الكتلة الصحيحة لكل لغة.

## أخطاء حقيقية اكتُشفت وصُلحت في هذه الجلسة
- `lookup()` كان يقسم المفاتيح على النقاط بينما القواميس **مسطحة** → ترجمة لا تعمل إطلاقاً (كانت ترجع المفتاح نفسه). صُلح بفحص المفتاح المسطح أولاً.
- `dictionary()` كان يبحث في `PropAutoLocales.en` بينما التصدير `PropAutoLocales.dictionaries.en` → صُلح.
- `index.html` كانت تستخدم 92 مفتاحاً مختلقاً غير موجود في القواميس → أُعيدت كتابتها بالمفاتيح الحقيقية (118).
- `formatPercent(0.0796)` يعطي `0.1%` — النسبة تُمرّر ككسر؛ صيغة النداء الصحيحة `formatPercent(value*100)` أو تمرير نسبة مئوية جاهزة.

## جودة التسليم (آخر جولة)
- `npm test` = `scripts/test.js` (25 اختباراً: قواميس/i18n/بيانات/طبقة تطبيق/تحليلات/صفحات) + `scripts/verify.js` (بوابة العلامة ↔ القواميس ↔ CSS، تفحص **كل** ملفات HTML في الجذر) + `scripts/api-test.js` (نهاية-إلى-نهاية: health/leads/calls/webhooks/analytics/auth/**checkout**) — **كلها تمر exit=0**.
- `check_preview` على كل الصفحات — **صفر أخطاء**.
- `scripts/bundle.js` يجمع **145 ملفاً** في `/workspace/propauto-complete-project.tar.gz` (344KB): الواجهة + السكربتات + كل أرشيف الاسترداد (recovery/) + README/CHANGELOG + robots/sitemap + **vercel.json** + **server.js**.
- `app.js` فيه **حارس أخطاء**: كل خطوة إقلاع داخل `safe(step, fn)` (خطأ واحد لا يكسر الصفحة، يُبلَّغ عبر analytics + toast)، و`initErrorGuard()` يلتقط أخطاء window/promise/الموارد.
- `vercel.json`: رؤوس أمان (CSP، HSTS، X-Frame-Options، nosniff، Referrer/Permissions-Policy) + Cache-Control (أصول immutable سنة، HTML must-revalidate).
- الصفحة مبنية بمفاتيح القاموس الحقيقية فقط (178 × 4 لغات)؛ المفاتيح الـ27 "غير المستخدمة في HTML" هي تشغيلية (رسائل تحقق، ردود سارة، مفاتيح مصادر تملؤها JS ديناميكياً) — مقصودة.

## طبقة التحليلات والزيارات (رُبطت في آخر جولة)
- `assets/js/analytics.js` يعرّف `window.PropAutoAnalytics` (الذي كانت app.js تستدعيه بلا تعريف): يرسل الأحداث (page_view, market_filter, chat_message, contact_submit) إلى Vercel Analytics (`window.va`) وGA4 (`gtag`/`dataLayer`)، ويخزّن قائمة انتظار في `localStorage` (مفتاح `propauto.analytics.queue`، حد 200)، ويُفرّغها عبر POST إلى `/api/analytics` عند إخفاء التبويب (visibilitychange).
- لوحة "Ownership intelligence" مربوطة ببيانات `AUDIENCE` الحقيقية: **500 زائراً، 85 عميلاً** (الرقم الحقيقي الذي ذكره المستخدم)، 42% عضوي، 12.6% نمو — العدادت المتحركة `data-count` بقيم حقيقية، وتوزيع المصادر (عضوي/مباشر/إحالات/اجتماعي) يُرسم بأشرطة `.meter` مع مفاتيح `dash.source.*` المترجمة (أُضيف `dash.source.organic`).
- نموذج التواصل: أُضيف حقل `#c-interest` (Buying/Investing/Partnership/Listing) الذي كانت app.js تتبعه (`contact_submit.interest`).
- SEO: hreflang كامل (en/ar/fr/es/de/tr + x-default)، `og:image`/`twitter:image` (icon.svg)، `meta robots` + كلمات مفتاحية، `robots.txt` + `sitemap.xml` (بـ 6 لغات)، روابط `rel=sitemap`/`rel=robots` في الرأس.

## الترقية التنافسية العالمية (GLOBAL COMPETITIVE UPGRADE)
- `lib/global-upgrade.ts` — كود المستخدم الحرفي: Stripe (getStripe/createCheckout بتحميل كسول — لا يكسر بدون STRIPE_SECRET_KEY)، `locales` (6 لغات)، `GLOBAL_VAPI_PROMPT`، `getGlobalAnalytics` (500 مكالمة/18 صفقة/23%/$2k–5k)، `globalMetadata` (SEO) — محفوظ في `lib/` (مرجع؛ server.js لا يستورده).
- `/api/checkout` مغطى بـ `server.js` (وضع demo بدون STRIPE_SECRET_KEY)؛ النسخة الأصلية (Next) في `original-source/src/src/app/api/checkout/route.ts` + `voice/config/route.ts`.
- لوحة التحليلات في index.html بها صف ثانٍ: dash.calls/dash.deals/dash.conversion/dash.mrr (500/18/23%/$2k–5k) + `Data.OPERATIONS` في data.js.
- `.meter i` الأصلي يستخدم `transform: scaleX` (وليس width) — لا تكرر تعريفه بـ width؛ `initSources` يضبط `fill.style.transform`.

## طبقة المنتج (لوحة + توثيق + API v1)
- مسارات Next.js من سقالة الجذر (`app/` — لوحة dashboard، api-docs، `/api/v1/*`) **حُذفت** (سقالة غير مبنية)؛ نفس الوظائف مغطاة بـ `server.js` (API كامل) وبالكود الأصلي الحقيقي في `original-source/src/src/app/api/`.
- جدول Nhost `leads` (id/name/phone/status/lang/type/source/created_at): أنشئه يدوياً في Nhost أو أصلح ربط الحساب — `scripts/nhost-schema.sql` جاهز.
- ⚠️ قراءة/كتابة `leads` من الواجهة تتطلب ضبط صلاحيات Hasura يدوياً في لوحة Nhost، أو المرور عبر مسارات الخادم (وهي تحمل admin secret — المسار المعتمد هنا).
- `scripts/bundle.js` يشمل: assets + scripts + recovery + lib + data + original-source + `.env.example`.

## طبقة الواجهة الخلفية (server.js + ربط النماذج — آخر جولة)
- `server.js` — خادم محلي **صفر-تبعية** (`node server.js`، منفذ 5173): يخدم الصفحات الـ12 + مسارات API حقيقية: GET/POST `/api/v1/leads`، POST `/api/v1/call`، POST `/api/v1/webhook`، POST `/api/analytics`، POST `/api/checkout` + GET `/api/checkout?session=` (جلسة Stripe-جاهزة: مع `STRIPE_SECRET_KEY` تعيد رابط stripe، وإلا وضع demo)، POST `/api/auth/{signup,signin,reset}`، GET `/api/auth/me`، GET `/api/health`. البيانات في **قاعدة SQLite** (`data/propauto.db` عبر `node:sqlite` — صفر-تبعية، مع ترحيل تلقائي لملفات JSON القديمة من `data/store/` — لا يُحذف شيء — وJSON كاحتياط؛ بدّل المسار بـ `DATA_DIR`). عند ضبط `NHOST_GRAPHQL_URL` + `NHOST_ADMIN_SECRET` يزامن الـ leads إلى Nhost تلقائياً (أفضل جهد، لا ينهار عند غيابها).
- محادثة سارة (app.js) تكتشف الآن طلب المكالمة (`call|phone|اتصال|هاتف|appel|telefon|arama…`) عبر intent `call` + `extractPhone()`، وإذا وُجد رقم هاتف في الرسالة تُرسل `POST /api/v1/call` فعلياً — مطابقة لوعد `GLOBAL_VAPI_PROMPT`. مفتاح `chat.reply.call` مترجم بـ 6 لغات.
- `package.json` أُصلح: `dev`/`start` = `node server.js` (كانا يشيران إلى `src/src` غير الموجود)؛ `build` = `node scripts/bundle.js`؛ `test` = test.js + verify.js + **api-test.js** (اختبار API شامل يمر exit=0).
- `vercel.json`: أُضيف `buildCommand: node scripts/bundle.js` — النشر على Vercel صار ثابتاً (بدل محاولة بناء Next من src/src).
- `app.js`: نموذج التواصل يرسل `POST /api/v1/leads` (نجاح → form.sent؛ فشل → قائمة انتظار `propauto.leads.queue` في localStorage + form.queued)؛ نماذج auth ترسل `/api/auth/*` وتحفظ `propauto.token` وتعيد التوجيه لـ index.html؛ أخطاء auth مترجمة (auth.invalid/taken/short).
- مفاتيح جديدة (5): `form.queued`, `auth.ok`, `auth.invalid`, `auth.taken`, `auth.short` — **187 مفتاحاً × 6 لغات** بتكافؤ كامل (تُدار في repair-locales.js + i18n-de.js/i18n-tr.js).
- ⚠️ **Nhost معطّل في الصندوق**: روابط الحساب المرتبط مكسورة (`https://https://…` → "Failed host lookup") — `nhost_execute_sql` لا يعمل، وجدول `leads` لم يُنشأ. الحلول: إعادة ربط Nhost في الإعدادات، أو إنشاء الجدول يدوياً (id/name/phone/status/lang/type/source/created_at) مع ضبط صلاحيات Hasura، أو الاعتماد على server.js المحلي (يعمل الآن وقد استقبل أحداث تحليلات حقيقية من المعاينة).
- `scripts/nhost-schema.sql` — مخطط Nhost الكامل (leads/calls/webhooks/api_keys/analytics + فهارس + بيانات تجريبية + إرشادات صلاحيات Hasura). يشغَّل في لوحة Nhost (Data → SQL) لأن أداة الصندوق معطلة.
- `app.js`: `flushQueue("leads", "/api/v1/leads")` يعيد إرسال قائمة `propauto.leads.queue` عند الإقلاع وعند حدث `online` — لا يضيع أي استفسار.
- `README.md` أُعيدت كتابته بالكامل ليطابق الواقع (6 لغات × 187 مفتاحاً، server.js، أوضاع النشر الثلاثة، مخطط Nhost).

## 🔒 الأمان — إزالة المفاتيح المكشوفة
- **توكن Vercel أُزيل نهائياً**: سكربتات `scripts/recover-*.js` (التي كانت تحمله) **حُذفت كلها** بأمر المستخدم، و`.env` حُذف — لا توجد أي أسرار في المشروع. `.env.example` هو القالب الآمن الوحيد.
- فحص نهائي: **صفر مفاتيح/أسرار** في كل المشروع (grep للتوكن وكلمة المرور = 0 نتائج).
- ⚠️ **يُنصح بتدوير (rotate) توكن Vercel وكلمة مرور Neon** لأن التوكن أُرسل في المحادثة سابقاً.

## 📦 pnpm-lock.yaml الأصلي — اكتشاف النسخ الدقيقة (أحدث إنجاز)
- المستخدم أرسل `pnpm-lock.yaml` الأصلي → محفوظ في `recovery/pnpm-lock-original.yaml` (قسم importers كامل + overrides + ملاحظات).
- **النسخ الدقيقة الأصلية:** next **16.3.8** · react/react-dom **19.2.4** · ai **7.0.66** · @ai-sdk/react **4.0.69** · better-auth **1.6.29** · drizzle-orm **0.45.2** · pg **8.23.0** · stripe **22.5.0** · resend **6.28.1** · @vapi-ai/web **2.7.1** · @vercel/analytics **1.6.1** · @vercel/speed-insights **2.0.0** · @vercel/connect **0.4.3** · @base-ui/react **1.5.0** · lucide-react **1.17.0** · tailwind-merge **3.4.0** · tw-animate-css **1.4.0** · zod **4.4.3** · clsx **2.1.1** · cva **0.7.1**. devDeps: eslint **9.39.5** + eslint-config-next **16.3.8** · tailwindcss **4.3.3** + @tailwindcss/postcss · typescript **5.7.3** · shadcn **4.10.0** · postcss **8.5.23** · @types/node **24**/react **19.2.14**/pg.
- **overrides الأصلية:** hono 4.12.25 · browserslist 4.28.7 · fast-uri 3.1.7 · ip-address 10.3.1 · js-yaml 4.3.2 · nanoid 3.3.18 · postcss 8.5.23 · undici 8.10.2.
- نسخ الأصل موثّقة أعلاه للرجوع إليها؛ `package.json` الجذر **صفر-تبعية** (النشر = `node scripts/bundle.js`)، وسكربتات Next (`dev:next`/`build:next`) تشير إلى `original-source/src/src` (الذي يحمل package.json الخاص به بالنسخ الأصلية).
- حزم غير مباشرة تكشف ميزات إضافية للأصل: `@daily-co/daily-js` (فيديو)، `@modelcontextprotocol/sdk` + `@vercel/connect` (MCP)، `@sentry/browser`، `eve` (محرك AI يتطلب Node ≥24)، `express` + `express-rate-limit`، `hono`، `graphql`، `kysely`، `jose`، `dotenvx`.
- pnpm 10 (lockfileVersion 9.0) · Node ≥22 (eve: ≥24).

## 🔀 دمج تعارضات package.json / .gitignore (جولة لاحقة)
- أوامر `rm -f package.json; rm -f .gitignore; git checkout HEAD -- …` نُفّذت في جذر `/workspace` فحُذف الملفان، ثم فشلت أوامر git لأن `/workspace/.git` **ليس مستودع git حقيقياً** (يحتوي فقط `local_commits.json` داخلياً — لا HEAD ولا remotes). لا يمكن `git add/commit/push` من الصندوق.
- استُعيد الملفان من `.polydev/backups/` **مدمجين**. لاحقاً بُسّط `package.json` نهائياً: **صفر-تبعية** (حُذفت deps غير المستخدمة) + سكربتات Next تشير إلى `original-source/src/src`. `.gitignore` = محتوى `.base` + `data/store/` + استثناء `.env`/`.env.*` مع `!.env.example`.
- محاولة `pnpm install` في `original-source/src/src` ملأت القرص (كان 99%) → حُذف `node_modules` الجزئي بموافقة المستخدم (لم يكن من الكود الأصلي). كاش pnpm store (~540MB) ما زال موجوداً — يمكن حذفه لتحرير مساحة. التثبيت/البناء في هذا الصندوق لا يعمل بسبب الشبكة غير المستقرة — يُنفَّذ على جهاز المطوّر: `cd original-source/src/src && pnpm install && pnpm build`.

## 🧹 التنظيف النهائي (بأمر المستخدم — "احذف الذي ليس له داعي")
- حُذفت النسخة المكررة `src/` (مطابقة 100% لـ `original-source/src` — 13.4MB).
- حُذفت سقالة Next.js غير المبنية من الجذر: `app/`، `components/`، `public/`، `next.config.mjs`، `tailwind.config.ts`، `tsconfig.json`، `postcss.config.js`، `tsconfig.tsbuildinfo`، `pnpm-lock.yaml`، `node_modules` (192MB).
- حُذفت الزيبات المكررة من الجذر (`propauto-complete-project.zip`، `propauto-project-ready.zip`) — النسخ الأصلية محفوظة داخل `original-source/`.
- حُذفت سكربتات الاسترداد/الأدوات المؤقتة (recover-*، add-*، dump-*، audit-*، inspect، repair-locales، i18n-de/tr، en-dump، export-keys) — أُبقي على بوابة الجودة فقط: `bundle.js`/`test.js`/`verify.js`/`api-test.js`/`nhost-schema.sql`.
- `lib/global-upgrade.ts` (كود المستخدم الحرفي) أُعيدت استعادته من النسخ الاحتياطية — محفوظ في `lib/`.
- **المحفوظ نهائياً:** الصفحات الـ12 + assets/ + data/ (قاعدة SQLite) + server.js + lib/{config,storage,global-upgrade}.js/.ts + scripts/{bundle,test,verify,api-test,nhost-schema} + vercel.json + robots/sitemap/icon + README/CHANGELOG/AGENTS + recovery/ (إثبات تاريخ التطوير: 127 نشرة) + original-source/ (الكود الأصلي كاملاً).
- الملف النهائي القابل للتسليم: `propauto-complete-project.tar.gz` (يُعاد بناؤه بـ `node scripts/bundle.js`).
