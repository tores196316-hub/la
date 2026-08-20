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
      a: 'YouTube 1080p ve üzeri çözünürlükleri video ve ses akışı ayrık olarak depolar. IMGIVO, arka plandaki FFmpeg motoru sayesinde en yüksek video akışı ile en kaliteli ses akışını kayıpsız bir şekilde birleştirir (merge).',
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
    <div className="w-full max-w-3xl mx-auto rounded-xl bg-[#0e1017] border border-white/[0.08] p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center gap-2.5 border-b border-white/[0.07] pb-3.5 text-left">
        <div className="p-2 rounded-lg bg-white/[0.06] text-slate-300">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white">Sıkça Sorulan Sorular</h2>
          <p className="text-xs text-slate-400">IMGIVO kullanımı ve dönüştürme hakkında bilgiler</p>
        </div>
      </div>

      {/* FAQ list */}
      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-lg border transition-all duration-150 overflow-hidden ${
                isOpen
                  ? 'border-white/20 bg-[#111319]'
                  : 'border-white/[0.06] bg-[#111319]/50 hover:border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <span className="pr-3 leading-snug">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04] text-left">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legal and Disclaimer Notice */}
      <div className="p-3.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10 text-left space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber-400/90 text-[11px] font-semibold uppercase tracking-wider">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Yasal Uyarı & Kullanım Şartları</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          IMGIVO, kullanıcılara yasal ve telifsiz medya akışlarını kişisel kullanım amacıyla dönüştürme imkanı sunan bağımsız bir araçtır. Kullanıcılar dönüştürdükleri içeriklerin telif haklarına riayet etmekle yükümlüdür.
        </p>
      </div>
    </div>
  );
};


