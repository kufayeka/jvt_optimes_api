import 'dotenv/config';
import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Ensure .env is loaded before running prisma/seed.ts');
}

const pool = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: pool });

// removed user/post seeds — project now only seeds lookups and accounts

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data (only lookup/account tables are relevant)
  // Seed lookups
  const taiyoEventPaletteLookups = [
    // TAIYO_EVENT_PALETTE - Setup
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/SetelFolding', label: 'Setup - 1 - Setel Folding', sort_order: 1 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/PuncholeSingle', label: 'Setup - 2 - Punchole (Single)', sort_order: 2 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/PuncholeDouble', label: 'Setup - 3 - Punchole (Double)', sort_order: 3 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/PasangKikirCross', label: 'Setup - 4 - Pasang / Kikir Cross', sort_order: 4 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/CrossTempelDieCut', label: 'Setup - 5 - Cross Tempel / Die Cut', sort_order: 5 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/Slitter', label: 'Setup - 6 - Slitter', sort_order: 6 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/SilinderCross', label: 'Setup - 7 - Silinder Cross', sort_order: 7 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/RakelSerokanDoctorBlade', label: 'Setup - 8 - Rakel + Serokan / Dr. Blade', sort_order: 8 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/CatridgeAnilox', label: 'Setup - 9 - Catridge / Anilox', sort_order: 9 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/PlatePolimerScreen', label: 'Setup - 10 - Plate / Polimer / Screen', sort_order: 10 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/WebbingTransportasi', label: 'Setup - 11 - Webbing / Transportasi', sort_order: 11 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/LetterPress', label: 'Setup - 12 - Letter Press', sort_order: 12 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/DeInk', label: 'Setup - 13 - De Ink', sort_order: 13 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/Blanket', label: 'Setup - 14 - Blanket', sort_order: 14 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/KaretHotSpot', label: 'Setup - 15 - Karet Hot Spot', sort_order: 15 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/SetelCetakan', label: 'Setup - 16 - Setel Cetakan', sort_order: 16 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/CuciTintaBak', label: 'Setup - 17 - Cuci Tinta + Bak', sort_order: 17 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/LemOtc', label: 'Setup - 18 - Lem OTC', sort_order: 18 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/CuciBlanket', label: 'Setup - 19 - Cuci Blanket', sort_order: 19 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/CuciSilinderImpression', label: 'Setup - 20 - Cuci Silinder Impression', sort_order: 20 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Setup/GantiKertasOtc', label: 'Setup - 21 - Ganti Kertas / OTC', sort_order: 21 },

    // TAIYO_EVENT_PALETTE - Idle
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B01BersihkanAnilox', label: 'Idle - B01 Bersihkan Anilox', sort_order: 1001 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B03BersihkanBakAir', label: 'Idle - B03 Bersihkan Bak Air', sort_order: 1002 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B04BersihkanBakTinta', label: 'Idle - B04 Bersihkan Bak Tinta', sort_order: 1003 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B05BersihkanBekasPunchhole', label: 'Idle - B05 Bersihkan Bekas Punchhole', sort_order: 1004 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B06BersihkanBlanket', label: 'Idle - B06 Bersihkan Blanket', sort_order: 1005 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B07BersihkanBlower', label: 'Idle - B07 Bersihkan Blower', sort_order: 1006 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B08BersihkanCorona', label: 'Idle - B08 Bersihkan Corona', sort_order: 1007 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B09BersihkanDampening', label: 'Idle - B09 Bersihkan Dampening', sort_order: 1008 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B13BersihkanNozzle', label: 'Idle - B13 Bersihkan Nozzle', sort_order: 1009 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B14BersihkanPlat', label: 'Idle - B14 Bersihkan Plat', sort_order: 1010 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B17BersihkanRolAir', label: 'Idle - B17 Bersihkan Rol Air', sort_order: 1011 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B18BersihkanRolTinta', label: 'Idle - B18 Bersihkan Rol Tinta', sort_order: 1012 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B19BersihkanRolTransfer', label: 'Idle - B19 Bersihkan Rol Transfer', sort_order: 1013 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B22BersihkanSilImpresion', label: 'Idle - B22 Bersihkan Sil Impresion', sort_order: 1014 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B23BersihkanSilLandasan', label: 'Idle - B23 Bersihkan Sil Landasan', sort_order: 1015 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B24BersihkanSilLetterpress', label: 'Idle - B24 Bersihkan Sil Letterpress', sort_order: 1016 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B28BersihkanScreen', label: 'Idle - B28 Bersihkan Screen', sort_order: 1017 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B32BersihkanRakel', label: 'Idle - B32 Bersihkan Rakel', sort_order: 1018 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G02GantiBlanket', label: 'Idle - G02 Ganti Blanket', sort_order: 1019 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G03GantiCartridge', label: 'Idle - G03 Ganti Cartridge', sort_order: 1020 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G04GantiDoctorBlade', label: 'Idle - G04 Ganti Doctor Blade', sort_order: 1021 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G06GantiHead', label: 'Idle - G06 Ganti Head', sort_order: 1022 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G08GantiImplant', label: 'Idle - G08 Ganti Implant', sort_order: 1023 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G09GantiInverter', label: 'Idle - G09 Ganti Inverter', sort_order: 1024 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G10GantiKaretFolding', label: 'Idle - G10 Ganti Karet Folding', sort_order: 1025 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G11GantiKaretHotspot', label: 'Idle - G11 Ganti Karet Hotspot', sort_order: 1026 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G12GantiKaretLetterpress', label: 'Idle - G12 Ganti Karet Letterpress', sort_order: 1027 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G14GantiLampuUv', label: 'Idle - G14 Ganti Lampu UV', sort_order: 1028 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G19GantiPisauTempel', label: 'Idle - G19 Ganti Pisau Tempel', sort_order: 1029 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G21GantiPunchHole', label: 'Idle - G21 Ganti Punch Hole', sort_order: 1030 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G22GantiRelay', label: 'Idle - G22 Ganti Relay', sort_order: 1031 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G23GantiRolAir', label: 'Idle - G23 Ganti Rol Air', sort_order: 1032 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G24GantiRumahWheel', label: 'Idle - G24 Ganti Rumah Wheel', sort_order: 1033 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G28GantiSkipNumerator', label: 'Idle - G28 Ganti Skip Numerator', sort_order: 1034 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G30GantiPolimer', label: 'Idle - G30 Ganti Polimer', sort_order: 1035 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G31GantiTractorFolding', label: 'Idle - G31 Ganti Tractor Folding', sort_order: 1036 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G33GantiScreen', label: 'Idle - G33 Ganti Screen', sort_order: 1037 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G34GantiRakelTaiyoOrtho', label: 'Idle - G34 Ganti Rakel (Taiyo/Ortho)', sort_order: 1038 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G35GantiSerokan', label: 'Idle - G35 Ganti Serokan', sort_order: 1039 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G36GantiTissueBlanket', label: 'Idle - G36 Ganti Tissue Blanket', sort_order: 1040 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/PS02PasangCrossTempel', label: 'Idle - PS02 Pasang Cross Tempel', sort_order: 1041 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/PS05PasangRolStainles', label: 'Idle - PS05 Pasang Rol Stainles', sort_order: 1042 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/PS06PasangSilPolimer', label: 'Idle - PS06 Pasang Sil Polimer', sort_order: 1043 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P01PerbaikanAirShaft', label: 'Idle - P01 Perbaikan Air Shaft', sort_order: 1044 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P02PerbaikanAnvil', label: 'Idle - P02 Perbaikan Anvil', sort_order: 1045 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P03PerbaikanBakAir', label: 'Idle - P03 Perbaikan Bak Air', sort_order: 1046 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P04PerbaikanBakTinta', label: 'Idle - P04 Perbaikan Bak Tinta', sort_order: 1047 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P05PerbaikanBearing', label: 'Idle - P05 Perbaikan Bearing', sort_order: 1048 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P06PerbaikanBlower', label: 'Idle - P06 Perbaikan Blower', sort_order: 1049 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P08PerbaikanCartridge', label: 'Idle - P08 Perbaikan Cartridge', sort_order: 1050 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P12PerbaikanCrossTempel', label: 'Idle - P12 Perbaikan Cross Tempel', sort_order: 1051 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P13PerbaikanCutsheet', label: 'Idle - P13 Perbaikan Cutsheet', sort_order: 1052 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P14PerbaikanDampening', label: 'Idle - P14 Perbaikan Dampening', sort_order: 1053 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P15PerbaikanDiesHole', label: 'Idle - P15 Perbaikan Dies Hole', sort_order: 1054 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P16PerbaikanElektrik', label: 'Idle - P16 Perbaikan Elektrik', sort_order: 1055 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P17PerbaikanFileHole', label: 'Idle - P17 Perbaikan File Hole', sort_order: 1056 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P19PerbaikanFolding', label: 'Idle - P19 Perbaikan Folding', sort_order: 1057 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P20PerbaikanGear', label: 'Idle - P20 Perbaikan Gear', sort_order: 1058 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P21PerbaikanGearBox', label: 'Idle - P21 Perbaikan Gear Box', sort_order: 1059 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P24PerbaikanKompresor', label: 'Idle - P24 Perbaikan Kompresor', sort_order: 1060 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P25PerbaikanKonveyor', label: 'Idle - P25 Perbaikan Konveyor', sort_order: 1061 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P26PerbaikanKopling', label: 'Idle - P26 Perbaikan Kopling', sort_order: 1062 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P27PerbaikanLampuUv', label: 'Idle - P27 Perbaikan Lampu UV', sort_order: 1063 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P29PerbaikanPemanas', label: 'Idle - P29 Perbaikan Pemanas', sort_order: 1064 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P30PerbaikanPengunciPlat', label: 'Idle - P30 Perbaikan Pengunci Plat', sort_order: 1065 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P31PerbaikanPowderBrake', label: 'Idle - P31 Perbaikan Powder Brake', sort_order: 1066 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P32PerbaikanPunchHole', label: 'Idle - P32 Perbaikan Punch Hole', sort_order: 1067 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P33PerbaikanRakelTaiyoOrtho', label: 'Idle - P33 Perbaikan Rakel (Taiyo/Ortho)', sort_order: 1068 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P34PerbaikanRegister', label: 'Idle - P34 Perbaikan Register', sort_order: 1069 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P35PerbaikanRewind', label: 'Idle - P35 Perbaikan Rewind', sort_order: 1070 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P36PerbaikanRolAir', label: 'Idle - P36 Perbaikan Rol Air', sort_order: 1071 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P38PerbaikanRolJejak', label: 'Idle - P38 Perbaikan Rol Jejak', sort_order: 1072 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P39PerbaikanRolJilat', label: 'Idle - P39 Perbaikan Rol Jilat', sort_order: 1073 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P40PerbaikanRolKaret', label: 'Idle - P40 Perbaikan Rol Karet', sort_order: 1074 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P41PerbaikanRolOsilator', label: 'Idle - P41 Perbaikan Rol Osilator', sort_order: 1075 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P42PerbaikanRolTarik', label: 'Idle - P42 Perbaikan Rol Tarik', sort_order: 1076 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P43PerbaikanRolTinta', label: 'Idle - P43 Perbaikan Rol Tinta', sort_order: 1077 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P44PerbaikanRolTransfer', label: 'Idle - P44 Perbaikan Rol Transfer', sort_order: 1078 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P46PerbaikanSensor', label: 'Idle - P46 Perbaikan Sensor', sort_order: 1079 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P47PerbaikanSilCross', label: 'Idle - P47 Perbaikan Sil Cross', sort_order: 1080 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P49PerbaikanSilImpression', label: 'Idle - P49 Perbaikan Sil Impression', sort_order: 1081 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P50PerbaikanSilLetterpress', label: 'Idle - P50 Perbaikan Sil Letterpress', sort_order: 1082 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P51PerbaikanSilinderAnilox', label: 'Idle - P51 Perbaikan Silinder Anilox', sort_order: 1083 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P52PerbaikanSlitter', label: 'Idle - P52 Perbaikan Slitter', sort_order: 1084 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P53PerbaikanTension', label: 'Idle - P53 Perbaikan Tension', sort_order: 1085 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P54PerbaikanTimingBelt', label: 'Idle - P54 Perbaikan Timing Belt', sort_order: 1086 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P55PerbaikanPolimer', label: 'Idle - P55 Perbaikan Polimer', sort_order: 1087 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P57PerbaikanTrafo', label: 'Idle - P57 Perbaikan Trafo', sort_order: 1088 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P58PerbaikanTurnbar', label: 'Idle - P58 Perbaikan Turnbar', sort_order: 1089 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P61PerbaikanWebGuide', label: 'Idle - P61 Perbaikan Web Guide', sort_order: 1090 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P62PerbaikanWheel', label: 'Idle - P62 Perbaikan Wheel', sort_order: 1091 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P63PerbaikanLampuIr', label: 'Idle - P63 Perbaikan Lampu IR', sort_order: 1092 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P64PerbaikanMesin', label: 'Idle - P64 Perbaikan Mesin', sort_order: 1093 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/PD01PindahCartridge', label: 'Idle - PD01 Pindah Cartridge', sort_order: 1094 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/PD02PindahTurnbar', label: 'Idle - PD02 Pindah Turnbar', sort_order: 1095 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S02SetelBeltConveyor', label: 'Idle - S02 Setel Belt Conveyor', sort_order: 1096 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S03SetelCartridge', label: 'Idle - S03 Setel Cartridge', sort_order: 1097 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S06SetelDeInk', label: 'Idle - S06 Setel De Ink', sort_order: 1098 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S07SetelFolding', label: 'Idle - S07 Setel Folding', sort_order: 1099 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S11SetelOtc', label: 'Idle - S11 Setel OTC', sort_order: 1100 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S12SetelPerforasi', label: 'Idle - S12 Setel Perforasi', sort_order: 1101 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S14SetelPosisiPisau', label: 'Idle - S14 Setel Posisi Pisau', sort_order: 1102 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S15SetelPunchHole', label: 'Idle - S15 Setel Punch Hole', sort_order: 1103 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S16SetelRakelOrtho', label: 'Idle - S16 Setel Rakel (Ortho)', sort_order: 1104 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S17SetelRegister', label: 'Idle - S17 Setel Register', sort_order: 1105 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S30SetelTimingMark', label: 'Idle - S30 Setel Timing Mark', sort_order: 1106 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S19SetelRolAir', label: 'Idle - S19 Setel Rol Air', sort_order: 1107 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S20SetelRolJejak', label: 'Idle - S20 Setel Rol Jejak', sort_order: 1108 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S21SetelRolJilat', label: 'Idle - S21 Setel Rol Jilat', sort_order: 1109 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S22SetelRolTinta', label: 'Idle - S22 Setel Rol Tinta', sort_order: 1110 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S23SetelSilImpression', label: 'Idle - S23 Setel Sil Impression', sort_order: 1111 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S24SetelSilLetterpress', label: 'Idle - S24 Setel Sil Letterpress', sort_order: 1112 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S26SetelSlitter', label: 'Idle - S26 Setel Slitter', sort_order: 1113 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S28SetelPolimer', label: 'Idle - S28 Setel Polimer', sort_order: 1114 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S29SetelTransportasiKertas', label: 'Idle - S29 Setel Transportasi Kertas', sort_order: 1115 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/TB01TambalBlanket', label: 'Idle - TB01 Tambal Blanket', sort_order: 1116 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/TB02TambalScreen', label: 'Idle - TB02 Tambal Screen', sort_order: 1117 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T01TungguBahanPembantu', label: 'Idle - T01 Tunggu Bahan Pembantu', sort_order: 1118 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T02TungguBlanketKering', label: 'Idle - T02 Tunggu Blanket Kering', sort_order: 1119 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T03TungguCartridge', label: 'Idle - T03 Tunggu Cartridge', sort_order: 1120 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T04TungguDataProgram', label: 'Idle - T04 Tunggu Data/Program', sort_order: 1121 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T05TungguFilm', label: 'Idle - T05 Tunggu Film', sort_order: 1122 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T07TungguJob', label: 'Idle - T07 Tunggu Job', sort_order: 1123 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T08TungguKertas', label: 'Idle - T08 Tunggu Kertas', sort_order: 1124 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T09TungguLoadingScitex', label: 'Idle - T09 Tunggu Loading Scitex', sort_order: 1125 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T10TungguMesinDomino', label: 'Idle - T10 Tunggu Mesin Domino', sort_order: 1126 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T13TungguPlat', label: 'Idle - T13 Tunggu Plat', sort_order: 1127 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T14TungguPolimer', label: 'Idle - T14 Tunggu Polimer', sort_order: 1128 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T15TungguRolUlang', label: 'Idle - T15 Tunggu Rol Ulang', sort_order: 1129 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T17TungguTinta', label: 'Idle - T17 Tunggu Tinta', sort_order: 1130 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T18TungguScreen', label: 'Idle - T18 Tunggu Screen', sort_order: 1131 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T20TungguLampuUvNyala', label: 'Idle - T20 Tunggu Lampu UV Nyala', sort_order: 1132 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/T21TungguHasilScreen', label: 'Idle - T21 Tunggu Hasil Screen', sort_order: 1133 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/M02KualitasMaterialBermasalah', label: 'Idle - M02 (Kualitas) Material Bermasalah', sort_order: 1134 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B12BersihkanNumerator', label: 'Idle - B12 Bersihkan Numerator', sort_order: 1135 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/B16BersihkanPrintHead', label: 'Idle - B16 Bersihkan Print Head', sort_order: 1136 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/G16GantiNumerator', label: 'Idle - G16 Ganti Numerator', sort_order: 1137 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/K06KomputerProgramError', label: 'Idle - K06 Komputer / Program Error', sort_order: 1138 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P07PerbaikanCamNumerator', label: 'Idle - P07 Perbaikan Cam Numerator', sort_order: 1139 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P28PerbaikanNumeratorScitexDomino', label: 'Idle - P28 Perbaikan Numerator (Scitex/Domino)', sort_order: 1140 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/P45PerbaikanPrintHead', label: 'Idle - P45 Perbaikan Print Head', sort_order: 1141 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/S10SetelNumerator', label: 'Idle - S10 Setel Numerator', sort_order: 1142 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/TP01TestPrintCobaProgram', label: 'Idle - TP01 Test Print / Coba Program', sort_order: 1143 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/TP02TestQc', label: 'Idle - TP02 Test QC', sort_order: 1144 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/L01ListrikPadam', label: 'Idle - L01 Listrik Padam', sort_order: 1145 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/K01KertasBerdebu', label: 'Idle - K01 Kertas Berdebu', sort_order: 1146 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/K02KertasKendorSebelah', label: 'Idle - K02 Kertas Kendor Sebelah', sort_order: 1147 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/K04KertasPutus', label: 'Idle - K04 Kertas Putus', sort_order: 1148 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/K05KertasTercabut', label: 'Idle - K05 Kertas Tercabut', sort_order: 1149 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/KF01KonfirmasiJob', label: 'Idle - KF01 Konfirmasi Job', sort_order: 1150 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/KF02KonfirmasiPolimer', label: 'Idle - KF02 Konfirmasi Polimer', sort_order: 1151 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/KF03KonfirmasiSetting', label: 'Idle - KF03 Konfirmasi Setting', sort_order: 1152 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/KF04KonfirmasiWarna', label: 'Idle - KF04 Konfirmasi Warna', sort_order: 1153 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Idle/O01OliPumpMatiBocor', label: 'Idle - O01 Oli Pump Mati/Bocor', sort_order: 1154 },
    { lookup_type: 'TAIYO_EVENT_PALETTE', code: 'Production/Run', label: 'Production - Mulai Produksi', sort_order: 0 },
  ];

  const lookups = [
    // ACCOUNT_LIFECYCLE
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'CREATED', label: 'Created', sort_order: 1 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'ACTIVE', label: 'Active', sort_order: 2 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'DISABLED', label: 'Disabled', sort_order: 3 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'EXPIRED', label: 'Expired', sort_order: 4 },
    { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'DELETED', label: 'Deleted', sort_order: 5 },
    // ACCOUNT_TYPE
    { lookup_type: 'ACCOUNT_TYPE', code: 'PERMANENT', label: 'Permanent', sort_order: 1 },
    { lookup_type: 'ACCOUNT_TYPE', code: 'WITH_EXPIRATION', label: 'With Expiration', sort_order: 2 },
    // ACCOUNT_ROLE
    { lookup_type: 'ACCOUNT_ROLE', code: 'OPERATOR', label: 'Operator', sort_order: 1 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'ADMINISTRATOR', label: 'Administrator', sort_order: 2 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'PPIC', label: 'PPIC', sort_order: 3 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'MAINTENANCE', label: 'Maintenance', sort_order: 4 },
    { lookup_type: 'ACCOUNT_ROLE', code: 'MAINTENANCE_ADMINISTRATOR', label: 'Maintenance Administrator', sort_order: 5 },
    // JOB_PRIORITY
    { lookup_type: 'JOB_PRIORITY', code: 'HIGH', label: 'High', sort_order: 1 },
    { lookup_type: 'JOB_PRIORITY', code: 'MEDIUM', label: 'Medium', sort_order: 2 },
    { lookup_type: 'JOB_PRIORITY', code: 'LOW', label: 'Low', sort_order: 3 },
    // JOB_LIFECYCLE_STATE
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'SCHEDULED', label: 'Scheduled', sort_order: 1 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'RELEASED', label: 'Released', sort_order: 2 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'RUNNING', label: 'Running', sort_order: 3 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'SUSPENDED', label: 'Suspended', sort_order: 4 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'COMPLETED', label: 'Completed', sort_order: 5 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'CANCELLED', label: 'Cancelled', sort_order: 6 },
    { lookup_type: 'JOB_LIFECYCLE_STATE', code: 'CLOSED', label: 'Closed', sort_order: 7 },
    // QUANTITY_UNIT
    { lookup_type: 'QUANTITY_UNIT', code: 'BK', label: 'BK', sort_order: 1 },
    { lookup_type: 'QUANTITY_UNIT', code: 'EA', label: 'EA', sort_order: 2 },
    // WORK_CENTER
    { lookup_type: 'WORK_CENTER', code: 'Jasuindo.OffsetPrinter.Taiyo1', label: 'Offset Printer Taiyo 1', sort_order: 1 },
    { lookup_type: 'WORK_CENTER', code: 'Jasuindo.OffsetPrinter.Taiyo2', label: 'Offset Printer Taiyo 2', sort_order: 2 },
    ...taiyoEventPaletteLookups,
  ];

  for (const l of lookups) {
    try {
      await prisma.lookup.upsert({
        where: { lookup_type_code: { lookup_type: l.lookup_type, code: l.code } },
        update: l,
        create: l,
      });
      console.log(`Upserted lookup ${l.lookup_type}:${l.code}`);
    } catch (err) {
      // If client doesn't generate a composite unique input name, fall back to try/catch create
      try {
        await prisma.lookup.create({ data: l });
        console.log(`Created lookup ${l.lookup_type}:${l.code}`);
      } catch (e) {
        console.error('Failed to create/upsert lookup', l, e);
      }
    }
  }

  // Seed accounts
  const lifecycleCreated = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_LIFECYCLE', code: 'CREATED' },
  });
  const typePermanent = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_TYPE', code: 'PERMANENT' },
  });
  const roleAdmin = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_ROLE', code: 'ADMINISTRATOR' },
  });
  const roleOperator = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_ROLE', code: 'OPERATOR' },
  });
  const rolePpic = await prisma.lookup.findFirst({
    where: { lookup_type: 'ACCOUNT_ROLE', code: 'PPIC' },
  });

  if (!lifecycleCreated || !typePermanent) {
    throw new Error('Required lookup seeds missing for account seeding');
  }

  const initialPassword = 'Qwerty12345!';
  const hashed = await bcrypt.hash(initialPassword, 12);

  const accountSeeds = [
    {
      username: 'alice2',
      full_name: 'Alice Operator',
      email: 'alice2@example.com',
      phone_number: null,
      account_type: typePermanent.id,
      account_role: roleOperator?.id ?? null,
      account_expiry_date: null,
      initial_password: initialPassword,
    },
    {
      username: 'alice22',
      full_name: 'Alice Admin',
      email: 'alice22@example.com',
      phone_number: null,
      account_type: typePermanent.id,
      account_role: roleAdmin?.id ?? null,
      account_expiry_date: null,
      initial_password: initialPassword,
    },
    {
      username: 'john',
      full_name: 'John PPIC',
      email: 'john@example.com',
      phone_number: null,
      account_type: typePermanent.id,
      account_role: rolePpic?.id ?? null,
      account_expiry_date: null,
      initial_password: initialPassword,
    },
  ];

  for (const acc of accountSeeds) {
    const saved = await prisma.account.upsert({
      where: { username: acc.username },
      create: {
        username: acc.username,
        password: hashed,
        full_name: acc.full_name,
        email: acc.email,
        phone_number: acc.phone_number,
        account_type: acc.account_type,
        account_role: acc.account_role,
        account_expiry_date: acc.account_expiry_date,
        account_lifecycle: lifecycleCreated.id,
        must_change_password: true,
        password_last_changed: null,
      },
      update: {
        password: hashed,
        full_name: acc.full_name,
        email: acc.email,
        phone_number: acc.phone_number,
        account_type: acc.account_type,
        account_role: acc.account_role,
        account_expiry_date: acc.account_expiry_date,
      },
    });
    console.log(`Upserted account ${saved.username} with password: ${acc.initial_password}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
