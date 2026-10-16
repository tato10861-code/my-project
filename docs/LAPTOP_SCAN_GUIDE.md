# دليل فحص PropAuto بأداة Mercor على اللابتوب (النسخة المحدّثة)

سري: لك وحدك. لا يحتوي أي كلمة مرور أو مفتاح، ولا تكتب أيّاً منها في أي أمر.

## 0. ما الجديد عن النسخة السابقة
- آخر كود: الفرع `main` عند الالتزام **آخر التزام على `main`** (دمج PR #62، بعد #57 و#58)، وليس `d627408`.
- أضفنا: قواعد اللغة، واسم العميل ولغته في بريد الحجز، وملف `docs/ARCHITECTURE.md` (تقرير المعمارية)، واختبارات الآن 110.

## 1. أين المشروع كله (مكان واحد)
| ماذا | الرابط |
|---|---|
| المستودع (خاص) | https://github.com/tato10861-code/my-project |
| آخر دمج | https://github.com/tato10861-code/my-project/pull/57 |
| الموقع الحي | https://propauto-ai-al-closer-saas.vercel.app |
| مشروع Vercel | https://vercel.com/ta-to/propauto-ai-al-closer-saas |
| وكيل سارة القديم (محفوظ ومدمج) | مجلد `agents/sara-closer` |
| أدلة أغسطس (v0) | مجلد `evidence/` والفرع `archive/v0-august-2026` |

## 2. ما يجب تثبيته (مرة واحدة)
1. **git**: https://git-scm.com/downloads
2. **Python 3.11 أو أحدث**: https://www.python.org/downloads/ (على ويندوز فعّل خيار Add python to PATH)
3. **Node.js 24**: https://nodejs.org ثم تحقق من `node -v`
4. **pnpm**: https://pnpm.io/installation
5. **Claude Code** مسجّلاً الدخول: https://code.claude.com/docs
6. **الأداة**: ملف `repo-quality-evaluation-measure-ext.zip` الذي رفعته. فكّه في مجلد مثل `~/tools/repo-quality`.

## 3. نسخة نظيفة (لا تفحص مجلد عملك)
الأداة تعدّل المجلد أثناء البناء، فاستخدم نسخة جديدة:

```
git clone https://github.com/tato10861-code/my-project.git ~/scan/my-project
cd ~/scan/my-project
git checkout main
git log --oneline -1
```
يجب أن يظهر آخر التزام على `main` أو أحدث. إن طلب git تسجيل الدخول فاستخدم حساب GitHub الذي يملك المستودع.

## 4. تحقق سريع قبل الفحص (5 دقائق)
```
cd ~/scan/my-project
pnpm install
pnpm test
pnpm typecheck
```
يجب أن تنجح الاختبارات (110). إن فشل شيء فأرسل لي آخر 20 سطراً من المخرجات.

## 5. تثبيت متطلبات الأداة
```
cd ~/tools/repo-quality
python3 -m venv .venv
source .venv/bin/activate        # ويندوز: .venv\Scripts\activate
pip install -r requirements.txt
```

## 6. تشغيل الفحص
```
python measure.py ~/scan/my-project --out ./out/my-project --review
```
- المدة المتوقعة: 20 إلى 60 دقيقة. لا تغلق الطرفية.
- إن انتهت مهلة البناء: `--build discover --timeout-build 2700`
- لا تشغّله على مجلد عملك الأصلي.

## 7. النتيجة
داخل `./out/my-project` أربعة ملفات. المطلوب للرفع اثنان:
- `measurement.json`
- `codebase_repo_mining.json`

راجعهما بنفسك، أو أرسل لي نصهما وأترجمه لك، قبل أي رفع. الرفع على بوابة Mercor تقوم به أنت.

## 8. ما تذكره بصدق عن الأرقام
- **الزيارات (مثبتة من Vercel Web Analytics، 15 سبتمبر إلى 14 أكتوبر 2026):** 105 زوّار و158 مشاهدة صفحة من حوالي 13 دولة (اليمن 69 زائراً، أمريكا 18، إيطاليا 4). الخطة المجانية تعرض 31 يوماً فقط. رقم "560+" لم أتحقق من مصدره، فاذكره فقط مع مصدره. هذه زيارات وليست عملاء ولا مبيعات. أرفق لقطة شاشة من https://vercel.com/ta-to/propauto-ai-al-closer-saas/analytics إن وُجدت.
- **تاريخ git:** يبدأ في 24 سبتمبر 2026. عمل أغسطس كان في v0 قبل النقل، ودليله في `evidence/`. اذكر ذلك نصاً، ولا تعدّل أي تاريخ.
- **الصوت (Vapi) والنماذج (Gemini)** خدمات خارجية، وواتساب غير مربوط. التفاصيل في `docs/ARCHITECTURE.md`.
- لا أعدك بتقييم أو سعر محدد.

## 9. ملاحظة الخصوصية
أثناء الفحص يُرسل الكود إلى مزوّد النموذج (Claude) عبر حسابك في Claude Code. هذا من طبيعة الأداة. لا تضع مفاتيح داخل المجلد المفحوص (الملفات `.env*` ليست في المستودع).

## 10. اختبار الحجز (قبل العرض)
1. افتح الموقع الحي وتحدث مع سارة بأي لغة، واطلب معاينة.
2. تحقق من وصول بريد بعنوان `🔥 New viewing request via Sarah - الاسم (اللغة)` إلى `propautoal@gmail.com`.
3. في Neon (من https://vercel.com/ta-to/propauto-ai-al-closer-saas ثم Storage) شغّل:
   `SELECT id, created_at, status, failure_reason FROM propauto_bookings ORDER BY created_at DESC LIMIT 5;`
4. أرسل لي قيمة `failure_reason` فقط (لا كلمات مرور).

## 11. ملف الإثبات (يُرفق مع التقرير)
`evidence/PROJECT_ORIGIN.md` داخل المستودع (على `main`). فيه بداية المشروع في 14 أغسطس 2026 (من بيانات Vercel)، وعناوين محادثات v0 وتواريخها، وسبب بدء تاريخ git في 24 سبتمبر، والزيارات المقاسة (105 زوّار و158 مشاهدة بين 15 سبتمبر و14 أكتوبر). لا يغيّر تاريخ git، وهو نص صريح بما لا يثبته (لا عملاء يدفعون).
