import { onAuthStateChanged, type User } from 'firebase/auth';
import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { AddProductModal, AdminPasswordModal } from './components/AdminModals';
import { BackgroundWaves } from './components/BackgroundWaves';
import { MusicPlayer } from './components/MusicPlayer';
import { RarityBadgeList } from './components/RarityBadges';
import { ReviewsSection } from './components/ReviewsSection';
import { CartDrawer, type CartEntry, FavoritesDrawer } from './components/ShopDrawers';
import { SplashScreen } from './components/SplashScreen';
import {
  CartOutlineIcon,
  ChatDotsIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  HomeIcon,
  PlusIcon,
  SearchGlassIcon,
  ShieldCheckIcon,
  TrashIcon,
} from './components/VikiIcons';
import {
  auth,
  deleteCatalogProduct,
  ensureAdminFirebaseSession,
  INITIAL_PLACEHOLDER_PRODUCTS,
  publishNewProduct,
  type RarityCode,
  signInOwnerWithGoogle,
  signOutAdminFirebaseSession,
  type StoreProduct,
  subscribeToCatalog,
} from './firebase';

const FAVORITES_STORAGE_KEY = 'viki_pets_favorites';
const CART_STORAGE_KEY = 'viki_pets_cart';

function readStoredFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function readStoredCart(): CartEntry[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartEntry =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  const [activeNav, setActiveNav] = useState<'catalog' | 'reviews'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [logoError, setLogoError] = useState(false);

  const [products, setProducts] = useState<StoreProduct[]>(INITIAL_PLACEHOLDER_PRODUCTS);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStoredFavorites());
  const [cartItems, setCartItems] = useState<CartEntry[]>(() => readStoredCart());
  const [activeDrawer, setActiveDrawer] = useState<'favorites' | 'cart' | null>(null);

  // Admin state (session token held strictly in memory, never in localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [needsAnonymousSetup, setNeedsAnonymousSetup] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = adminToken !== null;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setNeedsAnonymousSetup(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubCatalog = subscribeToCatalog(
      (liveProducts) => {
        setProducts(liveProducts);
        setCatalogError(null);
      },
      (err) => {
        console.error('Catalog subscription error:', err);
        setCatalogError('Не удалось загрузить каталог товаров');
      }
    );
    return () => unsubCatalog();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // ignore storage errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore storage errors
    }
  }, [cartItems]);

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (target && !target.isPlaceholder && target.stock <= 0) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        const maxStock = target && !target.isPlaceholder ? target.stock : 99;
        if (existing.quantity >= maxStock) return prev;
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    const target = products.find((p) => p.id === id);
    const maxStock = target && !target.isPlaceholder ? target.stock : 99;
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return { ...item, quantity: nextQty };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenCart = () => {
    setActiveDrawer('cart');
  };

  const ensureAdminWriteAuth = async () => {
    const session = await ensureAdminFirebaseSession(adminToken);
    if (!session.ready && session.needsAnonymousProvider) {
      setNeedsAnonymousSetup(true);
      throw new Error(
        'Включите Анонимную авторизацию (Anonymous) в Firebase Console, чтобы сохранять товары без входа через Google.'
      );
    }
  };

  const handlePublishProduct = async (input: {
    name: string;
    price: number;
    stock: number;
    imageUrl: string;
    rarities: RarityCode[];
  }) => {
    setAdminActionError(null);
    await ensureAdminWriteAuth();
    await publishNewProduct(input);
  };

  const handleDeleteProduct = async (productId: string) => {
    setAdminActionError(null);
    setDeletingId(productId);
    try {
      await ensureAdminWriteAuth();
      await deleteCatalogProduct(productId);
      setFavoriteIds((prev) => prev.filter((id) => id !== productId));
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      const msg =
        err instanceof Error && !err.message.startsWith('{')
          ? err.message
          : 'Не удалось удалить товар. Проверьте подключение к Firestore и правила доступа.';
      setAdminActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdminButtonClick = () => {
    if (isAdmin) {
      setAdminToken(null);
      setAdminActionError(null);
      setNeedsAnonymousSetup(false);
      void signOutAdminFirebaseSession().catch(() => {});
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => {
    const exists = products.some((p) => p.id === item.id);
    return exists ? sum + item.quantity : sum;
  }, 0);

  const totalCartPrice = cartItems.reduce((sum, item) => {
    const pet = products.find((p) => p.id === item.id);
    return sum + (pet ? pet.price * item.quantity : 0);
  }, 0);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visiblePets = normalizedQuery
    ? products.filter((pet) => pet.name.toLowerCase().includes(normalizedQuery))
    : products;

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-clip bg-[#FDF5EE] text-[#5B3B2A]">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      <BackgroundWaves />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1670px] flex-col gap-4 px-3.5 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:flex-row lg:items-stretch lg:gap-6 lg:px-7 lg:py-6 xl:gap-8 xl:px-10 xl:py-7 2xl:px-12">
        {/* Left Sidebar */}
        <aside className="flex w-full shrink-0 flex-col justify-between lg:w-[228px] xl:w-[272px] 2xl:w-[310px]">
          <div>
            {/* Brand Logo */}
            <div className="flex justify-center lg:justify-start">
              {!logoError ? (
                <img
                  src="/assets/viki-logo.png"
                  alt="Viki pets"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="-mt-1 h-auto w-[215px] max-w-full select-none object-contain sm:w-[265px] lg:-mt-2 lg:-ml-1 lg:w-[235px] xl:-ml-2 xl:w-[295px] 2xl:-ml-3 2xl:w-[355px]"
                />
              ) : (
                <div className="flex h-[140px] w-[220px] items-center justify-center rounded-3xl bg-[#F6E3D6] text-2xl font-bold text-[#7F5A46] sm:h-[180px] sm:w-[260px]">
                  Viki pets
                </div>
              )}
            </div>

            {/* Sidebar Navigation */}
            <nav
              aria-label="Основная навигация"
              className="mt-2 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-3.5 lg:mt-2 lg:flex lg:flex-col lg:gap-[12px] lg:pl-1 xl:gap-[14px] xl:pl-3"
            >
              <button
                type="button"
                onClick={() => setActiveNav('catalog')}
                className={`flex h-[50px] min-w-0 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-4 text-[15px] font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D654E] sm:h-[58px] sm:gap-3.5 sm:px-6 sm:text-[18px] lg:h-[58px] lg:max-w-[270px] lg:justify-start lg:gap-3.5 lg:px-5 lg:text-[17px] xl:h-[68px] xl:gap-4 xl:px-7 xl:text-[20px] 2xl:h-[74px] 2xl:text-[21px] ${
                  activeNav === 'catalog'
                    ? 'bg-[#9C755E] text-white hover:bg-[#8E6852]'
                    : 'bg-[#F4E1D4] text-[#5B3B2A] hover:bg-[#ECD4C4]'
                }`}
              >
                <HomeIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                <span className="truncate">Каталог</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('reviews')}
                className={`flex h-[50px] min-w-0 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-4 text-[15px] font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D654E] sm:h-[58px] sm:gap-3.5 sm:px-6 sm:text-[18px] lg:h-[58px] lg:max-w-[270px] lg:justify-start lg:gap-3.5 lg:px-5 lg:text-[17px] xl:h-[68px] xl:gap-4 xl:px-7 xl:text-[20px] 2xl:h-[74px] 2xl:text-[21px] ${
                  activeNav === 'reviews'
                    ? 'bg-[#9C755E] text-white hover:bg-[#8E6852]'
                    : 'bg-[#F4E1D4] text-[#6A4836] hover:bg-[#ECD4C4]'
                }`}
              >
                <ChatDotsIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
                <span className="truncate">Отзывы</span>
              </button>
            </nav>
          </div>

          {/* Bottom-Left Admin Login Button */}
          <div className="mt-8 hidden lg:block">
            <button
              type="button"
              onClick={handleAdminButtonClick}
              className={`flex h-[74px] w-full max-w-[310px] cursor-pointer items-center gap-3 rounded-full border-[1.5px] px-5 text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D654E] xl:h-[88px] xl:gap-4 xl:px-7 2xl:h-[92px] ${
                isAdmin
                  ? 'border-[#9B735B] bg-[#9B735B] text-white hover:bg-[#8C654E]'
                  : 'border-[#C8A895] bg-[#F5E3D7] text-[#5B3B2A] hover:bg-[#EED8CA]'
              }`}
            >
              <ShieldCheckIcon
                className={`h-6 w-6 shrink-0 xl:h-8 xl:w-8 ${
                  isAdmin ? 'text-white' : 'text-[#6A4836]'
                }`}
              />
              <span className="text-[15px] leading-[1.25] font-medium xl:text-[18px] 2xl:text-[19px]">
                {isAdmin ? (
                  <>
                    Выйти из
                    <br />
                    админ-режима
                  </>
                ) : (
                  <>
                    Войти как
                    <br />
                    администратор
                  </>
                )}
              </span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex min-w-0 flex-1 flex-col lg:pt-2 xl:pt-3">
          {/* Top Bar: Music Player + Favorites / Cart */}
          <header className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between md:gap-4 xl:gap-6">
            <MusicPlayer />

            {/* Favorites & Cart Action Tiles */}
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4 md:flex md:items-center md:gap-3.5 xl:gap-5 2xl:gap-6">
              <button
                type="button"
                onClick={() => setActiveDrawer('favorites')}
                aria-label={`Избранное (${favoriteIds.length})`}
                className="relative flex h-[82px] min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[22px] bg-[#9B735B] px-3 text-white transition-all duration-150 hover:bg-[#8D6650] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3B2A] sm:h-[96px] sm:gap-1.5 sm:rounded-[26px] md:h-[100px] md:w-[114px] md:px-4 lg:h-[98px] lg:w-[114px] xl:h-[112px] xl:w-[144px] xl:rounded-[28px] 2xl:h-[118px] 2xl:w-[162px]"
              >
                {favoriteIds.length > 0 && (
                  <span className="absolute top-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FCF0E7] px-1.5 text-[12px] font-bold tabular-nums text-[#5B3B2A] shadow-sm sm:top-2.5 sm:right-2.5">
                    {favoriteIds.length}
                  </span>
                )}
                <HeartOutlineIcon className="h-7 w-7 stroke-[1.75] sm:h-8 sm:w-8 xl:h-10 xl:w-10" />
                <span className="max-w-full truncate text-[14px] font-medium sm:text-[15px] xl:text-[17px]">
                  Избранное
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenCart}
                aria-label={`Корзина (${totalCartCount}, ${totalCartPrice} грн)`}
                className="relative flex h-[82px] min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[22px] bg-[#9B735B] px-3 text-white transition-all duration-150 hover:bg-[#8D6650] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3B2A] sm:h-[96px] sm:gap-1.5 sm:rounded-[26px] md:h-[100px] md:w-[114px] md:px-4 lg:h-[98px] lg:w-[114px] xl:h-[112px] xl:w-[144px] xl:rounded-[28px] 2xl:h-[118px] 2xl:w-[162px]"
              >
                {totalCartCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#FCF0E7] px-1.5 text-[12px] font-bold tabular-nums text-[#5B3B2A] shadow-sm sm:top-2.5 sm:right-2.5">
                    {totalCartCount}
                  </span>
                )}
                <CartOutlineIcon className="h-7 w-7 stroke-[1.75] sm:h-8 sm:w-8 xl:h-10 xl:w-10" />
                <span className="max-w-full truncate text-[14px] font-medium sm:text-[15px] xl:text-[17px]">
                  {totalCartCount > 0 ? `${totalCartPrice} грн` : 'Корзина'}
                </span>
              </button>
            </div>
          </header>

          {/* Admin Toolbar (visible only after password pipidastr_007 is verified) */}
          {isAdmin && (
            <div className="mt-4 flex flex-col gap-3 rounded-[22px] border-[1.5px] border-[#DFC3B0] bg-[#FAF0E6] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[#8D654E]" />
                  <span className="text-[14px] font-semibold text-[#5B3B2A] sm:text-[15px]">
                    Панель администратора
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav('catalog');
                      setIsAddProductOpen(true);
                    }}
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#9B735B] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#8C654E] active:scale-[0.98]"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Добавить товар</span>
                  </button>
                </div>
              </div>

              {needsAnonymousSetup && !firebaseUser && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-[16px] border border-[#E2C2AC] bg-[#F5E4D6] px-3.5 py-2.5 text-[12px] text-[#5B3B2A] sm:text-[13px]">
                  <p className="min-w-0 flex-1 leading-snug">
                    Для сохранения товаров без входа в Google включите провайдер{' '}
                    <strong>Anonymous</strong> в{' '}
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0460356534/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline decoration-[#9B735B] underline-offset-2"
                    >
                      Firebase Console → Authentication
                    </a>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => void signInOwnerWithGoogle().catch(() => {})}
                    className="cursor-pointer rounded-full border border-[#C8A895] bg-[#FDF5EE] px-3 py-1 text-[12px] font-medium text-[#5B3B2A] transition-colors hover:bg-[#EAD4C4]"
                  >
                    Или войти через Google
                  </button>
                </div>
              )}
            </div>
          )}

          {adminActionError && (
            <div className="mt-3 rounded-[18px] border border-[#E2B7AE] bg-[#F7E0DB] px-4 py-2.5 text-[13px] font-medium text-[#8F352B]">
              {adminActionError}
            </div>
          )}

          {activeNav === 'catalog' ? (
            <>
              {/* Search Bar */}
              <div className="mt-4 sm:mt-5 xl:mt-6">
                <label className="flex h-[50px] w-full min-w-0 items-center gap-3 rounded-full border-[1.5px] border-[#E4C9B6] bg-[#FCF0E6] px-4 transition-colors focus-within:border-[#B6927A] sm:h-[56px] sm:gap-4 sm:px-6 xl:h-[64px]">
                  <SearchGlassIcon className="h-5 w-5 shrink-0 text-[#8D654E] sm:h-6 sm:w-6" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск питомцев..."
                    className="min-w-0 w-full bg-transparent text-[15px] font-normal text-[#5B3B2A] placeholder-[#946F5A] focus:outline-none sm:text-[17px] xl:text-[19px]"
                  />
                </label>
              </div>

              {catalogError && (
                <div className="mt-4 rounded-[20px] border border-[#E4C9B6] bg-[#FCF0E7] px-5 py-3 text-[14px] text-[#8D654E]">
                  {catalogError}
                </div>
              )}

              {/* Pet Cards Grid */}
              {visiblePets.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-[26px] border-[1.5px] border-dashed border-[#DFC4B1] bg-[#FCF0E7] px-6 py-12 text-center">
                  <p className="text-[18px] font-medium text-[#5B3B2A]">
                    {normalizedQuery
                      ? `По запросу «${searchQuery}» ничего не найдено`
                      : 'В каталоге пока нет товаров'}
                  </p>
                  {normalizedQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-4 h-10 cursor-pointer rounded-full bg-[#9B735B] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#8C654E]"
                    >
                      Сбросить поиск
                    </button>
                  ) : isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setIsAddProductOpen(true)}
                      className="mt-4 h-10 cursor-pointer rounded-full bg-[#9B735B] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#8C654E]"
                    >
                      Добавить первый товар
                    </button>
                  ) : null}
                </div>
              ) : (
                <section
                  aria-label="Каталог питомцев"
                  className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-4 xl:mt-6 xl:gap-5 2xl:gap-6"
                >
                  {visiblePets.map((pet) => {
                    const isFavorite = favoriteIds.includes(pet.id);
                    const cartQty = cartItems.find((c) => c.id === pet.id)?.quantity ?? 0;
                    const isOutOfStock = !pet.isPlaceholder && pet.stock <= 0;

                    return (
                      <article
                        key={pet.id}
                        className="flex min-w-0 flex-col rounded-[22px] border-[1.5px] border-[#E4C9B6] bg-[#FCF0E7] p-3 sm:rounded-[24px] sm:p-3.5 xl:rounded-[26px] xl:p-[14px]"
                      >
                        {/* Pet Photo Slot */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-[#E8D8CC] sm:aspect-auto sm:h-[155px] sm:rounded-[18px] lg:h-[146px] xl:h-[164px] 2xl:h-[178px]">
                          {pet.imageUrl && (
                            <img
                              src={pet.imageUrl}
                              alt={pet.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          )}

                          {/* Admin Delete Button */}
                          {isAdmin && (
                            <button
                              type="button"
                              disabled={deletingId === pet.id}
                              onClick={() => void handleDeleteProduct(pet.id)}
                              aria-label={`Удалить товар ${pet.name}`}
                              className="absolute top-2.5 left-2.5 flex h-9 cursor-pointer items-center gap-1 rounded-full bg-[#B34B3E] px-3 text-[12px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#993D31] active:scale-95 disabled:opacity-60 sm:h-9"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>{deletingId === pet.id ? '...' : 'Удалить'}</span>
                            </button>
                          )}

                          {/* Favorite Heart Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(pet.id)}
                            aria-pressed={isFavorite}
                            aria-label={
                              isFavorite ? 'Убрать из избранного' : 'Сохранить в избранное'
                            }
                            className={`absolute top-2.5 right-2.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D654E] sm:h-10 sm:w-10 ${
                              isFavorite
                                ? 'bg-[#FCF0E7] text-[#C86D62]'
                                : 'bg-[#FCF0E7]/85 text-[#8D654E] hover:bg-[#FCF0E7] hover:text-[#5B3B2A]'
                            }`}
                          >
                            {isFavorite ? (
                              <HeartFilledIcon className="h-5 w-5" />
                            ) : (
                              <HeartOutlineIcon className="h-5 w-5 stroke-[1.9]" />
                            )}
                          </button>

                          {/* Optional Rarity Badges */}
                          {pet.rarities.length > 0 && (
                            <RarityBadgeList
                              rarities={pet.rarities}
                              size="md"
                              className="absolute right-2.5 bottom-2.5"
                            />
                          )}
                        </div>

                        {/* Pet Name */}
                        <h2 className="mt-2.5 truncate px-1 text-[17px] font-medium text-[#5B3B2A] sm:mt-3 sm:text-[18px] lg:text-[17px] xl:text-[18px] 2xl:text-[19px]">
                          {pet.name}
                        </h2>

                        {/* Clean unboxed stock line for published products */}
                        {!pet.isPlaceholder ? (
                          <p className="mt-0.5 mb-2.5 px-1 text-[13px] text-[#8D654E] tabular-nums">
                            {pet.stock > 0 ? `В наличии: ${pet.stock} шт.` : 'Нет в наличии'}
                          </p>
                        ) : (
                          <div className="mb-2.5 sm:mb-3" />
                        )}

                        {/* Price + Buy Row */}
                        <div className="mt-auto flex min-w-0 items-center justify-between gap-2 sm:gap-2.5 xl:gap-3">
                          <div className="flex h-[42px] min-w-0 flex-1 items-center justify-center rounded-full bg-[#E6CCBC] px-2.5 text-[15px] font-medium tabular-nums text-[#5B3B2A] whitespace-nowrap sm:h-[44px] sm:px-3 sm:text-[16px] lg:h-[42px] lg:px-2.5 lg:text-[15px] xl:h-[44px] xl:px-4 xl:text-[17px] 2xl:h-[46px] 2xl:text-[18px]">
                            <span className="truncate">{pet.price} грн</span>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock && cartQty === 0}
                            onClick={() =>
                              cartQty > 0 ? handleOpenCart() : handleAddToCart(pet.id)
                            }
                            className={`flex h-[42px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 text-[15px] font-medium text-white whitespace-nowrap transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3B2A] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[44px] sm:gap-2 sm:px-3 sm:text-[16px] lg:h-[42px] lg:px-2.5 lg:text-[15px] xl:h-[44px] xl:px-4 xl:text-[17px] 2xl:h-[46px] 2xl:text-[18px] ${
                              cartQty > 0
                                ? 'bg-[#7F5A44] hover:bg-[#6E4D3A]'
                                : 'bg-[#9B735B] hover:bg-[#8C654E]'
                            }`}
                          >
                            <CartOutlineIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                            <span className="truncate">
                              {cartQty > 0
                                ? `В корзине (${cartQty})`
                                : isOutOfStock
                                ? 'Распродано'
                                : 'Купить'}
                            </span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </>
          ) : (
            <ReviewsSection />
          )}

          {/* Mobile & Tablet Admin Button */}
          <div className="mt-4 pb-2 sm:mt-5 lg:hidden">
            <button
              type="button"
              onClick={handleAdminButtonClick}
              className={`flex h-[64px] w-full cursor-pointer items-center justify-center gap-3 rounded-full border-[1.5px] px-5 transition-all duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D654E] sm:h-[72px] ${
                isAdmin
                  ? 'border-[#9B735B] bg-[#9B735B] text-white hover:bg-[#8C654E]'
                  : 'border-[#C8A895] bg-[#F5E3D7] text-[#5B3B2A] hover:bg-[#EED8CA]'
              }`}
            >
              <ShieldCheckIcon
                className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 ${
                  isAdmin ? 'text-white' : 'text-[#6A4836]'
                }`}
              />
              <span className="truncate text-[16px] font-medium sm:text-[17px]">
                {isAdmin ? 'Выйти из админ-режима' : 'Войти как администратор'}
              </span>
            </button>
          </div>
        </main>
      </div>

      {/* Drawers */}
      <FavoritesDrawer
        isOpen={activeDrawer === 'favorites'}
        onClose={() => setActiveDrawer(null)}
        pets={products}
        favoriteIds={favoriteIds}
        cartItems={cartItems}
        onToggleFavorite={handleToggleFavorite}
        onAddToCart={handleAddToCart}
        onClearFavorites={() => setFavoriteIds([])}
        onOpenCart={handleOpenCart}
      />

      <CartDrawer
        isOpen={activeDrawer === 'cart'}
        onClose={() => setActiveDrawer(null)}
        pets={products}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Admin Modals */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={(token) => {
          setAdminToken(token);
          setIsPasswordModalOpen(false);
          setAdminActionError(null);
          void ensureAdminFirebaseSession(token)
            .then((res) => {
              if (!res.ready && res.needsAnonymousProvider) {
                setNeedsAnonymousSetup(true);
              }
            })
            .catch(() => {});
        }}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onPublish={handlePublishProduct}
      />
    </div>
  );
}
