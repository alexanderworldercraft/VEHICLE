INSERT INTO `CategorieEntretien` (`Nom`, `Couleur`, `Icone`) VALUES
  ('Entretien courant', '#0284c7', 'wrench-screwdriver'),
  ('Pneus', '#0ea5e9', 'lifebuoy'),
  ('Freinage', '#f97316', 'shield-check'),
  ('Fluides', '#fb923c', 'beaker'),
  ('Transmission', '#22c55e', 'cog'),
  ('Autres', '#8b5cf6', 'sparkles');

INSERT INTO `EntretienType` (`Nom`, `Description`, `CategorieEntretienID`) VALUES
  ('Vidange moteur', 'Remplacement huile et filtre à huile', 1),
  ('Révision périodique', 'Contrôle général et entretien courant', 1),
  ('Contrôle général', 'Vérification des points de sécurité', 1),
  ('Pneus avant', 'Contrôle ou remplacement des pneus avant', 2),
  ('Pneus arrière', 'Contrôle ou remplacement des pneus arrière', 2),
  ('Pneus (usure)', 'Vérification et remplacement si nécessaire', 2),
  ('Plaquettes de frein avant', 'Remplacement des plaquettes avant', 3),
  ('Plaquettes de frein arrière', 'Remplacement des plaquettes arrière', 3),
  ('Liquide de frein', 'Remplacement liquide de frein', 3),
  ('Liquide de refroidissement', 'Remplacement liquide de refroidissement', 4),
  ('Huile de transmission', 'Vidange ou appoint de transmission', 5),
  ('Changement kit chaîne', 'Usure kit chaîne', 5),
  ('Autre entretien', 'Entretien personnalisé', 6);
