# นวดารา (Nava Dara)

เว็บเปิดไพ่ทาโร่ออนไลน์ภาษาไทย เว็บ static บน GitHub Pages

## โครงสร้าง

| ที่อยู่ | เนื้อหา |
| --- | --- |
| `data/major.json` | เนื้อหาคำทำนายไพ่ Major 22 ใบ (ไพ่ตั้ง/กลับหัว, คำสำคัญ, ตำแหน่ง, 5 หมวด) |
| `data/spreads.json` | รูปแบบการเปิดไพ่ (`enabled: true` = เปิดใช้งาน) |
| `data/site.json` | ชื่อเว็บ, base path, ชุดไพ่, Google Analytics ID, โฆษณา |
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

สคริปต์จะตรวจว่าภาพครบ 23 ไฟล์ (`back` + `major-00` ถึง `major-21`) ตัดสัดส่วนเป็น 2:3
ย่อเป็น 600 × 900 px แปลงเป็น WebP ใส่ใน `decks/<ชื่อชุด>/` สลับ `data/site.json` และสร้างหน้าเว็บใหม่ให้

## เมื่อซื้อโดเมน

แก้ `siteUrl` และ `base` (เป็น `"/"`) ใน `data/site.json` แล้วรัน build ใหม่
