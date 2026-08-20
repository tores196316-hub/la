/**
 * IMGIVO — Test Suite
 * Validates security, URL parsing, metadata extractor, job queues, and API routes.
 */

import { isValidYouTubeUrl, extractYouTubeVideoId, getCanonicalYouTubeUrl, sanitizeFileName, isValidJobId, isSafePath } from '../server/utils/security.js';
import { jobManager } from '../server/services/jobManager.js';
import { getSystemDiagnostic } from '../server/services/systemChecker.js';
import path from 'path';

async function runTests() {
  console.log('🧪 IMGIVO Test Suite Başlatılıyor...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ ${testName}`);
      failed++;
    }
  }

  // 1. URL Validation Tests
  console.log('[1] URL Doğrulama ve Sanitizasyon Testleri');
  assert(isValidYouTubeUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ'), 'Geçerli standart watch URL');
  assert(isValidYouTubeUrl('https://youtu.be/aqz-KE-bpKQ'), 'Geçerli youtu.be URL');
  assert(isValidYouTubeUrl('https://www.youtube.com/shorts/aqz-KE-bpKQ'), 'Geçerli Shorts URL');
  assert(isValidYouTubeUrl('https://music.youtube.com/watch?v=aqz-KE-bpKQ'), 'Geçerli Music URL');
  assert(!isValidYouTubeUrl('https://malicious-site.com/watch?v=aqz-KE-bpKQ'), 'Geçersiz domain reddedildi');
  assert(!isValidYouTubeUrl('javascript:alert(1)'), 'XSS / script URL reddedildi');
  assert(extractYouTubeVideoId('https://www.youtube.com/watch?v=aqz-KE-bpKQ') === 'aqz-KE-bpKQ', 'Video ID çıkarma');
  assert(getCanonicalYouTubeUrl('https://youtu.be/aqz-KE-bpKQ?si=123') === 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Kanonik URL dönüştürme');

  // 2. Filename & Path Traversal Security Tests
  console.log('\n[2] Dosya Adı ve Path Traversal Güvenlik Testleri');
  assert(sanitizeFileName('../../etc/passwd.mp4') === 'etc_passwd.mp4', 'Path traversal dosya adı temizlendi');
  assert(!/[\\/:*?"<>|]/.test(sanitizeFileName('Video: "Test" <1>?*|')), 'Özel ve tehlikeli karakterler temizlendi');
  assert(isValidJobId('a1b2c3d4e5f6'), 'Geçerli Job ID formatı');
  assert(!isValidJobId('../../../job'), 'Geçersiz Job ID reddedildi');

  const baseDir = path.resolve(process.cwd(), 'tmp', 'downloads');
  assert(isSafePath(baseDir, path.join(baseDir, 'safe_file.mp4')), 'Güvenli dosya yolu onaylandı');
  assert(!isSafePath(baseDir, path.join(baseDir, '..', '..', 'etc', 'passwd')), 'Dizin dışı yol engellendi');

  // 3. System Diagnostic & Dependencies Tests
  console.log('\n[3] Sistem Bağımlılıkları ve Sağlık Testi');
  const diag = await getSystemDiagnostic(true);
  assert(diag.tempDirWritable, 'Geçici indirme dizini yazılabilir');
  assert(diag.ytdlpFound, `yt-dlp bulundu (${diag.ytdlpVersion})`);
  assert(diag.ffmpegFound, `FFmpeg bulundu (${diag.ffmpegVersion})`);

  // 4. Job Manager & Queue Tests
  console.log('\n[4] Job Manager & Kuyruk Yönetimi Testleri');
  const testJob = jobManager.createJob({
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    format: 'mp3',
    quality: '320k',
    title: 'Test Audio Track',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    type: 'audio',
  });
  assert(!!testJob.jobId, 'Job ID üretildi');
  assert(testJob.state === 'downloading' || testJob.state === 'queued', 'Job başlangıç durumu geçerli');
  
  const fetchedJob = jobManager.getJob(testJob.jobId);
  assert(fetchedJob?.title === 'Test Audio Track', 'Job bellekten başarıyla sorgulandı');

  // 5. Admin Stats & Cleanup Tests
  console.log('\n[5] İstatistik ve Disk Temizleme Testleri');
  const stats = await jobManager.getAdminStats();
  assert(stats.totalConversions >= 1, 'Toplam dönüşüm sayısı güncellendi');
  assert(typeof stats.system.tempStorageUsedMb === 'number', 'Geçici disk alanı hesaplandı');

  const cleanup = jobManager.cleanExpiredFiles();
  assert(typeof cleanup.freedBytes === 'number', 'Otomatik disk temizleyici çalıştı');

  console.log(`\n========================================`);
  console.log(`📊 Test Sonuçları: ${passed} Başarılı, ${failed} Başarısız`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Testler çalışırken kritik hata:', err);
  process.exit(1);
});
