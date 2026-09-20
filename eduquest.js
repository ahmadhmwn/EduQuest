/* =========================================================
   EduQuest Storage API
   =========================================================
   Setiap siswa & setiap mata pelajaran punya slot sendiri:
     eduquest_student_<slug>_<subject>   → JSON progres mapel
     eduquest_profile_<slug>             → JSON profil siswa
     eduquest_current                    → slug siswa aktif

   Struktur JSON mapel (chemistry.json dsb):
   {
     "xp": 0,
     "coins": 0,
     "level": 1,
     "plays": 0,
     "lastPlayed": null,
     "badges": [],
     "scores": []      // riwayat skor tiap sesi
   }
   ========================================================= */

const EduQuest = (function () {
  'use strict';

  const SUBJECTS = ['chemistry', 'biology', 'math', 'physics'];
  const XP_PER_LEVEL = 100;
  const PROFILE_PREFIX = 'eduquest_profile_';
  const SUBJECT_PREFIX = 'eduquest_student_';
  const CURRENT_KEY    = 'eduquest_current';

  /* ---------------- util ---------------- */
  function slugify(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  function profileKey(slug) { return PROFILE_PREFIX + slug; }
  function subjectKey(slug, subject) { return SUBJECT_PREFIX + slug + '_' + subject; }

  function safeParse(str, fallback) {
    try { return JSON.parse(str) ?? fallback; }
    catch (e) { return fallback; }
  }

  function emptySubject() {
    return {
      xp: 0,
      coins: 0,
      level: 1,
      plays: 0,
      lastPlayed: null,
      badges: [],
      scores: []
    };
  }

  /* ---------------- API ---------------- */
  const api = {
    SUBJECTS,
    XP_PER_LEVEL,

    /* -------- Profil siswa -------- */
    login(name) {
      const clean = String(name || '').trim();
      if (clean.length < 2)  return { ok: false, error: 'Nama minimal 2 karakter.' };
      if (clean.length > 30) return { ok: false, error: 'Nama maksimal 30 karakter.' };

      const slug = slugify(clean);
      if (!slug) return { ok: false, error: 'Nama tidak valid.' };

      // simpan / update profil
      const profile = {
        name: clean,
        slug: slug,
        createdAt: (safeParse(localStorage.getItem(profileKey(slug)), {})).createdAt
                    || new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem(profileKey(slug), JSON.stringify(profile));
      localStorage.setItem(CURRENT_KEY, slug);

      // inisialisasi slot tiap mapel kalau belum ada
      SUBJECTS.forEach(s => {
        const k = subjectKey(slug, s);
        if (!localStorage.getItem(k)) {
          localStorage.setItem(k, JSON.stringify(emptySubject()));
        }
      });

      return { ok: true, profile };
    },

    logout() {
      localStorage.removeItem(CURRENT_KEY);
    },

    getCurrentSlug() {
      return localStorage.getItem(CURRENT_KEY);
    },

    getProfile(slug) {
      slug = slug || this.getCurrentSlug();
      if (!slug) return null;
      return safeParse(localStorage.getItem(profileKey(slug)), null);
    },

    /* -------- Ambil JSON per mapel -------- */
    getSubjectData(subject, slug) {
      slug = slug || this.getCurrentSlug();
      if (!slug || !SUBJECTS.includes(subject)) return emptySubject();
      const raw = localStorage.getItem(subjectKey(slug, subject));
      if (!raw) return emptySubject();
      // merge dengan default agar field yang hilang tetap aman
      return Object.assign(emptySubject(), safeParse(raw, {}));
    },

    /* -------- Ambil semua mapel sekaligus -------- */
    getAllSubjects(slug) {
      slug = slug || this.getCurrentSlug();
      const out = {};
      SUBJECTS.forEach(s => { out[s] = this.getSubjectData(s, slug); });
      return out;
    },

    /* -------- Simpan JSON mapel (dipakai file game) -------- */
    saveSubjectData(subject, data, slug) {
      slug = slug || this.getCurrentSlug();
      if (!slug || !SUBJECTS.includes(subject)) return false;

      const current = this.getSubjectData(subject, slug);
      const merged  = Object.assign(current, data || {});

      // auto update level dari XP
      merged.level = this.levelFromXP(merged.xp);

      // auto update total XP & koin di profil (opsional)
      localStorage.setItem(subjectKey(slug, subject), JSON.stringify(merged));

      // update agregat profil
      this._recomputeProfileTotals(slug);
      return true;
    },

    /* -------- Shortcut untuk file game -------- */
    addXP(subject, amount, slug) {
      amount = Number(amount) || 0;
      if (amount <= 0) return false;

      const cur = this.getSubjectData(subject, slug);
      cur.xp      += amount;
      cur.coins   += Math.floor(amount / 10);   // 10 XP = 1 koin
      cur.plays   += 1;
      cur.lastPlayed = new Date().toISOString();

      return this.saveSubjectData(subject, cur, slug);
    },

    addCoins(subject, amount, slug) {
      amount = Number(amount) || 0;
      if (amount <= 0) return false;
      const cur = this.getSubjectData(subject, slug);
      cur.coins += amount;
      return this.saveSubjectData(subject, cur, slug);
    },

    recordPlay(subject, slug) {
      const cur = this.getSubjectData(subject, slug);
      cur.plays += 1;
      cur.lastPlayed = new Date().toISOString();
      return this.saveSubjectData(subject, cur, slug);
    },

    addScore(subject, score, slug) {
      const cur = this.getSubjectData(subject, slug);
      cur.scores = cur.scores || [];
      cur.scores.push({ score: Number(score) || 0, at: new Date().toISOString() });
      // simpan 20 skor terakhir saja
      if (cur.scores.length > 20) cur.scores = cur.scores.slice(-20);
      return this.saveSubjectData(subject, cur, slug);
    },

    addBadge(subject, badge, slug) {
      const cur = this.getSubjectData(subject, slug);
      cur.badges = cur.badges || [];
      if (!cur.badges.includes(badge)) cur.badges.push(badge);
      return this.saveSubjectData(subject, cur, slug);
    },

    /* -------- Agregat profil (total XP, koin) -------- */
    _recomputeProfileTotals(slug) {
      slug = slug || this.getCurrentSlug();
      if (!slug) return null;

      const all = this.getAllSubjects(slug);
      let totalXP = 0, totalCoins = 0, totalPlays = 0;
      SUBJECTS.forEach(s => {
        totalXP    += all[s].xp;
        totalCoins += all[s].coins;
        totalPlays += all[s].plays;
      });

      const profile = this.getProfile(slug) || { name: slug, slug: slug };
      profile.totalXP    = totalXP;
      profile.totalCoins = totalCoins;
      profile.totalPlays = totalPlays;
      profile.updatedAt  = new Date().toISOString();
      localStorage.setItem(profileKey(slug), JSON.stringify(profile));

      return profile;
    },

    getTotals(slug) {
      slug = slug || this.getCurrentSlug();
      const all = this.getAllSubjects(slug);
      let xp = 0, coins = 0, plays = 0, playedSubjects = 0;
      SUBJECTS.forEach(s => {
        xp    += all[s].xp;
        coins += all[s].coins;
        plays += all[s].plays;
        if (all[s].plays > 0) playedSubjects++;
      });
      return { xp, coins, plays, playedSubjects, total: SUBJECTS.length };
    },

    /* -------- Util level & progress -------- */
    levelFromXP(xp) {
      return Math.floor((Number(xp) || 0) / XP_PER_LEVEL) + 1;
    },

    progressInLevel(xp) {
      const inLevel = (Number(xp) || 0) % XP_PER_LEVEL;
      return Math.round((inLevel / XP_PER_LEVEL) * 100);
    },

    /* -------- Reset (opsional) -------- */
    resetStudent(slug) {
      slug = slug || this.getCurrentSlug();
      if (!slug) return;
      SUBJECTS.forEach(s => localStorage.removeItem(subjectKey(slug, s)));
      localStorage.removeItem(profileKey(slug));
      if (localStorage.getItem(CURRENT_KEY) === slug) {
        localStorage.removeItem(CURRENT_KEY);
      }
    },

    resetAll() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PROFILE_PREFIX) || k.startsWith(SUBJECT_PREFIX) || k === CURRENT_KEY)
        .forEach(k => localStorage.removeItem(k));
    }
  };

  return api;
})();

window.EduQuest = EduQuest;