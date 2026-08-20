import { userService, formatRemainingTime } from '../server/services/userService.js';

console.log('🧪 IMGIVO Auth & Membership Test Suite Başlatılıyor...\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

// 1. User Registration & Validation
console.log('[1] Kullanıcı Kayıt ve Doğrulama Testleri');
const regResult = userService.register({
  name: 'Test Kullanıcı',
  username: 'testuser_' + Date.now(),
  email: `test_${Date.now()}@example.com`,
  password: 'password123',
});

assert(regResult.success === true, 'Yeni kullanıcı başarıyla kaydedildi');
assert(Boolean(regResult.token), 'Oturum tokenı üretildi');
assert(regResult.user?.role === 'user', 'Varsayılan rol "user"');
assert(regResult.user?.plan === 'free', 'Varsayılan plan "free"');

// Duplicate email rejection
const dupResult = userService.register({
  name: 'Test Kullanıcı',
  username: 'another_' + Date.now(),
  email: regResult.user?.email || '',
  password: 'password123',
});
assert(dupResult.success === false, 'Aynı e-posta ile ikinci kayıt reddedildi');

// 2. User Login & Token Verification
console.log('\n[2] Giriş ve Token Doğrulama Testleri');
const loginResult = userService.login(regResult.user?.email || '', 'password123');
assert(loginResult.success === true, 'E-posta ve doğru şifre ile giriş başarılı');

const wrongPassResult = userService.login(regResult.user?.email || '', 'wrongpass');
assert(wrongPassResult.success === false, 'Hatalı şifre reddedildi');

const verifiedUser = userService.verifyToken(loginResult.token);
assert(verifiedUser?.id === regResult.user?.id, 'Token başarıyla doğrulandı ve kullanıcı eşleşti');

// 3. Dynamic Premium Duration Calculation
console.log('\n[3] Dinamik Premium Süre Hesaplama Testleri');
const now = Date.now();
const oneYearLater = now + 365 * 24 * 60 * 60 * 1000;
const formatted1 = formatRemainingTime(oneYearLater);
assert(formatted1.isActive === true, '1 yıl kalan süre aktif olarak hesaplandı');
assert(formatted1.formatted.includes('yıl'), 'Metin formatında yıl ifadesi mevcut');

const pastTime = now - 10000;
const formattedPast = formatRemainingTime(pastTime);
assert(formattedPast.isActive === false, 'Geçmiş süre pasif olarak hesaplandı');
assert(formattedPast.formatted === 'Süresi doldu', 'Biten üyelik için "Süresi doldu" metni döndü');

// 4. Admin Operations & Role / Premium Assignment
console.log('\n[4] Yönetici İşlemleri ve Premium Süre Tanımlama Testleri');
if (regResult.user) {
  // Add 3 months premium
  const premResult = userService.setPremiumDuration(regResult.user.id, {
    plan: 'premium',
    months: 3,
  });
  assert(premResult.success === true, 'Kullanıcıya 3 ay Premium tanımlandı');
  assert(premResult.user?.premiumActive === true, 'Premium üyelik aktifleşti');
  assert(premResult.user?.plan === 'premium', 'Plan "premium" olarak güncellendi');

  // Change role to admin
  const roleResult = userService.setUserRole(regResult.user.id, 'admin');
  assert(roleResult.success === true, 'Kullanıcıya admin rolü verildi');
  assert(roleResult.user?.role === 'admin', 'Kullanıcı rolü "admin" oldu');

  // Cancel premium
  const cancelResult = userService.setPremiumDuration(regResult.user.id, { cancel: true });
  assert(cancelResult.success === true, 'Premium başarıyla iptal edildi');
  assert(cancelResult.user?.premiumActive === false, 'Premium pasif oldu');
  assert(cancelResult.user?.plan === 'free', 'Plan "free" oldu');
}

// 5. User Download History
console.log('\n[5] Kullanıcı İndirme Geçmişi Testleri');
if (regResult.user) {
  const historyItem = userService.addHistoryItem({
    userId: regResult.user.id,
    jobId: 'job_test_123',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Test Video',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    format: 'mp4',
    quality: '1080p',
    status: 'completed',
  });
  assert(Boolean(historyItem.id), 'Geçmişe yeni kayıt eklendi');

  const historyList = userService.getUserHistory(regResult.user.id);
  assert(historyList.length === 1, 'Kullanıcının geçmişi doğru sayıda döndü');
  assert(historyList[0].title === 'Test Video', 'Geçmiş kaydı başlığı doğru');

  userService.clearUserHistory(regResult.user.id);
  const clearedList = userService.getUserHistory(regResult.user.id);
  assert(clearedList.length === 0, 'Geçmiş temizlendi');
}

console.log('\n========================================');
console.log(`📊 Auth Test Sonuçları: ${passed} Başarılı, ${failed} Başarısız`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
