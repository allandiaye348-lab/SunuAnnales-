import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { BookOpen, User as UserIcon, LogOut, CheckCircle2, ChevronDown, Check, Search, Layers } from 'lucide-react';

interface NavbarProps {
  currentUser?: User | null;
  purchasedCount: number;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  isAdminView?: boolean;
  onTogglePurchasesFilter: () => void;
  filterOnlyPurchased: boolean;
  onSelectCategory: (cat: string) => void;
  selectedCategory: string;
  categories?: string[];
  currentTab?: 'accueil' | 'apropos' | 'contact';
  onSelectTab?: (tab: 'accueil' | 'apropos' | 'contact') => void;
  onResetPurchases?: () => void;
  onOpenRoutes?: () => void;
  onOpenPortal?: () => void;
  onOpenPhotos?: () => void;
}

const DEFAULT_CATEGORIES = [
  'Tous',
  'Police',
  'Gendarmerie',
  'Douane',
  'ENA',
  'ENSOA',
  'Eaux & Forêts',
  'INSEPS',
  'FASTEF',
  'CREM',
  'ENDSS',
  'BTS Transit',
  'BTS Secrétariat',
  'BTS Gestion Chaine Approvisionnement Logistique',
  'Magistrature',
  'Greffe',
  'Ingénierie & Polytechnique',
  'BTS Génie Civil',
  'BTS Comptabilité',
  'BT Secrétariat',
  'Probatoire',
  'IFACE Dakar',
  "Agriculture de l'Armée",
  'Gendarmerie (ESOGN)',
  'BT Comptabilité',
];

const isAllCategories = (cat: string | null | undefined): boolean => {
  if (!cat) return true;
  const norm = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return (
    norm === 'tous' ||
    norm === 'all' ||
    norm === '*' ||
    norm.includes('tous') ||
    norm.includes('toutes') ||
    norm.includes('filiere') ||
    norm.includes('concours')
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  purchasedCount,
  onOpenAuth,
  onLogout,
  onTogglePurchasesFilter,
  filterOnlyPurchased,
  onSelectCategory,
  selectedCategory,
  categories = DEFAULT_CATEGORIES,
  currentTab = 'accueil',
  onSelectTab,
  onResetPurchases,
  onOpenPortal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left Brand Logo & Primary Nav Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-6">
            <div
              onClick={() => {
                onSelectTab?.('accueil');
                onSelectCategory('Tous');
                setIsDropdownOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 border border-emerald-500/30 group-hover:scale-105 transition shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-white font-['Cabinet_Grotesk']">
                    Sunu<span className="text-emerald-400">Annales</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden xl:block">
                  SaaS Annales Concours du Sénégal
                </p>
              </div>
            </div>

            {/* Essential Navigation Links: Accueil • À propos • Contact */}
            <nav className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => onSelectTab?.('accueil')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition ${
                  currentTab === 'accueil'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Accueil
              </button>
              <button
                onClick={() => onSelectTab?.('apropos')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition ${
                  currentTab === 'apropos'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                À propos
              </button>
              <button
                onClick={() => onSelectTab?.('contact')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition ${
                  currentTab === 'contact'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Center Compact Dropdown List for Concours & BTS */}
          <div className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-sm hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-semibold transition shadow-sm group"
              title="Sélectionner une catégorie de concours ou BTS"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Layers className="w-2.5 h-2.5" />
                </div>
                <span className="text-white font-bold truncate text-[11px] sm:text-xs">
                  {isAllCategories(selectedCategory) ? 'Filières & Concours' : selectedCategory}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-emerald-400">
                <span className="text-[10px] bg-slate-800 px-1 py-0.2 rounded text-slate-400 font-mono">
                  {categories.length}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu List */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar inside List */}
                <div className="p-2 border-b border-slate-800 bg-slate-950/60">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrer la liste (ex: BTS, Police...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Categories Scrollable List */}
                <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                  {filteredCategories.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      Aucune filière trouvée pour "{searchQuery}"
                    </div>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isSelected = isAllCategories(selectedCategory) ? cat === 'Tous' : selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            onSelectCategory(cat);
                            onSelectTab?.('accueil');
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{cat === 'Tous' ? '✨ Tous les concours & examens' : cat}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* My Purchases shortcut if any */}
            {purchasedCount > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onTogglePurchasesFilter}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    filterOnlyPurchased
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-200 border border-slate-700 hover:border-slate-600'
                  }`}
                  title="Afficher uniquement mes fascicules débloqués"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Mes Annales</span>
                  <span className="bg-emerald-700 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {purchasedCount}
                  </span>
                </button>

                {onResetPurchases && (
                  <button
                    onClick={onResetPurchases}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 text-[10px] transition"
                    title="Réinitialiser les achats de test"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

