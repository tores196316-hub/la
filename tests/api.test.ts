/**
 * IMGIVO — Test Suite
 * Validates security, URL parsing, metadata extractor, job queues, and API routes.
 */

import { isValidYouTubeUrl, extractYouTubeVideoId, getCanonicalYouTubeUrl, sanitizeFileName, isValidJobId, isSafePath } from '../server/utils/security.js';
import { jobManager } from '../server/services/jobManager.js';
import { getSystemDiagnostic } from '../server/services/systemChecker.js';
import { extractAvailableResolutions, getResolvedCookiePath, buildBaseYtDlpArgs } from '../server/services/ytdlp.js';
import path from 'path';
import fs from 'fs';

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

  // 6. DASH Stream & 1080p Format Resolution Extraction Tests
  console.log('\n[6] DASH Stream & 1080p Çözünürlük Çıkarma Testleri');
  
  // Test with video-only DASH formats (e.g. YouTube format 137 / 248 / 399)
  const mockDashInfo = {
    title: 'Sample 1080p Video',
    height: 1080,
    width: 1920,
    formats: [
      { format_id: '137', vcodec: 'avc1.640028', height: 1080, width: 1920, format_note: '1080p' },
      { format_id: '248', vcodec: 'vp9', height: 1080, width: 1920, format_note: '1080p' },
      { format_id: '136', vcodec: 'avc1.4d401f', height: 720, width: 1280, format_note: '720p' },
      { format_id: '140', vcodec: 'none', acodec: 'mp4a.40.2', format_note: 'audio only' },
    ],
  };
  const dashRes = extractAvailableResolutions(mockDashInfo);
  assert(dashRes.includes(1080), '1080p DASH formatı başarıyla algılandı');
  assert(dashRes.includes(720), '720p stream algılandı');

  // Test with vertical YouTube Shorts (1080x1920)
  const mockShortsInfo = {
    title: 'Sample 1080p Shorts',
    height: 1920,
    width: 1080,
    formats: [
      { format_id: '399', vcodec: 'av01', height: 1920, width: 1080, format_note: '1080p' },
      { format_id: '140', vcodec: 'none', acodec: 'mp4a.40.2' },
    ],
  };
  const shortsRes = extractAvailableResolutions(mockShortsInfo);
  assert(shortsRes.includes(1080), 'Dikey Shorts için 1080p başarıyla algılandı');

  // Test with only 720p maximum video
  const mock720pOnlyInfo = {
    title: 'Sample 720p Only Video',
    height: 720,
    width: 1280,
    formats: [
      { format_id: '22', vcodec: 'avc1.64001F', acodec: 'mp4a.40.2', height: 720, width: 1280 },
      { format_id: '18', vcodec: 'avc1.42001E', acodec: 'mp4a.40.2', height: 360, width: 640 },
    ],
  };
  const res720Only = extractAvailableResolutions(mock720pOnlyInfo);
  assert(res720Only.includes(720), '720p video için 720p korundu');
  assert(!res720Only.includes(1080), '720p videoda sahte 1080p eklenmedi');

  // Test with 360p only (e.g. vintage / low-res video)
  const mock360pOnlyInfo = {
    title: 'Sample 360p Only Video',
    height: 360,
    width: 640,
    formats: [
      { format_id: '18', vcodec: 'avc1.42001E', acodec: 'mp4a.40.2', height: 360, width: 640 },
    ],
  };
  const res360Only = extractAvailableResolutions(mock360pOnlyInfo);
  assert(res360Only.includes(360), '360p video için 360p algılandı');
  assert(!res360Only.includes(720), '360p videoda 720p eklenmedi');
  assert(!res360Only.includes(1080), '360p videoda 1080p eklenmedi');

  // 7. Cookie & Proxy Yapılandırma Testleri
  console.log('\n[7] Authentication & Proxy Yapılandırma Testleri');
  
  // Test raw cookie content with escaped newlines
  const sampleCookieContent = '# Netscape HTTP Cookie File\\n.youtube.com\\tTRUE\\t/\\tTRUE\\t1799999999\\tSID\\tsample_session_id';
  process.env.YTDLP_COOKIE_CONTENT = sampleCookieContent;
  const cookiePath = getResolvedCookiePath();
  assert(cookiePath !== null && fs.existsSync(cookiePath), 'Cookie içeriği dosyaya başarıyla yazıldı');
  if (cookiePath && fs.existsSync(cookiePath)) {
    const written = fs.readFileSync(cookiePath, 'utf-8');
    assert(written.includes('\n.youtube.com'), 'Kaçışlı satır sonları (\\n) gerçek satır sonuna çevrildi');
  }

  // Test proxy configuration in yt-dlp arguments
  process.env.YTDLP_PROXY = 'http://proxy.example.com:8080';
  const ytdlpArgs = buildBaseYtDlpArgs();
  assert(ytdlpArgs.includes('--proxy') && ytdlpArgs.includes('http://proxy.example.com:8080'), 'Proxy parametresi yt-dlp komutuna eklendi');
  assert(ytdlpArgs.includes('--cookies') && ytdlpArgs.includes(cookiePath || ''), 'Cookies parametresi yt-dlp komutuna eklendi');

  // Clean test env vars
  delete process.env.YTDLP_COOKIE_CONTENT;
  delete process.env.YTDLP_PROXY;

  // 8. Free vs Premium Kuyruk ve Hız Ayrımı Testi
  console.log('\n[8] Free vs Premium Kuyruk ve Hız Ayrımı Testleri');
  const freeJob = jobManager.createJob({
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    format: 'mp4',
    quality: '720p',
    title: 'Free User Download',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    type: 'video',
    isPremium: false,
    userPlan: 'free',
  });
  assert(freeJob.userPlan === 'free', 'Free kullanıcı planı doğru atandı');
  assert(freeJob.isPremium === false, 'Free kullanıcı için isPremium false olarak işaretlendi');
  assert(freeJob.progress.queuePosition === 3, 'Free kullanıcı yoğunluk kuyruğuna alındı (Sıra #3)');

  const premiumJob = jobManager.createJob({
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    format: 'mp4',
    quality: '1080p',
    title: 'Premium VIP User Download',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    type: 'video',
    isPremium: true,
    userPlan: 'premium',
  });
  assert(premiumJob.userPlan === 'premium', 'Premium kullanıcı planı doğru atandı');
  assert(premiumJob.isPremium === true, 'Premium kullanıcı için isPremium true olarak işaretlendi');
  assert(premiumJob.progress.queuePosition === 0, 'Premium kullanıcı için kuyruk beklemesi 0 (anında)');

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
