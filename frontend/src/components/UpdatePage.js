import React from "react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  PaintBrushIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

const appName = process.env.REACT_APP_NAME || "Vehicle";
const appVersion = process.env.REACT_APP_VER || "0.0.0";

const latestUpdateResume = "centralise le filtre vehicule sur la page Entretien et enrichit la repartition des couts.";
const updates = [
  {
    version: "1.18.0",
    title: "Filtres et couts d'entretien",
    date: "21 juin 2026",
    sections: [
      {
        title: "Filtre centralise",
        items: [
          "Ajout d'un filtre Perimetre en haut de la page Entretien pour basculer entre la vue globale et un vehicule precis.",
          "Application du meme perimetre aux cartes statistiques, a la section A venir prochainement, au calendrier, a la repartition des couts et a l'historique.",
          "Recalcul automatique des compteurs, des totaux et des paginations lorsque le perimetre change.",
        ],
      },
      {
        title: "Repartition des couts",
        items: [
          "Recalcul de la repartition des couts selon le vehicule selectionne ou la vue globale.",
          "Ajout d'un toggle Inclure archives pour comptabiliser les archives dans la repartition des couts sans changer les onglets d'historique.",
          "Ajout de barres de progression par categorie avec le pourcentage correspondant au total filtre.",
          "Mise a jour du donut et du total central selon le perimetre actif et l'option archives.",
        ],
      },
      {
        title: "Listes et historique",
        items: [
          "Filtrage de la section A venir prochainement par vehicule ou en vue globale.",
          "Filtrage des onglets Realises et Archives de l'historique selon le meme perimetre.",
          "Affichage du perimetre actif dans les sections concernees pour clarifier les valeurs affichees.",
        ],
      },
      {
        title: "Validation",
        items: [
          "Validation du build frontend apres l'ajout du filtre centralise, du toggle archives et des barres de progression.",
          "Conservation des warnings existants du projet sans ajout de nouveau warning lie aux changements.",
        ],
      },
    ],
  },
  {
    version: "1.17.0",
    title: "Notifications et archives d'entretien",
    date: "21 juin 2026",
    sections: [
      {
        title: "Notifications",
        items: [
          "Activation du bouton Notifications de la navbar pour afficher les entretiens planifies en retard.",
          "Ajout d'un badge compteur sur la cloche uniquement lorsqu'au moins un entretien est en retard.",
          "Ajout d'un menu de notifications avec le vehicule, le type d'entretien et l'echeance depassee.",
          "Ouverture directe de la page Entretien sur le detail de l'entretien concerne via un lien profond.",
        ],
      },
      {
        title: "Detail d'entretien",
        items: [
          "Ajout d'une modal d'information complete en lecture seule pour les entretiens planifies et realises.",
          "Ajout d'un bouton de passage vers la modification depuis la modal d'information.",
          "Ajout d'un bouton Marquer realise depuis la modal d'information d'un entretien planifie.",
          "Ajout d'un bouton Voir le detail dans les sections A venir prochainement et Historique.",
        ],
      },
      {
        title: "Archives",
        items: [
          "Ajout de l'option Archive ancien proprietaire sur les entretiens realises.",
          "Renommage de la section Historique recent en Historique.",
          "Ajout d'onglets Realises et Archives pour separer les entretiens de l'utilisateur et ceux des anciens proprietaires.",
          "Affichage d'un badge Archive sur les entretiens concernes dans l'historique et dans la modal de detail.",
        ],
      },
      {
        title: "Calculs et statistiques",
        items: [
          "Exclusion des archives des compteurs d'entretiens realises, du cout total et du detail des couts par categorie.",
          "Exclusion des archives de la page Statistiques globale afin de ne pas les comptabiliser dans les valeurs utilisateur.",
          "Conservation des archives dans l'historique du vehicule pour maintenir la trace des anciens entretiens.",
          "Ajout du champ EstArchive dans l'export CSV des entretiens realises.",
        ],
      },
      {
        title: "API et validation",
        items: [
          "Ajout du champ Prisma EstArchive sur EntretienRealise avec une migration dediee.",
          "Prise en charge de l'archive dans la creation, la modification et la completion d'un entretien.",
          "Validation du schema Prisma apres migration.",
          "Validation syntaxique des controleurs backend modifies et validation du build frontend.",
        ],
      },
    ],
  },
  {
    version: "1.16.0",
    title: "Page Statistiques globale",
    date: "19 juin 2026",
    sections: [
      {
        title: "Nouvelle page",
        items: [
          "Ajout de la page /statistiques dans le style sombre de la page Vehicule.",
          "Activation de l'entree Statistiques dans la navigation laterale et ajout des metadonnees de page.",
          "Ajout d'un toggle permettant d'inclure ou non les vehicules vendus dans le perimetre des statistiques.",
        ],
      },
      {
        title: "Kilometrage",
        items: [
          "Ajout d'un graphique Kilometrage avec une ligne distincte par vehicule pour comparer les evolutions.",
          "Correction du tri chronologique global afin que les releves recents ne soient plus places avant des releves plus anciens.",
          "Ajout d'un basculement entre la vue Km total des releves et la vue Km parcourus cumules depuis 0 pour chaque vehicule.",
        ],
      },
      {
        title: "Carburant et couts",
        items: [
          "Ajout de la repartition des carburants sur l'ensemble des releves du perimetre selectionne.",
          "Ajout d'une legende de donut enrichie avec barres de progression et pourcentage par carburant.",
          "Ajout de la section Evolution du prix du carburant reutilisant le graphique existant par carburant.",
          "Ajout des cartes Depense totale essence et Cout median / 100km.",
          "Ajout des classements Vehicule le moins cher et Vehicule le plus gourmand bases sur les intervalles entre releves.",
          "Conservation de l'affichage compatible Shield Mode pour les valeurs sensibles.",
        ],
      },
      {
        title: "Classements",
        items: [
          "Ajout du Vehicule le plus utilise selon les kilometres parcourus entre releves.",
          "Ajout du Vehicule le moins cher selon le cout median au 100 km.",
          "Ajout du Vehicule le plus gourmand selon la consommation mediane en L/100 km.",
          "Reorganisation des indicateurs en groupes principaux et secondaires avec styles differencies.",
        ],
      },
      {
        title: "Entretiens",
        items: [
          "Extension de l'API statistiques pour recuperer les entretiens realises des vehicules inclus.",
          "Ajout des cartes Depense totale entretiens et Entretiens realises.",
          "Alignement des statistiques d'entretien sur le meme filtre actifs/vendus que les releves.",
        ],
      },
      {
        title: "API et validation",
        items: [
          "Ajout de la route API /api/vehicule/:UtilisateurID/statistiques avec le parametre includeSold.",
          "Aggregation cote backend des vehicules, releves et entretiens realises de l'utilisateur actif.",
          "Validation syntaxique du controleur backend modifie.",
          "Validation du build frontend apres l'ajout de la page, des graphiques et des cartes.",
        ],
      },
    ],
  },
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
    version: "1.14.7",
    title: "Formulaire de releves harmonise",
    date: "28 mai 2026",
    sections: [
      {
        title: "Page Releves",
        items: [
          "Application du style des champs Ajouter un entretien aux inputs de saisie des releves.",
          "Harmonisation des listes Vehicule et Carburant avec les blocs sombres bordes utilises dans les formulaires d'entretien.",
          "Conservation des pre-remplissages existants du vehicule et de la date depuis la page Vehicule.",
        ],
      },
    ],
  },
  {
    version: "1.14.6",
    title: "Ajout rapide depuis un vehicule",
    date: "28 mai 2026",
    sections: [
      {
        title: "Page Vehicule",
        items: [
          "Remplacement du bouton Ajouter un releve par un menu deroulant Ajouter.",
          "Conservation de l'action Ajouter un releve avec le vehicule et la date du jour pre-remplis.",
          "Ajout d'une action Ajouter un entretien depuis le vehicule selectionne.",
        ],
      },
      {
        title: "Page Entretien",
        items: [
          "Ouverture automatique du modal d'ajout d'entretien via les parametres d'URL.",
          "Pre-remplissage du vehicule et de la date du jour lors de l'arrivee depuis la page Vehicule.",
        ],
      },
    ],
  },
  {
    version: "1.14.5",
    title: "Suppression des releves",
    date: "28 mai 2026",
    sections: [
      {
        title: "Page Vehicule",
        items: [
          "Ajout d'une action Supprimer dans le tableau Derniers releves et dans la liste Tous les releves.",
          "Reprise du style de suppression de l'Historique recent avec bouton icone, tooltip et confirmation sombre.",
          "Blocage de la suppression des releves pendant Shield Mode comme les autres actions d'ecriture.",
        ],
      },
      {
        title: "API",
        items: [
          "Ajout d'un endpoint backend dedie pour supprimer un releve appartenant au vehicule et a l'utilisateur.",
          "Rechargement automatique des donnees du vehicule apres suppression du releve.",
        ],
      },
    ],
  },
  {
    version: "1.14.4",
    title: "Ergonomie des actions et modales",
    date: "28 mai 2026",
    sections: [
      {
        title: "Tooltips accessibles",
        items: [
          "Ajout de tooltips au survol et au focus sur les boutons icones seuls des pages Vehicule et Entretien.",
          "Rendu des tooltips dans document.body afin de rester au-dessus des modales, tableaux et conteneurs avec overflow.",
          "Ajout de aria-label sur les actions icones pour conserver une description accessible au clavier et aux lecteurs d'ecran.",
          "Ajout d'une marge responsive de securite basee sur px-4, sm:px-6 et lg:px-8 afin que les tooltips ne collent pas aux bords de l'ecran.",
        ],
      },
      {
        title: "Actions en icones",
        items: [
          "Passage des actions Ajouter un releve, Marquer vendu et Rehabiliter en boutons icones avec tooltip sur la page Vehicule.",
          "Passage des actions Ajouter un entretien et Realise en boutons icones avec tooltip sur la page Entretien.",
          "Conservation des etats verrouilles par Shield Mode et des titres natifs existants lorsque l'action est bloquee.",
        ],
      },
      {
        title: "Modales Vehicule",
        items: [
          "Correction de la modal Tous les releves afin que le flou d'arriere-plan couvre tout l'ecran, y compris la sidebar.",
          "Correction de la modal Modifier le releve avec le meme rendu au-dessus de la sidebar.",
          "Rendu des modales de releves via portal dans document.body pour eviter les conflits de stacking du layout principal.",
          "Alignement visuel des modales de releves avec le style sombre et le panneau gradient de la modal Modifier l'entretien.",
        ],
      },
      {
        title: "Validation",
        items: [
          "Validation du build frontend apres les ajustements de tooltips, boutons icones et modales.",
          "Conservation des warnings existants du projet sans ajout de nouveau warning lie aux changements.",
        ],
      },
    ],
  },
  {
    version: "1.14.3",
    title: "Dates techniques en base de donnees",
    date: "28 mai 2026",
    sections: [
      {
        title: "Schema Prisma",
        items: [
          "Ajout des colonnes CreateDate et UpdateDate sur les tables qui n'avaient pas encore les deux dates techniques.",
          "Ajout de CreateDate sur Vehicule et Relever, qui possedaient deja UpdateDate.",
          "Conservation de CreateDate avec une valeur par defaut en base afin de renseigner les lignes existantes et les donnees de seed.",
        ],
      },
      {
        title: "Migration MySQL",
        items: [
          "Creation d'une nouvelle migration Prisma pour ajouter les colonnes de dates sur les tables concernees.",
          "Application de la migration sur la base locale vehicle configuree par DATABASE_URL.",
          "Regeneration du client Prisma apres mise a jour du schema.",
        ],
      },
      {
        title: "Ecritures serveur",
        items: [
          "Ajout explicite de l'heure serveur lors des creations avec CreateDate dans les controleurs vehicules, releves et entretiens.",
          "Ajout explicite de l'heure serveur lors des modifications avec UpdateDate dans les controleurs et le repository utilisateur.",
          "Extension des ecritures d'administration des donnees de reference pour renseigner CreateDate et UpdateDate.",
        ],
      },
      {
        title: "Exports et validation",
        items: [
          "Ajout de CreateDate dans les details vehicule et releves renvoyes par l'API lorsque ces donnees sont utiles.",
          "Ajout de CreateDate dans les exports CSV vehicule.csv et releves.csv des archives de vehicule.",
          "Validation du schema Prisma et verification syntaxique des fichiers backend modifies.",
        ],
      },
    ],
  },
  {
    version: "1.14.2",
    title: "Shield Mode sur la page Entretien",
    date: "28 mai 2026",
    sections: [
      {
        title: "Confidentialite niveau 1",
        items: [
          "Application du mode Shield leger sur les donnees d'entretien avec dates reduites a l'annee.",
          "Arrondi des kilometres et des couts afin de conserver une lecture utile sans exposer les valeurs exactes.",
          "Conservation de l'affichage des listes, du calendrier, des statistiques et de la repartition des couts pendant Shield Mode.",
        ],
      },
      {
        title: "Confidentialite niveau 2",
        items: [
          "Remplacement des donnees sensibles par des etoiles en Shield Mode niveau 2 sur les couts, dates, kilometres, garages et notes.",
          "Masquage des notes dans les cartes, l'historique recent et la modal du calendrier lorsque le niveau 2 est actif.",
          "Correction du formatage des couts afin d'eviter une erreur navigateur lors de l'activation du niveau 2.",
        ],
      },
      {
        title: "Verrouillage des actions",
        items: [
          "Blocage de l'ajout, de la modification, de la suppression et du passage en realise pendant Shield Mode.",
          "Fermeture automatique des modales d'ecriture ou de suppression lorsqu'un mode Shield est active.",
          "Validation du build frontend apres l'alignement des regles Shield de la page Entretien.",
        ],
      },
    ],
  },
  {
    version: "1.14.1",
    title: "Telechargement direct des archives",
    date: "28 mai 2026",
    sections: [
      {
        title: "Page Vehicule",
        items: [
          "Ajout d'un bouton Telecharger les archives du vehicule dans la liste des actions en haut de la page Vehicule.",
          "Placement du bouton avec les actions existantes comme Ajouter un releve, Marquer vendu, Modifier et Supprimer.",
          "Conservation du verrouillage par Shield Mode afin de bloquer l'action lorsque les donnees sensibles sont protegees.",
        ],
      },
      {
        title: "Archive sans suppression",
        items: [
          "Reutilisation du meme modal de mot de passe que le telechargement avant suppression.",
          "Reutilisation du meme endpoint backend pour generer le ZIP du vehicule et les exports CSV.",
          "Telechargement de l'archive sans afficher la confirmation de suppression et sans supprimer le vehicule.",
        ],
      },
      {
        title: "Compatibilite",
        items: [
          "Conservation du parcours Telecharger avant suppression dans le modal de suppression.",
          "Retour vers la validation finale de suppression uniquement lorsque le telechargement vient du parcours de suppression.",
          "Validation du build frontend apres la modification.",
        ],
      },
    ],
  },
  {
    version: "1.14.0",
    title: "Suppression et export des vehicules",
    date: "28 mai 2026",
    sections: [
      {
        title: "Suppression definitive",
        items: [
          "Ajout d'un bouton Supprimer sur la page Vehicule, place avec les actions Marquer vendu et Modifier.",
          "Ajout d'un premier modal de confirmation dans le style sombre existant de l'application.",
          "Ajout d'un second modal de validation demandant le mot de passe avant suppression definitive.",
          "Redirection automatique vers le Dashboard apres suppression avec notification de validation.",
        ],
      },
      {
        title: "Suppression en cascade",
        items: [
          "Ajout d'une route backend dediee pour supprimer un vehicule appartenant a l'utilisateur.",
          "Suppression en cascade des releves, entretiens planifies et entretiens realises lies au vehicule.",
          "Suppression physique des données du vehicule lorsque celle-ci existe dans le dossier uploads/vehicules.",
          "Protection de l'image par defaut afin qu'elle ne soit jamais supprimee lors de la suppression d'un vehicule.",
        ],
      },
      {
        title: "Archive avant suppression",
        items: [
          "Ajout d'une option Telecharger avant suppression dans le modal de confirmation.",
          "Demande du mot de passe avant de generer et telecharger l'archive du dossier du vehicule.",
          "Generation d'un fichier ZIP contenant les fichiers physiques du dossier uploads/vehicules de ce vehicule.",
          "Retour automatique vers le modal final de suppression apres le telechargement si l'utilisateur souhaite continuer.",
        ],
      },
      {
        title: "Donnees brutes CSV",
        items: [
          "Ajout d'un sous-dossier donneesBrute dans l'archive ZIP du vehicule.",
          "Generation des exports vehicule.csv, releves.csv, entretiens_planifies.csv et entretiens_realises.csv.",
          "Export limite au vehicule concerne afin de ne pas melanger les donnees avec celles d'autres vehicules.",
          "Remplacement des cles etrangeres par des noms lisibles comme carburant, marque, type, etat, utilisateur, type d'entretien et categorie.",
        ],
      },
      {
        title: "Securite et feedback",
        items: [
          "Validation backend du mot de passe pour le telechargement d'archive et la suppression definitive.",
          "Ajout d'un bridage partage entre telechargement et suppression : 3 essais incorrects puis blocage pendant 5 minutes.",
          "Affichage du feedback sous le champ mot de passe avec le nombre d'essais restants ou le temps d'attente.",
          "Remise a zero du compteur d'essais apres une validation reussie du mot de passe.",
        ],
      },
    ],
  },
  {
    version: "1.13.0",
    title: "Gestion des donnees de reference",
    date: "27 mai 2026",
    sections: [
      {
        title: "Administration",
        items: [
          "Ajout d'une nouvelle section Donnees de reference dans la page Administration.",
          "Ajout de la gestion des types de vehicule, marques de vehicule, carburants, categories d'entretien et entretiens types.",
          "Ajout d'un formulaire unique pour ajouter ou modifier les elements selon la table selectionnee.",
          "Conservation du style sombre existant de l'administration avec navigation par table, compteurs et actions rapides.",
        ],
      },
      {
        title: "Recherche et pagination",
        items: [
          "Ajout d'une barre de recherche par table afin de verifier rapidement si un contenu existe deja.",
          "Recherche locale sur les champs utiles : ID, nom, couleur, description et categorie selon la table.",
          "Ajout d'une pagination limitee a 10 elements par page sur les tables de reference.",
          "Reprise du style de pagination existant avec boutons precedent, suivant, pages numerotees et ellipses.",
        ],
      },
      {
        title: "API admin",
        items: [
          "Ajout d'endpoints backend dedies sous /api/admin/reference-data pour charger toutes les donnees de reference.",
          "Ajout des actions create, update et delete pour chaque table de reference geree depuis l'administration.",
          "Protection des nouvelles routes avec authentification admin et middleware Shield Mode.",
          "Gestion des suppressions bloquees lorsqu'un element est encore utilise par une relation en base.",
        ],
      },
      {
        title: "Robustesse",
        items: [
          "Validation des champs obligatoires avant creation ou modification.",
          "Verification de l'existence de la categorie avant de creer ou modifier un type d'entretien.",
          "Rechargement automatique des donnees apres ajout, modification ou suppression.",
          "Affichage de messages d'erreur explicites lorsque l'action ne peut pas etre effectuee.",
        ],
      },
    ],
  },
  {
    version: "1.12.0",
    title: "Ameliorations de la page Entretien",
    date: "27 mai 2026",
    sections: [
      {
        title: "Listes et pagination",
        items: [
          "Ajout d'une pagination locale a 5 elements par page sur A venir prochainement et Historique recent.",
          "Reorganisation de la page Entretien avec A venir prochainement en pleine largeur, Calendrier d'entretien et Repartition des couts sur la deuxieme ligne, puis Historique recent en pleine largeur.",
          "Ajout d'un overflow horizontal fiable sur le tableau Historique recent pour une lecture correcte sur telephone.",
          "Correction de l'affichage des echeances planifiees afin de ne montrer que la date ou le kilometrage disponible, sauf lorsque les deux valeurs sont renseignees.",
        ],
      },
      {
        title: "Notes et historique",
        items: [
          "Ajout de l'affichage des notes dans A venir prochainement avec un bouton Voir la note lorsque la note existe.",
          "Ajout des colonnes Garage et Note dans Historique recent.",
          "Ajout d'un modal de lecture des notes pour les entretiens planifies et realises.",
          "Conservation des boutons de note uniquement lorsqu'une note est presente afin d'eviter des actions inutiles.",
        ],
      },
      {
        title: "Suppression d'entretiens",
        items: [
          "Ajout d'un bouton de suppression sur les entretiens planifies et realises en cas de creation par erreur.",
          "Ajout d'un modal de confirmation avant suppression afin d'eviter les suppressions accidentelles.",
          "Ajout des endpoints backend DELETE pour supprimer un entretien planifie ou realise.",
          "Protection des nouvelles routes de suppression avec le middleware Shield Mode existant.",
        ],
      },
      {
        title: "Calendrier",
        items: [
          "Transformation des jours du calendrier contenant un entretien en boutons cliquables.",
          "Coloration complete du bouton du jour selon le statut prioritaire : a venir, en retard ou realise.",
          "Ajout d'un modal Calendrier listant les entretiens du jour avec vehicule, type, statut, echeance, cout, garage et note selon les donnees disponibles.",
          "Suppression des anciens points de couleur sous les jours au profit d'une interaction plus lisible.",
        ],
      },
      {
        title: "Couts",
        items: [
          "Passage de la Repartition des couts du filtre 12 mois au total general de tous les entretiens realises.",
          "Mise a jour de la carte Coût total pour afficher le total general et le libelle Tous les entretiens realises.",
          "Conservation du total 12 mois dans les statistiques backend pour compatibilite, tout en exposant le nouveau total global.",
        ],
      },
    ],
  },
  {
    version: "1.11.1",
    title: "Seed des entretiens",
    date: "26 mai 2026",
    sections: [
      {
        title: "Seed Prisma",
        items: [
          "Ajout des categories d'entretien par defaut dans prisma/seed.js : Entretien courant, Pneus, Freinage, Fluides, Transmission et Autres.",
          "Ajout des 13 types d'entretien par defaut relies a leur categorie respective.",
          "Utilisation d'une logique findFirst puis update/create pour eviter les doublons lorsque le seed est relance.",
          "Mise a jour des categories et types existants si leur couleur, icone, description ou categorie change.",
        ],
      },
      {
        title: "Robustesse",
        items: [
          "Ajout d'une verification explicite des categories avant la creation des types d'entretien.",
          "Ajout de skipDuplicates sur les utilisateurs par defaut afin d'eviter le blocage du script sur les surnoms uniques.",
          "Conservation des donnees deja presentes sans duplication des nouvelles tables d'entretien.",
        ],
      },
    ],
  },
  {
    version: "1.11.0",
    title: "Gestion des entretiens",
    date: "26 mai 2026",
    sections: [
      {
        title: "Base de donnees",
        items: [
          "Ajout des tables CategorieEntretien, EntretienType, EntretienPlanifie et EntretienRealise dans Prisma.",
          "Ajout des relations entre les vehicules, les entretiens planifies, les entretiens realises et les types d'entretien.",
          "Creation des migrations MySQL pour les nouvelles tables et les donnees de depart des categories et types d'entretien.",
          "Ajout de 6 categories et 13 types d'entretien par defaut pour initialiser la gestion d'entretien.",
        ],
      },
      {
        title: "Page Entretien",
        items: [
          "Ajout de la route /entretien et activation du lien Entretien dans la sidebar.",
          "Creation d'une page Entretien inspiree du visuel de reference avec statistiques, liste des entretiens a venir, calendrier, historique recent et repartition des couts.",
          "Connexion de la page aux vraies donnees de la base via une nouvelle API d'overview.",
          "Calcul des entretiens a venir, en retard, realises, du cout total sur 12 mois et de la repartition par categorie.",
        ],
      },
      {
        title: "Ajout d'entretien",
        items: [
          "Ajout d'une modal sombre pour planifier un entretien a venir ou enregistrer un entretien deja realise.",
          "Preselection et affichage des vehicules avec image, marque, modele et type.",
          "Ajout des champs categorie, type d'entretien, date, kilometrage, priorite, cout, garage et notes selon le mode choisi.",
          "Remplacement des selects natifs par des dropdowns custom avec recherche, icones et couleurs coherentes avec le reste de l'interface.",
        ],
      },
      {
        title: "Edition et historique",
        items: [
          "Ajout de la modification des entretiens planifies depuis la section A venir prochainement.",
          "Ajout de la modification des entretiens realises depuis la section Historique recent.",
          "Ajout de l'action Realise pour transformer un entretien planifie en entretien realise dans l'historique.",
          "L'action Realise lie l'historique cree a l'entretien planifie d'origine et marque ce dernier comme realise.",
        ],
      },
      {
        title: "API",
        items: [
          "Ajout des endpoints backend pour charger l'overview entretien, creer un entretien, modifier un entretien planifie, modifier un entretien realise et finaliser un entretien planifie.",
          "Protection des routes d'ecriture entretien avec le middleware Shield Mode existant.",
          "Regeneration du client Prisma et validation du schema apres l'ajout des nouveaux modeles.",
        ],
      },
    ],
  },
  {
    version: "1.10.1",
    title: "Correctif du tableau des relevés",
    date: "26 mai 2026",
    sections: [
      {
        title: "Releves",
        items: [
          "Masquage de la colonne Inclinaison dans le tableau Derniers releves lorsqu'aucune donnee d'inclinaison n'est disponible sur les lignes affichees.",
          "Conservation de la colonne Inclinaison des qu'au moins un releve affiche possede une inclinaison gauche ou droite.",
          "Reutilisation du meme controle de disponibilite pour garder un comportement coherent avec la carte Inclinaisons par releve.",
        ],
      },
    ],
  },
  {
    version: "1.10.0",
    title: "Shield Mode niveau 2 et verrouillage backend",
    date: "26 mai 2026",
    sections: [
      {
        title: "Shield Mode niveau 2",
        items: [
          "Ajout d'un niveau 2 de Shield Mode accessible depuis la modal de desactivation du niveau 1, sans demande de mot de passe supplementaire.",
          "Conservation de la demande de mot de passe uniquement pour desactiver Shield Mode, quel que soit le niveau actif.",
          "Bascule des accents visuels du niveau 2 vers un theme rouge afin de distinguer clairement le mode de confidentialite renforce.",
        ],
      },
      {
        title: "Confidentialite renforcee",
        items: [
          "Masquage des caracteres alphanumeriques du modele vehicule avec des etoiles en Shield Mode niveau 2.",
          "Arrondi des kilometres a la centaine, des prix a l'euro, des consommations au litre et des dates a l'annee dans les donnees accessibles.",
          "Blocage de la deconnexion pendant Shield Mode afin d'eviter une sortie de session depuis un etat confidentiel.",
        ],
      },
      {
        title: "Graphiques confidentiels",
        items: [
          "Lissage des courbes en Shield Mode niveau 2 avec une moyenne glissante afin de reduire la precision visuelle des donnees.",
          "Affichage des dates des graphiques au format mois + annee pendant Shield Mode niveau 2.",
          "Arrondi des prix et des consommations des graphiques a une decimale pendant Shield Mode niveau 2.",
        ],
      },
      {
        title: "Protection backend",
        items: [
          "Ajout d'un header X-Shield-Mode-Level envoye par les appels API Axios et fetch du frontend.",
          "Ajout d'un middleware backend Shield Mode qui verrouille les routes sensibles lorsque Shield Mode est actif.",
          "Maintien des routes de lecture vehicule accessibles pendant Shield Mode afin que les donnees utiles restent disponibles apres un rafraichissement de page.",
          "Blocage backend des actions d'ecriture comme ajouter un vehicule, ajouter un releve, modifier un vehicule, modifier un releve, vendre ou rehabiliter un vehicule.",
        ],
      },
      {
        title: "Application",
        items: [
          "Correction du middleware d'authentification backend pour respecter le format async attendu par Fastify.",
        ],
      },
    ],
  },
  {
    version: "1.9.0",
    title: "Shield Mode et confidentialite",
    date: "23 mai 2026",
    sections: [
      {
        title: "Shield Mode",
        items: [
          "Ajout d'un toggle Shield Mode dans le header, place a gauche du bouton Notifications.",
          "Activation immediate du mode confidentialite et desactivation protegee par une modal demandant le mot de passe utilisateur.",
          "Conservation d'un alias Drive-[ID court] pendant toute la session verrouillee, jusqu'au deverrouillage du mode.",
        ],
      },
      {
        title: "Donnees masquees",
        items: [
          "Remplacement du nom utilisateur par l'alias Shield Mode dans le header, la sidebar, le menu profil et la page Profil.",
          "Remplacement de l'image de profil par l'image publique confidentialiter.png.",
          "Masquage des immatriculations avec conservation du format, par exemple ER-738-BA devient **-***-**.",
          "Masquage du kilometrage total, des kilometres declares, des dates de releves et de mises a jour.",
          "Masquage des depenses totales, du prix total des releves et des couts calcules dans la page Simulation.",
        ],
      },
      {
        title: "Acces et actions",
        items: [
          "Blocage de l'acces aux pages Parametres, Releves et Administration pendant Shield Mode.",
          "Desactivation des boutons sensibles comme Ajouter un vehicule, Ajouter un releve, Modifier, Marquer vendu et Rehabiliter.",
          "Fermeture automatique des modes edition et modales de modification lorsque Shield Mode est active.",
        ],
      },
      {
        title: "Interface",
        items: [
          "Bascule des accents visuels du theme du bleu vers le vert pendant Shield Mode.",
          "Ajout d'un contexte frontend dedie pour centraliser l'etat, l'alias, l'image confidentielle et les helpers de masquage.",
        ],
      },
    ],
  },
  {
    version: "1.8.0",
    title: "Gestion des vehicules vendus",
    date: "23 mai 2026",
    sections: [
      {
        title: "Navigation",
        items: [
          "Ajout d'une section Actifs et d'une section Vendus dans le dropdown Vehicules de la sidebar.",
          "Les vehicules vendus restent accessibles depuis la sidebar afin de consulter leur fiche et leurs donnees historiques.",
          "La recherche du dropdown filtre maintenant les vehicules actifs et vendus.",
        ],
      },
      {
        title: "Vehicules vendus",
        items: [
          "Les vehicules vendus ne sont pas affiches dans le Dashboard, qui reste dedie aux vehicules actifs.",
          "La page Vehicule peut maintenant ouvrir une fiche de vehicule vendu avec ses informations et ses releves existants.",
          "Ajout d'un bouton Rehabiliter sur les fiches de vehicules vendus pour les remettre en actif en cas d'erreur.",
        ],
      },
      {
        title: "Releves",
        items: [
          "Masquage du bouton Ajouter un releve lorsqu'un vehicule est vendu.",
          "Conservation de l'acces en lecture et correction aux releves deja enregistres pour les vehicules vendus.",
        ],
      },
      {
        title: "Application",
        items: [
          "Ajout de l'endpoint backend permettant de rebasculer un vehicule vendu en actif.",
        ],
      },
    ],
  },
  {
    version: "1.7.0",
    title: "Harmonisation visuelle de l'application",
    date: "23 mai 2026",
    sections: [
      {
        title: "Design system",
        items: [
          "Harmonisation des pages Releves, Parametres, Administration et Mises a jour avec le style sombre des pages Dashboard et Vehicule.",
          "Generalisation des cartes slate avec bordures sky discretes, titres sobres, champs harmonises et boutons coherents.",
          "Ajout d'icones Heroicons sur les actions principales et les zones fonctionnelles.",
        ],
      },
      {
        title: "Releves",
        items: [
          "Refonte de la page d'ajout de releve avec une carte principale, une zone d'affectation et un resume de saisie.",
          "Mise a jour des listes Vehicule et Carburant pour reprendre le style des formulaires recents.",
          "Ajout d'une action de reinitialisation coherente avec le reste de l'interface.",
        ],
      },
      {
        title: "Parametres",
        items: [
          "Refonte de la page Parametres avec une carte Profil et une carte Zone danger.",
          "Modernisation du formulaire de profil, des messages de succes/erreur et des modales de suppression de compte.",
          "Correction d'attributs JSX invalides dans les controles de suppression d'image.",
        ],
      },
      {
        title: "Administration",
        items: [
          "Refonte de la page Administration avec une grille claire pour creation admin, liste admins et utilisateurs par etat.",
          "Modernisation du tableau des administrateurs avec badges d'etat et actions plus lisibles.",
          "Refonte des cartes utilisateurs actifs, bloques et supprimes avec avatars, badges et boutons harmonises.",
        ],
      },
      {
        title: "Application",
        items: [
          "Refonte de cette page Mises a jour pour reprendre le meme design que les autres pages modernisees.",
        ],
      },
    ],
  },
  {
    version: "1.6.0",
    title: "Dashboard des vehicules",
    date: "23 mai 2026",
    sections: [
      {
        title: "Dashboard",
        items: [
          "Ajout de la page Dashboard avec une section cliquable par vehicule actif.",
          "Affichage en lecture seule des informations principales de chaque vehicule.",
          "Calcul et affichage des kilometres declares, de la consommation moyenne, du prix moyen par litre et des kilometres moyens par releve.",
          "Chaque section Dashboard ouvre directement la fiche du vehicule selectionne.",
        ],
      },
      {
        title: "Navigation",
        items: [
          "Separation de la page Dashboard et de la page Vehicule afin de conserver l'edition sur la fiche vehicule.",
          "Ajout du lien Dashboard dans la sidebar avant le dropdown Vehicules.",
        ],
      },
      {
        title: "Application",
        items: [
          "Affichage du nom et de la version de l'application depuis les variables d'environnement.",
        ],
      },
    ],
  },
  {
    version: "1.5.0",
    title: "Statistiques vehicule et responsive",
    date: "22 mai 2026",
    sections: [
      {
        title: "Statistiques",
        items: [
          "Ajout d'une premiere rangee de cartes basee sur le dernier releve avec comparaison au releve precedent.",
          "Ajout d'une deuxieme rangee de cartes basee sur les moyennes generales du vehicule.",
          "Calcul global de la consommation moyenne, du cout moyen / 100km, du prix moyen par litre et des kilometres moyens par releve.",
          "La card d'identite affiche maintenant les kilometres declares au lieu du kilometrage total du compteur.",
        ],
      },
      {
        title: "Kilometrage",
        items: [
          "Ajout des kilometres declares sur la card Kilometrage, calcules entre le premier et le dernier releve du vehicule.",
          "Conservation du kilometrage total compteur dans le sous-titre du graphique Kilometrage.",
        ],
      },
      {
        title: "Responsive",
        items: [
          "Correction des debordements a partir de la section Kilometrage sur mobile et desktop.",
          "Correction de la ligne Derniers releves / Activite recente pour mieux utiliser l'espace disponible sur desktop.",
          "Ajout d'un overflow horizontal fiable au tableau des releves sur mobile.",
        ],
      },
      {
        title: "Interface",
        items: [
          "Correction du fond bleu de l'application afin qu'il reste fixe pendant le scroll.",
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

function UpdateCard({ update }) {
  return (
    <article className="overflow-hidden rounded-lg border border-sky-500/20 bg-slate-950/60 shadow-[0_18px_55px_rgba(2,6,23,0.28)]">
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
  );
}

export default function UpdatePage() {
  const latestUpdate = updates[0];
  const latestUpdates = updates.slice(0, 3);
  const historicalUpdates = updates.slice(3);

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

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-50">Dernieres mises a jour</h2>
            <p className="mt-1 text-sm text-slate-400">Les trois versions les plus recentes.</p>
          </div>
          <div className="space-y-6">
            {latestUpdates.map((update) => (
              <UpdateCard key={update.version} update={update} />
            ))}
          </div>
        </section>

        <section>
          <details className="group overflow-hidden rounded-lg border border-sky-500/20 bg-slate-950/60 shadow-[0_18px_55px_rgba(2,6,23,0.28)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">Historique complet</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {historicalUpdates.length} version{historicalUpdates.length > 1 ? "s" : ""} plus ancienne{historicalUpdates.length > 1 ? "s" : ""}, de v{historicalUpdates[0]?.version} a v{historicalUpdates[historicalUpdates.length - 1]?.version}.
                </p>
              </div>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 text-sky-300 transition group-open:rotate-180">
                <ChevronDownIcon className="h-5 w-5" />
              </span>
            </summary>
            <div className="space-y-6 border-t border-white/10 p-5 sm:p-6">
              {historicalUpdates.map((update) => (
                <UpdateCard key={update.version} update={update} />
              ))}
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
