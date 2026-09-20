# EduQuest
EduQuest — Belajar sambil bermain: dashboard gamifikasi dengan 4 mini-game edukasi (Chemistry, Biology, Math, Physics) yang menyimpan progres tiap siswa secara otomatis
Deployment: [![Netlify Status](https://api.netlify.com/api/v1/badges/db6dcb73-612a-4fcf-99c9-64ad344cc91a/deploy-status)](https://app.netlify.com/projects/eduquestapps/deploys)

# EduQuest — Gamified Learning Dashboard

EduQuest adalah platform pembelajaran berbasis gamifikasi yang
menggabungkan empat mini-game edukasi dalam satu dashboard terpadu.
Siswa cukup memasukkan nama untuk memulai, dan seluruh progres
(XP, koin, level, badge) tersimpan otomatis di perangkat.

## 🎓 Mata Pelajaran
| Game | Fokus | Teknologi |
|------|-------|-----------|
| 🧪 Chemistry | Reaksi & Unsur | Canvas 2D |
| 🧬 Biology | Pertumbuhan Tanaman | Three.js (WebGL 3D) |
| 📐 Math | Trigonometri | Three.js (Unit Circle 3D) |
| ⚛️ Physics | GLB, GLBB, GJB | Canvas 2D + Open World |

## 🎯 Tujuan
- Meningkatkan motivasi belajar melalui mekanik gamifikasi
  (XP, level, badge, streak, koin).
- Memberikan feedback visual langsung atas setiap jawaban benar.
- Memungkinkan siswa belajar mandiri tanpa perlu server.

## 🛠️ Arsitektur
- **Frontend**: HTML5 + CSS3 + Vanilla JS (no framework)
- **Rendering 3D**: Three.js
- **Penyimpanan**: localStorage (JSON per siswa per mapel)
- **Modul bersama**: `eduquest.js` (Storage API)

## 🚀 Cara Menjalankan
1. Clone repo ini.
2. Buka `index.html` di browser modern (Chrome/Edge/Firefox/Safari).
3. Masukkan nama → pilih game → mulai belajar!

Tidak perlu instalasi, build step, atau server.
