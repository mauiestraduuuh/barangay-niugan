import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Feedback Categories...");

  const categories= [
    // peace
    { name_en: "Noisy karaoke late at night", name_tl: "Maingay na karaoke hanggang disoras ng gabi" },
    { name_en: "Noisy gatherings of youth on the street", name_tl: "Maingay na tambayan ng mga kabataan sa kalsada" },
    { name_en: "Loud vehicle or motorcycle exhaust", name_tl: "Maingay na tambutso ng sasakyan o motor" },
    { name_en: "Neighbors gossiping or spreading rumors", name_tl: "Mga kapitbahay na mahilig sa tsismis o paninira" },
    { name_en: "Neighbors fighting in the middle of the street", name_tl: "Nag-aaway na kapitbahay sa gitna ng kalsada" },
    { name_en: "Youth not following curfew", name_tl: "Mga kabataang hindi sumusunod sa curfew" },
    { name_en: "Drinking sessions on the street or in front of houses", name_tl: "Mga nag-iinuman sa kalsada o harap ng bahay" },

    // pets
    { name_en: "Dogs chasing people", name_tl: "Nanghahabol na aso" },
    { name_en: "Pets defecating anywhere", name_tl: "Mga alagang hayop na kung saan-saan pinapatae" },
    { name_en: "Smelly piggery or poultry area", name_tl: "Mababahong babuyan o manukan" },
    { name_en: "Animal abuse (hurt, starved, or slaughtered cruelly)", name_tl: "Pang-aabuso sa hayop (sinusugatan, ginugutom, o kinakatay)" },
    { name_en: "Unleashed or stray pets roaming freely", name_tl: "Walang tali o kulungan ang mga alagang hayop na nagpapakalat-kalat sa daan" },

    // environment
    { name_en: "Improper garbage disposal", name_tl: "Pagtatapon ng basura sa hindi tamang lugar" },
    { name_en: "Clogged or overflowing drainage", name_tl: "Umaapaw o baradong drainage/kanal" },
    { name_en: "Irregular garbage collection", name_tl: "Hindi regular ang pangongolekta ng basura" },
    { name_en: "Dirty streets not cleaned by sweepers", name_tl: "Maruruming kalsada o hindi nililinis ng street sweeper" },
    { name_en: "Foul-smelling garbage pile in one area", name_tl: "Mababahong tambak ng basura sa isang lugar" },
    { name_en: "Burning trash despite prohibition", name_tl: "Pagsusunog ng basura kahit bawal (pagsisiga)" },

    // road
    { name_en: "Double parking on narrow roads", name_tl: "Double parking sa makitid na daan" },
    { name_en: "Vehicles blocking driveways", name_tl: "Mga sasakyang humaharang sa driveway" },
    { name_en: "Illegal tricycle or motorcycle parking", name_tl: "Ilegal na paradahan ng tricycle o motorsiklo" },
    { name_en: "Broken or missing traffic signs/speed bumps", name_tl: "Sira o kulang sa traffic signage at speed bump" },
    { name_en: "Overspeeding vehicles endangering pedestrians", name_tl: "Mga matutuling magpatakbo ng sasakyan na delikado sa mga naglalakad" },

    // ingfrastructure
    { name_en: "Broken street light post", name_tl: "Sirang poste ng ilaw sa kalsada" },
    { name_en: "Defective barangay CCTV camera", name_tl: "Sirang CCTV camera ng barangay" },
    { name_en: "Hanging or exposed live wires", name_tl: "Nakalaylay o nakasabit na live wires" },
    { name_en: "Damaged or pothole-filled roads", name_tl: "Butas-butas o sirang kalsada" },
    { name_en: "Lack of street lights in dark areas", name_tl: "Kulang sa street lights sa madidilim na lugar" },

    // safety
    { name_en: "Child abuse or neglect", name_tl: "Pang-aabuso o pagpapabaya sa bata" },
    { name_en: "Domestic abuse or family violence", name_tl: "Domestic abuse o karahasan sa pamilya" },
    { name_en: "Obstruction on roads (e.g. plants, trash, debris)", name_tl: "May nakaharang sa daan (hal. halaman, basura, tambak na lupa, atbp.)" },
  ];

  for (const category of categories) {
    await prisma.complaintCategory.upsert({
      where: { english_name: category.name_en },
      update: {},
      create: {
        tagalog_name: category.name_tl,
        english_name: category.name_en,
        description: null,
      },
    });
  }

  console.log("Complaint categories seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
