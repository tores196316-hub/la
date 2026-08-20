import React from 'react';
import { HelpCircle, Shield, FileCheck, AlertTriangle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const faqs = [
    {
      q: 'IMGIVO hangi formatları destekliyor?',
      a: 'Video için MP4 formatında 360p, 480p, 720p HD ve 1080p Full HD çözünürlükleri; Ses için MP3 formatında 128 kbps, 192 kbps ve 320 kbps yüksek kalite ile orijinal AAC M4A formatlarını destekler.',
    },
    {
      q: 'İndirdiğim dosyalar nerede saklanıyor?',
      a: 'Dönüştürme işlemi sunucu üzerindeki güvenli geçici alanda gerçekleşir. Dosyanız hazırlandıktan ve indirildikten sonra veya işlem zaman aşımına uğradığında sunucudan kalıcı olarak otomatik silinir.',
    },
    {
      q: 'Hangi içerikleri dönüştürebilirim?',
      a: 'Yalnızca yasal olarak indirme izniniz olan, telifsiz, Creative Commons lisanslı veya size ait içerikleri dönüştürebilirsiniz. DRM korumalı veya erişim engeli bulunan içeriklerin indirilmesine izin verilmez.',
    },
    {
      q: 'Mobil cihazlarda (iOS & Android) çalışıyor mu?',
      a: 'Evet! IMGIVO tüm modern mobil tarayıcılar (Safari, Chrome, Firefox) ile tam uyumludur. İndirilen dosyalar doğrudan cihazınızın İndirilenler / Dosyalar klasörüne kaydedilir.',
    },
    {
      q: 'Neden bazen 1080p seçeneği görünmüyor?',
      a: 'IMGIVO yalnızca orijinal videoda gerçekten mevcut olan çözünürlükleri listeler. Kaynak videoda 1080p akışı yoksa yapay olarak yükseltme yapılmaz.',
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Sıkça Sorulan Sorular & Yardım</h2>
          <p className="text-xs text-slate-400">IMGIVO kullanımı ve dönüştürme hakkında bilgiler</p>
        </div>
      </div>

      {/* FAQ list */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-left"
          >
            <h3 className="text-sm font-semibold text-white flex items-start gap-2">
              <span className="text-cyan-400 font-bold">S:</span>
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 pl-4 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      {/* Legal and Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-left space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4" />
          <span>Yasal Uyarı & Kullanım Şartları</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          IMGIVO, kullanıcılara yasal ve telifsiz medya akışlarını kişisel kullanım amacıyla dönüştürme imkanı sunan bir araçtır. Kullanıcılar dönüştürdükleri içeriklerin telif haklarına riayet etmekle yükümlüdür.
        </p>
      </div>
    </div>
  );
};
