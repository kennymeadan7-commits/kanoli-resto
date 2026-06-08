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
  const [imageZoomee, setImageZoomee] = useState(null);
  
  // Correction ici : initialisation complète
  const [showModal, setShowModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ nom: "", tel: "", adresse: "", paiement: "Espèces" });

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
    const canalRealtime = supabase.channel("liaison-directe").on("postgres_changes", { event: "*", schema: "public", table: "plats" }, () => recupererPlats()).subscribe();
    return () => { supabase.removeChannel(canalRealtime); };
  }, []);

  const platsFiltres = categorieActive === "Tous" ? plats : plats.filter(p => p.categorie === categorieActive);
  const totalPlats = panier.reduce((sum, i) => sum + (i.plat.prix * i.quantite), 0);
  const fraisLivraison = panier.length > 0 ? tarificationLivraison[zoneLivraison] : 0;
  const totalGeneral = totalPlats + fraisLivraison;
  const totalArticles = panier.reduce((sum, i) => sum + i.quantite, 0);
  const numeroWhatsApp = "22961000000"; 

  // Fonction unique et corrigée
  const envoyerCommandeWhatsApp = () => {
    if (panier.length === 0) return;
    const modePaiement = clientInfo.paiement || "Espèces";
    let msg = `*🇧🇯 NOUVELLE COMMANDE - KÀNÒLÍ RESTO*\n\n`;
    msg += `👤 *Client :* ${clientInfo.nom}\n📞 *Tel :* ${clientInfo.tel}\n📍 *Adresse :* ${clientInfo.adresse}\n💳 *Paiement :* ${modePaiement}\n\n`;
    panier.forEach(i => { msg += `▪️ *${i.quantite}x* ${i.plat.nom} (${(i.plat.prix * i.quantite).toLocaleString()} F)\n`; });
    msg += `\n💰 *TOTAL : ${totalGeneral.toLocaleString()} FCFA*`;
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

  return (
    <main className="min-h-screen bg-[#0c0a09] text-stone-200 font-sans pb-40">
      {/* ... [Garde ton header et ton hero ici, je les ai omis pour la brièveté du message] ... */}
      
      {/* MENU */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        {platsFiltres.map((plat) => {
          const itemDansPanier = panier.find(i => String(i.plat.id) === String(plat.id));
          const quantite = itemDansPanier ? itemDansPanier.quantite : 0;
          return (
            <div key={plat.id} className="group bg-stone-900/30 p-4 rounded-2xl border border-white/5">
              <div onClick={() => setImageZoomee({ src: plat.image, alt: plat.nom })} className="w-full h-48 rounded-xl overflow-hidden mb-4 cursor-zoom-in">
                <img src={plat.image} alt={plat.nom} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-lg font-black text-white">{plat.nom}</h4>
              <p className="text-stone-400 text-xs mb-4">{plat.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-500">{Number(plat.prix).toLocaleString()} F</span>
                <div className="flex items-center gap-2">
                   {quantite > 0 && <button onClick={() => retirarDuPanier(plat.id)} className="bg-stone-800 px-3 py-1 rounded-lg">-</button>}
                   {quantite > 0 && <span className="font-bold">{quantite}</span>}
                   <button onClick={() => ajouterAuPanier(plat)} className="bg-amber-600 px-3 py-1 rounded-lg">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LIGHTBOX */}
      {imageZoomee && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setImageZoomee(null)}>
          <img src={imageZoomee.src} className="max-h-[80vh] rounded-xl" />
        </div>
      )}

      {/* MODAL COMMANDE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
            <h3 className="text-white font-black text-xl mb-4">Finaliser la commande</h3>
            <input type="text" placeholder="Nom" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, nom: e.target.value})} />
            <input type="tel" placeholder="Téléphone" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, tel: e.target.value})} />
            <input type="text" placeholder="Adresse" className="w-full bg-stone-950 p-3 mb-3 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, adresse: e.target.value})} />
            
            <label className="text-stone-400 text-xs font-bold uppercase block mb-2">Paiement :</label>
            <select className="w-full bg-stone-950 p-3 mb-6 rounded-xl text-white" onChange={(e) => setClientInfo({...clientInfo, paiement: e.target.value})}>
              <option value="Espèces">Espèces (à la livraison)</option>
              <option value="Mobile Money">Mobile Money (MTN / Moov)</option>
            </select>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-stone-800 p-3 rounded-xl text-white font-bold">Annuler</button>
              <button onClick={() => { envoyerCommandeWhatsApp(); setShowModal(false); }} className="flex-1 bg-emerald-600 p-3 rounded-xl text-white font-bold">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}