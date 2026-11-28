This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Hébergement Vercel

Vercel détecte Next.js automatiquement : aucun adaptateur ou export statique ne
doit être ajouté. Le projet Vercel précédemment associé à ce dépôt n'est plus
accessible depuis le compte connecté au CLI ; vérifiez l'équipe et le projet
avant de relier ce dépôt ou d'en créer un autre.

L'application a besoin d'une base MySQL/TiDB joignable depuis les fonctions
Node.js de Vercel. Pour un lancement avec une base neuve, créez d'abord un
cluster TiDB Cloud Serverless dans un compte TiDB Cloud, puis connectez ce compte
et ce cluster au projet `artova-fin` depuis le
[Marketplace Vercel](https://vercel.com/marketplace/tidb-cloud). Cette
intégration relie un cluster existant ; elle ne le crée pas. Le plan gratuit
annoncé par TiDB reste soumis aux conditions et limites du fournisseur.

Après avoir associé le cluster, l'intégration configure les variables Production
`TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD` et `TIDB_DATABASE`.
L'application et les scripts de préparation les utilisent directement et
vérifient le certificat TLS. Pour une autre base MySQL, configurez plutôt
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` et `DB_SSL=1`.
Configurez aussi `AUTH_SECRET` et l'URL de production du site dans `SITE_URL`.
Ne copiez jamais de secret dans le dépôt, dans une commande enregistrée ou dans
un message.

Pour recevoir les notifications ntfy en production, ajoutez `NTFY_TOPIC` aux
variables d'environnement du projet Vercel (au minimum pour l'environnement
Production). Utilisez exactement le même canal dans l'application ntfy sur votre
téléphone ; choisissez un nom long et aléatoire, car ce nom tient lieu de secret.
`NTFY_SERVER` est facultative et vaut `https://ntfy.sh` par défaut. Après avoir
ajouté ou modifié ces variables, redéployez l'application. Dans l'administration,
le bouton « Envoyer une alerte de test » permet de vérifier la réception ; en cas
d'échec, consultez les journaux de la fonction Vercel.

## Actualités de l'art

La page publique `/actualites` (lecture libre, sans compte) présente chaque jour
l'actualité des arts visuels au Togo, en Afrique et dans le monde. La collecte
est automatique : `vercel.json` déclenche chaque matin à 5 h 30 la route
`/api/cron/actualites`, qui lit les flux RSS déclarés dans
Administration › Actualités, écarte les doublons et le hors-sujet, puis publie
un titre, un résumé court et le lien vers l'article d'origine (la source est
toujours citée).

- `CRON_SECRET` (obligatoire en production) : chaîne aléatoire d'au moins 32
  caractères. Vercel la joint automatiquement à l'appel du cron ; sans elle, la
  route répond 401 et seul le bouton « Lancer la collecte maintenant » fonctionne.
- `ANTHROPIC_API_KEY` (facultative) : active le tri par l'IA, des résumés
  réécrits en français et un classement par importance. Sans elle, le tri se fait
  par mots-clés et l'extrait d'origine est repris. `ACTUALITES_MODELE` choisit le
  modèle (par défaut `claude-opus-5-5` ; `claude-haiku-5-5` coûte nettement moins)
  et `ACTUALITES_MAX_PAR_COLLECTE` plafonne le nombre de publications analysées
  par jour (40 par défaut).
- La collecte tourne aussi à la demande des visites (toutes les 30 minutes au
  plus), et suit les réseaux sociaux ci-dessous.

### Réseaux sociaux

Les réseaux sont lus par leurs voies officielles uniquement (aucune page n'est
aspirée en contournant une connexion). Gestion : Administration › Actualités ›
Réseaux sociaux.

| Réseau | Ce qui est automatique | Ce qu'il faut |
| --- | --- | --- |
| YouTube | Nouvelles vidéos des chaînes suivies | Rien |
| Instagram, comptes professionnels | Publications, photos, vidéos, légendes | `META_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ID` |
| Instagram, mots-dièse | Publications des dernières 24 h (30 mots par semaine) | Les mêmes, plus « Instagram Public Content Access » (App Review) |
| Facebook, pages | Publications des pages accessibles au jeton | `FACEBOOK_PAGE_TOKEN` ou `META_ACCESS_TOKEN` ; les pages d'autrui exigent une validation Meta |
| TikTok | Rien : aucun accès aux comptes d'autrui | Ajout par lien |

**Ajout par lien** (sans clé) : coller l'adresse d'une publication Instagram,
TikTok, Facebook ou YouTube. Sur Android, ArTova installée depuis Chrome figure
dans le menu « Partager » (l'APK déjà signé doit être reconstruit pour cela ;
iPhone ne propose pas ce partage aux sites).

**Connexion à Meta** : passer le compte Instagram d'ArTova en compte
professionnel relié à une page Facebook ; créer une application sur
developers.facebook.com (autorisations `instagram_basic`,
`pages_read_engagement`, au besoin `instagram_manage_insights`) ; générer un
jeton de longue durée ; relever l'identifiant du compte Instagram
professionnel ; ajouter les variables sur Vercel et redéployer. Un jeton de
longue durée expire (environ 60 jours pour un jeton utilisateur) : le renouveler
quand l'administration signale une erreur « Meta ».

Chaque publication reprise garde son auteur et son lien d'origine, est affichée
avec le lecteur officiel du réseau, et reçoit ses « mots retenus » (mots-dièse,
lieux, termes de l'art) ; une date annoncée dans la légende l'inscrit à l'agenda.
- Les lecteurs connectés peuvent aimer, commenter et partager ; l'administration
  peut masquer, mettre à la une, supprimer, ajouter des sources et modérer.

Avant le premier démarrage, reliez ce dépôt au bon projet Vercel et initialisez
le schéma vide depuis ce dépôt. Dans un terminal interactif à la racine du
projet, utilisez la commande ci-dessous : elle transmet les variables de
Production au processus sans les écrire dans un fichier local.

```bash
vercel env run -e production -- npm run db:init
```

Cette commande crée sans suppression les tables `utilisateurs`, `artistes`,
`oeuvres`, `commandes`, `fichiers` et la vue `inscrits`. Elle est idempotente.
N'exécutez pas `db/seed.sql` en production : il contient uniquement des comptes
de démonstration. Une base neuve ne contient pas les anciennes inscriptions,
artistes, œuvres, commandes ni images ; ces données nécessitent un export
distinct de l'ancienne base.

Créez ensuite le premier administrateur depuis un terminal interactif. Son mot
de passe est saisi sans être affiché et n'est jamais enregistré dans le dépôt :

```bash
vercel env run -e production -- npm run db:admin
```

Cette commande refuse de créer un second administrateur ou de remplacer un
compte existant.

Si vous avez perdu ou exposé le mot de passe d'un administrateur, réinitialisez
uniquement le compte indiqué depuis un terminal interactif :

```bash
vercel env run -e production -- npm run db:admin:reset
```

Le script vérifie le rôle administrateur, demande une confirmation explicite et
saisit le nouveau mot de passe deux fois sans l'afficher. Choisissez un mot de
passe unique d'au moins 12 caractères et ne le transmettez jamais dans le chat.

Si les anciennes variables `DB_*` pointent encore vers `127.0.0.1:3306`, les
variables `TIDB_*` de l'intégration TiDB prennent priorité. Après initialisation
du schéma et création du premier administrateur, déployez l'application en
Production.

Reportez également les variables facultatives déjà utilisées pour conserver les
fonctions du site : e-mail (`RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_EMAIL`, ou
`SMTP_*`), Firebase (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`,
`FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_APPLE`), notifications
(`NTFY_TOPIC`, `NTFY_SERVER`, `CALLMEBOT_APIKEY`, `WHATSAPP_NUMBER`) et liens
Android / recherche (`ANDROID_PACKAGE_NAME`, `ANDROID_SHA256_FINGERPRINTS`,
`GOOGLE_SITE_VERIFICATION`). Autorisez le domaine Vercel dans Firebase
Authentication et mettez à jour `SITE_URL`.

**Attention au forfait :** le forfait Vercel Hobby gratuit est réservé à un
usage personnel ou non commercial. Comme ArTova présente des œuvres à la vente,
vérifiez l'éligibilité de votre activité et les conditions en vigueur avant de
l'utiliser en production ; un forfait adapté peut être nécessaire.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
