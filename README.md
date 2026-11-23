# پلتفرم خدمات تخصصی

Next.js (فرانت) + FastAPI (بک‌اند) + Postgres + Ollama (اختیاری، فقط پیش‌نویس) + n8n (اختیاری).

## ساختار
```
backend/    FastAPI, SQLAlchemy, Alembic, تست‌ها
frontend/   Next.js 14 (RTL، فرم پویا از schema_json)
templates/  قالب‌های docx/pptx (فاز ۳)
n8n/        workflow آماده‌ی اعلان سفارش (قابل import)
docker-compose.yml   render.yaml   .github/workflows/ci.yml
```

## اجرای لوکال
```bash
cp .env.example .env          # ADMIN_API_KEY را عوض کن
docker compose up --build
# فرانت: http://localhost:3000   API docs: http://localhost:8000/docs
docker compose --profile ai up -d ollama && docker compose exec ollama ollama pull qwen2.5:7b
```
بدون Docker:
```bash
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
alembic upgrade head && python -m app.seed && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

## API
عمومی: `GET /api/product-types` · `GET /api/product-types/{slug}` · `POST /api/orders` · `GET /api/orders/track/{code}`
ادمین (هدر `X-Admin-Key`): `GET /api/admin/orders` · `PATCH /api/admin/orders/{id}/status` ·
`GET|PUT /api/admin/product-types` · `POST /api/admin/orders/{id}/ai-draft` (۲۰۲، پس‌زمینه؛ وضعیت در `ai_status`) ·
`PATCH /api/admin/orders/{id}/price` · `POST /api/admin/orders/{id}/mark-paid` ·
فایل: `GET|POST /api/admin/orders/{id}/files` (+`/{fid}/complete`) · `GET /api/admin/files/{fid}/download` · `DELETE /api/admin/files/{fid}`

مشتری (با کد پیگیری): `POST /api/orders/track/{code}/pay` · `GET|POST /api/orders/track/{code}/files` (+`/{fid}/complete`, `/{fid}/download`)
· `GET /api/payments/callback` (بازگشت از درگاه)

افزودن Product Type جدید = یک `PUT /api/admin/product-types` با `schema_json`؛ بدون تغییر کد.

## مرحله ۱ — GitHub
```bash
git init && git add . && git commit -m "chore: initial commit"
git branch -M main
git remote add origin git@github.com:USERNAME/REPO.git
git push -u origin main
```
ریپو را Private بساز. قبل از push مطمئن شو `.env` در `git status` نیست.

## مرحله ۲ — Render (بک‌اند + دیتابیس)
1. Render → **New → Blueprint** → ریپو را انتخاب کن (`render.yaml` خوانده می‌شود).
2. بعد از ساخت، در سرویس `services-api` → Environment:
   - `CORS_ORIGINS` = آدرس Vercel (مرحله بعد)
   - `OLLAMA_BASE_URL` = آدرس Ollama (یا خالی بگذار تا AI-draft فعلاً 503 بدهد)
   - `ADMIN_API_KEY` خودکار ساخته شده؛ از همان‌جا کپی کن.
3. تست: `https://services-api.onrender.com/health` و `/docs`.
مایگریشن و seed هنگام هر استارت اجرا می‌شود (`backend/entrypoint.sh`).

## مرحله ۳ — Vercel (فرانت)
1. **Add New → Project** → ریپو → **Root Directory: `frontend`**.
2. Environment Variable: `NEXT_PUBLIC_API_URL` = آدرس Render.
3. Deploy. بعدش `CORS_ORIGINS` را در Render با آدرس واقعی Vercel به‌روز کن.

## مرحله ۴ — Ollama
روی Render/Vercel اجرا نمی‌شود. گزینه‌ها: سیستم/سرور خودت + Cloudflare Tunnel، یا VPS.
```bash
cloudflared tunnel --url http://localhost:11434   # آدرس خروجی را در OLLAMA_BASE_URL بگذار
```
هشدار: Ollama احراز هویت ندارد؛ آدرس تونل را عمومی منتشر نکن (Cloudflare Access یا یک reverse proxy با توکن جلویش بگذار).

## مرحله ۵ — دامنه
1. دامنه را بخر (Cloudflare Registrar / Namecheap / Porkbun).
2. Vercel → Settings → Domains → `example.com` و `www.example.com` را اضافه کن؛ رکوردهایی که Vercel نشان می‌دهد را در DNS بگذار.
3. API روی ساب‌دامین: Render → Settings → Custom Domains → `api.example.com`، سپس `CNAME api → services-api.onrender.com`.
4. به‌روزرسانی: `NEXT_PUBLIC_API_URL=https://api.example.com` (Vercel، سپس Redeploy) و `CORS_ORIGINS=https://example.com,https://www.example.com` (Render).

## پنل ادمین
آدرس: `/admin`. با همان `ADMIN_API_KEY` وارد شو. کلید در cookie با `httpOnly` + `SameSite=Strict` نگه‌داری می‌شود و
مرورگر هرگز مستقیم با API ادمین حرف نمی‌زند؛ همه‌چیز از proxy سمت سرور Next.js (`/api/admin/*`) می‌گذرد.
امکانات: فیلتر وضعیت، تغییر وضعیت، دیدن فیلدهای سفارش، تولید پیش‌نویس AI (پس‌زمینه + polling خودکار).
روی Vercel فقط `NEXT_PUBLIC_API_URL` لازم است (`API_INTERNAL_URL` اختیاری).

## ایمیل کد پیگیری (Resend)
1. در [resend.com](https://resend.com) حساب بساز و `RESEND_API_KEY` بگیر.
2. تست: با فرستنده‌ی پیش‌فرض `onboarding@resend.dev` فقط به ایمیل خودِ حساب Resend می‌شود ایمیل زد.
3. لانچ: دامنه‌ات را در Resend Verify کن (رکوردهای SPF/DKIM در DNS) و `EMAIL_FROM=Services <noreply@yourdomain.com>` بگذار.
4. `PUBLIC_SITE_URL` را آدرس سایت بگذار (لینک پیگیری داخل ایمیل از آن ساخته می‌شود).

ایمیل هنگام ثبت سفارش و هنگام هر تغییر وضعیت ارسال می‌شود. اگر `RESEND_API_KEY` خالی باشد، ارسال ایمیل بی‌صدا غیرفعال است.
شکست ارسال هیچ‌وقت ثبت سفارش را خراب نمی‌کند (فقط لاگ می‌شود).

## n8n — اعلان سفارش جدید
بک‌اند روی دو رویداد به `N8N_WEBHOOK_URL` یک POST می‌زند: `order.created` و `order.status_changed`
(بدنه: `{"event": "...", "order": {tracking_code, product, product_slug, customer_name, customer_email, status, fields}}`
و هدر `X-Webhook-Secret`).
1. `docker compose --profile automation up -d n8n` → `http://localhost:5678`
2. Workflows → Import from file → `n8n/order-notifications.json`
3. در node «Check secret» مقدار `N8N_WEBHOOK_SECRET` را جایگزین کن؛ در node تلگرام Credential و `chatId` را بگذار
   (یا node را با Slack/Email/WhatsApp عوض کن).
4. workflow را **Active** کن. آدرس production (`/webhook/order-events`، نه `/webhook-test/...`) را در `N8N_WEBHOOK_URL` بگذار.
5. روی Render، n8n باید از اینترنت در دسترس باشد (سرور/VPS یا n8n Cloud)؛ آدرس `http://n8n:5678` فقط داخل docker-compose کار می‌کند.

> workflow دستی نوشته شده و import آن را اینجا روی n8n واقعی اجرا نکردم؛ اگر node‌ای هنگام import خطا داد، همان node را از UI دوباره بساز (ساختار payload ثابت است).

## مدیریت محصولات (`/admin/products`)
ساخت و ویرایش Product Type با ویرایشگر بصری فیلدها (نام، برچسب، نوع، الزامی، گزینه‌ها، ترتیب) و پیش‌نمایش `schema_json`.
بک‌اند schema را اعتبارسنجی و نرمال می‌کند (نام فیلد انگلیسی و یکتا، گزینه‌های select و…) و خطاها را فارسی برمی‌گرداند.
حذف محصول عمداً وجود ندارد (سفارش‌های قبلی به آن وابسته‌اند)؛ فقط «غیرفعال‌سازی». slug بعد از ساخت قابل تغییر نیست.

## آپلود فایل (پیوست مشتری + خروجی تحویلی)
فایل‌ها با **presigned URL** مستقیم بین مرورگر و bucket جابه‌جا می‌شوند؛ از Vercel (سقف ۴.۵MB بدنه) و Render عبور نمی‌کنند.
- مشتری بعد از ثبت سفارش (و در `/track`) پیوست اضافه می‌کند؛ ادمین از پنل «خروجی تحویلی» آپلود می‌کند.
- **قفل پرداخت:** اگر برای سفارش مبلغ تعیین شده و پرداخت نشده باشد، دانلود خروجی تحویلی برای مشتری ۴۰۲ می‌دهد.
- محدودیت‌ها: فرمت‌های مجاز در `routers/files.py`، `MAX_UPLOAD_MB` (پیش‌فرض ۲۵)، حداکثر ۲۰ فایل از هر نوع برای هر سفارش؛ بعد از آپلود، حجم واقعی با HEAD تایید می‌شود.
- لوکال: MinIO در docker-compose (کنسول: `http://localhost:9001`، bucket خودکار ساخته می‌شود).

**پروداکشن (مثلاً Cloudflare R2):** bucket **خصوصی** بساز، API Token بساز و در Render بگذار:
`S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`، `S3_REGION=auto`، `S3_BUCKET`، `S3_ACCESS_KEY_ID`، `S3_SECRET_ACCESS_KEY`.
چون مرورگر مستقیم به bucket می‌نویسد، **CORS** را روی bucket تنظیم کن:
```json
[{"AllowedOrigins": ["https://yourdomain.com"], "AllowedMethods": ["GET", "PUT", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600}]
```
آپلودهای نیمه‌کاره (شروع شده و تمام‌نشده) ردیف `pending` و شیء باقی می‌گذارند؛ یک Lifecycle rule روی bucket برای پاک‌سازی شیءهای قدیمی بگذار.

## پرداخت
جریان: ادمین مبلغ را تعیین می‌کند (ایمیل + وب‌هوک `order.quoted`) ← مشتری در `/track` «پرداخت آنلاین» می‌زند ←
درگاه ← `GET /api/payments/callback` ← **تایید (verify) سمت سرور با مبلغ ذخیره‌شده در دیتابیس** ← ایمیل/وب‌هوک `order.paid`.
مبلغ و سفارش هرگز از query string خوانده نمی‌شوند و callback idempotent است.

| `PAYMENT_PROVIDER` | کاربرد |
|---|---|
| `zarinpal` | درگاه واقعی زرین‌پال (`ZARINPAL_MERCHANT_ID`؛ تست: `ZARINPAL_SANDBOX=true`). همیشه به ریال فراخوانی می‌شود (تومان×۱۰). |
| `mock` | فقط توسعه/تست؛ با `APP_ENV=production` خودکار رد می‌شود. |
| `none` | پرداخت آنلاین خاموش؛ «تایید پرداخت دستی» در پنل (واریز بانکی/کارت‌به‌کارت) همچنان کار می‌کند. |

زرین‌پال: دامنه‌ی callback باید با دامنه‌ی ثبت‌شده‌ی پذیرنده مطابقت داشته باشد؛ `PUBLIC_API_URL` را روی آدرس عمومی API بگذار.
اگر درگاه دیگری لازم است، فقط `start()` و `verify()` در `services/payments.py` را پیاده کن.

## چک‌لیست قبل از لانچ
- [ ] `ADMIN_API_KEY` قوی و فقط در Render
- [ ] Postgres پولی/بکاپ‌دار (نه free)
- [ ] پلن پولی Render (بدون sleep)
- [ ] `APP_ENV=production`، پرداخت واقعی با sandbox زرین‌پال یک بار از اول تا آخر تست شده
- [ ] CORS روی bucket و Lifecycle rule برای آپلودهای ناتمام
- [ ] Rate limit روی `POST /api/orders` و `POST /api/orders/track/{code}/files` (مثلاً slowapi یا Cloudflare)
- [ ] Rate limit روی `/api/admin-login` (حدس زدن کلید) و در صورت نیاز کاربران ادمین جدا به‌جای یک کلید مشترک
- [ ] دامنه‌ی فرستنده در Resend verify شده
- [ ] workflow در n8n روی Active و سرور n8n از اینترنت در دسترس
- [ ] خروجی AI همیشه بازبینی انسانی شود
