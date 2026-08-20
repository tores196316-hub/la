import React, { useState } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { HelpCircle, ChevronDown, Sparkles, Shield, ArrowRight, Video, Music, Crown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: 'general' | 'quality' | 'premium' | 'troubleshooting';
}

const FAQS: FaqItem[] = [
  {
    category: 'general',
    q: 'IMGIVO nedir ve nasıl çalışır?',
    a: 'IMGIVO, YouTube videolarını yüksek kalitede MP4 video veya MP3/M4A ses dosyalarına dönüştürüp doğrudan cihazınıza indirmenizi sağlayan hızlı, modern ve güvenilir bir medya işleme platformudur.',
  },
  {
    category: 'quality',
    q: 'Hangi çözünürlük ve ses formatları destekleniyor?',
    a: 'Standart (Free) kullanıcılarımız 1080p Full HD, 720p HD ve 360p video ile 192k MP3 ses formatlarını indirebilir. IMGIVO Premium üyelerimiz ise 2K QHD (1440p), 4K Ultra HD (2160p) ve kristal netliğinde 320 kbps ses kalitesinden faydalanabilir.',
  },
  {
    category: 'premium',
    q: '2K ve 4K indirmeler neden Premium gerektirir?',
    a: '2K ve 4K Ultra HD video akışları ile 60 FPS yayınlar çok yüksek sunucu işlem gücü ve bant genişliği gerektirir. Size kesintisiz, hızlı ve takılmasız dönüştürme sunabilmek için bu çözünürlükler Premium altyapımızla sağlanır.',
  },
  {
    category: 'premium',
    q: 'Premium üyeliğimi nasıl uzatabilirim veya yönetebilirim?',
    a: 'Profil sayfanızda kalan sürenizi anlık olarak görüntüleyebilir, Fiyatlandırma sayfasından yeni paket seçerek sürenizi kolayca uzatabilirsiniz. Süreniz mevcut bitiş tarihinizin üzerine otomatik olarak eklenir.',
  },
  {
    category: 'troubleshooting',
    q: 'İndirme butonuna bastıktan sonra ne kadar beklemeliyim?',
    a: 'İşlem süresi videonun uzunluğuna ve seçtiğiniz çözünürlüğe bağlıdır. Çoğu standart video 5-15 saniye içinde dönüştürülüp indirilmeye hazır hale gelir.',
  },
  {
    category: 'troubleshooting',
    q: 'İndirdiğim dosya cihazımda nereye kaydedilir?',
    a: 'Dosyanız tarayıcınızın varsayılan "İndirilenler" (Downloads) klasörüne kaydedilir. Mobilde ise dosya yöneticiniz veya Galeri / Müzik uygulamanızda görüntülenebilir.',
  },
];

export function FaqPage() {
  const { navigate } = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFaqs = FAQS.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 space-y-8 text-left">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white mb-2">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Yardım ve Sıkça Sorulan Sorular
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          IMGIVO dönüştürücü ve premium üyelik sistemi hakkında merak edilenler.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl bg-[#0e1017] border border-white/[0.08] text-xs">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-white text-black font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tümü
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('general')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeCategory === 'general'
              ? 'bg-white text-black font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Genel
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('quality')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeCategory === 'quality'
              ? 'bg-white text-black font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Kalite & Format
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory('premium')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeCategory === 'premium'
              ? 'bg-white text-black font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Premium
        </button>
      </div>

      {/* Accordion FAQ items */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-xl bg-[#0e1017] border border-white/[0.08] overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-white/[0.02] cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04]">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="rounded-2xl bg-gradient-to-r from-[#12151f] to-[#0e1017] border border-white/[0.08] p-6 text-center space-y-3">
        <h3 className="text-sm font-bold text-white">Sorunuza yanıt bulamadınız mı?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Dönüştürücüye geri dönerek hemen video indirmeye başlayabilir veya Premium ayrıcalıklarını inceleyebilirsiniz.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Dönüştürücüye Dön
          </Link>
          <Link
            to="/premium"
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Premium Planlar
          </Link>
        </div>
      </div>
    </div>
  );
}
