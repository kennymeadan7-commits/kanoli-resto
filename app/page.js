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
  const [searchTerm, setSearchTerm] = useState("");
  const [panier, setPanier] = useState([]);
  const [zoneLivraison, setZoneLivraison] = useState("Fidjrossè");
  const [showModal, setShowModal] = useState(false);
  const [imageZoomee, setImageZoomee] = useState(null);
  const [clientInfo, setClientInfo] = useState({ nom: "", tel: "", adresse: "", paiement: "Espèces" });

  // 1. Initialisation : Charger le panier
  useEffect(() => {
    const panierSauvegarde = localStorage.getItem("panier-kanoli");
    if (panierSauvegarde) setPanier(JSON.parse(panierSauvegarde));
  }, []);

  // 2. Sauvegarde auto du panier
  useEffect(() => {
    localStorage.setItem("panier-kanoli", JSON.stringify(panier));
  }, [panier]);

  // 3. Supabase : Fetch + Realtime
  useEffect(() => {
    async function recupererPlats() {
      const { data } = await supabase.from("plats").select("*").order("id", { ascending: true });
      if (data) setPlats(data);
    }
    recupererPlats();
    const canalRealtime = supabase.channel("realtime-plats").on("postgres_changes", { event: "*", schema: "public", table: "plats" }, () => recupererPlats()).subscribe();
    return () => { supabase.removeChannel(canalRealtime); };
  }, []);

  // Calculs
  const platsFiltres = plats.filter(p => {
    const matchCat = categorieActive === "Tous" || p.categorie === categorieActive;
    const matchSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPlats = panier.reduce((sum, i) => sum + (i.plat.prix * i.quantite), 0);
  const fraisLivraison = panier.length > 0 ? tarificationLivraison[zoneLivraison] : 0;
  const totalGeneral = totalPlats + fraisLivraison;
  const totalArticles = panier.reduce((sum, i) => sum + i.quantite, 0);
  const numeroWhatsApp = "22961000000";

  // Fonctions Panier
  const ajouterAuPanier = (plat) => {
    setPanier((prev) => {
      const ex = prev.find(i => String(i.plat.id) === String(plat.id));
      return ex ? prev.map(i => String(i.plat.id) === String(plat.id) ? { ...i, quantite: i.quantite + 1 } : i) : [...prev, { plat, quantite: 1 }];
    });
  };

  const retirerDuPanier = (platId) => {
    setPanier((prev) => {
      const item = prev.find(i => String(i.plat.id) === String(platId));
      if (!item) return prev;
      return item.quantite === 1 ? prev.filter(i => String(i.plat.id) !== String(platId)) : prev.map(i => String(i.plat.id) === String(platId) ? { ...i, quantite: i.quantite - 1 } : i);
    });
  };

  const envoyerCommandeWhatsApp = () => {
    if (panier.length === 0) return;
    let msg = `*🇧🇯 NOUVELLE COMMANDE - KÀNÒLÍ RESTO*\n\n`;
    msg += `👤 *Client :* ${clientInfo.nom}\n📞 *Tel :* ${clientInfo.tel}\n📍 *Adresse :* ${clientInfo.adresse}\n💳 *Paiement :* ${clientInfo.paiement}\n\n`;
    panier.forEach(i => { msg += `▪️ *${i.quantite}x* ${i.plat.nom} (${(i.plat.prix * i.quantite).toLocaleString()} F)\n`; });
    msg += `\n🛵 *Livraison :* ${zoneLivraison} (${fraisLivraison.toLocaleString()} F)\n\n💰 *TOTAL : ${totalGeneral.toLocaleString()} FCFA*`;
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#0c0a09] text-stone-200 font-sans pb-40 selection:bg-amber-500 selection:text-black">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-white/5 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl">
        <div className="text-xl font-black text-amber-500 tracking-widest">KÀNÒLÍ</div>
        <nav className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
          <a href="#accueil" className="hover:text-amber-500 transition-colors">Accueil</a>
          <a href="#menu" className="hover:text-amber-500 transition-colors">Menu</a>
          <a href="#contact" className="hover:text-amber-500 transition-colors">Contact</a>
        </nav>
        <button onClick={() => document.getElementById('panier-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2">
          🛒 {totalArticles}
        </button>
      </header>

      {/* HERO SECTION */}
      <section id="accueil" className="relative py-32 text-center px-6 overflow-hidden rounded-b-3xl mb-12 shadow-2xl">
        <img src="/hero-bg.jpg" alt="Fond restaurant" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Le goût du terroir,<br/> réinventé avec <span className="text-amber-500">Élégance</span>.</h2>
        </div>
      </section>

      {/* FILTRES & RECHERCHE */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <input 
          type="text" 
          placeholder="Rechercher un plat..." 
          className="w-full bg-stone-900 border border-white/10 p-3 rounded-2xl text-white mb-4 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 justify-center overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategorieActive(cat)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${categorieActive === cat ? "bg-amber-500 text-stone-950" : "bg-stone-900 text-stone-400"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MENU SECTION */}
      <div id="menu" className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        {platsFiltres.length > 0 ? (
          platsFiltres.map((plat) => {
            const itemDansPanier = panier.find(i => String(i.plat.id) === String(plat.id));
            const quantite = itemDansPanier ? itemDansPanier.quantite : 0;
            return (
              <div key={plat.id} className="group bg-stone-900/30 p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                <div onClick={() => setImageZoomee({ src: plat.image, alt: plat.nom })} className="w-full h-48 rounded-xl overflow-hidden mb-4 cursor-zoom-in">
                  <img src={plat.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} alt={plat.nom} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-lg font-black text-white">{plat.nom}</h4>
                <p className="text-stone-400 text-xs mb-4">{plat.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-500">{Number(plat.prix).toLocaleString()} F</span>
                  <div className="flex items-center gap-3 bg-stone-800 p-1 rounded-xl">
                    {quantite > 0 ? (
                      <>
                        <button onClick={() => retirerDuPanier(plat.id)} className="w-8 h-8 bg-stone-700 rounded-lg text-white font-bold">-</button>
                        <span className="font-bold text-amber-400 w-6 text-center">{quantite}</span>
                        <button onClick={() => ajouterAuPanier(plat)} className="w-8 h-8 bg-amber-600 rounded-lg text-stone-950 font-bold">+</button>
                      </>
                    ) : (
                      <button onClick={() => ajouterAuPanier(plat)} className="px-6 py-2 bg-amber-600 rounded-lg text-stone-950 font-black text-xs uppercase">Ajouter</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-stone-500 col-span-2 py-10">Aucun résultat trouvé pour votre recherche.</p>
        )}
      </div>

      {/* MODAL COMMANDE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-stone-900 p-6 rounded-2xl w-full max-w-md border border-white/10">
            <h3 className="text-white font-black text-xl mb-4">Finaliser la commande</h3>
            <input type="text" placeholder="Nom" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, nom: e.target.value})} />
            <input type="tel" placeholder="Téléphone" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, tel: e.target.value})} />
            <input type="text" placeholder="Adresse" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, adresse: e.target.value})} />
            
            <label className="text-stone-400 text-xs font-bold uppercase block mb-2">Zone :</label>
            <select className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setZoneLivraison(e.target.value)}>
              {Object.keys(tarificationLivraison).map(zone => <option key={zone} value={zone}>{zone}</option>)}
            </select>

            <label className="text-stone-400 text-xs font-bold uppercase block mb-2">Paiement :</label>
            <select className="w-full bg-stone-950 p-3 mb-6 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, paiement: e.target.value})}>
              <option value="Espèces">Espèces (à la livraison)</option>
              <option value="Mobile Money">Mobile Money (MTN / Moov)</option>
            </select>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-stone-800 p-3 rounded-xl text-white">Annuler</button>
              <button onClick={() => { envoyerCommandeWhatsApp(); setShowModal(false); }} className="flex-1 bg-emerald-600 p-3 rounded-xl text-white font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* PANIER FOOTER */}
      {panier.length > 0 && (
        <section id="panier-section" className="fixed bottom-4 left-4 right-4 z-50 bg-stone-950/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex justify-between items-center max-w-4xl mx-auto shadow-2xl">
          <p className="text-white font-black">Total : {totalGeneral.toLocaleString()} F</p>
          <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white font-black px-8 py-3 rounded-xl">Commander 💬</button>
        </section>
      )}
      
      {/* LIGHTBOX */}
      {imageZoomee && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setImageZoomee(null)}>
          <img src={imageZoomee.src} className="max-h-[80vh] rounded-xl" />
        </div>
      )}

      {/* FOOTER AVEC LOCALISATION */}
      <footer id="contact" className="bg-[#080706] border-t border-white/[0.02] mt-24 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <h4 className="font-black text-amber-500 mb-4 tracking-widest">KÀNÒLÍ</h4>
            <p className="text-stone-500 text-xs leading-relaxed">Le goût du terroir, réinventé avec élégance. Cuisine connectée à Cotonou.</p>
          </div>
          <div>
            <h4 className="font-black text-white mb-4 uppercase text-xs tracking-widest">Localisation</h4>
            <p className="text-stone-500 text-xs">Fidjrossè, Cotonou<br/>Bénin, Afrique de l'Ouest</p>
            <a href="#" className="text-amber-500 text-xs font-bold mt-2 block hover:underline">Voir sur Maps →</a>
          </div>
          <div>
            <h4 className="font-black text-white mb-4 uppercase text-xs tracking-widest">Contact</h4>
            <p className="text-stone-500 text-xs">Tel : +229 61 00 00 00</p>
            <p className="text-stone-500 text-xs mt-1">Email : contact@kanoli.bj</p>
          </div>
        </div>
        <p className="text-center text-stone-800 text-[10px] mt-12 border-t border-white/[0.02] pt-8">© 2026 Kànòlí Resto. Tous droits réservés.</p>
      </footer>
    </main>
  );
}