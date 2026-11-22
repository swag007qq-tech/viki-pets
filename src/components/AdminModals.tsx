import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  normalizeRarities,
  PRODUCT_LIMITS,
  RARITY_OPTIONS,
  type RarityCode,
  verifyAdminPasswordClient,
} from '../firebase';
import { CloseIcon, PlusIcon, ShieldCheckIcon } from './VikiIcons';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export function AdminPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isValid = await verifyAdminPasswordClient(password);
      if (!isValid) {
        setError('Неверный пароль');
        return;
      }

      const sessionMarker =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      onSuccess(sessionMarker);
    } catch {
      setError('Не удалось проверить пароль. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-[#5B3B2A]/30 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Вход администратора"
        className="relative z-10 w-full max-w-[400px] rounded-[28px] border-[1.5px] border-[#E4C9B6] bg-[#FDF5EE] p-6 text-[#5B3B2A] shadow-[0_18px_48px_rgba(91,59,42,0.18)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#9B735B] text-white">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <h2 className="text-[19px] font-semibold leading-tight">
              Вход администратора
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно входа"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F4E1D4] text-[#5B3B2A] transition-colors hover:bg-[#EAD0BF]"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-password-input"
              className="mb-1.5 block text-[14px] font-medium text-[#7F5A46]"
            >
              Пароль
            </label>
            <input
              id="admin-password-input"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Введите пароль администратора"
              className="h-[48px] w-full rounded-full border-[1.5px] border-[#DFC4B1] bg-[#FCF0E6] px-5 text-[16px] text-[#5B3B2A] placeholder-[#9E7861] focus:border-[#9B735B] focus:outline-none"
            />
            {error && (
              <p className="mt-2 px-2 text-[13px] font-medium text-[#B34B3E]">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] w-full cursor-pointer rounded-full bg-[#9B735B] text-[16px] font-medium text-white transition-colors hover:bg-[#8C654E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? 'Проверка...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Некорректный формат изображения'));
      img.onload = () => {
        const maxW = 800;
        const maxH = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Не удалось обработать изображение'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > PRODUCT_LIMITS.IMAGE_URL_MAX && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > PRODUCT_LIMITS.IMAGE_URL_MAX) {
          reject(new Error('Фотография слишком большая. Выберите файл меньшего размера.'));
          return;
        }

        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (input: {
    name: string;
    price: number;
    stock: number;
    imageUrl: string;
    rarities: RarityCode[];
  }) => Promise<void>;
}

export function AddProductModal({
  isOpen,
  onClose,
  onPublish,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedRarities, setSelectedRarities] = useState<RarityCode[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPrice('');
      setStock('1');
      setImageUrl('');
      setSelectedRarities([]);
      setError(null);
      setIsCompressing(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setImageUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки фотографии');
    } finally {
      setIsCompressing(false);
    }
  };

    const toggleRarity = (code: RarityCode) => {
    setSelectedRarities((prev) =>
      prev.includes(code)
        ? prev.filter((item) => item !== code)
        : normalizeRarities([...prev, code])
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!trimmedName) {
      setError('Укажите название товара');
      return;
    }
    if (!imageUrl) {
      setError('Добавьте фотографию товара');
      return;
    }
    if (!Number.isFinite(numericPrice) || price.trim() === '' || numericPrice < 0) {
      setError('Укажите корректную цену в грн');
      return;
    }
    if (!Number.isInteger(numericStock) || stock.trim() === '' || numericStock < 0) {
      setError('Укажите целое количество товара в наличии');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublish({
        name: trimmedName,
        price: numericPrice,
        stock: numericStock,
        imageUrl,
        rarities: selectedRarities,
      });
      onClose();
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : '';
      if (rawMsg.includes('popup') || rawMsg.includes('auth/cancelled')) {
        setError('Подтвердите вход в Google или включите Anonymous в Firebase Console.');
      } else if (rawMsg.startsWith('{') || rawMsg.toLowerCase().includes('permission')) {
        setError(
          'Нет прав на запись в Firestore. Проверьте, включена ли Анонимная авторизация в Firebase Console.'
        );
      } else if (rawMsg) {
        setError(rawMsg);
      } else {
        setError('Не удалось опубликовать товар');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-[#5B3B2A]/30 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Добавить новый товар"
        className="relative z-10 max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-[28px] border-[1.5px] border-[#E4C9B6] bg-[#FDF5EE] p-5 text-[#5B3B2A] shadow-[0_18px_48px_rgba(91,59,42,0.18)] sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#9B735B] text-white">
              <PlusIcon className="h-5 w-5" />
            </div>
            <h2 className="text-[19px] font-semibold leading-tight">
              Добавить новый товар
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть форму добавления товара"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F4E1D4] text-[#5B3B2A] transition-colors hover:bg-[#EAD0BF]"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Photo upload */}
          <div>
            <span className="mb-1.5 block text-[14px] font-medium text-[#7F5A46]">
              Фотография товара <span className="text-[#B34B3E]">*</span>
            </span>

            <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border-[1.5px] border-dashed border-[#C8A895] bg-[#FCF0E6] p-3 text-center transition-colors hover:border-[#9B735B]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Предпросмотр товара"
                  referrerPolicy="no-referrer"
                  className="max-h-[180px] w-full rounded-[14px] object-cover"
                />
              ) : (
                <div className="py-4">
                  <p className="text-[15px] font-medium text-[#5B3B2A]">
                    {isCompressing ? 'Обработка фото...' : 'Нажмите, чтобы выбрать фото'}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8D654E]">
                    PNG, JPG или WEBP
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          {/* Product name */}
          <div>
            <label
              htmlFor="product-name-input"
              className="mb-1.5 block text-[14px] font-medium text-[#7F5A46]"
            >
              Название товара <span className="text-[#B34B3E]">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              maxLength={PRODUCT_LIMITS.NAME_MAX}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Клубничная корова"
              className="h-[46px] w-full rounded-full border-[1.5px] border-[#DFC4B1] bg-[#FCF0E6] px-5 text-[15px] text-[#5B3B2A] placeholder-[#9E7861] focus:border-[#9B735B] focus:outline-none"
            />
          </div>

          {/* Price & Stock row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="product-price-input"
                className="mb-1.5 block text-[14px] font-medium text-[#7F5A46]"
              >
                Цена (грн) <span className="text-[#B34B3E]">*</span>
              </label>
              <input
                id="product-price-input"
                type="number"
                min={0}
                max={PRODUCT_LIMITS.PRICE_MAX}
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="250"
                className="h-[46px] w-full rounded-full border-[1.5px] border-[#DFC4B1] bg-[#FCF0E6] px-5 text-[15px] tabular-nums text-[#5B3B2A] placeholder-[#9E7861] focus:border-[#9B735B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="product-stock-input"
                className="mb-1.5 block text-[14px] font-medium text-[#7F5A46]"
              >
                В наличии (шт.) <span className="text-[#B34B3E]">*</span>
              </label>
              <input
                id="product-stock-input"
                type="number"
                min={0}
                max={PRODUCT_LIMITS.STOCK_MAX}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                className="h-[46px] w-full rounded-full border-[1.5px] border-[#DFC4B1] bg-[#FCF0E6] px-5 text-[15px] tabular-nums text-[#5B3B2A] placeholder-[#9E7861] focus:border-[#9B735B] focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Rarity Badges Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[14px] font-medium text-[#7F5A46]">
                Редкость{' '}
                <span className="text-[12px] font-normal text-[#9E7861]">
                  (необязательно)
                </span>
              </span>
              {selectedRarities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRarities([])}
                  className="cursor-pointer text-[12px] font-medium text-[#8D654E] underline decoration-[#C8A895] underline-offset-2 hover:text-[#5B3B2A]"
                >
                  Сбросить
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {RARITY_OPTIONS.map((option) => {
                const isSelected = selectedRarities.includes(option.code);
                return (
                  <button
                    key={option.code}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${option.label} (${option.code})`}
                    onClick={() => toggleRarity(option.code)}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] border-[1.5px] px-2 py-2.5 transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? 'border-[#9B735B] bg-[#EFE0D4] shadow-[0_3px_10px_rgba(91,59,42,0.12)]'
                        : 'border-[#DFC4B1] bg-[#FCF0E6] opacity-75 hover:border-[#C5A48F] hover:opacity-100'
                    }`}
                  >
                    <img
                      src={option.iconSrc}
                      alt={option.label}
                      draggable={false}
                      className="h-9 w-9 select-none object-contain"
                    />
                    <span className="text-[11px] font-medium text-[#5B3B2A]">
                      {option.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-2xl bg-[#F6DFDB] px-4 py-2.5 text-[13px] font-medium text-[#9A3A30]">
              {error}
            </p>
          )}

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[46px] cursor-pointer rounded-full border-[1.5px] border-[#D9BCAE] bg-[#F5E3D7] px-5 text-[14px] font-medium text-[#5B3B2A] transition-colors hover:bg-[#EED8CA]"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="h-[46px] flex-1 cursor-pointer rounded-full bg-[#9B735B] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#8C654E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSubmitting ? 'Публикация...' : 'Опубликовать товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
