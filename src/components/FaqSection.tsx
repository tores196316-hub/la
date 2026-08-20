import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'IMGIVO hangi formatları ve kaliteleri destekliyor?',
      a: 'Video için MP4 formatında 4K Ultra HD (2160p), 2K QHD (1440p), 1080p Full HD, 720p HD ve 480p/360p; Ses için MP3 (320kbps yüksek kalite) ve orijinal AAC M4A formatlarını destekler.',
    },
    {
      q: '1080p, 2K ve 4K videolarda ses neden eksik olmaz?',
      a: 'YouTube 1080p ve üzeri çözünürlükleri video ve ses akışı ayrık olarak depolar. IMGIVO, arka plandaki akıllı FFmpeg motoru sayesinde en yüksek video akışı ile en kaliteli ses akışını kayıpsız bir şekilde birleştirir (merge).',
    },
    {
      q: 'YouTube Shorts bağlantıları dönüştürülebilir mi?',
      a: 'Evet! YouTube Shorts linkleri otomatik olarak algılanır ve dönüştürülür. Standart youtube.com, youtu.be ve youtube.com/shorts linklerinin tümü tam uyumludur.',
    },
    {
      q: 'İndirdiğim dosyalar sunucuda saklanıyor mu?',
      a: 'Hayır. Kullanıcı gizliliği ve güvenliği için dönüştürme işlemi geçici disk belleğinde yapılır. Dosya indirilmesi tamamlandıktan kısa bir süre sonra diskten otomatik ve kalıcı olarak temizlenir.',
    },
    {
      q: 'Mobil cihazlarda (iOS & Android) çalışıyor mu?',
      a: 'Evet! IMGIVO tüm modern mobil tarayıcılar (Safari, Chrome, Firefox) ile tam uyumludur. İndirilen dosyalar doğrudan cihazınızın İndirilenler / Dosyalar klasörüne kaydedilir.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 border-b border-slate-800/90 pb-4 text-left">
        <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Sıkça Sorulan Sorular & Yardım</h2>
          <p className="text-xs sm:text-sm text-slate-400">IMGIVO kullanımı ve dönüştürme hakkında bilgiler</p>
        </div>
      </div>

      {/* FAQ list */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-cyan-500/50 bg-slate-950/80 shadow-md'
                  : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700/80'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 text-left text-sm sm:text-base font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <span className="pr-3 leading-snug">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-900 animate-in fade-in duration-150 text-left">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legal and Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-left space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Yasal Uyarı & Kullanım Şartları</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          IMGIVO, kullanıcılara yasal ve telifsiz medya akışlarını kişisel kullanım amacıyla dönüştürme imkanı sunan bağımsız bir araçtır. Kullanıcılar dönüştürdükleri içeriklerin telif haklarına riayet etmekle yükümlüdür.
        </p>
      </div>
    </div>
  );
};

