"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tarificationLivraison = {
  "Fidjrossè": 1000,
  "Haie Vive / Cadjehoun": 1000,
  "Cocotiers / Guinkomey": 1500,
  "Akpakpa": 2000,
  "Calavi (IITA / Kpota)": 2500,
  "Zogbo / Sainte Rita": 1500
};

const categories = ["Tous", "Plat Traditionnel", "Spécialité", "Entrée / Snack"];

export default function Home() {
  const [plats, setPlats] = useState([]); 
  const [categorieActive, setCategorieActive] = useState("Tous");
  const [panier, setPanier] = useState([]); 
  const [zoneLivraison, setZoneLivraison] = useState("Fidjrossè");

  useEffect(() => {
    async function recupererPlats() {
      const { data } = await supabase
        .from("plats")
        .select("*")
        .order("id", { ascending: true });
      if (data) setPlats(data);
    }
    
    recupererPlats();

    const canalRealtime = supabase
      .channel("liaison-directe-client")
      .on("postgres_changes", { event: "*", schema: "public", table: "plats" }, () => {
        recupererPlats();
      })
      .subscribe();

    return () => { supabase.removeChannel(canalRealtime); };
  }, []);

  const platsFiltres = categorieActive === "Tous" ? plats : plats.filter(p => p.categorie === categorieActive);

  const ajouterAuPanier = (plat) => {
    setPanier((prev) => {
      const ex = prev.find(i => String(i.plat.id) === String(plat.id));
      return ex ? prev.map(i => String(i.plat.id) === String(plat.id) ? { ...i, quantite: i.quantite + 1 } : i) : [...prev, { plat, quantite: 1 }];
    });
  };

  const retirarDuPanier = (platId) => {
    setPanier((prev) => {
      const item = prev.find(i => String(i.plat.id) === String(platId));
      if (!item) return prev;
      return item.quantite === 1 ? prev.filter(i => String(i.plat.id) !== String(platId)) : prev.map(i => String(i.plat.id) === String(platId) ? { ...i, quantite: i.quantite - 1 } : i);
    });
  };

  const totalPlats = panier.reduce((sum, i) => sum + (i.plat.prix * i.quantite), 0);
  const fraisLivraison = panier.length > 0 ? tarificationLivraison[zoneLivraison] : 0;
  const totalGeneral = totalPlats + fraisLivraison;
  const totalArticles = panier.reduce((sum, i) => sum + i.quantite, 0);
  const numeroWhatsApp = "22961000000"; 

  const envoyerCommandeWhatsApp = () => {
    if (panier.length === 0) return;
    let msg = `*🇧🇯 NOUVELLE COMMANDE - KÀNÒLÍ RESTO*\n\n`;
    panier.forEach(i => { msg += `▪️ *${i.quantite}x* ${i.plat.nom} (${(i.plat.prix * i.quantite).toLocaleString()} F)\n`; });
    msg += `\n-------------------------\n`;
    msg += `🍲 Plats : ${totalPlats.toLocaleString()} F\n`;
    msg += `🛵 Livraison (${zoneLivraison}) : ${fraisLivraison.toLocaleString()} F\n`;
    msg += `💰 *TOTAL : ${totalGeneral.toLocaleString()} FCFA*\n`;
    msg += `-------------------------\n\nMerci de me confirmer la commande !`;
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#0c0a09] text-stone-200 font-sans pb-40 selection:bg-amber-500 selection:text-black">
      
      {/* HEADER GLASSMORPHISM SOMBRE */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-white/5 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl shadow-2xl">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse">🔥</span>
          <span className="text-xl font-black tracking-widest bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            KÀNÒLÍ
          </span>
        </div>
        <nav className="hidden md:flex space-x-8 text-xs font-bold uppercase tracking-widest text-stone-400">
          <a href="#accueil" className="hover:text-amber-400 transition-colors">Accueil</a>
          <a href="#menu" className="hover:text-amber-400 transition-colors">La Carte</a>
          <a href="#contact" className="hover:text-amber-400 transition-colors">Horaires</a>
        </nav>
        <button 
          onClick={() => { if(panier.length > 0) document.getElementById('panier-section')?.scrollIntoView({behavior: 'smooth'}) }}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.25)] flex items-center space-x-2"
        >
          <span>🛒 Panier</span>
          <span className="bg-stone-950 text-amber-400 px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums shadow-inner">{totalArticles}</span>
        </button>
      </header>

      {/* HERO BANNER AVEC LE FOND TRADITIONNEL CORRIGÉ EN CONTRASTE */}
      <section 
        id="accueil" 
        className="relative py-28 md:py-40 px-6 max-w-7xl mx-auto text-center bg-cover bg-center bg-no-repeat rounded-3xl mt-4 overflow-hidden shadow-2xl"
        style={{ 
          backgroundImage: "linear-gradient(to bottom, rgba(12, 10, 9, 0.70), rgba(12, 10, 9, 0.98)), url('https://kanoli-resto-depty-oj7wx9qmw-kamikaze-s-projects29.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.bc64be73.png&w=1920&q=75')" 
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 text-amber-400 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Cuisine Connectée • Cotonou
          </span>
          <h2 className="text-4xl md:text-7xl font-black tracking-tight mb-6 leading-[1.15] text-white">
            Le goût du terroir,<br/>réinventé avec <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">Élégance</span>.
          </h2>
          <p className="text-xs md:text-sm text-stone-400 max-w-lg mx-auto mb-10 leading-relaxed font-medium">
            Découvrez notre carte synchronisée en direct. Composez votre panier et commandez instantanément via WhatsApp.
          </p>
          <a href="#menu" className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_30px_rgba(245,158,11,0.2)] inline-block">
            Consulter la Carte
          </a>
        </div>
      </section>

      {/* LA CARTE */}
      <section id="menu" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Menu du jour</h3>
          <p className="text-2xl md:text-4xl font-black text-white tracking-tight">Les Incontournables Kànòlí</p>
          <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* SLIDER DES CATÉGORIES */}
        <div className="flex overflow-x-auto justify-start md:justify-center gap-2.5 mb-14 pb-4 px-2 scrollbar-none snap-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorieActive(cat)}
              className={`snap-center px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 border duration-300 ${
                categorieActive === cat
                  ? "bg-white text-black border-white shadow-xl scale-102"
                  : "bg-stone-900/40 text-stone-400 hover:text-white border-white/5 hover:bg-stone-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRILLE BENTO BOX DES PLATS */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {platsFiltres.map((plat) => {
            const itemDansPanier = panier.find(i => String(i.plat.id) === String(plat.id));
            const quantite = itemDansPanier ? itemDansPanier.quantite : 0;

            return (
              <div 
                key={plat.id} 
                className="group bg-stone-900/30 hover:bg-stone-900/60 border border-white/[0.02] p-4 rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative">
                  {plat.tag && (
                    <span className="absolute top-3 right-3 z-10 text-[9px] font-black uppercase tracking-widest bg-amber-500 text-stone-950 px-2.5 py-1 rounded-lg shadow-md">
                      {plat.tag}
                    </span>
                  )}
                  <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-white/5 relative bg-stone-950 shadow-inner">
                    <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <span className="text-[9px] font-black tracking-widest uppercase text-amber-500/80 block mb-1">{plat.categorie}</span>
                  <h4 className="text-lg font-black text-white mb-1 tracking-tight">{plat.nom}</h4>
                  <p className="text-stone-400 text-xs leading-relaxed mb-6 font-medium">{plat.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.03] mt-auto">
                  <span className="font-black text-xl text-white tracking-tight">{Number(plat.prix).toLocaleString()} <span className="text-[10px] font-black text-amber-400 ml-0.5">FCFA</span></span>

                  <div className="flex items-center justify-end">
                    {quantite > 0 ? (
                      <div className="flex items-center bg-stone-950 rounded-xl border border-white/5 p-1.5 shadow-xl w-32 justify-between">
                        <button onClick={() => retirarDuPanier(plat.id)} className="w-8 h-8 rounded-lg bg-stone-900 text-white font-black flex items-center justify-center text-sm">−</button>
                        <span className="font-black text-xs text-amber-400 tabular-nums">{quantite}</span>
                        <button onClick={() => ajouterAuPanier(plat)} className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm">+</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => ajouterAuPanier(plat)}
                        className="bg-stone-900 hover:bg-amber-500 text-stone-300 hover:text-stone-950 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-white/5"
                      >
                        Ajouter 🛒
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER STICKY PANIER AVEC LIVRAISON INTEGREE */}
      {panier.length > 0 && (
        <section id="panier-section" className="fixed bottom-4 left-4 right-4 z-50 bg-stone-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 max-w-4xl mx-auto rounded-2xl transition-all">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block mb-0.5">Commande ({totalArticles} plats)</span>
                <span className="font-black text-2xl text-white tracking-tight block">
                  Total : <span className="text-amber-400 tabular-nums">{totalGeneral.toLocaleString()} F</span>
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Dont livraison : {fraisLivraison} F</span>
              </div>
              
              {/* Sélecteur Cotonou discret et pro */}
              <div className="w-full sm:w-auto bg-stone-900 border border-white/5 rounded-xl px-3 py-2 flex flex-col justify-center">
                <label className="text-[9px] font-black uppercase text-amber-500 tracking-wider mb-0.5">Zone de livraison</label>
                <select 
                  value={zoneLivraison}
                  onChange={(e) => setZoneLivraison(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-4"
                >
                  {Object.keys(tarificationLivraison).map((zone) => (
                    <option key={zone} value={zone} className="bg-stone-950 text-white">
                      {zone} (+{tarificationLivraison[zone]} F)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 justify-between md:justify-end">
              <button onClick={() => setPanier([])} className="text-stone-400 hover:text-red-400 text-[11px] font-black uppercase tracking-wider px-3 py-2 transition-colors">Vider</button>
              <button onClick={envoyerCommandeWhatsApp} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all">Commander 💬</button>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER BAS DE PAGE */}
      <footer id="contact" className="bg-[#080706] border-t border-white/[0.02] mt-24 py-12 px-6 text-center text-stone-500 text-[11px] tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-stone-400 mb-8 border-b border-white/[0.02] pb-8">
          <div>
            <h5 className="font-black uppercase tracking-widest text-amber-500 text-[10px] mb-1">📍 Cotonou</h5>
            <p className="text-stone-400 text-xs font-medium">Avenue de la Marina, Fidjrossè</p>
          </div>
          <div>
            <h5 className="font-black uppercase tracking-widest text-amber-500 text-[10px] mb-1">🕒 Service</h5>
            <p className="text-stone-400 text-xs font-medium">Lun - Dim : 11h00 - 23h00</p>
          </div>
        </div>
        <p className="font-medium">© 2026 Kànòlí Resto. Expérience de commande fluide.</p>
      </footer>

    </main>
  );
}