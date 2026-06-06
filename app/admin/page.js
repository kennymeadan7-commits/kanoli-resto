"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Initialisation de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPanel() {
  // 🔐 ÉTATS POUR L'AUTHENTIFICATION SÉCURISÉE
  const [estConnecte, setEstConnecte] = useState(false);
  const [motDePasseSaisi, setMotDePasseSaisi] = useState("");
  const [erreurAuth, setErreurAuth] = useState("");

  // Le mot de passe secret du gérant (Tu peux le modifier ici !)
  const MOT_DE_PASSE_SECRET = "Kanoli2026"; 

  const [plats, setPlats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [idEnModification, setIdEnModification] = useState(null);

  // États du formulaire
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [categorie, setCategorie] = useState("Plat Traditionnel");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [tag, setTag] = useState("Nouveau");
  const [statutMessage, setStatutMessage] = useState("");

  const categories = ["Plat Traditionnel", "Spécialité", "Entrée / Snack"];

  // Vérifier si le gérant était déjà connecté (via localStorage)
  useEffect(() => {
    const sessionToken = localStorage.getItem("kanoli_admin_session");
    if (sessionToken === "active") {
      setEstConnecte(true);
    }
  }, []);

  // Déclencher le chargement des plats UNIQUEMENT si connecté
  useEffect(() => {
    if (!estConnecte) return;

    recupererPlats();

    const canalAdmin = supabase
      .channel("sync-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plats" },
        () => {
          recupererPlats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalAdmin);
    };
  }, [estConnecte]);

  // Gestion de la connexion gérant
  const gererConnexion = (e) => {
    e.preventDefault();
    if (motDePasseSaisi === MOT_DE_PASSE_SECRET) {
      setEstConnecte(true);
      localStorage.setItem("kanoli_admin_session", "active"); // Reste connecté au rechargement
      setErreurAuth("");
    } else {
      setErreurAuth("❌ Mot de passe incorrect. Accès refusé.");
    }
  };

  // Déconnexion du gérant
  const gererDeconnexion = () => {
    setEstConnecte(false);
    localStorage.removeItem("kanoli_admin_session");
    setMotDePasseSaisi("");
  };

  async function recupererPlats() {
    try {
      setChargement(true);
      const { data, error } = await supabase
        .from("plats")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      if (data) setPlats(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setChargement(false);
    }
  }

  const activerModeModification = (plat) => {
    setIdEnModification(plat.id);
    setNom(plat.nom);
    setPrix(plat.prix.toString());
    setCategorie(plat.categorie);
    setDescription(plat.description);
    setImage(plat.image);
    setTag(plat.tag || "");
    setStatutMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const annulerModification = () => {
    setIdEnModification(null);
    setNom("");
    setPrix("");
    setCategorie("Plat Traditionnel");
    setDescription("");
    setImage("");
    setTag("Nouveau");
    setStatutMessage("");
  };

  const gererSoumissionFormulaire = async (e) => {
    e.preventDefault();
    
    if (!nom || !prix || !description) {
      setStatutMessage("❌ Veuillez remplir les champs obligatoires (Nom, Prix, Description).");
      return;
    }

    const donneesPlat = {
      nom,
      prix: parseInt(prix),
      categorie,
      description,
      image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
      tag
    };

    if (idEnModification) {
      setStatutMessage("Mise à jour en cours...");
      try {
        const { error } = await supabase
          .from("plats")
          .update(donneesPlat)
          .eq("id", idEnModification);

        if (error) throw error;
        setStatutMessage("✅ Plat mis à jour avec succès !");
        annulerModification();
      } catch (error) {
        setStatutMessage(`❌ Erreur lors de la modification : ${error.message}`);
      }
    } else {
      setStatutMessage("Ajout en cours...");
      try {
        const { error } = await supabase.from("plats").insert([donneesPlat]);
        if (error) throw error;
        setStatutMessage("✅ Plat ajouté avec succès au menu !");
        annulerModification();
      } catch (error) {
        setStatutMessage(`❌ Erreur lors de l'ajout : ${error.message}`);
      }
    }
  };

  const gererSuppression = async (id, nomPlat) => {
    const confirmation = window.confirm(`⚠️ Attention : Voulez-vous vraiment retirer "${nomPlat}" définitivement de la carte ?`);
    if (!confirmation) return;

    try {
      const { error } = await supabase.from("plats").delete().eq("id", id);
      if (error) throw error;
      if (idEnModification === id) annulerModification();
    } catch (error) {
      console.error(`Erreur de suppression : ${error.message}`);
      alert("Impossible de supprimer le plat.");
    }
  };

  // 🚪 RENDU 1 : SI PAS CONNECTÉ, ON AFFICHE L'ÉCRAN DE CONNEXION
  if (!estConnecte) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 p-8 rounded-3xl shadow-2xl text-center">
          <span className="text-4xl block mb-4">🔐</span>
          <h1 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">
            KÀNÒLÍ RESTO — ACCÈS PRO
          </h1>
          <p className="text-stone-400 text-xs mb-6">Cet espace est réservé uniquement au gérant du restaurant.</p>

          <form onSubmit={gererConnexion} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 text-left mb-1.5">Mot de passe de gestion</label>
              <input 
                type="password" 
                value={motDePasseSaisi} 
                onChange={(e) => setMotDePasseSaisi(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all"
            >
              Déverrouiller l'Espace Gérant 🚀
            </button>

            {erreurAuth && (
              <p className="text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/50 p-2.5 rounded-xl mt-2">
                {erreurAuth}
              </p>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-stone-800/60">
            <Link href="/" className="text-stone-500 hover:text-stone-300 text-xs font-bold transition-colors">
              ⬅️ Retourner au Site Client
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 🍽️ RENDU 2 : SI CONNECTÉ, ON AFFICHE LE PANEL COMPLET
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER ADMIN */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-stone-800 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-wide bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent uppercase">
              KÀNÒLÍ RESTO — ESPACE GÉRANT
            </h1>
            <p className="text-stone-400 text-xs mt-1">Ajoutez, modifiez ou supprimez les plats visibles sur le site en temps réel.</p>
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link href="/" className="flex-1 sm:flex-none text-center bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2.5 rounded-xl text-xs font-bold uppercase border border-stone-700 tracking-wider transition-all">
              ⬅️ Site Client
            </Link>
            <button 
              onClick={gererDeconnexion}
              className="flex-1 sm:flex-none bg-stone-950 hover:bg-red-950/40 text-stone-400 hover:text-red-400 border border-stone-800 hover:border-red-900/50 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Quitter 🚪
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* FORMULAIRE (AJOUT OU MODIFICATION) */}
          <div className="lg:col-span-1 bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl h-fit sticky top-6">
            <h2 className={`text-lg font-black mb-6 uppercase tracking-wider border-b border-stone-800 pb-2 ${idEnModification ? "text-orange-500" : "text-amber-400"}`}>
              {idEnModification ? "📝 Modifier le plat" : "🍽️ Ajouter une nouveauté"}
            </h2>

            <form onSubmit={gererSoumissionFormulaire} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Nom du repas *</label>
                <input 
                  type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Piron Rouge au Poisson Frit"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Prix (FCFA) *</label>
                  <input 
                    type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Ex: 3000"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Badge / Tag</label>
                  <input 
                    type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex: Populaire, Épicé"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Catégorie</label>
                <select 
                  value={categorie} onChange={(e) => setCategorie(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Lien de l'image (URL)</label>
                <input 
                  type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://images.unsplash.com/..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Description et Ingrédients *</label>
                <textarea 
                  rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détaillez le plat pour donner faim aux clients..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="submit"
                  className={`w-full font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all ${
                    idEnModification 
                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" 
                      : "bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950"
                  }`}
                >
                  {idEnModification ? "Enregistrer les modifications 💾" : "Mettre à la carte 🚀"}
                </button>

                {idEnModification && (
                  <button 
                    type="button"
                    onClick={annulerModification}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest py-2 rounded-xl transition-all border border-stone-700"
                  >
                    Annuler la modification
                  </button>
                )}
              </div>

              {statutMessage && (
                <p className="text-center text-xs font-bold mt-2 text-amber-400 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                  {statutMessage}
                </p>
              )}
            </form>
          </div>

          {/* LISTE DES PLATS ACTUELS */}
          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-black text-white mb-6 uppercase tracking-wider border-b border-stone-800 pb-2">
              📋 Menu Actuel ({plats.length} Plats en ligne)
            </h2>

            {chargement && plats.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">Chargement de la carte...</div>
            ) : plats.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-xs">Aucun plat sur la carte. Ajoutez-en un à gauche !</div>
            ) : (
              <div className="space-y-4">
                {plats.map((plat) => (
                  <div key={plat.id} className={`bg-stone-950 border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${idEnModification === plat.id ? "border-orange-500 shadow-lg shadow-orange-500/10" : "border-stone-800 hover:border-stone-700"}`}>
                    <div className="flex items-center space-x-4">
                      <img src={plat.image} alt={plat.nom} className="w-14 h-14 object-cover rounded-lg border border-stone-800 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">{plat.categorie}</span>
                        <h3 className="font-bold text-white text-sm">{plat.nom}</h3>
                        <span className="text-xs font-black text-stone-300">{Number(plat.prix).toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => activerModeModification(plat)}
                        className="bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        Modifier 📝
                      </button>
                      <button 
                        onClick={() => gererSuppression(plat.id, plat.nom)}
                        className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      >
                        Supprimer 🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}