# นวดารา (Nava Dara)

เว็บเปิดไพ่ทาโร่ออนไลน์ภาษาไทย เว็บ static บน GitHub Pages

## โครงสร้าง

| ที่อยู่ | เนื้อหา |
| --- | --- |
| `data/major.json` | เนื้อหาคำทำนายไพ่ Major 22 ใบ (ไพ่ตั้ง/กลับหัว, คำสำคัญ, ตำแหน่ง, 5 หมวด) |
| `data/wands.json` `cups.json` `swords.json` `pentacles.json` | เนื้อหาไพ่ Minor ชุดละ 14 ใบ |
| `data/cards.json` | ไฟล์รวม 78 ใบที่ระบบเปิดไพ่ใช้ (สร้างอัตโนมัติ ห้ามแก้มือ) |
| `data/spreads.json` | รูปแบบการเปิดไพ่ (`enabled: true` = เปิดใช้งาน) |
| `data/site.json` | ชื่อเว็บ, base path, ชุดไพ่, Google Analytics ID, โฆษณา, อีเมลติดต่อ, ลิงก์ affiliate, QR พร้อมเพย์ |
| `decks/<ชุด>/` | ภาพไพ่ ชื่อไฟล์ `major-00` ถึง `major-21` และ `back` |
| `assets/` | CSS และ JavaScript |
| `tools/build.mjs` | สร้างหน้า HTML ทั้งหมดจากข้อมูล |

## แก้ไขแล้วสร้างหน้าใหม่

```
node tools/build.mjs
```

## เปลี่ยนชุดภาพไพ่

```
python3 -I tools/import_deck.py <ไฟล์.zip หรือโฟลเดอร์ภาพ> [ชื่อชุด]
```

ชื่อไฟล์: `back`, `major-00`–`major-21`, `wands-01`–`wands-14`, `cups-01`–`cups-14`, `swords-01`–`swords-14`, `pentacles-01`–`pentacles-14`
ส่งไม่ครบได้ ใบที่ยังไม่มีภาพจะใช้ภาพชั่วคราว สคริปต์ตัดสัดส่วนเป็น 2:3
ย่อเป็น 600 × 900 px แปลงเป็น WebP ใส่ใน `decks/<ชื่อชุด>/` สลับ `data/site.json` และสร้างหน้าเว็บใหม่ให้

## เมื่อซื้อโดเมน

แก้ `siteUrl` และ `base` (เป็น `"/"`) ใน `data/site.json` แล้วรัน build ใหม่

## ลิงก์ affiliate และพร้อมเพย์

แก้ใน `data/site.json`:

- `affiliate`: รายการ `{ "title", "url", "note" }` จะแสดงท้ายผลไพ่และหน้าความหมายไพ่ (เว้น `url` ว่าง = ไม่แสดง)
- `tip.promptpayImage`: ที่อยู่ไฟล์ภาพ QR เช่น `assets/img/promptpay.png`
- `contactEmail`: อีเมลในหน้านโยบายความเป็นส่วนตัว

แล้วรัน `node tools/build.mjs`
