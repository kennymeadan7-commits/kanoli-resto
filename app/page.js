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
    msg += `-------------------------\n\nEn attente de confirmation...`;
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#fcfbfa] text-stone-900 font-sans pb-40 selection:bg-orange-500 selection:text-white">
      
      {/* NAVIGATION BAR - STYLE CLAIR LUMINEUX */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-stone-200/60 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-2xl drop-shadow-sm">🔥</span>
          <span className="text-xl font-black tracking-widest bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">KÀNÒLÍ</span>
        </div>
        <button 
          onClick={() => { if(panier.length > 0) document.getElementById('panier-section')?.scrollIntoView({behavior: 'smooth'}) }}
          className="bg-stone-900 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center space-x-2"
        >
          <span>🛒 Panier</span>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-lg text-[10px] tabular-nums">{totalArticles}</span>
        </button>
      </header>

      {/* HERO BANNER - FINI LE TEXTE ILLISIBLE, LE TITRE CLAQUE ET RESTE VIF */}
      <section 
        className="relative py-28 md:py-36 px-6 max-w-7xl mx-auto text-center bg-cover bg-center bg-no-repeat rounded-3xl mt-4 overflow-hidden shadow-md"
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(252, 251, 250, 0.7), rgba(252, 251, 250, 0.95)), url('https://kanoli-resto-depty-oj7wx9qmw-kamikaze-s-projects29.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.bc64be73.png&w=1920&q=75')" }}
      >
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-stone-900/5 text-stone-700 border border-stone-900/10 px-4 py-1.5 rounded-full mb-6">Authentique Gastronomie Béninoise</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight text-stone-950">
            Le goût du terroir,<br/>réinventé avec <span className="from-orange-600 to-amber-500 bg-gradient-to-r bg-clip-text text-transparent">Élégance</span>.
          </h2>
          <p className="text-xs md:text-sm text-stone-600 max-w-md mx-auto mb-8 font-semibold leading-relaxed">Composez votre menu en un clic et validez votre commande instantanément par WhatsApp.</p>
          <a href="#menu" className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest inline-block shadow-lg shadow-orange-600/20 hover:brightness-105 transition-all">Voir La Carte</a>
        </div>
      </section>

      {/* GRILLE DES PLATS DE LA CARTE - STYLE SMART CARD */}
      <section id="menu" className="py-16 px-4 max-w-7xl mx-auto">
        
        {/* FILTRES PAR CATÉGORIES */}
        <div className="flex overflow-x-auto gap-2 mb-10 pb-2 scrollbar-none justify-start md:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorieActive(cat)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                categorieActive === cat ? "bg-stone-900 text-white border-stone-900 shadow-sm" : "bg-white text-stone-500 border-stone-200 hover:text-stone-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LES PLATS */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {platsFiltres.map((plat) => {
            const itemDansPanier = panier.find(i => String(i.plat.id) === String(plat.id));
            const quantite = itemDansPanier ? itemDansPanier.quantite : 0;

            return (
              <div key={plat.id} className="group bg-white border border-stone-200/80 p-4 rounded-3xl flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-0.5">
                <div>
                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 border border-stone-100 bg-stone-100 relative">
                    <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                    {plat.tag && (
                      <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest bg-orange-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                        {plat.tag}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-black tracking-widest uppercase text-orange-600 block mb-1">{plat.categorie}</span>
                  <h4 className="text-base font-black text-stone-900 mb-1">{plat.nom}</h4>
                  <p className="text-stone-500 text-xs leading-relaxed mb-4 font-medium">{plat.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <span className="font-black text-lg text-stone-900">{Number(plat.prix).toLocaleString()} <span className="text-[10px] text-orange-600">FCFA</span></span>
                  
                  {quantite > 0 ? (
                    <div className="flex items-center bg-stone-100 rounded-xl border border-stone-200 p-1 w-28 justify-between">
                      <button onClick={() => retirarDuPanier(plat.id)} className="w-7 h-7 bg-white text-stone-900 border border-stone-200/60 shadow-sm font-black rounded-lg text-xs">−</button>
                      <span className="font-black text-xs text-stone-900">{quantite}</span>
                      <button onClick={() => ajouterAuPanier(plat)} className="w-7 h-7 bg-stone-900 text-white font-black rounded-lg text-xs">+</button>
                    </div>
                  ) : (
                    <button onClick={() => ajouterAuPanier(plat)} className="bg-stone-50 hover:bg-stone-950 text-stone-700 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-stone-200 transition-all">Ajouter 🛒</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PANIER RETRACTABLE STYLE ULTRA MODERNE CONTRASTÉ */}
      {panier.length > 0 && (
        <section id="panier-section" className="fixed bottom-4 left-4 right-4 z-50 bg-stone-900 text-white p-4 max-w-4xl mx-auto rounded-2xl shadow-xl shadow-stone-950/20">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div>
                <span className="text-[9px] uppercase font-black text-stone-400 block tracking-widest">Votre Panier</span>
                <span className="font-black text-xl text-white">{totalGeneral.toLocaleString()} F</span>
                <span className="text-[10px] text-stone-400 block">Livraison incluse</span>
              </div>
              <div className="w-full sm:w-auto bg-stone-800 border border-white/5 rounded-xl px-3 py-1.5">
                <label className="text-[8px] font-black uppercase text-amber-400 block tracking-wider">Livraison</label>
                <select value={zoneLivraison} onChange={(e) => setZoneLivraison(e.target.value)} className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer">
                  {Object.keys(tarificationLivraison).map((zone) => (
                    <option key={zone} value={zone} className="bg-stone-900 text-white">{zone} (+{tarificationLivraison[zone]} F)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4 justify-between">
              <button onClick={() => setPanier([])} className="text-stone-400 hover:text-white text-[10px] font-black uppercase tracking-wider px-2">Vider</button>
              <button onClick={envoyerCommandeWhatsApp} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors">Commander 💬</button>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT FOOTER MODE CLAIR */}
      <footer id="contact" className="bg-stone-100 border-t border-stone-200 mt-24 py-12 px-6 text-center text-stone-500 text-[11px] tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-stone-700 mb-8 border-b border-stone-200 pb-8">
          <div>
            <h5 className="font-black uppercase tracking-widest text-orange-600 text-[10px] mb-1">📍 Cotonou</h5>
            <p className="text-stone-600 text-xs font-semibold">Avenue de la Marina, Fidjrossè</p>
          </div>
          <div>
            <h5 className="font-black uppercase tracking-widest text-orange-600 text-[10px] mb-1">🕒 Service</h5>
            <p className="text-stone-600 text-xs font-semibold">Lun - Dim : 11h00 - 23h00</p>
          </div>
        </div>
        <p className="font-semibold text-stone-400">© 2026 Kànòlí Resto. Expérience de commande fluide.</p>
      </footer>

    </main>
 );
}