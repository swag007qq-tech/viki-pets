import { useEffect } from 'react';
import type { StoreProduct } from '../firebase';
import { RarityBadgeList } from './RarityBadges';
import {
  CartOutlineIcon,
  CloseIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from './VikiIcons';

export interface CartEntry {
  id: string;
  quantity: number;
}

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pets: StoreProduct[];
  favoriteIds: string[];
  cartItems: CartEntry[];
  onToggleFavorite: (id: string) => void;
  onAddToCart: (id: string) => void;
  onClearFavorites: () => void;
  onOpenCart: () => void;
}

export function FavoritesDrawer({
  isOpen,
  onClose,
  pets,
  favoriteIds,
  cartItems,
  onToggleFavorite,
  onAddToCart,
  onClearFavorites,
  onOpenCart,
}: FavoritesDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const favoritePets = pets.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-[#5B3B2A]/25 backdrop-blur-[2px] transition-opacity"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Избранное"
        className="relative z-10 flex h-full w-full max-w-[440px] flex-col border-l-[1.5px] border-[#E4C9B6] bg-[#FDF5EE] text-[#5B3B2A] shadow-[-12px_0_36px_rgba(91,59,42,0.14)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EAD5C6] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#9B735B] text-white">
              <HeartOutlineIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[19px] font-semibold leading-tight">
                Избранное
              </h2>
              <p className="text-[13px] text-[#8D654E] tabular-nums">
                Сохранено: {favoritePets.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть избранное"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F4E1D4] text-[#5B3B2A] transition-colors hover:bg-[#EAD0BF] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#8D654E]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {favoritePets.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[24px] border-[1.5px] border-dashed border-[#DFC4B1] bg-[#FCF0E7] p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFE0D4] text-[#9B735B]">
                <HeartOutlineIcon className="h-7 w-7" />
              </div>
              <p className="mt-3 text-[17px] font-medium text-[#5B3B2A]">
                В избранном пока пусто
              </p>
              <p className="mt-1 text-[14px] text-[#8D654E]">
                Нажмите на сердечко на карточке питомца, чтобы сохранить его сюда.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {favoritePets.map((pet) => {
                const cartQty = cartItems.find((c) => c.id === pet.id)?.quantity ?? 0;
                const isOutOfStock = pet.stock <= 0;
                return (
                  <li
                    key={pet.id}
                    className="flex items-center gap-3.5 rounded-[22px] border-[1.5px] border-[#E4C9B6] bg-[#FCF0E7] p-3"
                  >
                    <div className="h-18 w-22 shrink-0 overflow-hidden rounded-[14px] bg-[#E8D8CC]">
                      {pet.imageUrl && (
                        <img
                          src={pet.imageUrl}
                          alt={pet.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-[16px] font-medium text-[#5B3B2A]">
                          {pet.name}
                        </div>
                        <RarityBadgeList rarities={pet.rarities} size="sm" />
                      </div>
                      <div className="mt-0.5 text-[14px] font-medium text-[#8D654E] tabular-nums">
                        {pet.price} грн
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isOutOfStock && cartQty === 0}
                          onClick={() => (cartQty > 0 ? onOpenCart() : onAddToCart(pet.id))}
                          className="flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#9B735B] px-3 text-[13px] font-medium text-white whitespace-nowrap transition-colors hover:bg-[#8C654E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CartOutlineIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {cartQty > 0
                              ? `В корзине (${cartQty})`
                              : isOutOfStock
                              ? 'Нет в наличии'
                              : 'Купить'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleFavorite(pet.id)}
                          aria-label="Убрать из избранного"
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F3DFD3] text-[#C86D62] transition-colors hover:bg-[#EAD0C0] active:scale-95"
                        >
                          <HeartFilledIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {favoritePets.length > 0 && (
          <div className="flex items-center gap-3 border-t border-[#EAD5C6] bg-[#FAF0E6] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClearFavorites}
              className="h-11 flex-1 cursor-pointer rounded-full border-[1.5px] border-[#D9BCAE] bg-[#F5E3D7] px-4 text-[14px] font-medium text-[#5B3B2A] transition-colors hover:bg-[#EED8CA] active:scale-[0.98]"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="h-11 flex-1 cursor-pointer rounded-full bg-[#9B735B] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#8C654E] active:scale-[0.98]"
            >
              Перейти в корзину
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pets: StoreProduct[];
  cartItems: CartEntry[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  pets,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const detailedItems = cartItems
    .map((entry) => {
      const pet = pets.find((p) => p.id === entry.id);
      if (!pet) return null;
      const clampedQty = pet.isPlaceholder
        ? entry.quantity
        : Math.min(entry.quantity, Math.max(1, pet.stock));
      return { ...pet, quantity: clampedQty };
    })
    .filter((item): item is StoreProduct & { quantity: number } => item !== null);

  const totalCount = detailedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = detailedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const summaryLines = detailedItems
    .map((item) => {
      const rarityTag = item.rarities.length > 0 ? ` [${item.rarities.join('')}]` : '';
      return `• ${item.name}${rarityTag} × ${item.quantity} (${item.price * item.quantity} грн)`;
    })
    .join('\n');
  const telegramMessage = `Здравствуйте! Хочу купить в Viki pets:\n${summaryLines}\nВсего в сумме: ${totalPrice} грн`;
  const telegramBuyUrl = `https://t.me/vikii11x?text=${encodeURIComponent(telegramMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-[#5B3B2A]/25 backdrop-blur-[2px] transition-opacity"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        className="relative z-10 flex h-full w-full max-w-[440px] flex-col border-l-[1.5px] border-[#E4C9B6] bg-[#FDF5EE] text-[#5B3B2A] shadow-[-12px_0_36px_rgba(91,59,42,0.14)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#EAD5C6] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#9B735B] text-white">
              <CartOutlineIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[19px] font-semibold leading-tight">
                Корзина
              </h2>
              <p className="truncate text-[13px] text-[#8D654E] tabular-nums">
                {totalCount > 0
                  ? `Товаров: ${totalCount} · Сумма: ${totalPrice} грн`
                  : 'Товаров: 0'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть корзину"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F4E1D4] text-[#5B3B2A] transition-colors hover:bg-[#EAD0BF] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#8D654E]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {detailedItems.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[24px] border-[1.5px] border-dashed border-[#DFC4B1] bg-[#FCF0E7] p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFE0D4] text-[#9B735B]">
                <CartOutlineIcon className="h-7 w-7" />
              </div>
              <p className="mt-3 text-[17px] font-medium text-[#5B3B2A]">
                Корзина пока пуста
              </p>
              <p className="mt-1 text-[14px] text-[#8D654E]">
                Нажмите «Купить» на карточке питомца, чтобы добавить его в корзину.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {detailedItems.map((item) => {
                const canIncrement = item.isPlaceholder || item.quantity < item.stock;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3.5 rounded-[22px] border-[1.5px] border-[#E4C9B6] bg-[#FCF0E7] p-3"
                  >
                    <div className="h-18 w-20 shrink-0 overflow-hidden rounded-[14px] bg-[#E8D8CC]">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className="truncate text-[16px] font-medium text-[#5B3B2A]">
                            {item.name}
                          </div>
                          <RarityBadgeList rarities={item.rarities} size="sm" />
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          aria-label="Удалить из корзины"
                          className="shrink-0 cursor-pointer rounded-full p-1 text-[#9E7861] transition-colors hover:bg-[#F3DFD3] hover:text-[#7E4A3A]"
                        >
                          <TrashIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="mt-0.5 text-[14px] text-[#8D654E] tabular-nums">
                        {item.price} грн × {item.quantity} ={' '}
                        <span className="font-semibold text-[#5B3B2A]">
                          {item.price * item.quantity} грн
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="inline-flex items-center rounded-full bg-[#E6CCBC] p-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            aria-label="Уменьшить количество"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5B3B2A] transition-colors hover:bg-[#D9BA9F]"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="min-w-7 px-1 text-center text-[14px] font-semibold tabular-nums text-[#5B3B2A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={!canIncrement}
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            aria-label="Увеличить количество"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5B3B2A] transition-colors hover:bg-[#D9BA9F] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {detailedItems.length > 0 && (
          <div className="border-t border-[#EAD5C6] bg-[#FAF0E6] px-5 py-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between rounded-[16px] bg-[#EFE0D4] px-4 py-2.5 text-[17px] font-semibold text-[#5B3B2A]">
              <span>Всего в сумме:</span>
              <span className="text-[19px] font-bold tabular-nums">{totalPrice} грн</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClearCart}
                className="h-11 cursor-pointer rounded-full border-[1.5px] border-[#D9BCAE] bg-[#F5E3D7] px-4 text-[14px] font-medium text-[#5B3B2A] transition-colors hover:bg-[#EED8CA] active:scale-[0.98]"
              >
                Очистить
              </button>
              <a
                href={telegramBuyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#9B735B] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#8C654E] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3B2A]"
              >
                <CartOutlineIcon className="h-5 w-5 shrink-0" />
                <span>Купить</span>
              </a>
            </div>

            <p className="mt-2.5 text-center text-[11px] leading-[1.35] text-[#8D654E]">
              нажмите на кнопку купить, что бы оплатить и договориться о выдаче товара
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
