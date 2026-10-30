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

1. วางภาพใน `decks/navadara/` (เช่น `major-00.webp`, `back.webp`)
2. แก้ `data/site.json` เป็น `"deck": { "folder": "navadara", "ext": "webp" }`
3. รัน `node tools/build.mjs`

## เมื่อซื้อโดเมน

แก้ `siteUrl` และ `base` (เป็น `"/"`) ใน `data/site.json` แล้วรัน build ใหม่
