import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  PaintBrushIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const appName = process.env.REACT_APP_NAME || "Vehicle";
const appVersion = process.env.REACT_APP_VER || "0.0.0";

const latestUpdateResume = "ajoute une sauvegarde manuelle double copie reservee au superadmin.";
const updates = [
  {
    version: "1.15.3",
    title: "Sauvegarde manuelle superadmin",
    date: "18 juin 2026",
    sections: [
      {
        title: "Administration",
        items: [
          "Ajout d'un bloc Sauvegarde manuelle sur la page Administration, visible uniquement par le superadmin.",
          "Ajout d'un champ de confirmation par mot de passe avant de lancer la sauvegarde.",
          "Affichage d'un retour utilisateur clair lorsque la sauvegarde est creee ou lorsque le mot de passe est incorrect.",
        ],
      },
      {
        title: "Double copie",
        items: [
          "Creation d'une sauvegarde SQL dans uploads/BDD avec un nom date et heure pour eviter d'ecraser une sauvegarde du meme jour.",
          "Telechargement automatique de la meme sauvegarde afin de disposer rapidement d'une copie hors serveur.",
          "Exposition du nom du fichier de sauvegarde dans les headers CORS pour fiabiliser le nom du fichier telecharge.",
        ],
      },
      {
        title: "Securite et backend",
        items: [
          "Ajout d'une route API dediee protegee par JWT et limitee au GradeID superadmin.",
          "Revalidation du mot de passe de l'utilisateur connecte avant l'execution de mysqldump.",
          "Extraction de la logique de sauvegarde dans un service reutilise par la sauvegarde automatique hebdomadaire et la sauvegarde manuelle.",
          "Suppression automatique du fichier incomplet si mysqldump echoue pendant la creation de la sauvegarde.",
        ],
      },
      {
        title: "Validation",
        items: [
          "Validation syntaxique des fichiers backend modifies.",
          "Validation du build frontend apres l'ajout de l'interface de sauvegarde.",
          "Conservation des warnings existants du projet sans ajout de nouveau warning lie aux changements.",
        ],
      },
    ],
  },
  {
    version: "1.15.2",
    title: "Statistiques medianes des releves",
    date: "16 juin 2026",
    sections: [
      {
        title: "Page Vehicule",
        items: [
          "Remplacement de la Conso moyenne par une Conso mediane calculee a partir des consommations entre deux releves.",
          "Remplacement du Cout moyen / 100km par un Cout median / 100km afin de limiter l'impact des releves aberrants.",
          "Remplacement du Km moyen / releve par un Km median / releve sur les cartes de statistiques du vehicule.",
        ],
      },
      {
        title: "Dashboard",
        items: [
          "Alignement des cartes vehicule du Dashboard sur les memes statistiques medianes que la fiche vehicule.",
          "Mise a jour des libelles L/100km median et km median/releve pour afficher clairement la nouvelle methode de calcul.",
          "Conservation du prix moyen par litre, qui reste base sur le rapport cout total / litres totaux.",
        ],
      },
      {
        title: "Robustesse",
        items: [
          "Ajout d'un calcul de mediane reutilise par les statistiques basees sur les intervalles entre releves.",
          "Ignorance des valeurs invalides afin de conserver un affichage fiable lorsqu'un intervalle ne peut pas etre exploite.",
          "Validation du build frontend apres la mise a jour des statistiques et des libelles.",
        ],
      },
    ],
  },
  {
    version: "1.15.1",
    title: "Affichage des entretiens planifies",
    date: "29 mai 2026",
    sections: [
      {
        title: "Page Entretien",
        items: [
          "Ajout d'un defilement horizontal interne sur la section A venir prochainement pour les interfaces etroites.",
          "Protection de la colonne du type d'entretien afin que les libelles comme Revision periodique ne soient plus ecrases.",
          "Ajustement de la largeur minimale de la grille apres l'ajout de la colonne des fichiers.",
        ],
      },
      {
        title: "Echeances",
        items: [
          "Correction de l'affichage date ou kilometrage lorsque seule une des deux donnees est renseignee.",
          "Correction du cas ou un kilometrage absent etait interprete comme 0 km.",
          "Conservation de l'affichage combine date et kilometrage uniquement lorsque les deux valeurs existent.",
        ],
      },
      {
        title: "Validation",
        items: [
          "Validation du build frontend apres les corrections de grille et d'echeance.",
          "Conservation des warnings existants du projet sans ajout de nouveau warning lie aux changements.",
        ],
      },
    ],
  },
  {
    version: "1.15.0",
    title: "Pieces jointes d'entretien securisees",
    date: "29 mai 2026",
    sections: [
      {
        title: "Formulaires Entretien",
        items: [
          "Ajout de pieces jointes multiples sur les entretiens planifies et realises.",
          "Prise en charge des images et PDF avec nom personnalise et categorie par fichier.",
          "Affichage des fichiers existants directement dans le formulaire de modification.",
          "Ajout de la suppression d'un fichier avec modal de confirmation pour eviter les erreurs.",
        ],
      },
      {
        title: "Listes et historique",
        items: [
          "Affichage des pieces jointes dans les entretiens a venir et dans l'historique recent.",
          "Remplacement du badge de fichiers supplementaires par un bouton Voir tout.",
          "Ajout d'une modal listant tous les fichiers avec pagination au-dela de 5 elements.",
          "Ajout d'actions pour ouvrir, telecharger ou supprimer les fichiers depuis les modales.",
        ],
      },
      {
        title: "Apercu securise",
        items: [
          "Ouverture des fichiers dans une modal d'aperçu au lieu d'une nouvelle page.",
          "Affichage integre des images et PDF avec le meme rendu que le lecteur dedie.",
          "Chargement des fichiers via l'API avec JWT et creation d'une URL temporaire uniquement pendant l'ouverture de la modal.",
          "Revocation automatique de l'URL temporaire a la fermeture, a la deconnexion ou au changement d'utilisateur.",
        ],
      },
      {
        title: "API et stockage",
        items: [
          "Ajout du modele EntretienFichier et d'une migration Prisma dediee.",
          "Stockage des fichiers dans uploads/vehicules/UserID/VehiculeID/entretiens selon le type planifie ou realise.",
          "Deplacement automatique des fichiers d'un entretien planifie vers le dossier realise lors du passage en historique.",
          "Suppression physique des fichiers lors de la suppression d'une piece jointe ou d'un entretien.",
        ],
      },
      {
        title: "Securite",
        items: [
          "Blocage de l'acces direct aux pieces jointes d'entretien via les URL publiques /uploads.",
          "Ajout d'une route API protegee pour consulter les fichiers avec verification du JWT.",
          "Verification que le fichier appartient a un entretien lie a un vehicule de l'utilisateur connecte.",
          "Masquage du chemin de stockage dans les reponses de l'API afin de ne pas exposer l'URL backend.",
        ],
      },
      {
        title: "Validation",
        items: [
          "Validation du schema Prisma apres l'ajout du modele de fichiers.",
          "Regeneration du client Prisma pour exposer EntretienFichier.",
          "Validation syntaxique des fichiers backend modifies.",
          "Validation du build frontend apres les ajouts de formulaires, modales et apercu securise.",
        ],
      },
    ],
  },
  {
    version: "1.14.8",
    title: "Formulaire vehicule harmonise",
    date: "28 mai 2026",
    sections: [
      {
        title: "Page Vehicule",
        items: [
          "Refonte de la section Ajouter un nouveau vehicule avec le style sombre des formulaires Releves et Entretien.",
          "Remplacement des listes Type et Marque par des menus deroulants avec recherche.",
          "Ajout d'un resume de saisie et d'une action de reinitialisation harmonisee.",
        ],
      },
    ],
  },
  {
    version: "1.4.0",
    title: "Edition des vehicules et des releves",
    date: "22 mai 2026",
    sections: [
      {
        title: "Vehicules",
        items: [
          "Ajout d'un bouton Modifier sur la page vehicule pour transformer la card d'identite en formulaire d'edition.",
          "Edition du nom, modele, immatriculation, date de premiere immatriculation, type et marque depuis la fiche vehicule.",
          "Ajout d'une colonne UpdateDate sur les vehicules afin de suivre la derniere mise a jour de leur fiche.",
          "L'activite recente affiche maintenant une ligne dediee a la derniere mise a jour du vehicule basee uniquement sur Vehicule.UpdateDate.",
        ],
      },
      {
        title: "Photos vehicule",
        items: [
          "Ajout d'une colonne Photo sur les vehicules pour stocker le chemin de l'image.",
          "Ajout de l'upload d'image dans le dossier uploads/vehicules par utilisateur et par vehicule.",
          "Suppression automatique de l'ancienne photo lors du remplacement.",
          "Ajout d'une option pour supprimer la photo actuelle et revenir a l'image par defaut de l'application.",
        ],
      },
      {
        title: "Releves",
        items: [
          "Ajout d'une colonne Editions dans le tableau Derniers releves.",
          "Ajout d'une modal de correction pour modifier un releve existant en cas d'erreur de saisie.",
          "Edition de la date, carburant, kilometrage, prix par litre, prix total, litres, consommation et inclinaisons.",
          "Ajout d'une colonne UpdateDate sur les releves afin d'identifier le dernier releve corrige.",
        ],
      },
      {
        title: "Activite recente",
        items: [
          "Ajout d'une ligne Dernier releve mis a jour basee sur le dernier Relever.UpdateDate disponible.",
          "Separation claire entre la mise a jour de la fiche vehicule et la mise a jour d'un releve.",
        ],
      },
      {
        title: "Interface",
        items: [
          "Deplacement des controles d'image dans la colonne de droite du mode edition vehicule.",
          "Masquage du statut Actif/Vendu et des statistiques de la card uniquement pendant l'edition pour liberer de l'espace.",
        ],
      },
    ],
  },
  {
    version: "1.3.0",
    title: "Refonte complete de la page vehicule",
    date: "21 mai 2026",
    sections: [
      {
        title: "Page vehicule",
        items: [
          "Refonte visuelle complete de la page /vehicule avec une presentation dashboard sombre inspiree du visuel de reference.",
          "Ajout d'un hero vehicule avec image generique par defaut lorsque le vehicule ne possede pas encore d'image.",
          "Suppression de l'ancienne barre d'onglets des vehicules au profit de la selection depuis le dropdown Vehicules de la sidebar.",
          "Correction de la selection du vehicule afin que les donnees affichees correspondent toujours au parametre vehicleId de l'URL.",
        ],
      },
      {
        title: "Statistiques",
        items: [
          "Les cartes Conso moyenne, Cout moyen / 100km, Depense et Kilometrage se basent maintenant sur le dernier releve avec comparaison au releve precedent.",
          "La consommation moyenne utilise le calcul reel litres / distance plutot que la valeur de l'ordinateur de bord.",
          "Les graphiques utilisent un filtre par nombre de releves : 7, 30, 90 ou Tout.",
          "La carte Inclinaisons par releve est masquee quand aucune donnee d'inclinaison n'est disponible, et l'espace est donne au graphique Kilometrage.",
        ],
      },
      {
        title: "Graphiques",
        items: [
          "Ajout d'une presentation compacte et sombre pour les graphiques de consommation, prix carburant, kilometrage, carburants et inclinaisons.",
          "Transformation de la repartition des carburants en donut avec une icone pompe a essence centree dans le donut.",
          "Suppression de la section temperature, meteo et carburant le moins cher sur la page vehicule.",
        ],
      },
      {
        title: "Releves",
        items: [
          "Ajout d'un tableau Derniers releves sur la page vehicule.",
          "Ajout d'un modal Tous les releves avec table paginee a 10 releves par page.",
          "Le bouton Ajouter un releve depuis une fiche vehicule preselectionne le vehicule d'origine et pre-remplit la date du jour.",
          "La page d'ajout de releve utilise maintenant la date du jour par defaut.",
        ],
      },
      {
        title: "Navigation et interface",
        items: [
          "Ajout du bouton Ajouter un vehicule directement dans le dropdown Vehicules de la sidebar.",
          "Correction du fond general pour qu'il reste coherent pendant le scroll.",
          "Mise a jour de l'activite recente pour afficher la derniere mise a jour disponible, actuellement le dernier releve d'essence.",
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    title: "Refonte de la navigation",
    date: "21 mai 2026",
    sections: [
      {
        title: "Navigation",
        items: [
          "Remplacement de l'ancienne navbar horizontale par une sidebar fixe sur desktop.",
          "Ajout d'un menu burger sur mobile pour acceder a la navigation principale.",
          "Ajout d'un dropdown Vehicules avec recherche, affiche a droite sur desktop et sous le bouton sur mobile.",
          "Ajout du lien Mises a jour en bas de la sidebar.",
        ],
      },
      {
        title: "Vehicules",
        items: [
          "Ajout d'une route /vehicule avec selection automatique du vehicule via le parametre vehicleId.",
          "Les liens du dropdown Vehicules ouvrent directement la page vehicule avec le vehicule selectionne.",
        ],
      },
      {
        title: "Interface",
        items: [
          "Ajout du nouveau logo Vehicle inspire du visuel de reference.",
          "Ajout du header de page avec le message Bonjour et l'etat de la section actuelle.",
          "Affichage de la version de l'application depuis la variable REACT_APP_VER.",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    title: "Ajout de la page des mises a jour",
    date: "21 mai 2026",
    sections: [
      {
        title: "Application",
        items: [
          "Ajout d'une nouvelle page Mises a jour pour suivre les changements importants de Vehicle.",
          "Creation d'un historique clair des versions afin de mieux identifier les evolutions de l'application.",
          "La version 1.0.0 correspond a la version actuelle avant l'ajout de cette page.",
        ],
      },
      {
        title: "Navigation",
        items: [
          "Ajout d'un acces a la page des mises a jour depuis le menu utilisateur.",
          "Ajout de la route protegee /updates pour consulter l'historique une fois connecte.",
        ],
      },
      {
        title: "Interface",
        items: [
          "Mise en place d'une presentation par version avec titre, date, sections et liste des changements.",
          "Ajout d'un style responsive coherent avec l'interface existante.",
        ],
      },
    ],
  },
];

export default function UpdatePage() {
  const latestUpdate = updates[0];

  return (
    <main className="mx-auto max-w-7xl grow">
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Mises a jour</h1>
            <p className="mt-1 text-sm text-slate-400">
              Historique des changements importants apportes a l'application.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded border border-sky-500/20 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200">
            <TagIcon className="h-4 w-4 text-sky-300" />
            {appName} v{appVersion}
          </span>
        </div>
      </header>

      <section className="mb-8 overflow-hidden rounded-lg border border-sky-500/30 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9))] shadow-[0_24px_80px_rgba(2,6,23,0.38)]">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.35fr)]">
          <div>
            <p className="text-xs font-semibold uppercase text-sky-300">Derniere version</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-50">{latestUpdate.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              La version {latestUpdate.version} {latestUpdateResume}
              </p>
          </div>
          <div className="rounded-lg border border-sky-500/20 bg-slate-950/60 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/15 text-sky-300">
                <SparklesIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-50">Version {latestUpdate.version}</p>
                <p className="mt-1 text-xs text-slate-400">{latestUpdate.date}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {updates.map((update) => (
          <article
            key={update.version}
            className="overflow-hidden rounded-lg border border-sky-500/20 bg-slate-950/60 shadow-[0_18px_55px_rgba(2,6,23,0.28)]"
          >
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-sky-300">
                    <PaintBrushIcon className="h-4 w-4" />
                    Version {update.version}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-50">
                    {update.title}
                  </h2>
                </div>
                <time className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <ClockIcon className="h-4 w-4" />
                  {update.date}
                </time>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              {update.sections.map((section) => (
                <section key={section.title} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-50">
                    {section.title}
                  </h3>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
