import { useState } from 'react';

const TELEGRAM_REVIEWS_URL = 'https://t.me/vikipetsshop';

export function ReviewsSection() {
  const [bannerError, setBannerError] = useState(false);
  const [puppyError, setPuppyError] = useState(false);

  return (
    <section
      aria-label="Отзывы клиентов"
      className="flex flex-1 items-center justify-center py-4 sm:py-8 lg:py-10"
    >
      {/* Tablet & Desktop: exact illustrated reviews block matching the reference image */}
      {!bannerError ? (
        <div className="relative hidden w-full max-w-[1080px] select-none sm:block">
          <img
            src="/assets/reviews-banner.png"
            alt="Посмотреть пруфы и отзывы клиентов можно тут — ТЫК"
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="block h-auto w-full object-contain drop-shadow-[0_10px_28px_rgba(141,101,78,0.08)]"
          />

          <a
            href={TELEGRAM_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Тык — открыть канал с отзывами в Telegram"
            className="group absolute top-[68.2%] left-[70.2%] flex h-[22.5%] w-[22.5%] cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:bg-white/15 hover:shadow-[0_0_24px_rgba(155,115,91,0.35)] active:scale-[0.97] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#7A543E]"
          />
        </div>
      ) : null}

      {/* Mobile (< 640px) & Fallback: proportional responsive card with peeking puppy + large clickable ТЫК button */}
      <div
        className={`w-full max-w-[440px] pt-14 ${
          bannerError ? 'block' : 'block sm:hidden'
        }`}
      >
        <div className="relative rounded-[34px] border-[3px] border-[#DFC4B2] bg-gradient-to-b from-[#FBEFE6] to-[#F5E3D6] px-6 pt-14 pb-7 text-center shadow-[0_12px_28px_rgba(141,101,78,0.12)] ring-4 ring-[#F3DFD2]">
          {!puppyError && (
            <img
              src="/assets/reviews-puppy.png"
              alt="Viki pets"
              referrerPolicy="no-referrer"
              onError={() => setPuppyError(true)}
              className="pointer-events-none absolute -top-[88px] left-1/2 h-auto w-[215px] -translate-x-1/2 select-none object-contain"
            />
          )}

          <p className="text-[20px] leading-[1.35] font-bold text-[#8D664E]">
            Посмотреть пруфы
            <br />
            и отзывы клиентов
            <br />
            можно тут —
          </p>

          <div className="mt-5 flex justify-center">
            <a
              href={TELEGRAM_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex h-[52px] min-w-[196px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-[#7C5943] bg-gradient-to-b from-[#B3896E] via-[#9E755C] to-[#876049] px-8 text-[20px] font-bold tracking-wide text-white shadow-[0_4px_12px_rgba(124,89,67,0.28)] transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3B2A]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1 left-3 h-3 w-12 rounded-full bg-white/30 blur-[1px]"
              />
              <span>ТЫК ♥</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
