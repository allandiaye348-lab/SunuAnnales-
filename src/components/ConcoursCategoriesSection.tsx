import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  annales_count: number;
}

interface ConcoursCategoriesSectionProps {
  onSelectCategory: (categoryName: string) => void;
}

export const ConcoursCategoriesSection: React.FC<ConcoursCategoriesSectionProps> = ({
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load categories:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <section className="py-16 bg-slate-900/30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              Grandes Écoles & Concours Directs
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk']">
              Explorez par Catégorie de Concours
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Chaque filière dispose d'annales conformes aux arrêtés ministériels, avec 320 exercices corrigés et barèmes officiels au prix unique de 2 000 FCFA.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {categories.length} corps et catégories disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Category Image */}
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-amber-300 shadow">
                  {cat.annales_count} annale{cat.annales_count > 1 ? 's' : ''}
                </span>

                <span className="absolute bottom-3 left-4 text-xs font-black text-white px-2 py-0.5 rounded bg-emerald-700/80 border border-emerald-500/40">
                  2 000 FCFA
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Button Voir les annales */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.name);
                    const el = document.getElementById('catalogue');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition duration-200 border border-slate-700 hover:border-emerald-500 shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition" />
                  Voir les annales
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
