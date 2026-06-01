import { PrismaClient } from '@prisma/client'; // Import pour Prisma
import bcrypt from 'bcrypt'; // Import pour bcrypt
import 'dotenv/config';

const prisma = new PrismaClient();

const entretienCategories = [
  { Nom: "Entretien courant", Couleur: "#0284c7", Icone: "wrench-screwdriver" },
  { Nom: "Pneus", Couleur: "#0ea5e9", Icone: "lifebuoy" },
  { Nom: "Freinage", Couleur: "#f97316", Icone: "shield-check" },
  { Nom: "Fluides", Couleur: "#fb923c", Icone: "beaker" },
  { Nom: "Transmission", Couleur: "#22c55e", Icone: "cog" },
  { Nom: "Autres", Couleur: "#8b5cf6", Icone: "sparkles" },
];

const entretienTypes = [
  { Nom: "Vidange moteur", Description: "Remplacement huile et filtre à huile", Categorie: "Entretien courant" },
  { Nom: "Révision périodique", Description: "Contrôle général et entretien courant", Categorie: "Entretien courant" },
  { Nom: "Contrôle général", Description: "Vérification des points de sécurité", Categorie: "Entretien courant" },
  { Nom: "Pneus avant", Description: "Contrôle ou remplacement des pneus avant", Categorie: "Pneus" },
  { Nom: "Pneus arrière", Description: "Contrôle ou remplacement des pneus arrière", Categorie: "Pneus" },
  { Nom: "Pneus (usure)", Description: "Vérification et remplacement si nécessaire", Categorie: "Pneus" },
  { Nom: "Plaquettes de frein avant", Description: "Remplacement des plaquettes avant", Categorie: "Freinage" },
  { Nom: "Plaquettes de frein arrière", Description: "Remplacement des plaquettes arrière", Categorie: "Freinage" },
  { Nom: "Liquide de frein", Description: "Remplacement liquide de frein", Categorie: "Freinage" },
  { Nom: "Liquide de refroidissement", Description: "Remplacement liquide de refroidissement", Categorie: "Fluides" },
  { Nom: "Huile de transmission", Description: "Vidange ou appoint de transmission", Categorie: "Transmission" },
  { Nom: "Changement kit chaîne", Description: "Usure kit chaîne", Categorie: "Transmission" },
  { Nom: "Autre entretien", Description: "Entretien personnalisé", Categorie: "Autres" },
];

async function seedEntretienDefaults() {
  const categoriesByName = new Map();

  for (const category of entretienCategories) {
    const existingCategory = await prisma.categorieEntretien.findFirst({
      where: { Nom: category.Nom },
    });

    const savedCategory = existingCategory
      ? await prisma.categorieEntretien.update({
          where: { CategorieEntretienID: existingCategory.CategorieEntretienID },
          data: {
            Couleur: category.Couleur,
            Icone: category.Icone,
          },
        })
      : await prisma.categorieEntretien.create({
          data: category,
        });

    categoriesByName.set(savedCategory.Nom, savedCategory);
  }

  for (const type of entretienTypes) {
    const category = categoriesByName.get(type.Categorie);
    if (!category) {
      throw new Error(`Catégorie d'entretien introuvable : ${type.Categorie}`);
    }

    const existingType = await prisma.entretienType.findFirst({
      where: { Nom: type.Nom },
    });

    const data = {
      Nom: type.Nom,
      Description: type.Description,
      CategorieEntretienID: category.CategorieEntretienID,
    };

    if (existingType) {
      await prisma.entretienType.update({
        where: { EntretienTypeID: existingType.EntretienTypeID },
        data,
      });
    } else {
      await prisma.entretienType.create({ data });
    }
  }
}

async function main() {
  const salt = await bcrypt.genSalt(10);
  const superAdminPassword = process.env.PASSWORDSUPERADMIN || "change-me";
  const adminPassword = process.env.PASSWORDADMIN || "change-me";
  const hashedPasswordSuperAdmin = await bcrypt.hash(superAdminPassword, salt);
  const hashedPasswordAdmin = await bcrypt.hash(adminPassword, salt);

  // Ajouter des grades par défaut
  await prisma.grade.createMany({
    data: [
      { Nom: "SuperAdmin" },
      { Nom: "Admin" },
      { Nom: "Utilisateur" },
    ],
    skipDuplicates: true, // Évite les erreurs s'il existent déjà
  });

  console.log("Grades par défaut ajoutés !");

  // Ajouter des Etat par défaut
  await prisma.etat.createMany({
    data: [
      { Nom: "Actif" },
      { Nom: "Supprimer" },
      { Nom: "Bloquer" },
      { Nom: "Vendu" },
    ],
    skipDuplicates: true, // Évite les erreurs s'il existent déjà
  });

  console.log("Etat par défaut ajoutés !");

  // Ajouter des Carburant par défaut
  await prisma.carburant.createMany({
    data: [
      { 
        Nom: "SP-98 E5",
        Couleur: "#052e16",
      },
      { 
        Nom: "SP-95 E5",
        Couleur: "#166534",
      },
      { 
        Nom: "SP-95 E10",
        Couleur: "#4d7c0f",
      },
      { 
        Nom: "SP-85",
        Couleur: "#a3e635",
      },
      { 
        Nom: "Gazole",
        Couleur: "#f59e0b",
      },
      { 
        Nom: "Gazole premium",
        Couleur: "#a16207",
      },
      { 
        Nom: "Électricité",
        Couleur: "#facc15",
      },
      { 
        Nom: "Hydrogène",
        Couleur: "#0ea5e9",
      },
    ],
    skipDuplicates: true, // Évite les erreurs s'il existent déjà
  });

  console.log("Carburant par défaut ajoutés !");

  // Ajouter des Carburant par défaut
  await prisma.marque.createMany({
    data: [
      // Marques de voitures
      { Nom: "Peugeot" },
      { Nom: "Renault" },
      { Nom: "Citroën" },
      { Nom: "Toyota" },
      { Nom: "Honda" },
      { Nom: "Nissan" },
      { Nom: "Mazda" },
      { Nom: "Mitsubishi" },
      { Nom: "Suzuki" },
      { Nom: "Subaru" },
      { Nom: "Lexus" },
      { Nom: "Ford" },
      { Nom: "Chevrolet" },
      { Nom: "Tesla" },
      { Nom: "Dodge" },
      { Nom: "Chrysler" },
      { Nom: "Jeep" },
      { Nom: "Ram" },
      { Nom: "GMC" },
      { Nom: "Buick" },
      { Nom: "Cadillac" },
      { Nom: "Volkswagen" },
      { Nom: "Audi" },
      { Nom: "BMW" },
      { Nom: "Mercedes-Benz" },
      { Nom: "Porsche" },
      { Nom: "Opel" },
      { Nom: "Seat" },
      { Nom: "Skoda" },
      { Nom: "Volvo" },
      { Nom: "Saab" },
      { Nom: "Fiat" },
      { Nom: "Alfa Romeo" },
      { Nom: "Lancia" },
      { Nom: "Ferrari" },
      { Nom: "Lamborghini" },
      { Nom: "Maserati" },
      { Nom: "Abarth" },
      { Nom: "Bentley" },
      { Nom: "Rolls-Royce" },
      { Nom: "Aston Martin" },
      { Nom: "Jaguar" },
      { Nom: "Land Rover" },
      { Nom: "Mini" },
      { Nom: "Kia" },
      { Nom: "Hyundai" },
      { Nom: "Genesis" },
      { Nom: "Bugatti" },
      { Nom: "Pagani" },
      { Nom: "Koenigsegg" },
      { Nom: "McLaren" },
      { Nom: "Rivian" },
      { Nom: "Lucid" },
      { Nom: "Tata" },
      { Nom: "Mahindra" },
      { Nom: "Dacia" },
      { Nom: "Smart" },
      { Nom: "SsangYong" },
      { Nom: "Geely" },
      { Nom: "BYD" },
      { Nom: "Chery" },
      { Nom: "Great Wall" },
      { Nom: "Zotye" },
      { Nom: "NIO" },
      { Nom: "XPeng" },
      { Nom: "Lynk & Co" },
      { Nom: "Roewe" },
      { Nom: "MG" },
      { Nom: "Haval" },
      { Nom: "BAIC" },
      { Nom: "FAW" },
      { Nom: "Wuling" },
      { Nom: "Hongqi" },
      { Nom: "Polestar" },
      { Nom: "Cupra" },
      { Nom: "Fisker" },
      { Nom: "Scion" },
      { Nom: "Saturn" },
      { Nom: "Plymouth" },
      { Nom: "Oldsmobile" },
      { Nom: "Hummer" },
  
      // Marques de motos
      { Nom: "Harley-Davidson" },
      { Nom: "Honda" },
      { Nom: "Yamaha" },
      { Nom: "Kawasaki" },
      { Nom: "Suzuki" },
      { Nom: "Ducati" },
      { Nom: "BMW Motorrad" },
      { Nom: "KTM" },
      { Nom: "Triumph" },
      { Nom: "Indian Motorcycle" },
      { Nom: "Royal Enfield" },
      { Nom: "Aprilia" },
      { Nom: "Moto Guzzi" },
      { Nom: "MV Agusta" },
      { Nom: "Benelli" },
      { Nom: "Husqvarna" },
      { Nom: "GasGas" },
      { Nom: "Buell" },
      { Nom: "Can-Am" },
      { Nom: "CFMoto" },
      { Nom: "Sherco" },
      { Nom: "Beta" },
      { Nom: "Vespa" },
      { Nom: "Piaggio" },
      { Nom: "Sym" },
      { Nom: "Kymco" },
      { Nom: "Zero Motorcycles" },
      { Nom: "Energica" },
      { Nom: "Norton" },
      { Nom: "Bimota" },
      { Nom: "Arch Motorcycle" },
      { Nom: "Ural" },
      { Nom: "SWM" },
      { Nom: "Fantic" },
      { Nom: "Mash" },
      { Nom: "AJP" },
      { Nom: "Zontes" },
      { Nom: "Lambretta" },
      { Nom: "Segway" },
      { Nom: "Brammo" }
  ]
  ,
    skipDuplicates: true, // Évite les erreurs s'il existent déjà
  });

  console.log("Marques par défaut ajoutés !");

  // Ajouter des Type par défaut
  await prisma.type.createMany({
    data: [
      { Nom: "Voiture" },
      { Nom: "Moto" },
      { Nom: "Quad" },
      { Nom: "Bateau" },
      { Nom: "Avion" },
      { Nom: "Scooter" },
      { Nom: "Camion" },
      { Nom: "Camionnette" },
    ],
    skipDuplicates: true, // Évite les erreurs s'il existent déjà
  });

  console.log("Type par défaut ajoutés !");

  await seedEntretienDefaults();

  console.log("Catégories et types d'entretien par défaut ajoutés !");

  // Créer un utilisateur par défaut
  await prisma.utilisateur.createMany({
    data: [
      {
        Surnom: process.env.USERNAMESUPERADMIN || "admin",
        CheminImage: "", // Si vous ne souhaitez pas définir d'image par défaut
        Email: process.env.EMAILSUPERADMIN || "admin@example.com",
        Salt: salt,
        MotDePasse: hashedPasswordSuperAdmin,
        GradeID: 1,
        EtatID: 1,
      },
      {
        Surnom: process.env.USERNAMEADMIN || "user",
        CheminImage: "", // Si vous ne souhaitez pas définir d'image par défaut
        Email: process.env.EMAILADMIN || "user@example.com",
        Salt: salt,
        MotDePasse: hashedPasswordAdmin,
        GradeID: 2,
        EtatID: 1,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Utilisateur par défaut ajouté !");

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
