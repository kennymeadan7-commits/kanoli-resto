"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- DEBUG : Vérification de la clé au chargement ---
console.log("DEBUG - Clé FedaPay chargée :", process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY);

// Configuration
const FEDAPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
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

  // Chargement script FedaPay
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const panierSauvegarde = localStorage.getItem("panier-kanoli");
    if (panierSauvegarde) setPanier(JSON.parse(panierSauvegarde));
  }, []);

  useEffect(() => {
    localStorage.setItem("panier-kanoli", JSON.stringify(panier));
  }, [panier]);

  useEffect(() => {
    async function recupererPlats() {
      const { data } = await supabase.from("plats").select("*").order("id", { ascending: true });
      if (data) setPlats(data);
    }
    recupererPlats();
    const canalRealtime = supabase.channel("realtime-plats").on("postgres_changes", { event: "*", schema: "public", table: "plats" }, () => recupererPlats()).subscribe();
    return () => { supabase.removeChannel(canalRealtime); };
  }, []);

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

  const handleConfirmer = () => {
    if (clientInfo.paiement === "Mobile Money") {
        // --- VÉRIFICATION DE SÉCURITÉ ---
        if (!FEDAPAY_PUBLIC_KEY) {
            alert("Erreur critique : La clé FedaPay est manquante (undefined).");
            return;
        }

        if (typeof window.FedaPay === "undefined") {
            alert("Le système de paiement est en cours de chargement... Attends 2 secondes.");
            return;
        }
        
        const handler = window.FedaPay.init({
            public_key: FEDAPAY_PUBLIC_KEY,
            transaction: { 
                amount: totalGeneral, 
                description: "Commande Kànòlí Resto" 
            },
            customer: { 
                email: "client@kanoli.bj", 
                firstname: clientInfo.nom, 
                phone_number: clientInfo.tel 
            }
        });

        try {
            handler.open();
        } catch (e) {
            alert("Erreur FedaPay : " + e.message);
        }
    } else {
        envoyerCommandeWhatsApp();
        setShowModal(false);
    }
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
    <main className="min-h-screen bg-[#0c0a09] text-stone-200 font-sans pb-40">
      {/* HEADER, HERO, MENU, MODAL, FOOTER restent identiques à ton code précédent */}
      {/* (Collé ici pour la structure) */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-stone-950/80 border-b border-white/5 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto rounded-b-3xl">
        <div className="text-xl font-black text-amber-500 tracking-widest">KÀNÒLÍ</div>
        <button onClick={() => document.getElementById('panier-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2">
          🛒 {totalArticles}
        </button>
      </header>

      {/* ... [RESTE DU CODE IDENTIQUE] ... */}
      
      {/* MODAL COMMANDE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-stone-900 p-6 rounded-2xl w-full max-w-md border border-white/10">
            <h3 className="text-white font-black text-xl mb-4">Finaliser la commande</h3>
            <input type="text" placeholder="Nom" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, nom: e.target.value})} />
            <input type="tel" placeholder="Téléphone" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, tel: e.target.value})} />
            <input type="text" placeholder="Adresse" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, adresse: e.target.value})} />
            <select className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setZoneLivraison(e.target.value)}>
              {Object.keys(tarificationLivraison).map(zone => <option key={zone} value={zone}>{zone}</option>)}
            </select>
            <select className="w-full bg-stone-950 p-3 mb-6 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, paiement: e.target.value})}>
              <option value="Espèces">Espèces (à la livraison)</option>
              <option value="Mobile Money">Mobile Money (MTN / Moov)</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-stone-800 p-3 rounded-xl text-white">Annuler</button>
              <button onClick={handleConfirmer} className="flex-1 bg-emerald-600 p-3 rounded-xl text-white font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}
      
      {/* (Reste du footer et éléments omis pour concision mais à garder) */}
    </main>
  );
}