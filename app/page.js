"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialisation du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  // 1. États dynamiques branchés sur Supabase
  const [plats, setPlats] = useState([]); 
  const [chargement, setChargement] = useState(true); 
  const [categorieActive, setCategorieActive] = useState("Tous");
  const [panier, setPanier] = useState([]); 

  const categories = ["Tous", "Plat Traditionnel", "Spécialité", "Entrée / Snack"];

  // 2. Chargement initial ET Écoute en Temps Réel (Realtime)
  useEffect(() => {
    async function recupererPlats() {
      try {
        setChargement(true);
        const { data, error } = await supabase
          .from("plats")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;
        if (data) setPlats(data);
      } catch (error) {
        console.error("Erreur de récupération :", error.message);
      } finally {
        setChargement(false);
      }
    }

    recupererPlats();

    // 🌟 SYNCHRONISATION INSTANTANÉE
    const canalRealtime = supabase
      .channel("liaison-directe-client")
      .on(
        "postgres_changes", 
        { event: "*", schema: "public", table: "plats" }, 
        () => {
          recupererPlats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  // Filtrage des plats
  const platsFiltres = categorieActive === "Tous" 
    ? plats 
    : plats.filter(plat => plat.categorie === categorieActive);

  // 3. Fonctions du panier (Correctif d'ID inclus)
  const ajouterAuPanier = (plat) => {
    setPanier((prevPanier) => {
      const existe = prevPanier.find(item => String(item.plat.id) === String(plat.id));
      if (existe) {
        return prevPanier.map(item => 
          String(item.plat.id) === String(plat.id) ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prevPanier, { plat, quantite: 1 }];
    });
  };

  const retirarDuPanier = (platId) => {
    setPanier((prevPanier) => {
      const item = prevPanier.find(item => String(item.plat.id) === String(platId));
      
      if (!item) return prevPanier;

      if (item.quantite === 1) {
        return prevPanier.filter(item => String(item.plat.id) !== String(platId));
      }
      return prevPanier.map(item => 
        String(item.plat.id) === String(platId) ? { ...item, quantite: item.quantite - 1 } : item
      );
    });
  };

  const viderPanier = () => setPanier([]);

  const totalGeneral = panier.reduce((sum, item) => sum + (item.plat.prix * item.quantite), 0);
  const totalArticles = panier.reduce((sum, item) => sum + item.quantite, 0);

  // 4. Envoi vers WhatsApp
  const numeroWhatsApp = "22961000000"; 

  const envoyerCommandeWhatsApp = () => {
    if (panier.length === 0) return;

    let message = `*🇧🇯 NOUVELLE COMMANDE - KÀNÒLÍ RESTO*\n\n`;
    message += `Bonjour, je souhaite passer la commande suivante :\n\n`;
    
    panier.forEach(item => {
      const sousTotal = item.plat.prix * item.quantite;
      message += `▪️ *${item.quantite}x* ${item.plat.nom} (${sousTotal.toLocaleString()} FCFA)\n`;
    });

    message += `\n-------------------------\n`;
    message += `💰 *TOTAL À PAYER : ${totalGeneral.toLocaleString()} FCFA*\n`;
    message += `-------------------------\n\n`;
    message += `Merci de me confirmer la prise en compte et le délai !`;

    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-900 pb-32">
      
      {/* BARRE DE NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-stone-900/80 border-b border-stone-800 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-2xl shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            KÀNÒLÍ RESTO
          </span>
        </div>
        <nav className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide text-stone-400">
          <a href="#accueil" className="hover:text-amber-400 transition-colors">Accueil</a>
          <a href="#menu" className="hover:text-amber-400 transition-colors">La Carte</a>
          <a href="#contact" className="hover:text-amber-400 transition-colors">Horaires</a>
        </nav>
        <button 
          onClick={() => { if(panier.length > 0) { document.getElementById('panier-section')?.scrollIntoView({behavior: 'smooth'}) } }}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-lg transition-all flex items-center space-x-2"
        >
          <span>🛒 Panier</span>
          <span className="bg-stone-950 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums">{totalArticles}</span>
        </button>
      </header>

      {/* 🖼️ BANNER PRINCIPALE (HERO) AVEC IMAGE DE FOND PROFESSIONNELLE */}
      <section 
        id="accueil" 
        className="relative py-24 md:py-36 px-6 max-w-7xl mx-auto text-center border-b border-stone-800 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "linear-gradient(to bottom, rgba(28, 25, 23, 0.85), rgba(28, 25, 23, 0.95)), url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200')" 
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full mb-6">
            Authentique Gastronomie Béninoise
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight text-white">
            Le goût du terroir, réinventé avec <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Élégance</span>.
          </h2>
          <p className="text-sm md:text-base text-stone-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Découvrez notre carte mise à jour en direct. Composez votre menu et passez commande instantanément sur WhatsApp.
          </p>
          <a href="#menu" className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 px-8 py-3.5 rounded-xl font-extrabold shadow-xl hover:brightness-110 transition-all inline-block">
            Découvrir la Carte 🛒
          </a>
        </div>
      </section>

      {/* SECTION EXPOSITION DU MENU */}
      <section id="menu" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Notre Menu</h3>
          <p className="text-2xl md:text-3xl font-extrabold text-white">Les Chefs d'Œuvre de notre Cuisine</p>
          <div className="w-16 h-1 bg-amber-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Boutons de Filtres */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorieActive(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                categorieActive === cat
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 shadow-lg scale-105"
                  : "bg-stone-800 text-stone-400 hover:text-white border border-stone-700/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* État de chargement internet */}
        {chargement ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-stone-400 text-sm font-medium tracking-wide">Ouverture de la carte...</p>
          </div>
        ) : plats.length === 0 ? (
          <div className="text-center py-20 text-stone-500 text-sm">
            Aucun plat n'est disponible sur la carte pour le moment.
          </div>
        ) : (
          /* Grille des Plats */
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {platsFiltres.map((plat) => {
              const itemDansPanier = panier.find(item => String(item.plat.id) === String(plat.id));
              const quantite = itemDansPanier ? itemDansPanier.quantite : 0;

              return (
                <div 
                  key={plat.id} 
                  className="group bg-stone-900 border border-stone-800 hover:border-amber-500/40 p-5 rounded-2xl shadow-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
                >
                  {plat.tag && (
                    <span className="absolute top-4 right-4 z-10 text-[10px] font-bold uppercase tracking-wider bg-stone-950 text-amber-400 px-2.5 py-1 rounded-md border border-stone-800">
                      {plat.tag}
                    </span>
                  )}

                  <div>
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-stone-800 relative">
                      <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500/80 block mb-1">{plat.categorie}</span>
                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{plat.nom}</h4>
                    <p className="text-stone-400 text-xs leading-relaxed mb-4">{plat.description}</p>
                  </div>

                  {/* ZONE PRIX ET UTILITIES */}
                  <div className="flex items-center justify-between pt-4 border-t border-stone-800/60 mt-auto">
                    <div>
                      <span className="font-black text-xl text-white">{Number(plat.prix).toLocaleString()} <span className="text-xs font-bold text-amber-500">FCFA</span></span>
                    </div>

                    <div className="flex items-center justify-end">
                      {quantite > 0 ? (
                        <div className="flex items-center bg-stone-800 rounded-xl border border-stone-700 p-1 shadow-md w-32 justify-between">
                          <button 
                            onClick={() => retirarDuPanier(plat.id)}
                            className="w-8 h-8 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold flex items-center justify-center transition-all text-base"
                          >
                            −
                          </button>
                          <span className="font-bold text-sm text-amber-400 tabular-nums">
                            {quantite}
                          </span>
                          <button 
                            onClick={() => ajouterAuPanier(plat)}
                            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center transition-all text-base"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => ajouterAuPanier(plat)}
                          className="bg-stone-800 hover:bg-amber-500 text-stone-200 hover:text-stone-950 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-stone-700/50 hover:border-amber-500 shadow-md"
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
        )}
      </section>

      {/* FOOTER BAR STICKY (PANIER GLOBAL) */}
      {panier.length > 0 && (
        <section id="panier-section" className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-md border-t-2 border-amber-500 shadow-2xl p-4 max-w-4xl mx-auto rounded-t-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs text-stone-400 block font-semibold">Votre Sélection ({totalArticles} articles)</span>
              <span className="font-black text-2xl text-white tracking-wide">
                Total : <span className="text-amber-500 tabular-nums">{totalGeneral.toLocaleString()} FCFA</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button 
                onClick={viderPanier}
                className="text-stone-400 hover:text-red-500 text-xs font-bold uppercase tracking-wider px-3 py-2 transition-colors"
              >
                Vider
              </button>
              <button 
                onClick={envoyerCommandeWhatsApp}
                className="w-full sm:w-auto flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Commander ({totalGeneral.toLocaleString()} F)</span>
                <span className="text-sm">💬</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* INFORMATIONS CONTACT */}
      <footer id="contact" className="bg-stone-950 border-t border-stone-800 mt-16 py-10 px-6 text-center text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-stone-400 mb-6">
          <div>
            <h5 className="font-bold text-white mb-0.5">📍 Localisation</h5>
            <p className="text-stone-500 text-xs">Avenue de la Marina, Fidjrossè, Cotonou, Bénin</p>
          </div>
          <div>
            <h5 className="font-bold text-white mb-0.5">🕒 Horaires</h5>
            <p className="text-stone-500 text-xs">Lun - Dim : 11h00 - 23h00</p>
          </div>
        </div>
        <p>© 2026 Kànòlí Resto. Solution de commande WhatsApp connectée.</p>
      </footer>

    </main>
  );
}