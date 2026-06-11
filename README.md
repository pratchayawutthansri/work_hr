# HRMS Portal (Next.js Monolith)

ระบบ HRMS Portal ในรูปแบบ Full-stack Monolith (Next.js App Router + React + TypeScript + Prisma ORM + PostgreSQL/Supabase)

---

## 🛠️ ข้อมูลเบื้องต้นก่อนใช้งาน (Prerequisites)

1.  **Node.js**: แนะนำเวอร์ชัน `18.x` หรือสูงกว่า
2.  **PostgreSQL (Supabase)**: โครงการต้องการฐานข้อมูล PostgreSQL ที่พร้อมใช้งานบน Supabase (หรือระบบอื่นๆ)

---

## 🚀 ขั้นตอนการตั้งค่าและเปิดใช้งานระบบ (Setup Guide)

ดำเนินตามคำสั่งเหล่านี้ทีละขั้นตอนในระบบปฏิบัติการของคุณ (เปิด Terminal/PowerShell ที่โฟลเดอร์โครงการ):

### 1. ติดตั้ง Dependencies
ติดตั้งโมดูลที่จำเป็นทั้งหมดสำหรับ Next.js, React และ Prisma:
```bash
npm install
```

### 2. ตั้งค่าไฟล์ Environment Variables
คัดลอกไฟล์ต้นแบบเพื่อสร้างไฟล์ตั้งค่าของตัวเอง:
```powershell
# สำหรับ Windows (PowerShell)
Copy-Item .env.example .env

# สำหรับ macOS / Linux / Bash
cp .env.example .env
```
เปิดไฟล์ `.env` ที่สร้างขึ้นใหม่ แล้วแก้ไขค่า `DATABASE_URL` ให้เป็น URL เชื่อมต่อของฐานข้อมูล Supabase ของคุณ:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
```

### 3. ซิงค์โครงสร้างตารางไปยัง Supabase (Prisma Push)
ส่งโครงสร้างตารางข้อมูลใน `schema.prisma` ขึ้นไปสร้างตาราง SQL จริงใน Supabase:
```bash
npx prisma db push
```

### 4. ใส่ข้อมูลเริ่มต้นของระบบ (Database Seeding)
รันสคริปต์เพื่อเพิ่มประวัติข้อมูลพนักงานและบัญชีผู้ดูแลระบบ (Admin) ตั้งต้นลงสู่ฐานข้อมูล:
```bash
npm run seed
```

### 5. ตรวจสอบความถูกต้องของระบบวันลา (Verification Tests)
รันสคริปต์ทดสอบการจำลองหักลดวันลาสะสม, การตรวจเช็กวันหยุดเสาร์-อาทิตย์ และธุรกรรมการป้องกันยอดลาติดลบ:
```bash
node scripts/test_leave.js
```

### 6. เริ่มการรันระบบในโหมดพัฒนา (Development Server)
เริ่มการรันเซิร์ฟเวอร์ทดสอบ Next.js ในเครื่อง:
```bash
npm run dev
```
เมื่อรันสำเร็จ สามารถเปิดเบราว์เซอร์ไปที่:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔐 บัญชีเข้าใช้งานสำหรับทดสอบ (Seeded Admin Account)

*   **อีเมลผู้ดูแลระบบ (Admin Email):** `admin@hrms.local`
*   **รหัสผ่าน (Password):** `Password123!`

---

## 📂 โครงสร้างโฟลเดอร์หลักในระบบ
*   `app/` - จัดเก็บหน้าจอแอปพลิเคชัน (Pages Layouts) และ API routes ต่างๆ ของ Next.js
*   `components/` - โครงสร้างส่วนกลางหน้าจอ เช่น Layout หลัก และ Dialog กล่องข้อความ
*   `lib/` - ส่วนเชื่อมต่อ Prisma database client และกลไกสิทธิ์การใช้งาน
*   `prisma/` - โครงสร้างการอ้างอิงตารางและ SQL schema ปลายทาง
*   `scripts/` - สคริปต์การทำข้อมูลตั้งต้น (Seeding) และชุดทดสอบความถูกต้อง
