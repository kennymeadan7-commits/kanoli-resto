"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Configuration Supabase
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
  
  // États pour le formulaire
  const [showModal, setShowModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ nom: "", tel: "", adresse: "" });

  useEffect(() => {
    const panierSauvegarde = localStorage.getItem("panier-kanoli");
    if (panierSauvegarde) {
      setPanier(JSON.parse(panierSauvegarde));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("panier-kanoli", JSON.stringify(panier));
  }, [panier]);
  
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
    msg += `👤 *Nom :* ${clientInfo.nom}\n`;
    msg += `📞 *Tel :* ${clientInfo.tel}\n`;
    msg += `📍 *Adresse :* ${clientInfo.adresse}\n\n`;
    panier.forEach(i => { msg += `▪️ *${i.quantite}x* ${i.plat.nom} (${(i.plat.prix * i.quantite).toLocaleString()} F)\n`; });
    msg += `\n-------------------------\n`;
    msg += `🍲 Plats : ${totalPlats.toLocaleString()} F\n`;
    msg += `🛵 Livraison (${zoneLivraison}) : ${fraisLivraison.toLocaleString()} F\n`;
    msg += `💰 *TOTAL : ${totalGeneral.toLocaleString()} FCFA*\n`;
    msg += `-------------------------\n\n`;
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#0c0a09] text-stone-200 font-sans pb-40 selection:bg-amber-500 selection:text-black">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-white/5 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl shadow-2xl">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl animate-pulse">🔥</span>
          <span className="text-xl font-black tracking-widest bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">KÀNÒLÍ</span>
        </div>
        <button 
          onClick={() => { if(panier.length > 0) document.getElementById('panier-section')?.scrollIntoView({behavior: 'smooth'}) }}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center space-x-2"
        >
          <span>🛒 Panier</span>
          <span className="bg-stone-950 text-amber-400 px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums shadow-inner">{totalArticles}</span>
        </button>
      </header>

      {/* HERO BANNER */}
      <section id="accueil" className="relative py-20 md:py-32 px-6 max-w-[95rem] mx-auto text-center mt-4 overflow-hidden shadow-2xl rounded-3xl">
        <img src="/hero-bg.jpg" alt="Fond restaurant" className="absolute inset-0 w-full h-full object-contain object-center bg-black" />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 text-amber-400 border border-white/10 px-4 py-2 rounded-full mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Cuisine Connectée • Cotonou
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-[1.1] text-white">
            Le goût du terroir,<br/>
            réinventé avec <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">Élégance</span>.
          </h2>
          <p className="text-sm md:text-base text-stone-300 max-w-lg mx-auto mb-8 leading-relaxed font-medium">
            Découvrez notre carte synchronisée en direct. Composez votre panier et commandez instantanément via WhatsApp.
          </p>
          <a href="#menu" className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform inline-block shadow-lg">
            Consulter la Carte
          </a>
        </div>
      </section>

      {/* MENU */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
  {platsFiltres.map((plat) => {
    const itemDansPanier = panier.find(i => String(i.plat.id) === String(plat.id));
    const quantite = itemDansPanier ? itemDansPanier.quantite : 0;
    return (
      <div key={plat.id} className="group bg-stone-900/30 hover:bg-stone-900/60 border border-white/[0.02] p-4 rounded-2xl shadow-xl flex flex-col justify-between transition-all duration-300">
        
        {/* IMAGE DU PLAT */}
        <div onClick={() => setImageZoomee({ src: plat.image, alt: plat.nom })} className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-white/5 relative bg-stone-950 cursor-zoom-in">
          <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        </div>

        <h4 className="text-lg font-black text-white">{plat.nom}</h4>
        <p className="text-stone-400 text-xs mb-4">{plat.description}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="font-bold text-amber-500">{Number(plat.prix).toLocaleString()} F</span>
          {quantite > 0 ? (
            <div className="flex items-center gap-2">
              <button onClick={() => retirarDuPanier(plat.id)} className="bg-stone-800 px-3 py-1 rounded-lg text-white font-bold">-</button>
              <span className="font-bold text-amber-400">{quantite}</span>
              <button onClick={() => ajouterAuPanier(plat)} className="bg-amber-600 px-3 py-1 rounded-lg text-stone-950 font-bold">+</button>
            </div>
          ) : (
            <button onClick={() => ajouterAuPanier(plat)} className="bg-stone-800 hover:bg-amber-500 hover:text-stone-950 transition-colors px-4 py-2 rounded-lg text-xs font-bold uppercase text-white">Ajouter</button>
          )}
        </div>
      </div>
    );
  })}
</div>

      {/* MODAL COMMANDE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
            <h3 className="text-white font-black text-xl mb-4">Vos informations</h3>
            <input type="text" placeholder="Votre nom" className="w-full bg-stone-950 border border-white/10 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, nom: e.target.value})} />
            <input type="tel" placeholder="Votre téléphone" className="w-full bg-stone-950 border border-white/10 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, tel: e.target.value})} />
            <input type="text" placeholder="Adresse de livraison" className="w-full bg-stone-950 border border-white/10 p-3 mb-6 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, adresse: e.target.value})} />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-stone-800 rounded-xl text-white font-bold">Annuler</button>
              <button onClick={() => { envoyerCommandeWhatsApp(); setShowModal(false); }} className="flex-1 px-4 py-3 bg-emerald-600 rounded-xl text-white font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* PANIER (Footer flottant) */}
      {panier.length > 0 && (
        <section id="panier-section" className="fixed bottom-4 left-4 right-4 z-50 bg-stone-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 max-w-4xl mx-auto rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-black">Total : {totalGeneral.toLocaleString()} F</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-xl">
              Commander 💬
            </button>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer id="contact" className="bg-[#080706] border-t border-white/[0.02] mt-24 py-12 px-6 text-center text-stone-500 text-[11px]">
        <p>© 2026 Kànòlí Resto. Expérience de commande fluide.</p>
      </footer>
    </main>
  );
}