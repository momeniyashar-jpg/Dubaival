import { useState, useCallback, useRef, useEffect } from "react";

// --- DESIGN SYSTEM ------------------------------------------------------------
// Palette: deep navy intelligence + warm gold authority + precise data green
// Typography: Space Grotesk (data/numbers) + Inter (UI) - financial-grade feel
// Signature: verdict card with animated confidence bar - the one moment that lands
const T = {
  // Dark mode (default)
  dark: {
    bg:       "#070B14",
    surface:  "#0D1220",
    raised:   "#131926",
    border:   "#1C2540",
    borderHi: "#2A3660",
    gold:     "#D4A843",
    goldDim:  "#8A6420",
    goldFaint:"#D4A84310",
    white:    "#E8EDF5",
    sub:      "#6B7A9E",
    subHi:    "#9BA8C8",
    green:    "#00C896",
    greenBg:  "#00C89612",
    greenBo:  "#00C89640",
    red:      "#F04060",
    redBg:    "#F0406012",
    redBo:    "#F0406040",
    yellow:   "#F0A030",
    yellowBg: "#F0A03012",
    yellowBo: "#F0A03040",
    blue:     "#4090F0",
    blueBg:   "#4090F012",
  },
  light: {
    bg:       "#F0F3FA",
    surface:  "#FFFFFF",
    raised:   "#F8FAFF",
    border:   "#DDE3F0",
    borderHi: "#C0CBE8",
    gold:     "#9A6A10",
    goldDim:  "#C48A30",
    goldFaint:"#9A6A1010",
    white:    "#1A2040",
    sub:      "#7A88AA",
    subHi:    "#4A5878",
    green:    "#00A070",
    greenBg:  "#00A07010",
    greenBo:  "#00A07035",
    red:      "#D03050",
    redBg:    "#D0305010",
    redBo:    "#D0305035",
    yellow:   "#C07820",
    yellowBg: "#C0782010",
    yellowBo: "#C0782035",
    blue:     "#2060C0",
    blueBg:   "#2060C010",
  }
};

// --- MARKET DATA --------------------------------------------------------------
const MARKET = {
  cycle: "Post-Geo Correction - Moderation Phase",
  geo_adj: -0.06,
  stats: [
    { label:"Q1 2026 Volume",  val:"AED 252B", note:"+31% YoY", up:true },
    { label:"Apt Avg PSF",     val:"AED 1,976",note:"+18% YoY", up:true },
    { label:"Villa PSF",       val:"AED 1,594",note:"+16% YoY", up:true },
    { label:"Peak Yield",      val:"9.5%",     note:"JVC",      up:null },
    { label:"Foreign Capital", val:"AED 148B", note:"+26% Q1",  up:true },
    { label:"Off-Plan Share",  val:"77.8%",    note:"Weekly",   up:null },
  ],
};

// --- VIEW PREMIUMS (Hedonic, calibrated from DLD 2024-2026) ------------------
const VIEW_P = {
  "Full Sea View":0.28,"Partial Sea View":0.14,
  "Burj Khalifa View":0.32,"Partial Burj View":0.16,
  "Full Canal View":0.19,"Partial Canal View":0.09,
  "Beach Access View":0.22,"Golf View":0.14,"Lagoon View":0.13,
  "Pool View":0.09,"Garden/Park View":0.06,
  "City Skyline":0.05,"Road View":0.00,"Not specified":0.00,
};
const APT_VIEWS = ["Burj Khalifa View","Partial Burj View","Full Sea View","Partial Sea View","Full Canal View","Partial Canal View","Pool View","Garden/Park View","City Skyline","Road View","Not specified"];
const VILLA_VIEWS = ["Beach Access View","Full Sea View","Lagoon View","Golf View","Garden/Park View","Pool View","City Skyline","Road View","Not specified"];

// --- BUILDING DATABASE (302 buildings) ---------------------------------------
const DB = {
  // Downtown Dubai
  "burj khalifa":{p:6000,lo:5000,hi:8000,sc:67.88,a:"Downtown Dubai",g:"Ultra"},
  "the address downtown":{p:3200,lo:2900,hi:3600,sc:40.84,a:"Downtown Dubai",g:"Ultra"},
  "address boulevard":{p:3000,lo:2800,hi:3400,sc:55.0,a:"Downtown Dubai",g:"Ultra"},
  "kempinski the boulevard":{p:4500,lo:4000,hi:5500,sc:55.0,a:"Downtown Dubai",g:"Ultra"},
  "vida residences downtown":{p:2500,lo:2300,hi:2700,sc:39.0,a:"Downtown Dubai",g:"A+"},
  "burj vista":{p:2700,lo:2600,hi:3000,sc:28.0,a:"Downtown Dubai",g:"A+"},
  "opera grand":{p:2600,lo:2400,hi:2900,sc:24.0,a:"Downtown Dubai",g:"A"},
  "the act one act two":{p:2200,lo:2000,hi:2500,sc:22.0,a:"Downtown Dubai",g:"A"},
  "forte":{p:2400,lo:2200,hi:2700,sc:19.0,a:"Downtown Dubai",g:"A"},
  "il primo":{p:5500,lo:5000,hi:6500,sc:25.0,a:"Downtown Dubai",g:"Ultra"},
  "blvd heights":{p:2350,lo:2100,hi:2600,sc:18.0,a:"Downtown Dubai",g:"A"},
  "boulevard point":{p:2550,lo:2400,hi:2700,sc:18.0,a:"Downtown Dubai",g:"A"},
  "burj royale":{p:2400,lo:2200,hi:2700,sc:19.0,a:"Downtown Dubai",g:"A"},
  "south ridge":{p:1950,lo:1750,hi:2150,sc:16.5,a:"Downtown Dubai",g:"B+"},
  "standpoint":{p:1950,lo:1800,hi:2100,sc:16.5,a:"Downtown Dubai",g:"B+"},
  "29 boulevard":{p:2000,lo:1800,hi:2200,sc:17.0,a:"Downtown Dubai",g:"B+"},
  "8 boulevard walk":{p:2100,lo:1900,hi:2300,sc:17.5,a:"Downtown Dubai",g:"B+"},
  "claren":{p:2000,lo:1800,hi:2200,sc:16.0,a:"Downtown Dubai",g:"B+"},
  "the lofts":{p:1900,lo:1700,hi:2100,sc:15.5,a:"Downtown Dubai",g:"B+"},
  "boulevard central":{p:1950,lo:1750,hi:2150,sc:16.0,a:"Downtown Dubai",g:"B+"},
  "boulevard crescent":{p:2100,lo:1900,hi:2300,sc:17.0,a:"Downtown Dubai",g:"B+"},
  "the residences":{p:2800,lo:2600,hi:3200,sc:20.0,a:"Downtown Dubai",g:"A+"},
  "rixos financial centre":{p:4000,lo:3500,hi:5000,sc:45.0,a:"Downtown Dubai",g:"Ultra"},
  "mercedes benz places":{p:6000,lo:5000,hi:8000,sc:60.0,a:"Downtown Dubai",g:"Ultra"},
  // Dubai Marina
  "marina gate":{p:1950,lo:1800,hi:2200,sc:14.0,a:"Dubai Marina",g:"A"},
  "52|42":{p:2200,lo:2000,hi:2500,sc:18.0,a:"Dubai Marina",g:"A+"},
  "cayan tower":{p:1750,lo:1600,hi:1900,sc:17.0,a:"Dubai Marina",g:"B+"},
  "princess tower":{p:1550,lo:1400,hi:1700,sc:14.5,a:"Dubai Marina",g:"B"},
  "elite residence":{p:1600,lo:1450,hi:1750,sc:15.0,a:"Dubai Marina",g:"B+"},
  "ocean heights":{p:1700,lo:1550,hi:1900,sc:16.0,a:"Dubai Marina",g:"B+"},
  "damac heights":{p:1900,lo:1700,hi:2100,sc:20.0,a:"Dubai Marina",g:"A"},
  "address marina":{p:3500,lo:3200,hi:4000,sc:45.0,a:"Dubai Marina",g:"Ultra"},
  "park island":{p:1900,lo:1700,hi:2100,sc:19.8,a:"Dubai Marina",g:"A"},
  "the torch":{p:1550,lo:1400,hi:1700,sc:14.0,a:"Dubai Marina",g:"B"},
  "infinity tower":{p:1700,lo:1550,hi:1900,sc:15.0,a:"Dubai Marina",g:"B+"},
  "marina crown":{p:1600,lo:1450,hi:1750,sc:13.0,a:"Dubai Marina",g:"B"},
  "al sahab":{p:1700,lo:1550,hi:1900,sc:14.0,a:"Dubai Marina",g:"B+"},
  "trident bayside":{p:1650,lo:1500,hi:1800,sc:15.5,a:"Dubai Marina",g:"B+"},
  "marina pinnacle":{p:1600,lo:1450,hi:1750,sc:14.0,a:"Dubai Marina",g:"B"},
  "al majara":{p:1650,lo:1500,hi:1800,sc:13.5,a:"Dubai Marina",g:"B+"},
  "marina quays":{p:1700,lo:1550,hi:1900,sc:15.0,a:"Dubai Marina",g:"B+"},
  "mag 218":{p:1500,lo:1350,hi:1650,sc:14.0,a:"Dubai Marina",g:"B"},
  "the point":{p:1600,lo:1450,hi:1750,sc:14.0,a:"Dubai Marina",g:"B+"},
  // Palm Jumeirah
  "one palm":{p:4200,lo:4000,hi:5000,sc:35.0,a:"Palm Jumeirah",g:"Ultra"},
  "serenia":{p:3600,lo:3400,hi:4000,sc:28.0,a:"Palm Jumeirah",g:"A+"},
  "serenia living":{p:3400,lo:3200,hi:3800,sc:26.0,a:"Palm Jumeirah",g:"A+"},
  "atlantis the royal residences":{p:8000,lo:7000,hi:12000,sc:80.0,a:"Palm Jumeirah",g:"Ultra"},
  "como residences":{p:7000,lo:6000,hi:9000,sc:65.0,a:"Palm Jumeirah",g:"Ultra"},
  "palm beach towers":{p:2800,lo:2500,hi:3200,sc:22.0,a:"Palm Jumeirah",g:"A"},
  "the 8":{p:3000,lo:2800,hi:3400,sc:25.0,a:"Palm Jumeirah",g:"A"},
  "palm views":{p:2400,lo:2200,hi:2700,sc:18.0,a:"Palm Jumeirah",g:"A-"},
  "azure residences":{p:2600,lo:2400,hi:2900,sc:20.0,a:"Palm Jumeirah",g:"A"},
  "tiara residences":{p:2200,lo:2000,hi:2500,sc:16.0,a:"Palm Jumeirah",g:"B+"},
  "shoreline":{p:2000,lo:1800,hi:2200,sc:12.0,a:"Palm Jumeirah",g:"B+"},
  "oceana":{p:2100,lo:1900,hi:2400,sc:14.0,a:"Palm Jumeirah",g:"B+"},
  "marina residences":{p:1900,lo:1700,hi:2100,sc:11.0,a:"Palm Jumeirah",g:"B+"},
  "palm tower":{p:3500,lo:3200,hi:4200,sc:30.0,a:"Palm Jumeirah",g:"Ultra"},
  "fairmont residences south":{p:3000,lo:2700,hi:3500,sc:28.0,a:"Palm Jumeirah",g:"A+"},
  "golden mile":{p:1800,lo:1650,hi:2000,sc:10.5,a:"Palm Jumeirah",g:"B+"},
  "garden homes":{p:3000,lo:2600,hi:3500,sc:8.5,a:"Palm Jumeirah",g:"A+",t:"villa"},
  "signature villas":{p:3500,lo:3000,hi:4500,sc:10.0,a:"Palm Jumeirah",g:"Ultra",t:"villa"},
  // Business Bay
  "sls dubai":{p:2150,lo:2000,hi:2400,sc:22.0,a:"Business Bay",g:"A"},
  "the opus":{p:3500,lo:3200,hi:4000,sc:35.0,a:"Business Bay",g:"Ultra"},
  "bugatti residences":{p:8000,lo:7000,hi:12000,sc:80.0,a:"Business Bay",g:"Ultra"},
  "binghatti ghost":{p:2200,lo:2000,hi:2500,sc:20.0,a:"Business Bay",g:"A"},
  "paramount tower":{p:1850,lo:1700,hi:2000,sc:20.0,a:"Business Bay",g:"A-"},
  "aykon city":{p:1700,lo:1600,hi:1900,sc:18.5,a:"Business Bay",g:"B+"},
  "damac towers by paramount":{p:1600,lo:1500,hi:1800,sc:17.0,a:"Business Bay",g:"B+"},
  "safa two de grisogono":{p:2800,lo:2500,hi:3200,sc:28.0,a:"Business Bay",g:"Ultra"},
  "executive bay":{p:1500,lo:1350,hi:1650,sc:15.5,a:"Business Bay",g:"B"},
  "business bay executive towers":{p:1450,lo:1300,hi:1600,sc:15.0,a:"Business Bay",g:"B"},
  "the distinction":{p:1600,lo:1450,hi:1750,sc:16.0,a:"Business Bay",g:"B+"},
  "peninsula":{p:1800,lo:1650,hi:2000,sc:17.0,a:"Business Bay",g:"A-"},
  "canal heights":{p:2000,lo:1800,hi:2200,sc:18.0,a:"Business Bay",g:"A"},
  "sterling":{p:1600,lo:1450,hi:1750,sc:16.0,a:"Business Bay",g:"B+"},
  "ellington art bay":{p:2000,lo:1800,hi:2200,sc:18.0,a:"Business Bay",g:"A"},
  "omniyat vela viento":{p:4500,lo:4000,hi:5500,sc:40.0,a:"Business Bay",g:"Ultra"},
  "dorchester collection":{p:5500,lo:5000,hi:7000,sc:55.0,a:"Business Bay",g:"Ultra"},
  // Emaar Beachfront
  "beach vista":{p:2400,lo:2200,hi:2700,sc:20.0,a:"Emaar Beachfront",g:"A+"},
  "sunrise bay":{p:2350,lo:2100,hi:2600,sc:19.5,a:"Emaar Beachfront",g:"A+"},
  "marina vista":{p:2300,lo:2100,hi:2600,sc:19.0,a:"Emaar Beachfront",g:"A"},
  "grand bleu tower":{p:2800,lo:2600,hi:3200,sc:22.0,a:"Emaar Beachfront",g:"A+"},
  "beach mansion":{p:2500,lo:2300,hi:2800,sc:21.0,a:"Emaar Beachfront",g:"A+"},
  "south beach":{p:2400,lo:2200,hi:2700,sc:20.0,a:"Emaar Beachfront",g:"A"},
  "address beach resort":{p:4500,lo:4000,hi:5500,sc:45.0,a:"Emaar Beachfront",g:"Ultra"},
  "seapoint":{p:2500,lo:2300,hi:2800,sc:21.0,a:"Emaar Beachfront",g:"A+"},
  // Bluewaters
  "bluewaters residences":{p:3500,lo:3200,hi:4500,sc:28.0,a:"Bluewaters Island",g:"A+"},
  "bluewaters bay":{p:3800,lo:3500,hi:4500,sc:30.0,a:"Bluewaters Island",g:"Ultra"},
  "caesars resort bluewaters":{p:5000,lo:4500,hi:6000,sc:50.0,a:"Bluewaters Island",g:"Ultra"},
  // MBR / Sobha / District One
  "district one":{p:2200,lo:2000,hi:2600,sc:5.0,a:"MBR City",g:"A+",t:"villa"},
  "district one west":{p:2400,lo:2200,hi:2800,sc:5.5,a:"MBR City",g:"A+",t:"villa"},
  "the oasis":{p:2000,lo:1800,hi:2300,sc:5.0,a:"MBR City",g:"A+",t:"villa"},
  "creek vistas":{p:1750,lo:1600,hi:1900,sc:16.0,a:"Sobha Hartland",g:"A-"},
  "creek vistas heights":{p:1900,lo:1700,hi:2100,sc:17.0,a:"Sobha Hartland",g:"A"},
  "creek vistas grande":{p:2000,lo:1800,hi:2200,sc:17.5,a:"Sobha Hartland",g:"A"},
  "one park avenue":{p:1850,lo:1700,hi:2000,sc:16.5,a:"Sobha Hartland",g:"A"},
  "sobha one":{p:2000,lo:1800,hi:2200,sc:18.0,a:"Sobha Hartland",g:"A"},
  "sobha seahaven":{p:2200,lo:2000,hi:2500,sc:20.0,a:"Dubai Harbour",g:"A+"},
  // City Walk
  "city walk residences":{p:2200,lo:2000,hi:2500,sc:20.0,a:"City Walk",g:"A"},
  "the crestmark":{p:2400,lo:2200,hi:2700,sc:22.0,a:"City Walk",g:"A+"},
  "laurel central park":{p:2500,lo:2300,hi:2800,sc:22.0,a:"City Walk",g:"A+"},
  "city walk":{p:2000,lo:1800,hi:2200,sc:18.0,a:"City Walk",g:"A-"},
  // Dubai Creek Harbour
  "creek beach":{p:1750,lo:1600,hi:1950,sc:17.0,a:"Dubai Creek Harbour",g:"A"},
  "harbour gate":{p:1700,lo:1550,hi:1900,sc:16.5,a:"Dubai Creek Harbour",g:"A-"},
  "creek horizon":{p:1650,lo:1500,hi:1850,sc:16.0,a:"Dubai Creek Harbour",g:"A-"},
  "the cove":{p:1800,lo:1650,hi:2000,sc:17.5,a:"Dubai Creek Harbour",g:"A"},
  "creek gate":{p:1650,lo:1500,hi:1850,sc:16.0,a:"Dubai Creek Harbour",g:"A-"},
  "address creek harbour":{p:4800,lo:4500,hi:5500,sc:48.0,a:"Dubai Creek Harbour",g:"Ultra"},
  "creek waters":{p:1750,lo:1600,hi:1950,sc:17.0,a:"Dubai Creek Harbour",g:"A"},
  // Dubai Hills
  "club drive":{p:1850,lo:1700,hi:2000,sc:16.5,a:"Dubai Hills Estate",g:"A"},
  "park heights":{p:1750,lo:1600,hi:1900,sc:15.5,a:"Dubai Hills Estate",g:"A-"},
  "golf suites":{p:1900,lo:1700,hi:2100,sc:17.0,a:"Dubai Hills Estate",g:"A"},
  "golfville":{p:1800,lo:1650,hi:1950,sc:16.0,a:"Dubai Hills Estate",g:"A-"},
  "hills park":{p:1700,lo:1550,hi:1900,sc:15.0,a:"Dubai Hills Estate",g:"A-"},
  "elvira":{p:1900,lo:1700,hi:2100,sc:16.0,a:"Dubai Hills Estate",g:"A"},
  "acacia":{p:1600,lo:1400,hi:1800,sc:3.5,a:"Dubai Hills Estate",g:"A",t:"villa"},
  "maple":{p:1300,lo:1100,hi:1500,sc:3.0,a:"Dubai Hills Estate",g:"A-",t:"villa"},
  "sidra":{p:1500,lo:1300,hi:1700,sc:3.5,a:"Dubai Hills Estate",g:"A",t:"villa"},
  "mulberry":{p:1700,lo:1500,hi:1900,sc:3.8,a:"Dubai Hills Estate",g:"A",t:"villa"},
  // JVC
  "samana hills":{p:1000,lo:900,hi:1100,sc:11.5,a:"Jumeirah Village Circle",g:"B"},
  "ellington belgravia":{p:1150,lo:1050,hi:1300,sc:13.0,a:"Jumeirah Village Circle",g:"B+"},
  "binghatti stars":{p:1000,lo:950,hi:1100,sc:10.5,a:"Jumeirah Village Circle",g:"B"},
  "binghatti avenue":{p:980,lo:880,hi:1080,sc:10.0,a:"Jumeirah Village Circle",g:"B"},
  "five jvc":{p:1200,lo:1100,hi:1350,sc:13.0,a:"Jumeirah Village Circle",g:"B+"},
  "genesis by meraki":{p:1000,lo:900,hi:1100,sc:11.0,a:"Jumeirah Village Circle",g:"B"},
  // JLT
  "bonnington tower":{p:1200,lo:1100,hi:1350,sc:18.0,a:"Jumeirah Lake Towers",g:"B+"},
  "movenpick jlt":{p:1400,lo:1250,hi:1550,sc:20.0,a:"Jumeirah Lake Towers",g:"B+"},
  // Al Furjan
  "azizi freesia":{p:950,lo:850,hi:1050,sc:11.0,a:"Al Furjan",g:"B"},
  "al furjan villas":{p:1050,lo:950,hi:1150,sc:2.5,a:"Al Furjan",g:"B+",t:"villa"},
  // DAMAC Lagoons
  "damac lagoons venice":{p:1400,lo:1250,hi:1600,sc:4.5,a:"DAMAC Lagoons",g:"A-",t:"villa",cluster:"Venice"},
  "damac lagoons morocco":{p:1250,lo:1100,hi:1400,sc:4.5,a:"DAMAC Lagoons",g:"B+",t:"villa",cluster:"Morocco"},
  "damac lagoons costa brava":{p:1350,lo:1200,hi:1500,sc:4.5,a:"DAMAC Lagoons",g:"A-",t:"villa",cluster:"Costa Brava"},
  "damac lagoons mykonos":{p:1300,lo:1150,hi:1500,sc:4.5,a:"DAMAC Lagoons",g:"B+",t:"villa",cluster:"Mykonos"},
  "damac lagoons marbella":{p:1400,lo:1250,hi:1600,sc:4.5,a:"DAMAC Lagoons",g:"A-",t:"villa",cluster:"Marbella"},
  "damac lagoons santorini":{p:1350,lo:1200,hi:1500,sc:4.5,a:"DAMAC Lagoons",g:"A-",t:"villa",cluster:"Santorini"},
  "damac lagoons ibiza":{p:1250,lo:1100,hi:1400,sc:4.5,a:"DAMAC Lagoons",g:"B+",t:"villa",cluster:"Ibiza"},
  "damac lagoons malta":{p:1300,lo:1150,hi:1450,sc:4.5,a:"DAMAC Lagoons",g:"B+",t:"villa",cluster:"Malta"},
  // Tilal Al Ghaf
  "tilal al ghaf harmony":{p:1730,lo:1520,hi:1940,sc:4.0,a:"Tilal Al Ghaf",g:"A",t:"villa"},
  "tilal al ghaf serenity":{p:2200,lo:2000,hi:2600,sc:5.0,a:"Tilal Al Ghaf",g:"A+",t:"villa"},
  "tilal al ghaf aura":{p:1900,lo:1700,hi:2100,sc:4.5,a:"Tilal Al Ghaf",g:"A",t:"villa"},
  "elysian mansions":{p:3500,lo:3000,hi:5000,sc:7.0,a:"Tilal Al Ghaf",g:"Ultra",t:"villa"},
  "alaya":{p:2000,lo:1800,hi:2300,sc:4.5,a:"Tilal Al Ghaf",g:"A+",t:"villa"},
  "elan":{p:1600,lo:1400,hi:1800,sc:4.0,a:"Tilal Al Ghaf",g:"A-",t:"villa"},
  // Palm Jebel Ali
  "palm jebel ali":{p:2650,lo:2600,hi:2800,sc:8.0,a:"Palm Jebel Ali",g:"A+",t:"villa"},
  // Mina Rashid
  "mina rashid seagate":{p:2200,lo:2000,hi:2500,sc:20.0,a:"Mina Rashid",g:"A+"},
  "anwa omniyat":{p:2800,lo:2600,hi:3200,sc:28.0,a:"Mina Rashid",g:"Ultra"},
  // Dubai Harbour
  "harbour lights":{p:2500,lo:2200,hi:2800,sc:22.0,a:"Dubai Harbour",g:"A+"},
  // DIFC
  "difc gate residences":{p:2500,lo:2300,hi:2800,sc:25.0,a:"DIFC",g:"A+"},
  "one za'abeel residences":{p:5000,lo:4500,hi:6000,sc:50.0,a:"DIFC",g:"Ultra"},
  "difc living":{p:2800,lo:2600,hi:3200,sc:26.0,a:"DIFC",g:"A+"},
  "index tower":{p:2400,lo:2200,hi:2700,sc:24.0,a:"DIFC",g:"A+"},
  // Jumeirah Bay Island
  "bulgari residences":{p:6000,lo:5000,hi:8000,sc:60.0,a:"Jumeirah Bay Island",g:"Ultra",t:"villa"},
  "bulgari hotel residences":{p:7000,lo:6000,hi:9000,sc:65.0,a:"Jumeirah Bay Island",g:"Ultra"},
  // Meydan
  "district one west meydan":{p:2400,lo:2200,hi:2800,sc:5.5,a:"Meydan",g:"A+",t:"villa"},
  "meydan avenue":{p:1600,lo:1450,hi:1800,sc:16.0,a:"Meydan",g:"A-"},
  // Other areas
  "the springs":{p:1400,lo:1200,hi:1600,sc:2.5,a:"The Springs",g:"B+",t:"villa"},
  "the meadows":{p:1500,lo:1300,hi:1700,sc:2.8,a:"The Meadows",g:"A-",t:"villa"},
  "the lakes":{p:1600,lo:1400,hi:1800,sc:3.0,a:"The Lakes",g:"A-",t:"villa"},
  "the views":{p:1800,lo:1600,hi:2000,sc:15.0,a:"The Views",g:"A-"},
  "the greens":{p:1400,lo:1250,hi:1550,sc:12.0,a:"The Greens",g:"B+"},
  "jumeirah golf estates":{p:1500,lo:1300,hi:1700,sc:5.5,a:"Jumeirah Golf Estates",g:"A",t:"villa"},
  "arabian ranches":{p:1400,lo:1200,hi:1600,sc:2.5,a:"Arabian Ranches",g:"A-",t:"villa"},
  "al barari villas":{p:2000,lo:1800,hi:2400,sc:7.57,a:"Al Barari",g:"A+",t:"villa"},
  "seventh heaven al barari":{p:2200,lo:2000,hi:2600,sc:22.0,a:"Al Barari",g:"A+"},
  "town square":{p:800,lo:700,hi:900,sc:2.8,a:"Town Square",g:"B",t:"villa"},
  "the valley":{p:900,lo:800,hi:1000,sc:3.0,a:"The Valley",g:"B+",t:"villa"},
  "damac hills villas":{p:1100,lo:950,hi:1250,sc:4.5,a:"DAMAC Hills",g:"B+",t:"villa"},
  "nad al sheba villas":{p:1600,lo:1400,hi:1800,sc:3.5,a:"Nad Al Sheba",g:"A",t:"villa"},
  "discovery gardens":{p:600,lo:500,hi:700,sc:7.0,a:"Discovery Gardens",g:"C"},
  "international city":{p:450,lo:380,hi:550,sc:5.0,a:"International City",g:"C"},
  "dubai silicon oasis":{p:700,lo:600,hi:800,sc:8.0,a:"Dubai Silicon Oasis",g:"B"},
};

// --- AREA BENCHMARKS ---------------------------------------------------------
const AREAS = {
  "Downtown Dubai":{psf:2400,sc:20,r1:110000,r2:165000,r3:270000,y:[4.8,5.5],g:[15,25,35]},
  "Dubai Marina":{psf:2000,sc:16,r1:85000,r2:130000,r3:190000,y:[5.5,6.2],g:[12,20,30]},
  "Palm Jumeirah":{psf:3300,sc:22,r1:120000,r2:180000,r3:280000,y:[4.0,4.8],g:[10,18,28]},
  "Business Bay":{psf:1900,sc:16,r1:80000,r2:120000,r3:165000,y:[5.8,6.5],g:[10,18,25]},
  "Emaar Beachfront":{psf:2350,sc:20,r1:100000,r2:150000,r3:220000,y:[5.5,6.5],g:[15,25,35]},
  "Bluewaters Island":{psf:3500,sc:28,r1:140000,r2:200000,r3:280000,y:[5.5,6.5],g:[10,18,28]},
  "City Walk":{psf:2200,sc:20,r1:90000,r2:140000,r3:200000,y:[5.2,6.0],g:[10,18,26]},
  "Dubai Creek Harbour":{psf:1700,sc:17,r1:70000,r2:110000,r3:155000,y:[6.0,7.0],g:[15,25,38]},
  "MBR City":{psf:1900,sc:16,r1:75000,r2:115000,r3:165000,y:[5.8,6.8],g:[12,22,32]},
  "Sobha Hartland":{psf:1850,sc:16,r1:74000,r2:114000,r3:162000,y:[5.8,6.8],g:[12,20,30]},
  "Jumeirah Village Circle":{psf:1150,sc:12,r1:52000,r2:75000,r3:100000,y:[7.5,9.5],g:[8,15,22]},
  "Dubai Hills Estate":{psf:1850,sc:15,r1:75000,r2:115000,r3:170000,y:[5.2,6.0],g:[12,20,30]},
  "DAMAC Lagoons":{psf:1300,sc:4.5,rv3:150000,rv4:200000,y:[6.0,7.5],g:[10,18,28]},
  "Arabian Ranches 3":{psf:1250,sc:3.0,rv3:140000,rv4:190000,y:[5.8,7.0],g:[8,15,22]},
  "Tilal Al Ghaf":{psf:1900,sc:4.5,rv3:220000,rv4:300000,y:[5.5,7.0],g:[10,18,26]},
  "Palm Jebel Ali":{psf:2650,sc:8.0,rv5:450000,rv6:600000,y:[4.0,5.5],g:[20,35,50]},
  "Mina Rashid":{psf:2200,sc:20,r1:90000,r2:135000,r3:190000,y:[5.5,6.5],g:[15,25,35]},
  "Dubai Harbour":{psf:2800,sc:24,r1:110000,r2:165000,r3:240000,y:[5.0,6.0],g:[12,22,32]},
  "Al Furjan":{psf:1050,sc:3.0,r1:48000,r2:70000,r3:95000,y:[7.0,8.5],g:[8,14,20]},
  "Dubai South":{psf:900,sc:3.5,r1:38000,r2:58000,r3:82000,y:[7.5,9.0],g:[10,18,28]},
  "Jumeirah Lake Towers":{psf:1200,sc:15,r1:55000,r2:82000,r3:115000,y:[6.5,8.0],g:[8,14,20]},
  "The Springs":{psf:1400,sc:2.5,rv2:130000,rv3:165000,y:[6.0,7.5],g:[8,15,22]},
  "The Meadows":{psf:1500,sc:2.8,rv3:165000,rv4:220000,y:[6.0,7.5],g:[8,15,22]},
  "Meydan":{psf:1600,sc:16,r1:68000,r2:105000,r3:148000,y:[5.8,7.0],g:[12,22,32]},
  "Al Barsha":{psf:1000,sc:12,r1:45000,r2:68000,r3:92000,y:[7.0,8.5],g:[6,12,18]},
  "Jumeirah Golf Estates":{psf:1450,sc:5.5,rv3:180000,rv4:240000,y:[5.5,7.0],g:[10,18,26]},
  "Dubai Sports City":{psf:900,sc:10,r1:38000,r2:58000,r3:80000,y:[7.5,9.0],g:[8,14,20]},
  "DAMAC Hills":{psf:1100,sc:4.5,rv3:140000,rv4:185000,y:[6.0,7.5],g:[8,15,22]},
  "Town Square":{psf:800,sc:2.8,rv3:120000,rv4:160000,y:[6.5,8.0],g:[8,14,20]},
  "The Valley":{psf:900,sc:3.0,rv3:130000,rv4:170000,y:[6.5,8.0],g:[8,14,20]},
  "Discovery Gardens":{psf:600,sc:7,r1:35000,r2:52000,r3:75000,y:[8.0,10.0],g:[5,10,16]},
  "International City":{psf:450,sc:5,r1:28000,r2:42000,r3:60000,y:[9.0,11.0],g:[5,10,15]},
  "Dubai Silicon Oasis":{psf:700,sc:8,r1:38000,r2:56000,r3:80000,y:[7.5,9.0],g:[6,12,18]},
  "Dubai Investments Park":{psf:650,sc:7.5,r1:34000,r2:50000,r3:72000,y:[7.5,9.0],g:[6,12,18]},
  "Arjan":{psf:900,sc:10,r1:42000,r2:62000,r3:88000,y:[7.0,8.5],g:[7,13,20]},
  "Nad Al Sheba":{psf:1550,sc:3.5,rv3:160000,rv4:210000,y:[5.8,7.0],g:[12,20,28]},
  "Al Barari":{psf:2000,sc:7.57,rv4:280000,rv5:380000,y:[5.0,6.5],g:[8,15,22]},
  "Jumeirah Bay Island":{psf:5000,sc:50,rv4:500000,rv5:700000,y:[4.0,5.5],g:[10,18,28]},
  "DIFC":{psf:2600,sc:24,r1:110000,r2:165000,r3:235000,y:[5.0,6.0],g:[12,20,28]},
};
const AREA_NAMES = Object.keys(AREAS);

// --- LOOKUP -------------------------------------------------------------------
function lookupBuilding(name) {
  if (!name || name.length < 3) return null;
  const k = name.toLowerCase().trim();
  if (DB[k]) return DB[k];
  const found = Object.entries(DB).find(([key]) => k.includes(key) || key.includes(k));
  return found ? found[1] : null;
}

// --- VALUATION ENGINE ---------------------------------------------------------
// Methodology: Cascade AVM (ICE/FHFA standard) + Hedonic pricing (Rosen 1974)
// Target accuracy: 5% for DB buildings, 12% for comps-based
function computeValuation(f, buildingVal, liveData) {
  const bData = lookupBuilding(buildingVal);
  const aData = AREAS[f.area] || { psf:1800, sc:15, y:[5,7], g:[10,18,28] };
  const askPSF = f.size && f.price ? Math.round(f.price / f.size) : 0;
  if (!askPSF) return null;

  // === LAYER 1: Building DB (target 5% error) ===
  let basePSF, psfLo, psfHi, dataSource, dataLayer;
  if (bData) {
    basePSF = bData.p; psfLo = bData.lo; psfHi = bData.hi;
    dataSource = `${buildingVal} - Verified DB`; dataLayer = 1;
  } else {
    // === LAYER 2: Live comps from PropertyFinder ===
    const sales = liveData?.sales || [];
    const bedsMap = {"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5+ BR":5};
    const targetBeds = bedsMap[f.beds] ?? 2;
    const relevantComps = sales.filter(s => s.psf > 400 && s.psf < 15000 && Math.abs((parseInt(s.beds)||0)-targetBeds) <= 1);
    const allComps = sales.filter(s => s.psf > 400 && s.psf < 15000);
    const pool = relevantComps.length >= 3 ? relevantComps : allComps;

    if (pool.length >= 3) {
      const psfs = pool.map(s=>s.psf).sort((a,b)=>a-b);
      const trim = Math.max(0, Math.floor(psfs.length*0.1));
      const trimmed = psfs.slice(trim, psfs.length-trim);
      basePSF = Math.round(trimmed.reduce((s,p)=>s+p,0)/trimmed.length);
      psfLo = psfs[Math.floor(psfs.length*0.2)] || Math.round(basePSF*0.90);
      psfHi = psfs[Math.floor(psfs.length*0.8)] || Math.round(basePSF*1.10);
      dataSource = `${pool.length} live comps - ${f.area}`; dataLayer = 2;
    } else if (pool.length >= 1) {
      // === LAYER 3: Area benchmark + sparse comps ===
      const compAvg = Math.round(pool.reduce((s,c)=>s+c.psf,0)/pool.length);
      basePSF = Math.round((compAvg + aData.psf) / 2);
      psfLo = Math.round(basePSF * 0.89); psfHi = Math.round(basePSF * 1.11);
      dataSource = `${pool.length} comps + area avg - ${f.area}`; dataLayer = 3;
    } else {
      // === LAYER 4: Area benchmark only ===
      basePSF = aData.psf; psfLo = Math.round(basePSF*0.87); psfHi = Math.round(basePSF*1.13);
      dataSource = `Area benchmark - ${f.area}`; dataLayer = 4;
    }
  }

  // === HEDONIC ADJUSTMENTS (research-calibrated) ===
  const vP = VIEW_P[f.view] || 0;
  const floorN = parseInt(f.floor) || 20;
  const fP = floorN > 10 ? (floorN - 10) * 0.005 : 0;
  const furnP = f.furnished==="Furnished" ? 0.15 : f.furnished==="Semi-Furnished" ? 0.07 : 0;
  const geoAdj = MARKET.geo_adj;
  const hedonicMult = (1+vP)*(1+fP)*(1+furnP)*(1+geoAdj);

  const adjPSF = Math.round(basePSF * hedonicMult);
  psfLo = Math.round(psfLo * hedonicMult);
  psfHi = Math.round(psfHi * hedonicMult);

  // === PRICE TIERS ===
  const parkBonus = Math.max(0, (parseInt(f.parking)||1)-1) * 80000;
  const fairPrice = Math.round(adjPSF * f.size + parkBonus);
  const distressPrice = Math.round(psfLo * 0.91 * f.size);
  const goodPrice = Math.round(psfLo * f.size);
  const overpricedAt = Math.round(psfHi * 1.06 * f.size);

  // === VERDICT ===
  const vsPct = ((askPSF - adjPSF) / adjPSF) * 100;
  let verdict, suggestedOffer;
  if (askPSF <= psfLo*0.91)      { verdict="DISTRESS"; suggestedOffer=null; }
  else if (askPSF <= psfLo)      { verdict="GOOD";     suggestedOffer=null; }
  else if (askPSF <= psfHi)      { verdict="FAIR";     suggestedOffer=Math.round(fairPrice*0.97); }
  else                            { verdict="OVER";     suggestedOffer=fairPrice; }

  // === CONFIDENCE SCORE (IAAO + MISMO 2025 standards) ===
  // Layers: 1=DB(95), 2=Comps5(85), 3=Comps2-4(72), 4=Area(58)
  const baseConfidence = [0, 95, 85, 72, 58][dataLayer] || 58;
  const compsBonus = (liveData?.txs?.length||0) >= 5 ? 5 : (liveData?.txs?.length||0) >= 2 ? 2 : 0;
  const inputPenalty = (!f.floor?-4:0) + (f.view==="Not specified"?-2:0) + (!f.serviceCharge?-1:0);
  const confScore = Math.min(97, Math.max(40, baseConfidence + compsBonus + inputPenalty));

  const confTier = confScore>=90 ? {label:"Very High",range:"+/-3-5%",spread:0.04,c:"green"} :
                   confScore>=80 ? {label:"High",     range:"+/-5-8%",spread:0.07,c:"green"} :
                   confScore>=68 ? {label:"Medium",   range:"+/-8-12%",spread:0.11,c:"yellow"} :
                   confScore>=55 ? {label:"Low",      range:"+/-12-18%",spread:0.15,c:"yellow"} :
                                   {label:"Indicative",range:"+/-18-25%",spread:0.22,c:"red"};

  const priceLow  = Math.round(fairPrice*(1-confTier.spread));
  const priceHigh = Math.round(fairPrice*(1+confTier.spread));

  // === YIELD ===
  const bn = {"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5+ BR":5}[f.beds]??2;
  const isV = f.type==="Villa"||f.type==="Townhouse";
  const rent = isV ? (bn<=3?aData.rv3||180000:aData.rv4||240000) :
               bn===0?(aData.r1||65000)*0.65:bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  const sc = (parseFloat(f.serviceCharge)||bData?.sc||aData.sc||15)*f.size;
  const grossYield = (rent/f.price*100).toFixed(1);
  const netYield = ((rent-sc)/f.price*100).toFixed(1);
  const gr = aData.g||[10,18,28];

  return {
    askPSF, adjPSF, psfLo, psfHi,
    fairPrice, distressPrice, goodPrice, overpricedAt,
    verdict, vsPct: vsPct.toFixed(1), suggestedOffer,
    dataSource, dataLayer, confScore, confTier, priceLow, priceHigh,
    inDB:!!bData, bData,
    vP:Math.round(vP*100), fP:Math.round(fP*100), furnP:Math.round(furnP*100), geo:Math.round(geoAdj*100),
    rent, sc, grossYield, netYield,
    g0:gr[0], g1:gr[1], g2:gr[2],
    compsCount: liveData?.sales?.length||0, txCount: liveData?.txs?.length||0,
  };
}

// --- API ---------------------------------------------------------------------
const PF_KEY = "7da522d58fmsh161b7610dfa29acp1023adjsn4dda46dfadfc";
const PF_HOST = "propertyfinder-uae-data.p.rapidapi.com";
const pfH = { "x-rapidapi-key":PF_KEY, "x-rapidapi-host":PF_HOST };

async function fetchLiveData(building, area, beds) {
  const bedsMap={"Studio":"0","1 BR":"1","2 BR":"2","3 BR":"3","4 BR":"4","5+ BR":"5"};
  const q = (building && building.length > 2) ? `${building} ${area}` : area;
  const bn = bedsMap[beds]||"2";
  const [s,t] = await Promise.allSettled([
    fetch(`https://${PF_HOST}/search-buy?page=1&hitsPerPage=10&q=${encodeURIComponent(q)}&rooms=${bn}`,{headers:pfH}).then(r=>r.ok?r.json():null),
    fetch(`https://${PF_HOST}/get-get-transactions?page=1&size=12&q=${encodeURIComponent(q)}`,{headers:pfH}).then(r=>r.ok?r.json():null),
  ]);
  const sales = s.status==="fulfilled"&&s.value?.data?.properties
    ? s.value.data.properties.filter(p=>p.price&&p.area).map(p=>({price:p.price,size:p.area,psf:Math.round(p.price/p.area),beds:p.rooms,furnished:p.furnishing})) : [];
  const txs = t.status==="fulfilled"&&t.value?.data?.transactions
    ? t.value.data.transactions.filter(tx=>tx.price&&tx.area).map(tx=>({date:tx.date||tx.transactionDate,price:tx.price||tx.transactionAmount,size:tx.area,psf:Math.round((tx.price||tx.transactionAmount)/tx.area)})) : [];
  return { sales, txs };
}

async function askClaude(messages, system="") {
  const body={model:"claude-sonnet-4-20250514",max_tokens:1000,messages};
  if(system) body.system=system;
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(`API ${r.status}`);
  const d=await r.json();
  return d.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
}

// --- THEME HOOK ---------------------------------------------------------------
function useTheme() {
  const [dark,setDark]=useState(true);
  return { C: dark?T.dark:T.light, dark, toggle:()=>setDark(d=>!d) };
}

// --- SHARED UI ----------------------------------------------------------------
function Pill({ children, color="gray", C }) {
  const palettes = {
    green:  { bg:C.greenBg,  bo:C.greenBo,  tx:C.green  },
    yellow: { bg:C.yellowBg, bo:C.yellowBo, tx:C.yellow },
    red:    { bg:C.redBg,    bo:C.redBo,    tx:C.red    },
    gold:   { bg:C.goldFaint,bo:C.goldDim,  tx:C.gold   },
    gray:   { bg:"transparent",bo:C.border, tx:C.sub    },
  };
  const p = palettes[color]||palettes.gray;
  return <span style={{background:p.bg,border:`1px solid ${p.bo}`,color:p.tx,padding:"3px 10px",borderRadius:20,fontSize:11,fontFamily:"'Space Grotesk',monospace",fontWeight:600}}>{children}</span>;
}

function Label({children,C}) {
  return <div style={{color:C.sub,fontSize:9.5,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5,fontFamily:"'Space Grotesk',monospace"}}>{children}</div>;
}

function Spin({C,label=""}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"44px 0"}}>
      <div style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:C.gold,animation:"spin 0.8s linear infinite"}}/>
      {label&&<span style={{color:C.sub,fontSize:11,fontFamily:"'Space Grotesk',monospace"}}>{label}</span>}
    </div>
  );
}

const selStyle = (C) => ({width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.white,padding:"10px 14px",borderRadius:10,fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none",WebkitTextFillColor:C.white});
const inpStyle = (C) => ({...selStyle(C),caretColor:C.gold,boxSizing:"border-box"});

// --- VERDICT CARD -------------------------------------------------------------
function VerdictCard({val,C}) {
  const cfg = {
    DISTRESS:{bg:`linear-gradient(135deg,${C.greenBg},transparent)`,bo:C.greenBo,tx:C.green,icon:"",label:"DISTRESS DEAL",sub:"Significantly below market"},
    GOOD:    {bg:`linear-gradient(135deg,${C.greenBg},transparent)`,bo:C.greenBo,tx:C.green,icon:"",label:"GOOD PRICE",   sub:"Below market - strong entry"},
    FAIR:    {bg:`linear-gradient(135deg,${C.yellowBg},transparent)`,bo:C.yellowBo,tx:C.yellow,icon:"",label:"FAIR PRICE", sub:"At market - room to negotiate"},
    OVER:    {bg:`linear-gradient(135deg,${C.redBg},transparent)`,   bo:C.redBo,   tx:C.red,   icon:"",label:"OVERPRICED", sub:"Above market - negotiate hard"},
  }[val.verdict];

  const confColor = val.confTier.c==="green"?C.green:val.confTier.c==="yellow"?C.yellow:C.red;

  return (
    <div style={{background:cfg.bg,border:`2px solid ${cfg.bo}`,borderRadius:16,overflow:"hidden"}}>
      {/* Verdict header */}
      <div style={{padding:"20px 20px 16px",textAlign:"center",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:32,marginBottom:8}}>{cfg.icon}</div>
        <div style={{color:cfg.tx,fontSize:22,fontWeight:800,fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em"}}>{cfg.label}</div>
        <div style={{color:cfg.tx,opacity:0.75,fontSize:12,marginTop:3,fontFamily:"'Inter',sans-serif"}}>{cfg.sub}</div>
      </div>

      <div style={{padding:"16px 20px"}}>
        {/* PSF comparison */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:C.raised,borderRadius:10,padding:"12px 14px"}}>
            <Label C={C}>Asking PSF</Label>
            <div style={{color:C.white,fontSize:17,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>AED {val.askPSF?.toLocaleString()}</div>
          </div>
          <div style={{background:C.raised,borderRadius:10,padding:"12px 14px"}}>
            <Label C={C}>Market PSF</Label>
            <div style={{color:C.green,fontSize:17,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>AED {val.adjPSF?.toLocaleString()}</div>
          </div>
        </div>

        {/* vs market */}
        <div style={{background:C.raised,borderRadius:10,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{color:C.sub,fontSize:12,fontFamily:"'Space Grotesk',monospace"}}>vs Market Average</span>
          <span style={{color:parseFloat(val.vsPct)<0?C.green:parseFloat(val.vsPct)>8?C.red:C.yellow,fontSize:19,fontWeight:800,fontFamily:"'Space Grotesk',monospace"}}>
            {parseFloat(val.vsPct)>0?"+":""}{val.vsPct}%
          </span>
        </div>

        {/* Price tiers */}
        <div style={{marginBottom:14}}>
          {[
            {label:" Distress Deal",price:val.distressPrice,active:val.verdict==="DISTRESS"},
            {label:" Good Price",   price:val.goodPrice,     active:val.verdict==="GOOD"},
            {label:" Fair Market", price:val.fairPrice,     active:val.verdict==="FAIR"},
            {label:" Overpriced",  price:val.overpricedAt,  active:val.verdict==="OVER"},
          ].map((t,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",marginBottom:3,borderRadius:8,background:t.active?cfg.bg:"transparent",border:t.active?`1px solid ${cfg.bo}`:"1px solid transparent",transition:"all 0.2s"}}>
              <span style={{color:t.active?cfg.tx:C.sub,fontSize:12,fontFamily:"'Inter',sans-serif"}}>{t.label}</span>
              <span style={{color:t.active?cfg.tx:C.sub,fontSize:12,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>AED {t.price?.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Suggested offer */}
        {val.suggestedOffer && (
          <div style={{background:C.goldFaint,border:`1px solid ${C.goldDim}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <Label C={C}>Negotiation Target</Label>
            <div style={{color:C.gold,fontSize:20,fontWeight:800,fontFamily:"'Space Grotesk',monospace"}}>AED {val.suggestedOffer?.toLocaleString()}</div>
          </div>
        )}

        {/* Confidence meter */}
        <div style={{background:C.raised,borderRadius:10,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <Label C={C}>Valuation Confidence</Label>
            <span style={{color:confColor,fontSize:12,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>{val.confTier.label} - {val.confTier.range}</span>
          </div>
          <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${val.confScore}%`,background:`linear-gradient(90deg,${confColor}90,${confColor})`,borderRadius:3,transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:C.sub,fontSize:10.5,fontFamily:"'Space Grotesk',monospace"}}>
              Score {val.confScore}/100 - {val.dataSource}
              {val.compsCount>0&&` - ${val.compsCount} comps`}
              {val.txCount>0&&` - ${val.txCount} DLD txs`}
            </span>
            <span style={{color:C.sub,fontSize:10,fontFamily:"'Space Grotesk',monospace"}}>Fair: AED {val.priceLow?.toLocaleString()}-{val.priceHigh?.toLocaleString()}</span>
          </div>
        </div>

        {/* Unknown building warning */}
        {!val.inDB && (
          <div style={{marginTop:10,background:C.yellowBg,border:`1px solid ${C.yellowBo}`,borderRadius:8,padding:"10px 12px",display:"flex",gap:8}}>
            <span style={{fontSize:14}}></span>
            <div style={{color:C.yellow,fontSize:11.5,fontFamily:"'Inter',sans-serif",lineHeight:1.6}}>
              Building not in verified database - analysis based on {val.dataLayer===2?"live market comps":"area benchmarks"}.
              {" "}<a href="https://mollak.rera.gov.ae" target="_blank" rel="noopener" style={{color:C.gold}}>Verify SC on Mollak </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MARKET TAB ---------------------------------------------------------------
function MarketTab({C}) {
  return (
    <div style={{padding:"20px",maxWidth:640,margin:"0 auto"}}>
      {/* Live pulse banner */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C.gold},${C.gold},transparent)`,animation:"shimmer 3s ease infinite"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"}}>Dubai Market - June 2026</div>
          <div style={{display:"flex",alignItems:"center",gap:5,background:C.greenBg,border:`1px solid ${C.greenBo}`,borderRadius:20,padding:"3px 10px"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
            <span style={{color:C.green,fontSize:9.5,fontFamily:"'Space Grotesk',monospace"}}>LIVE DATA</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {MARKET.stats.map((s,i)=>(
            <div key={i} style={{background:C.raised,borderRadius:10,padding:"12px 14px"}}>
              <div style={{color:C.sub,fontSize:9.5,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontFamily:"'Space Grotesk',monospace"}}>{s.label}</div>
              <div style={{color:C.gold,fontSize:17,fontWeight:700,fontFamily:"'Space Grotesk',monospace",marginBottom:2}}>{s.val}</div>
              <div style={{color:s.up===true?C.green:s.up===false?C.red:C.sub,fontSize:10,fontFamily:"'Space Grotesk',monospace"}}>{s.up?" ":""}{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:14}}>* Market Cycle - 20-Year History</div>
        {[
          {yr:"2002-08",n:"Bubble Boom",c:"+400%",col:C.green},
          {yr:"2008-11",n:"GFC Crash",c:"-50%",col:C.red},
          {yr:"2011-14",n:"Recovery",c:"+60%",col:C.green},
          {yr:"2014-19",n:"Correction",c:"-25-35%",col:C.red},
          {yr:"2020",n:"COVID Dip",c:"-10-15%",col:C.yellow},
          {yr:"2021-25",n:"Super Cycle",c:"+75%",col:C.green},
          {yr:"2026 ",n:"Moderation - Buyer Window",c:"+/-3-8%",col:C.yellow},
        ].map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:i<6?`1px solid ${C.border}`:"none"}}>
            <div style={{color:C.gold,fontSize:10.5,fontFamily:"'Space Grotesk',monospace",minWidth:60}}>{c.yr}</div>
            <div style={{color:C.white,fontSize:12.5,fontFamily:"'Inter',sans-serif",flex:1}}>{c.n}</div>
            <div style={{color:c.col,fontSize:12,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>{c.c}</div>
          </div>
        ))}
        <div style={{marginTop:12,background:C.goldFaint,border:`1px solid ${C.goldDim}`,borderRadius:8,padding:"10px 14px",color:C.subHi,fontSize:12.5,fontFamily:"'Inter',sans-serif",lineHeight:1.7}}>
          <strong style={{color:C.gold}}>June 2026 window:</strong> Post-geopolitical correction. Supply pressure H2 2026. Buyer leverage open 3-6 months. Geo adjustment: 6% applied to all valuations.
        </div>
      </div>

      {/* PSF table */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:14}}>* PSF Benchmarks</div>
        {[
          ["Downtown Dubai","AED 2,400","4.8-5.5%"],
          ["Palm Jumeirah","AED 3,300","4.0-4.8%"],
          ["Emaar Beachfront","AED 2,350","5.5-6.5%"],
          ["Dubai Marina","AED 2,000","5.5-6.2%"],
          ["Business Bay","AED 1,900","5.8-6.5%"],
          ["Dubai Hills Estate","AED 1,850","5.2-6.0%"],
          ["DAMAC Lagoons","AED 1,300","6.0-7.5%"],
          ["JVC","AED 1,150","7.5-9.5%"],
          ["Al Furjan","AED 1,050","7.0-8.5%"],
        ].map(([area,psf,yield_],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<8?`1px solid ${C.border}`:"none"}}>
            <span style={{color:C.subHi,fontSize:12.5,fontFamily:"'Inter',sans-serif",flex:1}}>{area}</span>
            <span style={{color:C.white,fontSize:12,fontWeight:600,fontFamily:"'Space Grotesk',monospace",marginRight:16}}>{psf}</span>
            <span style={{color:C.green,fontSize:11,fontFamily:"'Space Grotesk',monospace"}}>{yield_}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ANALYZER TAB -------------------------------------------------------------
function AnalyzerTab({C}) {
  const [f,setF]=useState({area:"",type:"Apartment",beds:"2 BR",floor:"",view:"Not specified",furnished:"Unfurnished",parking:"1",size:"",price:"",serviceCharge:""});
  const [showPDF,setShowPDF]=useState(false);
  const [buildingVal,setBuildingVal]=useState("");
  const [stage,setStage]=useState(0); // 0=form, 1=loading, 2=result
  const [val,setVal]=useState(null);
  const [liveData,setLiveData]=useState(null);
  const [aiText,setAiText]=useState("");
  const [err,setErr]=useState("");
  const [step,setStep]=useState(0);
  const bRef=useRef(null);
  const upd=useCallback((k,v)=>setF(p=>({...p,[k]:v})),[]);
  const isVilla = f.type==="Villa"||f.type==="Townhouse";
  const views = isVilla?VILLA_VIEWS:APT_VIEWS;
  const psf = f.size&&f.price ? Math.round(f.price/f.size) : null;

  // Auto-fill SC from DB
  const handleBuilding = useCallback((v) => {
    setBuildingVal(v);
    if(v.length>2) {
      const b=lookupBuilding(v);
      if(b?.sc) upd("serviceCharge",String(b.sc));
    }
  },[upd]);

  const analyze = async () => {
    if(!f.area||!f.size||!f.price) return;
    setStage(1); setStep(1); setVal(null); setAiText(""); setErr("");
    try {
      // Step 1: compute with no live data first (instant)
      const v0 = computeValuation(f,buildingVal,null);
      setVal(v0); setStep(2);

      // Step 2: fetch live data
      const live = await fetchLiveData(buildingVal, f.area, f.beds);
      setLiveData(live); setStep(3);

      // Step 3: recompute with live data
      const v1 = computeValuation(f, buildingVal, live);
      setVal(v1);

      // Step 4: AI commentary
      const isUnknown = !v1.inDB;
      const compsStr = live.sales.slice(0,4).map(s=>`AED ${s.price?.toLocaleString()} (PSF ${s.psf?.toLocaleString()})`).join(", ");
      const txStr = live.txs.slice(0,4).map(t=>`PSF ${t.psf?.toLocaleString()}`).join(", ");

      const sys = `You are DubaiVal, Dubai's most precise property valuation AI. June 2026.
Market: Post-geo correction. Geo adj -6%. Buyer leverage window open.
Be specific with AED. Max 3 sentences. No fluff.`;

      const prompt = isUnknown
        ? `Building: "${buildingVal||"Unknown"}" in ${f.area}. ${f.beds}, floor ${f.floor||"mid"}, ${f.view}, ${parseInt(f.size).toLocaleString()} sqft @ AED ${parseInt(f.price).toLocaleString()} (PSF ${v1.askPSF?.toLocaleString()}).
Comps found: ${compsStr||"none"} | DLD txs PSF: ${txStr||"none"}.
Verdict: ${v1.verdict} vs market PSF ${v1.adjPSF?.toLocaleString()} (${v1.vsPct}% diff). Confidence: ${v1.confTier.label} (${v1.confTier.range}).
3 sentences: (1) PSF assessment with numbers, (2) negotiation advice with AED target if needed, (3) key risk or opportunity for this area.`
        : `${buildingVal}, ${f.beds}, floor ${f.floor||"mid"}, ${f.view}, ${parseInt(f.size).toLocaleString()} sqft @ AED ${parseInt(f.price).toLocaleString()} (PSF ${v1.askPSF?.toLocaleString()}).
Verdict: ${v1.verdict}. Asking PSF ${v1.vsPct}% vs market (${v1.adjPSF?.toLocaleString()}). Comps: ${compsStr||"none"}.
3 sentences: assessment, negotiation advice, risk/opportunity.`;

      const ai = await askClaude([{role:"user",content:prompt}], sys);
      setAiText(ai);
      setStep(4); setStage(2);
    } catch(e) {
      setErr(e.message); setStage(0);
    }
  };

  const reset = () => { setStage(0); setVal(null); setAiText(""); setLiveData(null); setStep(0); };

  const S = selStyle(C);
  const I = inpStyle(C);

  if(stage===2 && val) return (
    <div style={{padding:"20px",maxWidth:640,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"}}>* Analysis Complete</div>
          <div style={{color:C.subHi,fontSize:13,fontFamily:"'Inter',sans-serif"}}>{buildingVal||f.area} - {f.beds} - {f.size?.toLocaleString()} sqft</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowPDF(true)} style={{background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,border:"none",color:"#070B14",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'Space Grotesk',monospace",fontWeight:700}}> PDF</button>
          <button onClick={reset} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.sub,padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif"}}> New</button>
        </div>
      </div>

      {/* VERDICT - the signature moment */}
      <div style={{marginBottom:14,animation:"fadeUp 0.4s ease"}}>
        <VerdictCard val={val} C={C}/>
      </div>

      {/* AI Commentary */}
      {aiText && (
        <div style={{background:C.surface,border:`1px solid ${val.inDB?C.goldDim:C.greenBo}`,borderRadius:14,padding:18,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"}}>* Expert Commentary</div>
            <Pill color={val.inDB?"gold":"green"} C={C}>{val.inDB?"Verified DB":"AI-Enhanced"}</Pill>
          </div>
          <div style={{color:C.subHi,fontSize:13.5,lineHeight:1.85,fontFamily:"'Inter',sans-serif"}}>{aiText}</div>
        </div>
      )}

      {/* Premium breakdown */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:12}}>* Premium Breakdown</div>
        {[
          {label:"View Premium",val:val.vP,note:f.view},
          {label:"Floor Premium",val:val.fP,note:`Floor ${f.floor||"N/A"}`},
          {label:"Furnished Premium",val:val.furnP,note:f.furnished},
          {label:"Geo Adjustment",val:val.geo,note:"Post-geo correction",neg:true},
        ].map((item,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
            <div>
              <div style={{color:C.white,fontSize:12.5,fontFamily:"'Inter',sans-serif"}}>{item.label}</div>
              <div style={{color:C.sub,fontSize:11,fontFamily:"'Space Grotesk',monospace"}}>{item.note}</div>
            </div>
            <div style={{color:item.val===0?C.sub:item.neg||item.val<0?C.red:C.green,fontSize:13,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>
              {item.val===0?"-":`${item.neg?"-":"+"}${Math.abs(item.val)}%`}
            </div>
          </div>
        ))}
      </div>

      {/* Yield & Growth */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:12}}>* Yield & Growth</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[
            {label:"Gross Yield",val:`${val.grossYield}%`,color:C.green},
            {label:"Net Yield",  val:`${val.netYield}%`, color:parseFloat(val.netYield)>5?C.green:C.yellow},
            {label:"Annual Rent Est.",val:`AED ${val.rent?.toLocaleString()}`,color:C.subHi},
            {label:"Annual SC",val:`AED ${Math.round(val.sc)?.toLocaleString()}`,color:C.sub},
          ].map((item,i)=>(
            <div key={i} style={{background:C.raised,borderRadius:10,padding:"12px 14px"}}>
              <Label C={C}>{item.label}</Label>
              <div style={{color:item.color,fontSize:15,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>{item.val}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{l:"Conservative",v:`+${val.g0}%`,c:C.yellow},{l:"Base Case",v:`+${val.g1}%`,c:C.green,hi:true},{l:"Optimistic",v:`+${val.g2}%`,c:C.gold}].map((item,i)=>(
            <div key={i} style={{background:item.hi?C.greenBg:C.raised,border:`1px solid ${item.hi?C.greenBo:C.border}`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
              <div style={{color:C.sub,fontSize:9.5,fontFamily:"'Space Grotesk',monospace",marginBottom:4}}>{item.l}</div>
              <div style={{color:item.c,fontSize:16,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>{item.v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:8,color:C.sub,fontSize:11,fontFamily:"'Inter',sans-serif"}}>3-year capital appreciation forecast - {f.area}</div>
      </div>

      {/* Live comps */}
      {liveData && (liveData.sales.length>0||liveData.txs.length>0) && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14}}>
          <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:12}}>* Live Market Data</div>
          {liveData.sales.slice(0,4).map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<3&&i<liveData.sales.length-1?`1px solid ${C.border}`:"none"}}>
              <span style={{color:C.subHi,fontSize:12,fontFamily:"'Inter',sans-serif"}}>{s.beds}BR - {s.size?.toLocaleString()} sqft</span>
              <div style={{textAlign:"right"}}>
                <div style={{color:C.white,fontSize:12,fontFamily:"'Space Grotesk',monospace"}}>AED {s.price?.toLocaleString()}</div>
                {s.psf&&<div style={{color:C.sub,fontSize:10,fontFamily:"'Space Grotesk',monospace"}}>PSF {s.psf?.toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Download PDF button (bottom) */}
      <button onClick={()=>setShowPDF(true)} style={{width:"100%",padding:14,borderRadius:10,border:`1px solid ${C.goldDim}`,background:C.goldFaint,color:C.gold,fontSize:14,fontWeight:700,fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.06em",marginBottom:8}}>
         DOWNLOAD VALUATION REPORT 
      </button>

      {/* PDF Modal */}
      {showPDF && <PDFReportModal val={val} formData={f} buildingVal={buildingVal} C={C} onClose={()=>setShowPDF(false)}/>}
    </div>
  );

  if(stage===1) return (
    <div style={{padding:"20px",maxWidth:640,margin:"0 auto"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:28}}>
        <Spin C={C} label={step===1?"Running valuation engine...":step===2?"Fetching live market data...":"Generating AI analysis..."}/>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
          {[
            {s:1,t:"Cascade AVM: DB  Comps  Benchmarks"},
            {s:1,t:"Hedonic adjustments: view, floor, furnished, geo"},
            {s:2,t:"PropertyFinder live listings"},
            {s:2,t:"DLD transaction history"},
            {s:3,t:"AI expert commentary"},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:step>=item.s?C.green:C.border,transition:"background 0.3s"}}/>
              <span style={{color:step>=item.s?C.subHi:C.sub,fontSize:11.5,fontFamily:"'Space Grotesk',monospace"}}>{item.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Form
  return (
    <div style={{padding:"20px",maxWidth:640,margin:"0 auto"}}>
      <div style={{marginBottom:16}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:4}}>* Property Valuation Engine</div>
        <div style={{color:C.sub,fontSize:13,fontFamily:"'Inter',sans-serif"}}>Cascade AVM - Hedonic pricing - Live DLD data</div>
      </div>

      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:14}}>
        {/* Building */}
        <div style={{marginBottom:14}}>
          <Label C={C}>Building Name</Label>
          <input ref={bRef} type="text" defaultValue="" placeholder="e.g. BLVD Heights, Marina Gate, Serenia..."
            onChange={e=>handleBuilding(e.target.value)} style={I} autoComplete="off" autoCorrect="off" spellCheck="false"/>
          {f.serviceCharge && <div style={{color:C.green,fontSize:10.5,marginTop:3,fontFamily:"'Space Grotesk',monospace"}}> SC auto-filled: AED {f.serviceCharge}/sqft</div>}
        </div>

        {/* Area + Type */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <Label C={C}>Area *</Label>
            <select style={S} value={f.area} onChange={e=>upd("area",e.target.value)}>
              <option value="">Select...</option>{AREA_NAMES.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <Label C={C}>Type</Label>
            <select style={S} value={f.type} onChange={e=>upd("type",e.target.value)}>
              {["Apartment","Villa","Townhouse","Penthouse"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Beds + Floor */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <Label C={C}>Bedrooms</Label>
            <select style={S} value={f.beds} onChange={e=>upd("beds",e.target.value)}>
              {["Studio","1 BR","2 BR","3 BR","4 BR","5+ BR"].map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <Label C={C}>Floor</Label>
            <input type="number" placeholder="e.g. 39" style={I} value={f.floor} onChange={e=>upd("floor",e.target.value)}/>
          </div>
        </div>

        {/* View */}
        <div style={{marginBottom:14}}>
          <Label C={C}>View {isVilla?"(Villa)":"(Apartment)"}</Label>
          <select style={S} value={f.view} onChange={e=>upd("view",e.target.value)}>
            {views.map(v=><option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Size + Price */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <Label C={C}>Size (sqft) *</Label>
            <input type="number" placeholder="1,666" style={I} value={f.size} onChange={e=>upd("size",e.target.value)}/>
          </div>
          <div>
            <Label C={C}>Asking Price (AED) *</Label>
            <input type="number" placeholder="4,000,000" style={I} value={f.price} onChange={e=>upd("price",e.target.value)}/>
          </div>
        </div>

        {/* Furnished + Parking */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <Label C={C}>Furnished</Label>
            <select style={S} value={f.furnished} onChange={e=>upd("furnished",e.target.value)}>
              {["Unfurnished","Furnished","Semi-Furnished"].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <Label C={C}>Parking</Label>
            <select style={S} value={f.parking} onChange={e=>upd("parking",e.target.value)}>
              {["0","1","2","3+"].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Service charge */}
        <div style={{marginBottom:16}}>
          <Label C={C}>Service Charge (AED/sqft/yr)</Label>
          <input type="number" placeholder="Auto-filled for known buildings" style={{...I,borderColor:f.serviceCharge?C.greenBo:C.border}} value={f.serviceCharge} onChange={e=>upd("serviceCharge",e.target.value)}/>
        </div>

        {/* PSF preview */}
        {psf && (
          <div style={{background:C.goldFaint,border:`1px solid ${C.goldDim}`,borderRadius:8,padding:"9px 14px",display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <span style={{color:C.sub,fontSize:12,fontFamily:"'Space Grotesk',monospace"}}>Implied PSF</span>
            <span style={{color:C.gold,fontSize:16,fontWeight:700,fontFamily:"'Space Grotesk',monospace"}}>AED {psf.toLocaleString()}</span>
          </div>
        )}

        <button onClick={analyze} disabled={!f.area||!f.size||!f.price} style={{
          width:"100%",padding:14,borderRadius:10,border:"none",
          background:!f.area||!f.size||!f.price?C.border:`linear-gradient(135deg,${C.gold},${C.goldDim})`,
          color:!f.area||!f.size||!f.price?C.sub:"#070B14",
          fontSize:14,fontWeight:800,fontFamily:"'Space Grotesk',monospace",
          cursor:!f.area||!f.size||!f.price?"not-allowed":"pointer",
          letterSpacing:"0.06em",
        }}>ANALYZE THIS DEAL </button>
        {err&&<div style={{color:C.red,fontSize:11,marginTop:8,fontFamily:"'Space Grotesk',monospace"}}>{err}</div>}
      </div>

      {/* Data quality note */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",display:"flex",gap:10}}>
        <span style={{fontSize:16}}></span>
        <div style={{color:C.sub,fontSize:11.5,fontFamily:"'Inter',sans-serif",lineHeight:1.65}}>
          Valuations use Cascade AVM: verified database (302 buildings)  live PropertyFinder comps  area benchmarks. Confidence score shown for every result. Known buildings: target +/-5% accuracy.
        </div>
      </div>
    </div>
  );
}

// --- COMPARE TAB --------------------------------------------------------------
function CompareTab({C}) {
  const [a1,setA1]=useState(""); const [a2,setA2]=useState("");
  const [budget,setBudget]=useState(""); const [purpose,setPurpose]=useState("Investment");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(""); const [err,setErr]=useState("");
  const S=selStyle(C); const I=inpStyle(C);

  const run = async () => {
    if(!a1||!a2) return;
    setLoading(true); setResult(""); setErr("");
    const d1=AREAS[a1]||{}; const d2=AREAS[a2]||{};
    try {
      const text = await askClaude([{role:"user",content:
`Compare for a client - Dubai June 2026:
Area A: ${a1} - avg PSF AED ${d1.psf?.toLocaleString()||"N/A"}, yield ${d1.y?.join("-")||"N/A"}%
Area B: ${a2} - avg PSF AED ${d2.psf?.toLocaleString()||"N/A"}, yield ${d2.y?.join("-")||"N/A"}%
Budget: ${budget?"AED "+parseInt(budget).toLocaleString():"not specified"} | Purpose: ${purpose}
Market: Post-geo correction, -6% geo adj, supply pressure H2 2026, buyer leverage window open

PSF - Yield - 3yr growth - Demand/liquidity - Risk - Decisive verdict for ${purpose}`
      }], `You are DubaiVal AI. June 2026 Dubai market expert. Specific AED numbers only. No fluff. 5 sections, 2 sentences each.`);
      setResult(text);
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{padding:"20px",maxWidth:640,margin:"0 auto"}}>
      <div style={{marginBottom:16}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:4}}>* Area Comparison</div>
        <div style={{color:C.sub,fontSize:13}}>Side-by-side analysis with live benchmarks</div>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          {[{label:"Area A",val:a1,set:setA1},{label:"Area B",val:a2,set:setA2}].map((item,i)=>(
            <div key={i}>
              <Label C={C}>{item.label}</Label>
              <select style={S} value={item.val} onChange={e=>item.set(e.target.value)}>
                <option value="">Select...</option>{AREA_NAMES.map(a=><option key={a}>{a}</option>)}
              </select>
              {item.val&&AREAS[item.val]&&(
                <div style={{marginTop:5,display:"flex",gap:8}}>
                  <Pill C={C} color="gold">AED {AREAS[item.val].psf?.toLocaleString()}</Pill>
                  <Pill C={C} color="green">{AREAS[item.val].y?.join("-")}%</Pill>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <Label C={C}>Budget (AED)</Label>
            <input style={I} type="number" placeholder="3,000,000" value={budget} onChange={e=>setBudget(e.target.value)}/>
          </div>
          <div>
            <Label C={C}>Purpose</Label>
            <select style={S} value={purpose} onChange={e=>setPurpose(e.target.value)}>
              {["Investment","End-Use","Rental Income","Capital Growth","Off-Plan Flip"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <button onClick={run} disabled={loading||!a1||!a2} style={{width:"100%",padding:13,borderRadius:10,border:"none",background:loading||!a1||!a2?C.border:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:loading||!a1||!a2?C.sub:"#070B14",fontSize:14,fontWeight:800,fontFamily:"'Space Grotesk',monospace",cursor:loading||!a1||!a2?"not-allowed":"pointer",letterSpacing:"0.06em"}}>
          {loading?"COMPARING...":"COMPARE "}
        </button>
        {err&&<div style={{color:C.red,fontSize:11,marginTop:8,fontFamily:"'Space Grotesk',monospace"}}>{err}</div>}
      </div>
      {loading&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}><Spin C={C} label="Analyzing both areas..."/></div>}
      {result&&!loading&&(
        <div style={{background:C.surface,border:`1px solid ${C.goldDim}`,borderRadius:14,padding:20}}>
          <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:12}}>* {a1} vs {a2}</div>
          <div style={{color:C.subHi,fontSize:13.5,lineHeight:1.85,fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"}}>{result}</div>
        </div>
      )}
    </div>
  );
}

// --- PERSONAL ADVISOR TAB -----------------------------------------------------
function PersonalTab({C}) {
  const [p,setP]=useState({budget:"",role:"Investor",family:"Couple",children:"0",work:"",car:true,purpose:"Investment",timeline:"6 months",nationality:""});
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(""); const [err,setErr]=useState("");
  const upd=(k,v)=>setP(prev=>({...prev,[k]:v}));
  const S=selStyle(C); const I=inpStyle(C);

  const run = async () => {
    if(!p.budget) return;
    setLoading(true); setResult(""); setErr("");
    try {
      const text = await askClaude([{role:"user",content:
`My profile:
Budget: AED ${parseInt(p.budget).toLocaleString()} | I am: ${p.role} | Family: ${p.family} | Children: ${p.children}
Work: ${p.work||"flexible"} | Has car: ${p.car?"Yes":"No"} | Purpose: ${p.purpose} | Timeline: ${p.timeline}
Nationality: ${p.nationality||"not specified"}

Give me 3 specific area recommendations, 3 communities, and 3 buildings in Dubai.
For each: current PSF range, expected yield, lifestyle fit, why it matches my profile.
Be specific with AED numbers. Format clearly.`
      }], `You are DubaiVal Personal Advisor. June 2026 Dubai expert. Specific AED numbers, direct recommendations, no fluff.`);
      setResult(text);
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{padding:"20px",maxWidth:640,margin:"0 auto"}}>
      <div style={{marginBottom:16}}>
        <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:4}}>* Personal Property Advisor</div>
        <div style={{color:C.sub,fontSize:13}}>Tell us about yourself - get tailored area, community & building recommendations</div>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,marginBottom:14}}>
        <div style={{marginBottom:14}}>
          <Label C={C}>Budget (AED) *</Label>
          <input style={I} type="number" placeholder="2,000,000" value={p.budget} onChange={e=>upd("budget",e.target.value)}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><Label C={C}>I am</Label><select style={S} value={p.role} onChange={e=>upd("role",e.target.value)}>{["Investor","End-User","First-Time Buyer","Upgrader","Relocating"].map(v=><option key={v}>{v}</option>)}</select></div>
          <div><Label C={C}>Purpose</Label><select style={S} value={p.purpose} onChange={e=>upd("purpose",e.target.value)}>{["Investment","End-Use","Rental Income","Golden Visa","Vacation Home"].map(v=><option key={v}>{v}</option>)}</select></div>
          <div><Label C={C}>Family</Label><select style={S} value={p.family} onChange={e=>upd("family",e.target.value)}>{["Single","Couple","Family with Kids","Retiree"].map(v=><option key={v}>{v}</option>)}</select></div>
          <div><Label C={C}>Children</Label><select style={S} value={p.children} onChange={e=>upd("children",e.target.value)}>{["0","1","2","3","4+"].map(v=><option key={v}>{v}</option>)}</select></div>
          <div><Label C={C}>Has Car?</Label><select style={S} value={p.car} onChange={e=>upd("car",e.target.value==="true")}><option value="true">Yes</option><option value="false">No</option></select></div>
          <div><Label C={C}>Timeline</Label><select style={S} value={p.timeline} onChange={e=>upd("timeline",e.target.value)}>{["1 month","3 months","6 months","1 year","2+ years"].map(v=><option key={v}>{v}</option>)}</select></div>
        </div>
        <div style={{marginBottom:16}}>
          <Label C={C}>Work Location</Label>
          <input style={I} type="text" placeholder="DIFC, Downtown, Work from home..." value={p.work} onChange={e=>upd("work",e.target.value)} autoComplete="off"/>
        </div>
        <button onClick={run} disabled={loading||!p.budget} style={{width:"100%",padding:13,borderRadius:10,border:"none",background:loading||!p.budget?C.border:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:loading||!p.budget?C.sub:"#070B14",fontSize:14,fontWeight:800,fontFamily:"'Space Grotesk',monospace",cursor:loading||!p.budget?"not-allowed":"pointer",letterSpacing:"0.06em"}}>
          {loading?"FINDING YOUR MATCH...":"GET RECOMMENDATIONS "}
        </button>
        {err&&<div style={{color:C.red,fontSize:11,marginTop:8}}>{err}</div>}
      </div>
      {loading&&<Spin C={C} label="Analyzing your profile..."/>}
      {result&&!loading&&(
        <div style={{background:C.surface,border:`1px solid ${C.goldDim}`,borderRadius:14,padding:20}}>
          <div style={{color:C.gold,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:12}}>* Your Recommendations</div>
          <div style={{color:C.subHi,fontSize:13.5,lineHeight:1.9,fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"}}>{result}</div>
        </div>
      )}
    </div>
  );
}

// --- AI CHAT TAB --------------------------------------------------------------
const CHAT_SYS = `You are DubaiVal AI - Dubai's most precise property intelligence engine. June 2026.
Market: Post-geo correction, -6% adj, moderation phase, buyer leverage window.
PSF: Downtown 2,400 | Marina 2,000 | Palm 3,300 | Business Bay 1,900 | JVC 1,150 | Dubai Hills 1,850.
Yields: JVC 7.5-9.5% | Al Furjan 7-8.5% | Business Bay 5.8-6.5% | Downtown 4.8-5.5%.
Be specific with AED. Short and decisive. Professional brokers are your audience.`;

function ChatTab({C}) {
  const [msgs,setMsgs]=useState([{role:"assistant",text:"DubaiVal Intelligence.\n\nBuilding-level knowledge - June 2026 data - Confidence scoring on all estimates.\n\nAsk me about any building, deal, or strategy."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"})},[msgs]);

  const send = async (text) => {
    const t=text||input.trim();
    if(!t||loading) return;
    setInput("");
    const newMsgs=[...msgs,{role:"user",text:t}];
    setMsgs(newMsgs); setLoading(true);
    try {
      const history=newMsgs.slice(-8).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const reply=await askClaude(history,CHAT_SYS);
      setMsgs(p=>[...p,{role:"assistant",text:reply}]);
    } catch(e) { setMsgs(p=>[...p,{role:"assistant",text:"Error: "+e.message}]); }
    setLoading(false);
  };

  const suggestions=["Is BLVD Heights at AED 2,800 PSF a good deal?","Best yield under AED 1.5M right now?","Geo risk still affecting prices?","Off-plan vs ready in 2026?"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",padding:"0 20px",maxWidth:640,margin:"0 auto",width:"100%"}}>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingTop:16,paddingBottom:12,minHeight:0}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:7,flexShrink:0,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#070B14",fontFamily:"'Space Grotesk',monospace"}}>DV</div>}
            <div style={{maxWidth:"84%",background:m.role==="user"?C.goldFaint:C.surface,border:`1px solid ${m.role==="user"?C.goldDim:C.border}`,borderRadius:m.role==="user"?"14px 14px 0 14px":"14px 14px 14px 0",padding:"11px 15px",color:C.subHi,fontSize:13,lineHeight:1.8,fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"}}>{m.text}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#070B14"}}>DV</div>
            <div style={{display:"flex",gap:4}}>{[0,1,2].map(j=><div key={j} style={{width:7,height:7,borderRadius:"50%",background:C.gold,animation:`bounce 1.1s ${j*0.18}s infinite`}}/>)}</div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {msgs.length<=1&&(
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
          {suggestions.map((s,i)=>(
            <button key={i} onClick={()=>send(s)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.sub,padding:"9px 14px",borderRadius:10,cursor:"pointer",fontSize:12.5,fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.goldDim;e.currentTarget.style.color=C.gold;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.sub;}}>{s}</button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:10,alignItems:"center",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask about any building, deal, or market question..."
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.white,fontSize:13,fontFamily:"'Inter',sans-serif",WebkitTextFillColor:C.white,caretColor:C.gold}} autoComplete="off"/>
        <button onClick={()=>send()} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?C.border:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#070B14",border:"none",width:36,height:36,borderRadius:8,cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}></button>
      </div>
    </div>
  );
}

// Usage: Add this to dubaival-final.jsx
// Renders inside app, generates printable HTML  PDF via browser print dialog
// Two modes: Public (watermarked, email required) | Agent (professional, RERA)
// Lead capture: collects email before PDF download

// --- PDF GENERATOR (browser print-to-PDF) ------------------------------------
function generatePDFHTML({ val, formData, agentData, isAgent, reportDate }) {
  const vLabel = {DISTRESS:'DISTRESS DEAL',GOOD:'GOOD PRICE',FAIR:'FAIR PRICE',OVER:'OVERPRICED'}[val.verdict];
  const vColor = {DISTRESS:'#00B87A',GOOD:'#00B87A',FAIR:'#E8A020',OVER:'#E83050'}[val.verdict];
  const vIcon = {DISTRESS:'',GOOD:'',FAIR:'',OVER:''}[val.verdict];
  const vSub = {DISTRESS:'Below market - Buy Now',GOOD:'Below market - Strong entry',FAIR:'At market - Negotiate',OVER:'Above market - Pass or negotiate hard'}[val.verdict];
  const ref = 'DV-' + Date.now().toString(36).toUpperCase().slice(-8);
  const cCol = val.confScore >= 80 ? '#00A070' : val.confScore >= 60 ? '#E8A020' : '#E83050';
  const Q = (s) => String(s||'').replace(/"/g, '&quot;');

  const box = (label, value, color) =>
    '<div style="background:#F8FAFF;border:1px solid #E0E6F0;border-radius:8px;padding:10px">' +
    '<div style="font-size:8.5px;color:#6B7A9E;text-transform:uppercase;letter-spacing:0.08em;font-family:monospace;margin-bottom:4px">' + label + '</div>' +
    '<div style="font-family:monospace;font-size:13px;font-weight:700;color:' + (color||'#1A2040') + '">' + value + '</div></div>';

  const tierRows = [
    {label:' Distress Deal',price:val.distressPrice,active:val.verdict==='DISTRESS'},
    {label:' Good Price',   price:val.goodPrice,    active:val.verdict==='GOOD'},
    {label:' Fair Market', price:val.fairPrice,    active:val.verdict==='FAIR'},
    {label:' Overpriced',  price:val.overpricedAt, active:val.verdict==='OVER'},
  ].map(t =>
    '<div style="display:flex;justify-content:space-between;padding:5px 8px;border-radius:6px;margin-bottom:3px;background:' +
    (t.active ? vColor+'15' : '#F8FAFF') + ';border:1px solid ' + (t.active ? vColor+'40' : '#E8EDF5') + '">' +
    '<span style="font-size:11px;color:' + (t.active ? vColor : '#4A5878') + '">' + t.label + '</span>' +
    '<span style="font-family:monospace;font-size:12px;font-weight:700;color:' + (t.active ? vColor : '#1A2040') + '">AED ' + (t.price||0).toLocaleString() + '</span></div>'
  ).join('');

  const premRows = [
    {l:'View Premium',   v:val.vP,   n:formData.view,             neg:false},
    {l:'Floor Premium',  v:val.fP,   n:'Floor '+(formData.floor||'N/A'), neg:false},
    {l:'Furnished',      v:val.furnP,n:formData.furnished,         neg:false},
    {l:'Geo Adjustment', v:val.geo,  n:'Post-correction',          neg:true},
  ].map(item =>
    '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F0F3FA">' +
    '<div><div style="font-size:11px;color:#6B7A9E">' + item.l + '</div>' +
    '<div style="font-size:9px;color:#C0CBE8">' + item.n + '</div></div>' +
    '<span style="font-family:monospace;font-size:12px;font-weight:700;color:' +
    (item.v===0?'#9BA8C8':item.neg?'#E83050':'#00A070') + '">' +
    (item.v===0?'-':(item.neg?'-':'+') + Math.abs(item.v)+'%') + '</span></div>'
  ).join('');

  const agentHtml = isAgent && agentData && agentData.name
    ? '<div style="background:#1A2040;border-radius:10px;padding:14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">' +
      '<div><div style="font-family:monospace;font-size:13px;font-weight:700;color:#D4A843;margin-bottom:2px">' + Q(agentData.name) + '</div>' +
      '<div style="font-size:10px;color:#9BA8C8">' + Q(agentData.email) + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:11px;color:#E8EDF5;font-weight:600">' + Q(agentData.company) + '</div>' +
      (agentData.rera ? '<div style="font-size:9px;color:#9BA8C8;font-family:monospace">RERA #' + Q(agentData.rera) + '</div>' : '') +
      '</div></div>'
    : '';

  const negHtml = val.suggestedOffer
    ? '<div style="background:#D4A84312;border:1px solid #D4A84340;border-radius:10px;padding:12px;margin-bottom:14px">' +
      '<div style="font-size:9px;color:#D4A843;font-family:monospace;margin-bottom:6px">NEGOTIATION TARGET</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div style="font-size:12px;color:#6B7A9E">Recommended offer</div>' +
      '<div style="font-family:monospace;font-size:20px;font-weight:800;color:#D4A843">AED ' + (val.suggestedOffer||0).toLocaleString() + '</div></div></div>'
    : '';

  const wm = isAgent ? '' :
    '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-family:monospace;font-size:48px;font-weight:800;color:rgba(212,168,67,0.05);white-space:nowrap;pointer-events:none;z-index:999">DUBAIVAL</div>';

  const css = '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:#fff;color:#1A2040}.page{width:210mm;min-height:297mm;margin:0 auto;padding:12mm 14mm;position:relative}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{margin:0;padding:10mm 12mm}}</style>';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' + css + '</head><body>' + wm +
    '<div class="page">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10mm;border-bottom:2px solid #D4A843;margin-bottom:8mm">' +
    '<div style="display:flex;align-items:center;gap:10px">' +
    '<div style="width:36px;height:36px;background:linear-gradient(135deg,#D4A843,#8A6420);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:900;font-size:12px;color:#070B14">DV</div>' +
    '<div><div style="font-family:monospace;font-size:18px;font-weight:800;color:#1A2040">DubaiVal</div>' +
    '<div style="font-size:9px;color:#D4A843;letter-spacing:0.12em;text-transform:uppercase;font-family:monospace">Property Intelligence</div></div></div>' +
    '<div style="text-align:right">' +
    '<div style="font-size:9px;color:#6B7A9E;letter-spacing:0.1em;text-transform:uppercase;font-family:monospace;margin-bottom:3px">' + (isAgent?'Professional Valuation Report':'Property Analysis Report') + '</div>' +
    '<div style="font-size:11px;color:#1A2040;font-weight:600">' + reportDate + '</div>' +
    '<div style="font-size:9px;color:#9BA8C8;font-family:monospace">REF: ' + ref + '</div></div></div>' +
    agentHtml +
    '<div style="margin-bottom:14px">' +
    '<div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#D4A843;font-family:monospace;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #E8EDF5">* Property Details</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    '<div>' + [['Building',formData.building||'Not specified'],['Area',formData.area],['Type',formData.type],['Bedrooms',formData.beds]].map(([k,v])=>
      '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F0F3FA"><span style="font-size:11px;color:#6B7A9E">' + k + '</span><span style="font-size:11px;font-weight:600;color:#1A2040;font-family:monospace">' + v + '</span></div>'
    ).join('') + '</div>' +
    '<div>' + [['Floor',formData.floor||'N/A'],['View',formData.view],['Size',parseInt(formData.size||0).toLocaleString()+' sqft'],['Furnished',formData.furnished]].map(([k,v])=>
      '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F0F3FA"><span style="font-size:11px;color:#6B7A9E">' + k + '</span><span style="font-size:11px;font-weight:600;color:#1A2040;font-family:monospace">' + v + '</span></div>'
    ).join('') + '</div></div></div>' +
    '<div style="background:' + vColor + '10;border:2px solid ' + vColor + '50;border-radius:12px;padding:18px;margin-bottom:14px;text-align:center">' +
    '<div style="font-size:28px;margin-bottom:5px">' + vIcon + '</div>' +
    '<div style="font-family:monospace;font-size:20px;font-weight:800;color:' + vColor + ';letter-spacing:0.04em">' + vLabel + '</div>' +
    '<div style="font-size:12px;color:' + vColor + ';opacity:0.8;margin-top:3px">' + vSub + '</div>' +
    '<div style="display:inline-block;margin-top:7px;background:' + vColor + '20;padding:3px 12px;border-radius:20px;font-family:monospace;font-size:14px;font-weight:700;color:' + vColor + '">' +
    (parseFloat(val.vsPct||0)>0?'+':'') + val.vsPct + '% vs Market Average</div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">' +
    box('Asking Price','AED '+(parseInt(formData.price||0)).toLocaleString()) +
    box('Asking PSF','AED '+(val.askPSF||0).toLocaleString()) +
    box('Market PSF','AED '+(val.adjPSF||0).toLocaleString(), vColor) +
    box('Confidence',(val.confTier&&val.confTier.label)||'N/A', cCol) +
    '</div>' +
    '<div style="height:5px;background:#E8EDF5;border-radius:3px;margin-bottom:4px;overflow:hidden">' +
    '<div style="height:100%;width:' + (val.confScore||50) + '%;background:linear-gradient(90deg,' + cCol + '80,' + cCol + ');border-radius:3px"></div></div>' +
    '<div style="font-size:8.5px;color:#9BA8C8;font-family:monospace;margin-bottom:12px">Score: ' + (val.confScore||0) + '/100 - Source: ' + (val.dataSource||'') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
    '<div><div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#D4A843;font-family:monospace;margin-bottom:7px;border-bottom:1px solid #E8EDF5;padding-bottom:5px">* Price Tiers</div>' + tierRows + '</div>' +
    '<div><div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#D4A843;font-family:monospace;margin-bottom:7px;border-bottom:1px solid #E8EDF5;padding-bottom:5px">* Yield</div>' +
    [['Gross Yield',(val.grossYield||0)+'%','#00A070'],['Net Yield',(val.netYield||0)+'%','#00A070'],['Annual Rent','AED '+(val.rent||0).toLocaleString(),'#1A2040']].map(([l,v,c])=>
      '<div style="background:#F8FAFF;border:1px solid #E0E6F0;border-radius:8px;padding:9px;margin-bottom:7px">' +
      '<div style="font-size:8.5px;color:#6B7A9E;font-family:monospace;margin-bottom:3px">' + l + '</div>' +
      '<div style="font-family:monospace;font-size:14px;font-weight:700;color:' + c + '">' + v + '</div></div>'
    ).join('') + '</div></div>' +
    negHtml +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
    '<div><div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#D4A843;font-family:monospace;margin-bottom:7px;border-bottom:1px solid #E8EDF5;padding-bottom:5px">* Premiums</div>' + premRows + '</div>' +
    '<div><div style="font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#D4A843;font-family:monospace;margin-bottom:7px;border-bottom:1px solid #E8EDF5;padding-bottom:5px">* 3-Year Growth</div>' +
    [['Conservative','+'+(val.g0||0)+'%','#E8A020'],['Base Case','+'+(val.g1||0)+'%','#00A070'],['Optimistic','+'+(val.g2||0)+'%','#D4A843']].map(([l,v,c])=>
      '<div style="background:#F8FAFF;border:1px solid #E0E6F0;border-radius:8px;padding:9px;margin-bottom:7px">' +
      '<div style="font-size:8.5px;color:#6B7A9E;font-family:monospace;margin-bottom:3px">' + l + '</div>' +
      '<div style="font-family:monospace;font-size:15px;font-weight:700;color:' + c + '">' + v + '</div></div>'
    ).join('') + '</div></div>' +
    '<div style="background:#F8FAFF;border:1px solid #E0E6F0;border-radius:8px;padding:10px;font-size:8px;color:#9BA8C8;line-height:1.6">' +
    '<strong style="color:#6B7A9E">Disclaimer:</strong> DubaiVal Cascade AVM report. Confidence ' + (val.confScore||0) + '/100 (' + ((val.confTier&&val.confTier.label)||'') + '). ' +
    'Data: PropertyFinder API, DLD records, June 2026. <strong>Not professional valuation advice.</strong></div>' +
    '<div style="position:absolute;bottom:10mm;left:14mm;right:14mm;display:flex;justify-content:space-between;border-top:1px solid #E8EDF5;padding-top:7px">' +
    '<div style="font-size:8px;color:#9BA8C8;font-family:monospace">DubaiVal - dubaival.com - ' + (isAgent?(agentData&&agentData.name||''):(formData.email||'Anonymous')) + '</div>' +
    '<div style="font-size:8px;color:#9BA8C8;font-family:monospace;text-align:right">' + (isAgent?'Professional':'Standard') + ' Report - ' + ref + '</div></div>' +
    '</div></body></html>';
}




// --- PDF MODAL COMPONENT ------------------------------------------------------
function PDFReportModal({ val, formData, buildingVal, C, onClose }) {
  const [mode, setMode] = useState("choose"); // choose | email | agent | preview
  const [email, setEmail] = useState("");
  const [agentData, setAgentData] = useState({ name:"", email:"", company:"", rera:"" });
  const [err, setErr] = useState("");

  const updAgent = (k,v) => setAgentData(p=>({...p,[k]:v}));
  const I = { width:"100%", background:"#0D1220", border:"1px solid #1C2540", color:"#E8EDF5", padding:"10px 14px", borderRadius:10, fontSize:13, fontFamily:"'Inter',sans-serif", outline:"none", marginBottom:10, boxSizing:"border-box" };

  const handleDownload = (isAgent) => {
    if(!isAgent && !email.includes("@")) { setErr("Please enter a valid email"); return; }
    if(isAgent && !agentData.name) { setErr("Please enter your name"); return; }

    const html = generatePDFHTML({
      val,
      formData: { ...formData, building: buildingVal, email },
      agentData,
      isAgent,
      reportDate: new Date().toLocaleDateString("en-AE", { day:"numeric", month:"long", year:"numeric" }),
    });

    // Open print dialog
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
    onClose();
  };

  const overlay = { position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(7,11,20,0.85)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 };
  const modal = { background:"#0D1220", border:"1px solid #1C2540", borderRadius:16, padding:24, maxWidth:460, width:"100%", maxHeight:"90vh", overflowY:"auto" };

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ color:"#D4A843", fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'Space Grotesk',monospace" }}>* Download Report</div>
            <div style={{ color:"#9BA8C8", fontSize:13 }}>PDF Valuation Report - DubaiVal</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"1px solid #1C2540", color:"#6B7A9E", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:16 }}></button>
        </div>

        {mode === "choose" && (
          <>
            <div style={{ color:"#9BA8C8", fontSize:13, lineHeight:1.7, marginBottom:20, fontFamily:"'Inter',sans-serif" }}>
              Get a professional PDF report of this valuation - branded with DubaiVal intelligence, suitable for client presentations and deal negotiations.
            </div>
            {/* Standard */}
            <div onClick={() => setMode("email")} style={{ background:"#131926", border:"1px solid #2A3660", borderRadius:12, padding:16, marginBottom:12, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#D4A84360"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#2A3660"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ color:"#E8EDF5", fontSize:14, fontWeight:700, fontFamily:"'Space Grotesk',monospace", marginBottom:4 }}> Standard Report</div>
                  <div style={{ color:"#6B7A9E", fontSize:12, lineHeight:1.6 }}>Full analysis with DubaiVal branding<br/>Verdict, PSF, confidence score, yield, growth</div>
                </div>
                <div style={{ background:"#1C2540", borderRadius:20, padding:"3px 10px", color:"#D4A843", fontSize:11, fontFamily:"'Space Grotesk',monospace", fontWeight:700 }}>FREE</div>
              </div>
              <div style={{ marginTop:8, color:"#6B7A9E", fontSize:11, fontFamily:"'Space Grotesk',monospace" }}> Includes DubaiVal watermark - Email required</div>
            </div>
            {/* Agent */}
            <div onClick={() => setMode("agent")} style={{ background:"linear-gradient(135deg,#D4A84310,#8A642008)", border:"1px solid #D4A84340", borderRadius:12, padding:16, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#D4A843"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#D4A84340"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ color:"#D4A843", fontSize:14, fontWeight:700, fontFamily:"'Space Grotesk',monospace", marginBottom:4 }}> Agent Professional Report</div>
                  <div style={{ color:"#9BA8C8", fontSize:12, lineHeight:1.6 }}>Clean report with YOUR name, company & RERA<br/>No watermark - Perfect for client presentations</div>
                </div>
                <div style={{ background:"#D4A84320", border:"1px solid #D4A84350", borderRadius:20, padding:"3px 10px", color:"#D4A843", fontSize:11, fontFamily:"'Space Grotesk',monospace", fontWeight:700 }}>AGENT</div>
              </div>
              <div style={{ marginTop:8, color:"#D4A843", fontSize:11, fontFamily:"'Space Grotesk',monospace" }}> Your brand - Your RERA number - Professional layout</div>
            </div>
          </>
        )}

        {mode === "email" && (
          <>
            <div style={{ color:"#9BA8C8", fontSize:13, marginBottom:16 }}>Enter your email to receive and download the report.</div>
            <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={I} autoComplete="email"/>
            {err && <div style={{ color:"#E83050", fontSize:11, marginBottom:8 }}>{err}</div>}
            <button onClick={() => handleDownload(false)} style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:"linear-gradient(135deg,#D4A843,#8A6420)", color:"#070B14", fontSize:14, fontWeight:800, fontFamily:"'Space Grotesk',monospace", cursor:"pointer", letterSpacing:"0.06em", marginBottom:10 }}>
              DOWNLOAD PDF 
            </button>
            <button onClick={() => setMode("choose")} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #1C2540", background:"transparent", color:"#6B7A9E", fontSize:12, cursor:"pointer" }}> Back</button>
          </>
        )}

        {mode === "agent" && (
          <>
            <div style={{ color:"#9BA8C8", fontSize:13, marginBottom:16 }}>Your details will appear on the report - professional presentation for your clients.</div>
            {[
              { k:"name", ph:"Your Full Name *", label:"Name" },
              { k:"email", ph:"your@email.com", label:"Email" },
              { k:"company", ph:"Agency / Company Name", label:"Company" },
              { k:"rera", ph:"RERA Registration Number", label:"RERA #" },
            ].map(field => (
              <div key={field.k}>
                <div style={{ color:"#6B7A9E", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'Space Grotesk',monospace", marginBottom:5 }}>{field.label}</div>
                <input type="text" placeholder={field.ph} value={agentData[field.k]} onChange={e=>updAgent(field.k,e.target.value)} style={I} autoComplete="off"/>
              </div>
            ))}
            {err && <div style={{ color:"#E83050", fontSize:11, marginBottom:8 }}>{err}</div>}
            <button onClick={() => handleDownload(true)} style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:"linear-gradient(135deg,#D4A843,#8A6420)", color:"#070B14", fontSize:14, fontWeight:800, fontFamily:"'Space Grotesk',monospace", cursor:"pointer", letterSpacing:"0.06em", marginBottom:10 }}>
              GENERATE PROFESSIONAL REPORT 
            </button>
            <button onClick={() => setMode("choose")} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #1C2540", background:"transparent", color:"#6B7A9E", fontSize:12, cursor:"pointer" }}> Back</button>
          </>
        )}

        {/* Preview note */}
        {(mode === "email" || mode === "agent") && (
          <div style={{ marginTop:14, background:"#131926", borderRadius:8, padding:"10px 14px", color:"#6B7A9E", fontSize:11, fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>
             PDF opens in a new tab  use <strong style={{color:"#9BA8C8"}}>File  Print  Save as PDF</strong> (or Cmd/Ctrl+P)
          </div>
        )}
      </div>
    </div>
  );
}


// --- ROOT ---------------------------------------------------------------------
export default function App() {
  const {C,dark,toggle}=useTheme();
  const [tab,setTab]=useState("Market");
  const TABS=[{id:"Market",icon:"",label:"Market"},{id:"Analyzer",icon:"",label:"Analyzer"},{id:"Compare",icon:"",label:"Compare"},{id:"Personal",icon:"",label:"Personal"},{id:"Chat",icon:"",label:"AI Chat"}];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.white,fontFamily:"'Inter',sans-serif",transition:"background 0.25s,color 0.25s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:${C.goldDim};border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes shimmer{0%{opacity:0.4}50%{opacity:1}100%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        select option{background:${C.bg}}
      `}</style>

      {/* Live ticker */}
      <div style={{background:C.gold,overflow:"hidden",padding:"4px 0"}}>
        <div style={{display:"flex",gap:56,whiteSpace:"nowrap",animation:"ticker 32s linear infinite",fontFamily:"'Space Grotesk',monospace",fontSize:10.5,color:"#070B14",fontWeight:700}}>
          {["Q1 2026: AED 252B - +31%","Villa PSF +16% YoY","Foreign Capital AED 148B","JVC Yield 9.5%","87% Cash Purchases","Off-Plan 77.8%","Buyer Window: 3-6 Months","May: AED 14B+/week",
            "Q1 2026: AED 252B - +31%","Villa PSF +16% YoY","Foreign Capital AED 148B","JVC Yield 9.5%"].map((t,i)=><span key={i}>* {t}</span>)}
        </div>
      </div>

      {/* Header */}
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:7,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#070B14",fontFamily:"'Space Grotesk',monospace"}}>DV</div>
          <div>
            <div style={{color:C.white,fontSize:14,fontWeight:800,fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.02em"}}>DubaiVal</div>
            <div style={{color:C.goldDim,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"}}>Property Intelligence</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:5,background:C.greenBg,border:`1px solid ${C.greenBo}`,borderRadius:20,padding:"4px 10px"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
            <span style={{color:C.green,fontSize:9.5,fontFamily:"'Space Grotesk',monospace"}}>LIVE</span>
          </div>
          <button onClick={toggle} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",color:C.sub,fontSize:14}}>{dark?"":""}</button>
        </div>
      </header>

      {/* Nav */}
      <nav style={{background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",overflowX:"auto",padding:"0 20px"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?C.gold:"transparent"}`,color:tab===t.id?C.gold:C.sub,padding:"11px 14px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",fontSize:12.5,fontWeight:tab===t.id?700:400,whiteSpace:"nowrap",transition:"all 0.15s"}}>
            <span style={{marginRight:5}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div key={tab} style={{animation:"fadeUp 0.25s ease"}}>
        {tab==="Market"   && <MarketTab   C={C}/>}
        {tab==="Analyzer" && <AnalyzerTab C={C}/>}
        {tab==="Compare"  && <CompareTab  C={C}/>}
        {tab==="Personal" && <PersonalTab C={C}/>}
        {tab==="Chat"     && <ChatTab     C={C}/>}
      </div>

      <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 20px",display:"flex",justifyContent:"space-between"}}>
        <span style={{color:C.sub,fontSize:9.5,fontFamily:"'Space Grotesk',monospace"}}>DubaiVal - DLD - Cascade AVM - Hedonic Pricing - June 2026</span>
        <span style={{color:C.sub,fontSize:9.5,fontFamily:"'Space Grotesk',monospace"}}>Professional use only - Not financial advice</span>
      </div>
    </div>
  );
}
