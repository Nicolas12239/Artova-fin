"use client";

import { useState } from "react";
import { useEnvoiAvecImages } from "./envoiImages";
import {
  enregistrerMaPage,
  enregistrerMonOeuvre,
} from "@/app/actions/artiste";
import { inscrireArtiste } from "@/app/actions/auth";
import { EncartCommission } from "./FormAuth";
import { COMMISSION_ARTOVA } from "@/lib/types";

const champ =
  "w-full border-b border-encre/25 bg-transparent py-3 text-[15px] outline-none transition-colors placeholder:text-gris/60 focus:border-encre";
const libelle = "mb-1 block text-[11px] uppercase tracking-[0.18em] text-gris";
const aide = "mt-2 text-xs leading-relaxed text-gris";
const bouton =
  "w-full bg-encre px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-craie transition-colors hover:bg-terracotta disabled:opacity-50 sm:w-auto";

const useFormulaire = useEnvoiAvecImages;

type Etat = { erreur?: string; succes?: string } | null;

function Section({
  numero,
  titre,
  description,
  children,
}: {
  numero: string;
  titre: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-6 border-t border-fil py-10 md:grid-cols-[260px_1fr] md:gap-12">
      <legend className="sr-only">{titre}</legend>
      <div>
        <p className="font-display text-sm text-terracotta">{numero}</p>
        <h3 className="mt-1 font-display text-2xl">{titre}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gris">{description}</p>
      </div>
      <div className="space-y-7">{children}</div>
    </fieldset>
  );
}

function ChampImage({
  nom,
  label,
  actuelle,
  format,
  conseil,
  retirable = false,
  requis = false,
}: {
  nom: string;
  label: string;
  actuelle: string | null;
  format: "banniere" | "portrait" | "oeuvre";
  conseil: string;
  retirable?: boolean;
  requis?: boolean;
}) {
  const [apercu, setApercu] = useState<string | null>(actuelle);
  const [retiree, setRetiree] = useState(false);
  const ratio =
    format === "banniere" ? "aspect-[16/6]" : format === "portrait" ? "aspect-[3/4] max-w-[220px]" : "aspect-[4/5] max-w-[260px]";

  return (
    <div>
      <span className={libelle}>{label}</span>
      <label
        className={`group relative mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden border border-dashed border-encre/30 bg-panel transition-colors hover:border-encre ${ratio}`}
      >
        {apercu && !retiree ? (
          <>
            <img src={apercu} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-encre/75 py-2 text-center text-[10px] uppercase tracking-[0.18em] text-craie opacity-0 transition-opacity group-hover:opacity-100">
              Remplacer l&apos;image
            </span>
          </>
        ) : (
          <span className="px-4 text-center text-[11px] uppercase tracking-[0.18em] text-gris">
            + Choisir une image
          </span>
        )}
        <input
          type="file"
          name={nom}
          accept="image/*,.heic,.heif"
          required={requis && !actuelle}
          className="sr-only"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) {
              setApercu(URL.createObjectURL(fichier));
              setRetiree(false);
            }
          }}
        />
      </label>
      <p className={aide}>{conseil}</p>
      {retirable && actuelle && (
        <label className="mt-2 flex items-center gap-2 text-xs text-gris">
          <input
            type="checkbox"
            name="retirer_banniere"
            value="1"
            checked={retiree}
            onChange={(e) => setRetiree(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#a65a41]"
          />
          Retirer la bannière (l&apos;œuvre maîtresse sera affichée à la place)
        </label>
      )}
    </div>
  );
}

function Message({ etat }: { etat: { erreur?: string; succes?: string } | null }) {
  if (etat?.erreur) {
    return (
      <p role="alert" className="border-l-2 border-terracotta pl-3 text-sm text-terracotta">
        {etat.erreur}
      </p>
    );
  }
  if (etat?.succes) {
    return (
      <p role="status" className="border-l-2 border-encre pl-3 text-sm">
        {etat.succes}
      </p>
    );
  }
  return null;
}

export type PageInitiale = {
  nom: string;
  discipline: string;
  ville: string | null;
  histoire: string;
  note_univers: string | null;
  theme_primaire: string;
  theme_accent: string;
  theme_fond: string;
  motif: string;
  portrait_url: string | null;
  banniere_url: string | null;
  annee_debut: number | null;
  formation: string | null;
  techniques: string | null;
  expositions: string | null;
};

export function ChampsPage({
  initial,
  numeroDepart = 1,
}: {
  initial: PageInitiale;
  numeroDepart?: number;
}) {
  const [histoire, setHistoire] = useState(initial.histoire);
  const [couleurs, setCouleurs] = useState({
    primaire: initial.theme_primaire,
    accent: initial.theme_accent,
    fond: initial.theme_fond,
  });
  const numero = (i: number) => String(numeroDepart + i).padStart(2, "0");

  return (
    <>
      <Section
        numero={numero(0)}
        titre="Identité"
        description="Comment les collectionneurs vous découvrent : votre nom d'artiste, votre pratique et une phrase qui résume votre univers."
      >
        <div className="grid gap-7 sm:grid-cols-2">
          <div>
            <label htmlFor="nom" className={libelle}>Nom d&apos;artiste</label>
            <input id="nom" name="nom" required maxLength={120} defaultValue={initial.nom} className={champ} />
          </div>
          <div>
            <label htmlFor="discipline" className={libelle}>Discipline</label>
            <select id="discipline" name="discipline" defaultValue={initial.discipline} className={champ}>
              <option value="peintre">Peintre</option>
              <option value="plasticien">Plasticien·ne</option>
              <option value="sculpteur">Sculpteur·rice</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="ville" className={libelle}>Ville</label>
          <input id="ville" name="ville" maxLength={80} placeholder="Lomé, Kpalimé, Aného…" defaultValue={initial.ville ?? ""} className={champ} />
        </div>
        <div>
          <label htmlFor="note_univers" className={libelle}>Votre univers en une phrase</label>
          <input
            id="note_univers"
            name="note_univers"
            maxLength={255}
            placeholder="Ex. : Indigo profond et gestes larges, une marée nocturne à travers Lomé."
            defaultValue={initial.note_univers ?? ""}
            className={`${champ} font-display text-lg italic`}
          />
        </div>
      </Section>

      <Section
        numero={numero(1)}
        titre="Bannière & portrait"
        description="La bannière ouvre votre page en grand format. Choisissez une image forte : atelier, détail d'une toile, exposition."
      >
        <ChampImage
          nom="banniere"
          label="Bannière"
          actuelle={initial.banniere_url}
          format="banniere"
          conseil="Format paysage conseillé. Toutes les photos sont acceptées, même lourdes : elles sont redimensionnées automatiquement. Facultatif : sans bannière, votre œuvre maîtresse ouvre la page."
          retirable
        />
        <ChampImage
          nom="portrait"
          label="Portrait (requis)"
          actuelle={initial.portrait_url}
          format="portrait"
          conseil="Format portrait (3:4), visage bien éclairé. Redimensionné automatiquement."
          requis
        />
      </Section>

      <Section
        numero={numero(2)}
        titre="Votre histoire"
        description="Racontez-la comme vous le souhaitez : vos débuts, vos influences, ce que vos œuvres disent du Togo. Sautez une ligne pour créer un nouveau paragraphe."
      >
        <div>
          <label htmlFor="histoire" className={libelle}>Votre histoire</label>
          <textarea
            id="histoire"
            name="histoire"
            rows={12}
            required
            minLength={80}
            maxLength={6000}
            value={histoire}
            onChange={(e) => setHistoire(e.target.value)}
            placeholder="J'ai grandi à Lomé, entre le marché d'Adawlato et l'atelier de mon oncle…"
            className="w-full border border-encre/20 bg-craie p-4 text-[15px] leading-7 outline-none transition-colors focus:border-encre"
          />
          <p className={`${aide} flex justify-between`}>
            <span>80 caractères minimum.</span>
            <span className={histoire.length > 6000 ? "text-terracotta" : ""}>
              {histoire.length} / 6000
            </span>
          </p>
        </div>
      </Section>

      <Section
        numero={numero(3)}
        titre="Parcours"
        description="Les repères qui rassurent les collectionneurs. Tous ces champs sont facultatifs."
      >
        <div className="grid gap-7 sm:grid-cols-2">
          <div>
            <label htmlFor="annee_debut" className={libelle}>Artiste depuis (année)</label>
            <input
              id="annee_debut"
              name="annee_debut"
              type="number"
              min={1940}
              max={new Date().getFullYear()}
              placeholder="2012"
              defaultValue={initial.annee_debut ?? ""}
              className={champ}
            />
          </div>
          <div>
            <label htmlFor="techniques" className={libelle}>Techniques & matières</label>
            <input
              id="techniques"
              name="techniques"
              maxLength={255}
              placeholder="Acrylique, pigments naturels, tissu wax…"
              defaultValue={initial.techniques ?? ""}
              className={champ}
            />
          </div>
        </div>
        <div>
          <label htmlFor="formation" className={libelle}>Formation</label>
          <input
            id="formation"
            name="formation"
            maxLength={255}
            placeholder="Autodidacte, atelier de…, École des Beaux-Arts de…"
            defaultValue={initial.formation ?? ""}
            className={champ}
          />
        </div>
        <div>
          <label htmlFor="expositions" className={libelle}>Expositions & distinctions</label>
          <textarea
            id="expositions"
            name="expositions"
            rows={4}
            maxLength={3000}
            placeholder={"2024 : Biennale de Lomé\n2022 : Prix jeune talent, Institut français"}
            defaultValue={initial.expositions ?? ""}
            className="w-full border border-encre/20 bg-craie p-4 text-sm leading-6 outline-none transition-colors focus:border-encre"
          />
          <p className={aide}>Une ligne par exposition ou distinction.</p>
        </div>
      </Section>

      <Section
        numero={numero(4)}
        titre="Univers visuel"
        description="Les couleurs et le motif habillent votre page pour qu'elle vous ressemble."
      >
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              ["theme_primaire", "Principale", "primaire"],
              ["theme_accent", "Accent", "accent"],
              ["theme_fond", "Fond", "fond"],
            ] as const
          ).map(([nom, label, cle]) => (
            <label key={nom} className="block">
              <span className={libelle}>{label}</span>
              <input
                type="color"
                name={nom}
                value={couleurs[cle]}
                onChange={(e) => setCouleurs((c) => ({ ...c, [cle]: e.target.value }))}
                className="mt-1 h-12 w-full cursor-pointer border border-encre/20 bg-craie p-1"
              />
            </label>
          ))}
        </div>
        <div>
          <label htmlFor="motif" className={libelle}>Motif décoratif</label>
          <select id="motif" name="motif" defaultValue={initial.motif} className={champ}>
            <option value="pinceau">Coup de pinceau</option>
            <option value="collage">Collage</option>
            <option value="pierre">Pierre taillée</option>
          </select>
        </div>
        <div
          className="flex items-center justify-between gap-4 px-6 py-6"
          style={{ backgroundColor: couleurs.fond }}
          aria-hidden="true"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: couleurs.primaire }}>
              Aperçu des couleurs
            </p>
            <p className="mt-1 font-display text-2xl text-encre">Votre page</p>
          </div>
          <span className="h-10 w-10 rounded-full" style={{ backgroundColor: couleurs.accent }} />
        </div>
      </Section>
    </>
  );
}

function BarreEnvoi({
  etat,
  enCours,
  libelleBouton,
  libelleEnCours,
}: {
  etat: Etat;
  enCours: boolean;
  libelleBouton: string;
  libelleEnCours: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-4 border-t border-fil bg-creme/95 px-4 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:mx-0 md:px-0">
      <Message etat={etat} />
      <button type="submit" disabled={enCours} className={`${bouton} sm:ml-auto`}>
        {enCours ? libelleEnCours : libelleBouton}
      </button>
    </div>
  );
}

export function FormMaPage({ initial }: { initial: PageInitiale }) {
  const { etat, onSubmit, enCours } = useFormulaire(enregistrerMaPage);
  return (
    <form onSubmit={onSubmit}>
      <ChampsPage initial={initial} />
      <BarreEnvoi
        etat={etat}
        enCours={enCours}
        libelleBouton="Enregistrer ma page"
        libelleEnCours="Enregistrement…"
      />
    </form>
  );
}

export type OeuvreArtisteInitiale = {
  id: number;
  titre: string;
  type: string;
  prix_fcfa: number;
  annee: number | null;
  dimensions: string | null;
  technique: string | null;
  description: string;
  oeuvre_maitre: number;
  statut: string;
  image_url: string;
};

export function ChampsOeuvre({
  initial,
  premiere = false,
}: {
  initial?: OeuvreArtisteInitiale;
  premiere?: boolean;
}) {
  const [prix, setPrix] = useState(initial?.prix_fcfa ? String(initial.prix_fcfa) : "");
  const net = Math.round(((Number(prix) || 0) * (100 - COMMISSION_ARTOVA)) / 100);

  return (
    <>
      <ChampImage
        nom="image"
        label={initial ? "Photo de l'œuvre" : "Photo de l'œuvre (requise)"}
        requis
        actuelle={initial?.image_url ?? null}
        format="oeuvre"
        conseil="Photo de face, lumière naturelle, fond neutre. Redimensionnée automatiquement."
      />
      <div>
        <label htmlFor="titre" className={libelle}>Titre</label>
        <input id="titre" name="titre" required maxLength={160} defaultValue={initial?.titre} className={champ} />
      </div>
      <div className="grid gap-7 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className={libelle}>Type</label>
          <select id="type" name="type" defaultValue={initial?.type ?? "toile"} className={champ}>
            <option value="toile">Toile</option>
            <option value="sculpture">Sculpture</option>
          </select>
        </div>
        <div>
          <label htmlFor="annee" className={libelle}>Année</label>
          <input id="annee" name="annee" type="number" min={1900} max={2100} defaultValue={initial?.annee ?? ""} className={champ} />
        </div>
      </div>
      <div>
        <label htmlFor="prix_fcfa" className={libelle}>Prix de vente (FCFA)</label>
        <input
          id="prix_fcfa"
          name="prix_fcfa"
          type="number"
          min={1}
          required
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          className={champ}
        />
        <p className={aide}>
          Vous percevrez{" "}
          <strong className="font-medium text-encre">
            {new Intl.NumberFormat("fr-FR").format(net)} FCFA
          </strong>{" "}
          après la commission ArTova de {COMMISSION_ARTOVA} %.
        </p>
      </div>
      <div className="grid gap-7 sm:grid-cols-2">
        <div>
          <label htmlFor="dimensions" className={libelle}>Dimensions</label>
          <input id="dimensions" name="dimensions" maxLength={80} placeholder="100 × 80 cm" defaultValue={initial?.dimensions ?? ""} className={champ} />
        </div>
        <div>
          <label htmlFor="technique" className={libelle}>Technique</label>
          <input id="technique" name="technique" maxLength={160} placeholder="Acrylique sur toile" defaultValue={initial?.technique ?? ""} className={champ} />
        </div>
      </div>
      <div>
        <label htmlFor="description" className={libelle}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          minLength={10}
          defaultValue={initial?.description}
          className="w-full border border-encre/20 bg-craie p-4 text-sm leading-6 outline-none transition-colors focus:border-encre"
        />
      </div>
      {premiere ? (
        <>
          <input type="hidden" name="statut" value="disponible" />
          <input type="hidden" name="oeuvre_maitre" value="1" />
        </>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2">
          <div>
            <label htmlFor="statut" className={libelle}>Disponibilité</label>
            <select id="statut" name="statut" defaultValue={initial?.statut ?? "disponible"} className={champ}>
              <option value="disponible">Disponible</option>
              <option value="reserve">Réservée</option>
              <option value="vendu">Vendue</option>
            </select>
          </div>
          <label className="flex items-end gap-3 pb-3 text-sm">
            <input
              type="checkbox"
              name="oeuvre_maitre"
              value="1"
              defaultChecked={Boolean(initial?.oeuvre_maitre)}
              className="h-4 w-4 accent-[#a65a41]"
            />
            Mon œuvre maîtresse
          </label>
        </div>
      )}
    </>
  );
}

export function FormMonOeuvre({ initial }: { initial?: OeuvreArtisteInitiale }) {
  const { etat, onSubmit, enCours } = useFormulaire(enregistrerMonOeuvre);
  return (
    <form onSubmit={onSubmit} className="space-y-7">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <ChampsOeuvre initial={initial} />
      <Message etat={etat} />
      <button type="submit" disabled={enCours} className={bouton}>
        {enCours ? "Enregistrement…" : initial ? "Mettre à jour l'œuvre" : "Ajouter l'œuvre"}
      </button>
    </form>
  );
}

const PAGE_VIERGE: PageInitiale = {
  nom: "",
  discipline: "peintre",
  ville: "",
  histoire: "",
  note_univers: "",
  theme_primaire: "#1e2a78",
  theme_accent: "#d9a441",
  theme_fond: "#f4f0e6",
  motif: "pinceau",
  portrait_url: null,
  banniere_url: null,
  annee_debut: null,
  formation: null,
  techniques: null,
  expositions: null,
};

export function FormInscriptionArtiste({ avecCompte = true }: { avecCompte?: boolean }) {
  const { etat, onSubmit, enCours } = useFormulaire(inscrireArtiste);
  return (
    <form onSubmit={onSubmit}>
      <Section
        numero="01"
        titre={avecCompte ? "Votre compte" : "Vos coordonnées"}
        description={
          avecCompte
            ? "Vos identifiants de connexion. Votre email et votre téléphone ne sont jamais affichés sur votre page."
            : "Votre téléphone n'est jamais affiché sur votre page : il sert à l'équipe ArTova lors d'une commande."
        }
      >
        {avecCompte && (
          <div>
            <label htmlFor="email" className={libelle}>Adresse e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={champ} />
          </div>
        )}
        <div>
          <label htmlFor="telephone" className={libelle}>Téléphone / WhatsApp</label>
          <input id="telephone" name="telephone" type="tel" autoComplete="tel" required className={champ} />
          <p className={aide}>Pour que l&apos;équipe ArTova vous contacte lors d&apos;une commande.</p>
        </div>
        {avecCompte && (
          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <label htmlFor="mot_de_passe" className={libelle}>Mot de passe</label>
              <input id="mot_de_passe" name="mot_de_passe" type="password" autoComplete="new-password" minLength={8} required className={champ} />
              <p className={aide}>8 caractères min., avec une lettre et un chiffre.</p>
            </div>
            <div>
              <label htmlFor="confirmation" className={libelle}>Confirmation</label>
              <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required className={champ} />
            </div>
          </div>
        )}
      </Section>

      <ChampsPage initial={PAGE_VIERGE} numeroDepart={2} />

      <Section
        numero="07"
        titre="Votre première œuvre"
        description="Elle devient votre œuvre maîtresse. Vous pourrez en ajouter d'autres depuis votre espace artiste."
      >
        <ChampsOeuvre premiere />
      </Section>

      <Section
        numero="08"
        titre="Conditions"
        description="La rémunération d'ArTova, transparente dès le départ."
      >
        <EncartCommission avecAcceptation />
      </Section>

      <BarreEnvoi
        etat={etat}
        enCours={enCours}
        libelleBouton="Créer ma page d'artiste ↗"
        libelleEnCours="Création de votre page…"
      />
    </form>
  );
}
