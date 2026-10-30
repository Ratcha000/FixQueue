# Deploy บน Netlify (ฟรี)

โฟลเดอร์นี้ใช้ deploy ทั้งหน้าเว็บและ API ขึ้น Netlify โดยไม่ต้องแก้ไฟล์เดิมของโปรเจกต์

- หน้าเว็บ build จาก `client/` เดิม
- API คือ Express เดิม (`server/routes/`) ทำงานเป็น Netlify Function ตัวเดียว (`functions/api.js`)

## ขั้นตอน

1. Push โค้ดขึ้น GitHub
2. ไปที่ [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → เลือก repo นี้
3. ช่อง **Base directory** ใส่ `deploy-netlify` (ค่าอื่นปล่อยว่างไว้ ระบบจะอ่านจาก `netlify.toml` เอง)
4. ไปที่ **Site configuration → Environment variables** แล้วเพิ่ม

   | ตัวแปร | ค่า |
   |---|---|
   | `ADMIN_PASSWORD` | รหัสเข้าหน้าแอดมิน |
   | `APPS_SCRIPT_URL` | URL Web app ของ Apps Script (ตัวเดียวกับที่ใช้บน Render) |
   | `APPS_SCRIPT_SECRET` | ต้องตรงกับ `SECRET` ใน Code.gs |
   | `VITE_LINE_URL` | ลิงก์ LINE ร้าน |
   | `JWT_SECRET` | ข้อความสุ่มยาวๆ **ต้องตั้งเอง** (Netlify ไม่สุ่มให้เหมือน Render) |

5. กด **Deploy** จะได้เว็บที่ `ชื่อเว็บ.netlify.app`
6. ทดสอบโดยเปิด `https://ชื่อเว็บ.netlify.app/api/health` ต้องเห็น `{"ok":true}`

> ถ้าแก้ Environment variables ภายหลัง ต้องไปที่ **Deploys → Trigger deploy** หนึ่งครั้ง

## ข้อแตกต่างจาก Render

- เว็บไม่หลับแล้ว แต่ถ้าไม่มีคนใช้สักพัก ครั้งแรกจะช้ากว่าปกติ 1-2 วินาที เพราะระบบเชื่อม Google Sheet ใหม่
- API แต่ละครั้งต้องเสร็จภายใน 10 วินาที ถ้า Apps Script ตอบช้ามาก หน้าเว็บจะแสดงข้อความระบบขัดข้อง
- ระบบกันเดา PIN และระบบรันเลขคิวจำค่าไว้ทีละเครื่อง ถ้ามีคนจองพร้อมกันพอดีมีโอกาสน้อยมากที่เลขคิวจะซ้ำ
- การย้ายคิวเก่าไป Archive อัตโนมัติอาจข้ามบางวัน ให้กดย้ายเองในหน้าตั้งค่าแอดมินได้
- แผนฟรีของ Netlify มีโควตาต่อเดือน (ดูได้ที่ **Usage**) ร้านขนาดนี้ไม่น่าจะใช้เกิน
