# ระบบจองคิวแจ้งปัญหาแอป

React + Vite (หน้าบ้าน) · Node.js + Express (หลังบ้าน) · Google Sheets (ฐานข้อมูล) · Deploy บน Render ฟรี

- ลูกค้า: `/` หน้าหลัก + ปฏิทิน, `/book` ลงคิว, `/check` เช็คคิว, `/contact` ติดต่อแอดมิน
- แอดมิน: `/admin` (ไม่มีลิงก์จากหน้าลูกค้า)

## รันในเครื่อง

```bash
npm install
cp .env.example .env      # ใส่ ADMIN_PASSWORD อย่างน้อย
npm run dev               # API ที่ :3000, หน้าเว็บที่ http://localhost:5173
```

ถ้ายังไม่ใส่ `APPS_SCRIPT_URL` ระบบจะเก็บข้อมูลในหน่วยความจำ (หายเมื่อรีสตาร์ท) ใช้ทดสอบหน้าตาได้เลย

## ตั้งค่า Google Sheet (ผ่าน Apps Script — ฟรี ไม่ต้องผูกบัตร)

1. สร้าง Google Sheet เปล่า 1 ไฟล์ด้วยบัญชี Gmail ของร้าน
2. ในชีต ไปที่เมนู **ส่วนขยาย (Extensions) → Apps Script**
3. ลบโค้ดเดิมในไฟล์ `Code.gs` ทั้งหมด แล้ววางโค้ดจากไฟล์ [`apps-script/Code.gs`](apps-script/Code.gs) แทน
4. แก้บรรทัด `const SECRET = '...'` เป็นข้อความสุ่มยาวๆ เช่น `k8Qz2vN7pR4tX9mW` แล้วกดบันทึก 💾
5. กด **Deploy → New deployment** แล้วตั้งค่าดังนี้
   - กดไอคอนเฟือง ⚙️ แล้วเลือก **Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone
   - กด Deploy
6. Google จะขอสิทธิ์ ให้กด Authorize access แล้วเลือกบัญชีของร้าน
   - ถ้าขึ้นหน้า "Google hasn't verified this app" ให้กด **Advanced → Go to ... (unsafe)** ได้ เพราะเป็นสคริปต์ของเราเอง
   - จากนั้นกด Allow
7. คัดลอก **Web app URL** ที่ได้ (ลงท้ายด้วย `/exec`)
8. ตั้งค่าตัวแปรใน `.env` หรือบน Render
   - `APPS_SCRIPT_URL=<URL จากข้อ 7>`
   - `APPS_SCRIPT_SECRET=<ข้อความเดียวกับ SECRET ในข้อ 4>`

เมื่อเปิดเซิร์ฟเวอร์ครั้งแรก ระบบจะสร้างชีต `Queues`, `Archive`, `Options` และ `Settings` ให้อัตโนมัติ พร้อมข้อมูลตัวอย่าง

- **Options**: แก้รายชื่อแอปและปัญหาสำหรับ dropdown ได้ที่นี่ (1 แถว = 1 ปัญหา) ตัวเลือก "อื่นๆ" ระบบเพิ่มให้เอง
- **Settings**: แก้ผ่านปุ่ม "ตั้งค่า" ในหน้าแอดมินได้
- **Archive**: คิวที่แก้ไขเสร็จแล้วและเก่ากว่า 90 วันจะถูกย้ายมาที่นี่อัตโนมัติวันละครั้ง ชีตหลักจึงเล็กและเร็วไปได้ยาวๆ

> **อัปเดต Code.gs (เวอร์ชัน 2 — เพิ่มช่องข้อมูลติดต่อใหม่)**: ถ้าเคยตั้งค่าไว้แล้ว ให้วางโค้ดจาก `apps-script/Code.gs` ทับของเดิม
> (ใส่ `SECRET` เดิมกลับไป) แล้วกด **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
> เปิดเซิร์ฟเวอร์ครั้งถัดไป ระบบจะปรับคอลัมน์ชีต Queues ให้อัตโนมัติ ข้อมูลเดิมไม่หาย
> หลังจากเวอร์ชันนี้ ถ้าเพิ่มหรือแก้ช่องในฟอร์ม **ไม่ต้อง deploy Apps Script ใหม่อีก** และสลับลำดับคอลัมน์ใน Sheet ได้

> **ถ้าแก้โค้ดใน Apps Script ภายหลัง** ให้กด **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
> อย่ากด New deployment เพราะ URL จะเปลี่ยน

## Deploy บน Render (ฟรี)

1. Push โค้ดขึ้น GitHub
2. ที่ Render ไปที่ **New → Blueprint** แล้วเลือก repo นี้ (Render จะอ่าน `render.yaml`)
3. กรอกค่า `ADMIN_PASSWORD`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET` และ `VITE_LINE_URL` (ลิงก์ LINE ร้าน) — `JWT_SECRET` ระบบสุ่มให้เอง
   - `VITE_LINE_URL` ใช้เป็นลิงก์สำรองให้ปุ่ม "ติดต่อแอดมินทาง LINE" ที่ขึ้นเมื่อเว็บมีปัญหา (ทำงานได้แม้เซิร์ฟเวอร์ล่ม)
4. รอ build เสร็จแล้วเปิด URL ที่ได้

> Render แพ็กฟรีจะพักเซิร์ฟเวอร์เมื่อไม่มีคนเข้า 15 นาที ครั้งแรกที่เข้าหลังจากนั้นจะช้าประมาณ 30–50 วินาที
> ถ้าไม่อยากให้พัก ให้ตั้ง [UptimeRobot](https://uptimerobot.com) (ฟรี) ให้เรียก `https://<your-app>.onrender.com/api/health` ทุก 5–10 นาที

## รูปแบบรหัสคิว

`A01-231069-1111` = คิวที่ **01** ของวันที่ **23/10/(25)69** และ PIN **1111**

- เลขลำดับเริ่มนับใหม่ทุกวัน
- PIN 4 หลักสุ่มให้ไม่ซ้ำกับคิวที่สร้างในเดือนนี้และคิวที่ยังไม่เสร็จ จึงนำเลขกลับมาใช้ใหม่ได้ทุกเดือน
- การเช็คคิวถูกจำกัดไว้ที่ 10 ครั้งต่อ 5 นาทีต่อ IP เพื่อกันการสุ่มเดา PIN
