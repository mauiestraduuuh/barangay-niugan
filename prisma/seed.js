import { PrismaClient, ComplaintGroup } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Complaint Categories...");

  const complaints = [
    // PEACE
    { english: "Noisy karaoke late at night", tagalog: "Maingay na karaoke hanggang disoras ng gabi", group: ComplaintGroup.PEACE },
    { english: "Noisy gatherings of youth on the street", tagalog: "Maingay na tambayan ng mga kabataan sa kalsada", group: ComplaintGroup.PEACE },
    { english: "Loud vehicle or motorcycle exhaust", tagalog: "Maingay na tambutso ng sasakyan o motor", group: ComplaintGroup.PEACE },
    { english: "Neighbors gossiping or spreading rumors", tagalog: "Mga kapitbahay na mahilig sa tsismis o paninira", group: ComplaintGroup.PEACE },
    { english: "Neighbors fighting in the middle of the street", tagalog: "Nag-aaway na kapitbahay sa gitna ng kalsada", group: ComplaintGroup.PEACE },
    { english: "Youth not following curfew", tagalog: "Mga kabataang hindi sumusunod sa curfew", group: ComplaintGroup.PEACE },
    { english: "Drinking sessions on the street or in front of houses", tagalog: "Mga nag-iinuman sa kalsada o harap ng bahay", group: ComplaintGroup.PEACE },

    // PETS
    { english: "Dogs chasing people", tagalog: "Nanghahabol na aso", group: ComplaintGroup.PETS },
    { english: "Pets defecating anywhere", tagalog: "Mga alagang hayop na kung saan-saan pinapatae", group: ComplaintGroup.PETS },
    { english: "Smelly piggery or poultry area", tagalog: "Mababahong babuyan o manukan", group: ComplaintGroup.PETS },
    { english: "Animal abuse (hurt, starved, or slaughtered cruelly)", tagalog: "Pang-aabuso sa hayop (sinusugatan, ginugutom, o kinakatay)", group: ComplaintGroup.PETS },
    { english: "Unleashed or stray pets roaming freely", tagalog: "Walang tali o kulungan ang mga alagang hayop na nagpapakalat-kalat sa daan", group: ComplaintGroup.PETS },

    // ENVIRONMENT
    { english: "Improper garbage disposal", tagalog: "Pagtatapon ng basura sa hindi tamang lugar", group: ComplaintGroup.ENVIRONMENT },
    { english: "Clogged or overflowing drainage", tagalog: "Umaapaw o baradong drainage/kanal", group: ComplaintGroup.ENVIRONMENT },
    { english: "Irregular garbage collection", tagalog: "Hindi regular ang pangongolekta ng basura", group: ComplaintGroup.ENVIRONMENT },
    { english: "Dirty streets not cleaned by sweepers", tagalog: "Maruruming kalsada o hindi nililinis ng street sweeper", group: ComplaintGroup.ENVIRONMENT },
    { english: "Foul-smelling garbage pile in one area", tagalog: "Mababahong tambak ng basura sa isang lugar", group: ComplaintGroup.ENVIRONMENT },
    { english: "Burning trash despite prohibition", tagalog: "Pagsusunog ng basura kahit bawal (pagsisiga)", group: ComplaintGroup.ENVIRONMENT },

    // ROAD
    { english: "Double parking on narrow roads", tagalog: "Double parking sa makitid na daan", group: ComplaintGroup.ROAD },
    { english: "Vehicles blocking driveways", tagalog: "Mga sasakyang humaharang sa driveway", group: ComplaintGroup.ROAD },
    { english: "Illegal tricycle or motorcycle parking", tagalog: "Ilegal na paradahan ng tricycle o motorsiklo", group: ComplaintGroup.ROAD },
    { english: "Broken or missing traffic signs/speed bumps", tagalog: "Sira o kulang sa traffic signage at speed bump", group: ComplaintGroup.ROAD },
    { english: "Overspeeding vehicles endangering pedestrians", tagalog: "Mga matutuling magpatakbo ng sasakyan na delikado sa mga naglalakad", group: ComplaintGroup.ROAD },

    // INFRASTRUCTURE
    { english: "Broken street light post", tagalog: "Sirang poste ng ilaw sa kalsada", group: ComplaintGroup.INFRASTRUCTURE },
    { english: "Defective barangay CCTV camera", tagalog: "Sirang CCTV camera ng barangay", group: ComplaintGroup.INFRASTRUCTURE },
    { english: "Hanging or exposed live wires", tagalog: "Nakalaylay o nakasabit na live wires", group: ComplaintGroup.INFRASTRUCTURE },
    { english: "Damaged or pothole-filled roads", tagalog: "Butas-butas o sirang kalsada", group: ComplaintGroup.INFRASTRUCTURE },
    { english: "Lack of street lights in dark areas", tagalog: "Kulang sa street lights sa madidilim na lugar", group: ComplaintGroup.INFRASTRUCTURE },

    // SAFETY
    { english: "Child abuse or neglect", tagalog: "Pang-aabuso o pagpapabaya sa bata", group: ComplaintGroup.SAFETY },
    { english: "Domestic abuse or family violence", tagalog: "Domestic abuse o karahasan sa pamilya", group: ComplaintGroup.SAFETY },
    { english: "Obstruction on roads (e.g. plants, trash, debris)", tagalog: "May nakaharang sa daan (hal. halaman, basura, tambak na lupa, atbp.)", group: ComplaintGroup.SAFETY },
  ];

  for (const complaint of complaints) {
    await prisma.complaintCategory.upsert({
      where: { english_name: complaint.english },
      update: {},
      create: {
        english_name: complaint.english,
        tagalog_name: complaint.tagalog,
        group: complaint.group,
        description: null,
      },
    });
  }

  console.log("31 Complaint categories seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
