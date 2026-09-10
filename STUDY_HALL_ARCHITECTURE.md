# معماری ماژول سالن مطالعه

## تحلیل پروژه موجود

پروژه React 19 + TypeScript + Vite و Capacitor Android است، نه Flutter. داده‌ها در حال حاضر LocalStorage هستند، احراز هویت واقعی وجود ندارد و `UserProfile` نقش کاربر محلی را دارد. ناوبری با `NavTab` و state مرکزی `App.tsx` انجام می‌شود. زبان بصری اپ از Vazirmatn، RTL، سطح‌های روشن نرم، گوشه‌های گرد، indigo برای ساختار و coral برای اقدام اصلی استفاده می‌کند.

ماژول بدون Router یا State Manager جدید به همین الگو متصل شده تا وابستگی و ریسک رگرسیون اضافه نشود. ثبت نهایی زمان از مسیر موجود `StudySession` عبور می‌کند؛ بنابراین مطالعه مجازی و حضوری همان لحظه وارد آمار کلی امروز، هفتگی و ماهانه می‌شوند.

## مرزبندی Feature

`src/features/studyHall/types.ts` مدل Domain و قرارداد Repository را تعریف می‌کند.

`src/features/studyHall/repository.ts` پیاده‌سازی Local/Mock است و تنها لایه‌ای است که UI با آن حرف می‌زند. برای اتصال Backend کافی است کلاس API همان `StudyHallRepository` را پیاده کند و Provider آن عوض شود؛ UI و User Flow تغییر نمی‌کنند.

`src/features/studyHall/StudyHallView.tsx` تجربه دانش‌آموز و مدیر، تایمر، Check-in، QR validation، Live Hall Map، Pause/Resume، Check-out و خلاصه نشست را مدیریت می‌کند.

## مدل نشست

هر نشست دارای Student, Organization, Branch, Hall, Section, Seat, QR, Subject، زمان ورود و خروج، مدت حضور، مدت مطالعه مفید، status، date، syncStatus و timestampهای ساخت/ویرایش است. `syncStatus` از ابتدا چرخه `pending -> syncing -> synced | failed` را پشتیبانی می‌کند.

مدت حضور و مطالعه مفید جدا ثبت می‌شوند. در نشست حضوری، Pause فقط مطالعه مفید را متوقف می‌کند و حضور ادامه دارد. در نشست مجازی، حضور و مطالعه یک مقدار دارند.

## QR و امنیت

QR به عنوان token امضاشدنی در نظر گرفته شده، نه URL. Local Repository اکنون اعتبار QR، فعال بودن سالن، دسترسی به صندلی، اشغال/رزرو بودن و Session فعال را بررسی می‌کند. در Backend این validation باید اتمیک و سمت سرور باشد و پاسخ موفق شامل Context کامل Organization تا Seat برگرداند.

قرارداد پیشنهادی:

- `POST /study-halls/check-in/validate` با `qrToken`, `studentId`, `deviceTime`, `locationProof?`
- `POST /study-halls/sessions` برای Check-in اتمیک و قفل Seat
- `PATCH /study-halls/sessions/:id` برای heartbeat, pause, resume و sync
- `POST /study-halls/sessions/:id/check-out` برای محاسبه نهایی و آزادسازی Seat
- `GET /study-halls/:id/live` برای Snapshot اولیه
- `WS /study-halls/:id/live` برای تغییرات لحظه‌ای Seatها

GPS، Wi-Fi، Beacon و Dynamic QR باید به شکل `VerificationProvider`های مستقل به validation pipeline اضافه شوند.

## Information Architecture

سالن مطالعه یک مقصد اصلی در Bottom Navigation است. سطح اول دو تجربه مستقل «مجازی» و «حضوری» دارد. حالت دانش‌آموز روی شروع سریع نشست، صندلی من و QR متمرکز است. حالت مدیر روی ظرفیت، نقشه زنده و عملیات صندلی متمرکز است. تغییر نقش فعلاً برای دمو محلی از دکمه هدر انجام می‌شود؛ بعد از اتصال Auth باید role/permission از Session کاربر خوانده شود و این دکمه فقط برای نقش مجاز نمایش داده شود.

## گام‌های Backend بعدی

1. جایگزینی `LocalStudyHallRepository` با API Repository و نگه داشتن Local Repository به عنوان cache.
2. افزودن Queue پایدار برای Sync و retry با backoff.
3. انتقال validation و Seat locking به transaction سمت سرور.
4. افزودن role/permission واقعی و scope سازمان/شعبه.
5. اتصال Live Map به WebSocket یا SSE.
6. افزودن CRUD کامل Organization, Branch, Hall, Section, Seat, Assignment, Reservation و Subscription در پنل مدیریت.
