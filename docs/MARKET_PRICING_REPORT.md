# Rapport d'Analyse et de Mise à Jour Tarifaire du Marché (K-Beauty Maroc)

> Ce rapport détaille l'alignement des prix de la base de données interne sur les relevés concurrents marocains issus de `all_products_filtered_brands.csv` (Velvet Glow, KBeauty Maroc, Herboda).

## 1. Synthèse Globale

| Indicateur | Nombre |
| :--- | :--- |
| **Total des produits au catalogue** | **323** |
| **Produits analysés et mis à jour** | **132** |
| ↳ *Produits existants passés en promo (prix barré augmenté, prix de vente préservé)* | 23 |
| ↳ *Nouveaux produits avec promo (prix de vente = minimum marché, prix barré = maximum marché)* | 49 |
| ↳ *Nouveaux produits avec prix unique constaté* | 60 |
| **Produits où notre prix est le plus élevé (conservés inchangés)** | **38** |
| **Produits sans correspondance marché (conservés inchangés)** | **153** |
| **Total des produits actuellement en promotion active (`compare_at_dh > price_dh`)** | **72** |

---

## 2. Produits où notre prix est le plus élevé du marché (38 produits)

Conformément à la consigne, ces produits sont conservés strictement inchangés pour préserver notre marge maximale.

| ID | Réf / SKU | Produit | Notre Prix | Prix Relevés sur le Marché | Sources Concurrents |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 3 | `KG-0003` | **SKIN1004 SKIN1004 Madagascar Centella Ampoule Kit (4 x 30ml)** | **300 DH** | 299 DH | Herboda (299 DH) |
| 10 | `KG-0010` | **COSRX COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++** | **230 DH** | 210 DH | Herboda (210 DH) |
| 13 | `KG-0013` | **SKIN1004 SKIN1004 Madagascar Centella Tea-Trica Relief Ampoule 100ml** | **270 DH** | 235 DH | Herboda (235 DH) |
| 17 | `KG-0017` | **Dr. Althea Dr. Althea Aqua Marine Watery Cream 50ml** | **260 DH** | 260 DH | KBeauty Maroc (260 DH) |
| 22 | `KG-0022` | **SKIN1004 SKIN1004 Madagascar Centella Hyalu-Cica Water-Fit Sun Serum SPF50+ PA++++ 100ml** | **310 DH** | 230 DH | KBeauty Maroc (230 DH) |
| 26 | `KG-0026` | **numbuzin numbuzin No.9+ NAD+ Peptides Dewy Sun Essence SPF50+ PA++++ 50ml** | **230 DH** | 195 DH | Herboda (195 DH) |
| 29 | `KG-0029` | **Biodance Biodance Refreshing Sea Kelp Real Deep Mask (4 sheets)** | **300 DH** | 270 DH | Herboda (270 DH) |
| 31 | `KG-0031` | **AXIS-Y AXIS-Y Dark Spot Correcting Glow Serum** | **230 DH** | 229 DH, 230 DH | KBeauty Maroc (229 DH), Herboda (230 DH) |
| 32 | `KG-0032` | **Biodance Biodance Bio Collagen Real Deep Mask (4 sheets)** | **320 DH** | 275 DH | Herboda (275 DH) |
| 33 | `KG-0033` | **AXIS-Y AXIS-Y Spot The Difference Blemish Treatment** | **220 DH** | 125 DH | Herboda (125 DH) |
| 35 | `KG-0035` | **AXIS-Y AXIS-Y PHA Resurfacing Glow Peel** | **240 DH** | 125 DH | Herboda (125 DH) |
| 46 | `KG-0046` | **SOME BY MI SOME BY MI Beta Panthenol Repair Toner 150ml** | **260 DH** | 200 DH, 210 DH | Herboda (200 DH), Herboda (210 DH) |
| 53 | `KG-0053` | **Medicube Medicube PDRN Pink Collagen Capsule Cream 55g** | **290 DH** | 255 DH | Herboda (255 DH) |
| 56 | `KG-0056` | **SKIN1004 SKIN1004 Madagascar Centella Matrixyl 10 Boosting Shot Ampoule 30ml** | **280 DH** | 245 DH, 255 DH | Herboda (255 DH), Herboda (245 DH) |
| 57 | `KG-0057` | **SKIN1004 SKIN1004 Madagascar Centella Niacinamide 10 Boosting Shot Ampoule 30ml** | **290 DH** | 255 DH | Herboda (255 DH) |
| 58 | `KG-0058` | **SKIN1004 SKIN1004 Madagascar Centella Retinol 0.2 Boosting Shot Ampoule 30ml** | **290 DH** | 245 DH | Herboda (245 DH) |
| 59 | `KG-0059` | **SKIN1004 SKIN1004 Madagascar Centella Soothing Cream 75ml** | **280 DH** | 240 DH, 260 DH | Velvet Glow (260 DH), Herboda (240 DH) |
| 63 | `KG-0063` | **SKIN1004 SKIN1004 Madagascar Centella Ampoule 100ml** | **280 DH** | 225 DH, 235 DH | Herboda (235 DH), Herboda (225 DH) |
| 64 | `KG-0064` | **SKIN1004 SKIN1004 Madagascar Centella Tone Brightening Boosting Toner 210ml** | **260 DH** | 245 DH, 250 DH | Herboda (250 DH), Herboda (245 DH) |
| 68 | `KG-0068` | **Anua Anua Heartleaf Pore Control Cleansing Oil 200ml** | **270 DH** | 250 DH, 259 DH, 269 DH | Velvet Glow (250 DH), KBeauty Maroc (259 DH), KBeauty Maroc (269 DH), Herboda (269 DH), Herboda (269 DH) |
| 69 | `KG-0069` | **Anua Anua Heartleaf Quercetinol Pore Deep Cleansing Foam 150ml** | **250 DH** | 195 DH, 209 DH, 215 DH | KBeauty Maroc (209 DH), Herboda (195 DH), Herboda (215 DH) |
| 70 | `KG-0070` | **Beauty of Joseon Beauty of Joseon Relief Sun Aqua-Fresh Rice + B5 SPF50+ PA++++** | **220 DH** | 215 DH | KBeauty Maroc (215 DH) |
| 71 | `KG-0071` | **Beauty of Joseon Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++** | **220 DH** | 210 DH, 215 DH | KBeauty Maroc (215 DH), KBeauty Maroc (210 DH) |
| 74 | `KG-0074` | **Anua Anua Zero-Cast Moisturizing Finish Sunscreen SPF50+ PA++++ 50ml** | **280 DH** | 260 DH | Herboda (260 DH) |
| 75 | `KG-0075` | **Anua Anua Airy Sun Cream Cica + Heartleaf SPF50+ PA++++ 50ml** | **280 DH** | 160 DH, 239 DH | Herboda (239 DH), Herboda (160 DH) |
| 76 | `KG-0076` | **Dr. Althea Dr. Althea Pure Grinding Cleansing Balm 50ml** | **290 DH** | 245 DH, 265 DH | Herboda (245 DH), Herboda (265 DH) |
| 79 | `KG-0079` | **Beauty of Joseon Beauty of Joseon Glow Replenishing Rice Milk** | **290 DH** | 289 DH | Herboda (289 DH) |
| 81 | `KG-0081` | **Dr. Althea Dr. Althea Gentle Vitamin C Serum 30ml** | **290 DH** | 260 DH, 270 DH, 275 DH | Velvet Glow (260 DH), Velvet Glow (260 DH), Herboda (270 DH), Herboda (275 DH) |
| 82 | `KG-0082` | **Dr. Althea Dr. Althea Vitamin C Boosting Serum 30ml** | **290 DH** | 260 DH, 270 DH, 275 DH | Velvet Glow (260 DH), Velvet Glow (260 DH), KBeauty Maroc (260 DH), Herboda (270 DH), Herboda (275 DH) |
| 83 | `KG-0083` | **AXIS-Y AXIS-Y Complete No-Stress Physical Sunscreen Ver.3 SPF50+ PA++++ 50ml** | **280 DH** | 250 DH | Velvet Glow (250 DH) |
| 84 | `KG-0084` | **AXIS-Y AXIS-Y Vegan Collagen Eye Serum 10ml** | **265 DH** | 195 DH, 230 DH, 235 DH | Velvet Glow (230 DH), KBeauty Maroc (235 DH), Herboda (195 DH) |
| 85 | `KG-0085` | **Arencia Arencia Eraser Shot Glycolic Acid Booster 30ml** | **300 DH** | 240 DH | KBeauty Maroc (240 DH) |
| 86 | `KG-0086` | **Arencia Arencia PDRN Booster Shot 30ml** | **260 DH** | 240 DH | KBeauty Maroc (240 DH), KBeauty Maroc (240 DH), KBeauty Maroc (240 DH) |
| 87 | `KG-0087` | **Arencia Arencia Retinal Booster Shot 30ml** | **280 DH** | 240 DH | KBeauty Maroc (240 DH), KBeauty Maroc (240 DH), KBeauty Maroc (240 DH) |
| 89 | `KG-0089` | **numbuzin numbuzin No.9 NAD+ PDRN Glow Boosting Toner 150ml** | **290 DH** | 279 DH | KBeauty Maroc (279 DH) |
| 90 | `KG-0090` | **numbuzin numbuzin No.9 NAD+ Retinol Volumetox Eye Cream 10ml** | **280 DH** | 259 DH | KBeauty Maroc (259 DH) |
| 91 | `KG-0091` | **Shiseido Fino Shiseido Fino Premium Touch Hair Mask 230g** | **270 DH** | 260 DH | KBeauty Maroc (260 DH) |
| 96 | `KG-0096` | **SKIN1004 SKIN1004 Madagascar Centella Poremizing Deep Cleansing Foam 125ml** | **245 DH** | 195 DH, 235 DH | Herboda (235 DH), Herboda (195 DH) |

---

## 3. Produits Existants passés en Promotion (Astuce Marketing - 23 produits)

Pour ces produits, un concurrent pratique un prix supérieur à notre prix actuel. Le prix de vente réel (`price_dh`) reste identique pour le client, tandis que le prix par défaut (`compare_at_dh`) a été rehaussé au niveau maximum du marché pour créer l'effet promotionnel.

| ID | Réf / SKU | Produit | Prix Réel Client | Nouveau Prix Barré | Réduction Affichée | Sources Marché |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 2 | `KG-0002` | **Arencia Arencia Vitamin C Booster Shot 30ml** | **220 DH** | ~~240 DH~~ | `-8%` | KBeauty Maroc (240 DH) |
| 5 | `KG-0005` | **Medicube Medicube Azelaic Acid 16 BB Calming Serum 30ml** | **250 DH** | ~~285 DH~~ | `-12%` | Herboda (285 DH) |
| 6 | `KG-0006` | **Anua Anua Heartleaf Pore Control Cleansing Oil Mild 200ml** | **240 DH** | ~~269 DH~~ | `-11%` | Velvet Glow (250 DH), KBeauty Maroc (259 DH), KBeauty Maroc (269 DH), Herboda (269 DH), Herboda (269 DH) |
| 7 | `KG-0007` | **Anua Anua Peach 70 Niacin Serum 30ml** | **240 DH** | ~~289 DH~~ | `-17%` | Herboda (275 DH), Herboda (289 DH) |
| 11 | `KG-0011` | **Medicube Medicube Collagen Firming Sun Cream SPF50+ PA++++ 50ml** | **260 DH** | ~~275 DH~~ | `-5%` | Herboda (275 DH) |
| 20 | `KG-0020` | **SKIN1004 SKIN1004 Madagascar Centella Double Cleansing Duo** | **370 DH** | ~~430 DH~~ | `-14%` | Velvet Glow (430 DH) |
| 21 | `KG-0021` | **SKIN1004 SKIN1004 Madagascar Centella Glow 1004 Duo** | **400 DH** | ~~430 DH~~ | `-7%` | Velvet Glow (430 DH), KBeauty Maroc (265 DH), Herboda (299 DH) |
| 23 | `KG-0023` | **SKIN1004 SKIN1004 Madagascar Centella Hyalu-Cica Water-Fit Sun Serum SPF50+ PA++++ 50ml** | **220 DH** | ~~230 DH~~ | `-4%` | Velvet Glow (220 DH), KBeauty Maroc (230 DH) |
| 25 | `KG-0025` | **Celimax Celimax Retinal Shot Tightening Booster 15ml** | **200 DH** | ~~250 DH~~ | `-20%` | Velvet Glow (250 DH), KBeauty Maroc (205 DH) |
| 34 | `KG-0034` | **AXIS-Y AXIS-Y Artichoke Intensive Skin Barrier Ampoule** | **220 DH** | ~~260 DH~~ | `-15%` | KBeauty Maroc (250 DH), Herboda (260 DH) |
| 47 | `KG-0047` | **SOME BY MI SOME BY MI Beta Panthenol Repair Serum 30ml** | **230 DH** | ~~245 DH~~ | `-6%` | Herboda (245 DH) |
| 54 | `KG-0054` | **Medicube Medicube TXA Niacinamide 15 Serum 30ml** | **290 DH** | ~~295 DH~~ | `-2%` | Herboda (275 DH), Herboda (295 DH) |
| 61 | `KG-0061` | **SKIN1004 SKIN1004 Madagascar Centella Light Cleansing Oil 200ml** | **250 DH** | ~~285 DH~~ | `-12%` | KBeauty Maroc (265 DH), Herboda (245 DH), Herboda (285 DH) |
| 62 | `KG-0062` | **SKIN1004 SKIN1004 Madagascar Centella Ampoule Foam 125ml** | **260 DH** | ~~275 DH~~ | `-5%` | Velvet Glow (230 DH), KBeauty Maroc (250 DH), Herboda (275 DH) |
| 65 | `KG-0065` | **SKIN1004 SKIN1004 Madagascar Centella Probio-Cica Intensive Ampoule 95ml** | **260 DH** | ~~290 DH~~ | `-10%` | Herboda (255 DH), Herboda (290 DH) |
| 66 | `KG-0066` | **SKIN1004 SKIN1004 Madagascar Centella Probio-Cica Bakuchiol Eye Cream 20ml** | **245 DH** | ~~285 DH~~ | `-14%` | KBeauty Maroc (250 DH), Herboda (235 DH), Herboda (285 DH) |
| 72 | `KG-0072` | **Anua Anua Azelaic Acid 10 Hyaluron Redness Soothing Serum 30ml** | **280 DH** | ~~299 DH~~ | `-6%` | Velvet Glow (260 DH), Herboda (299 DH) |
| 73 | `KG-0073` | **Beauty of Joseon Beauty of Joseon Matte Sun Stick Mugwort + Camelia SPF50+ PA++++** | **220 DH** | ~~289 DH~~ | `-24%` | Herboda (289 DH) |
| 77 | `KG-0077` | **Dr. Althea Dr. Althea 147 Barrier Cream** | **280 DH** | ~~289 DH~~ | `-3%` | Velvet Glow (260 DH), KBeauty Maroc (260 DH), Herboda (285 DH), Herboda (289 DH) |
| 78 | `KG-0078` | **Dr. Althea Dr. Althea 345 Relief Cream** | **280 DH** | ~~289 DH~~ | `-3%` | KBeauty Maroc (260 DH), Herboda (230 DH), Herboda (289 DH) |
| 80 | `KG-0080` | **Beauty of Joseon Beauty of Joseon Dynasty Cream 50ml** | **295 DH** | ~~315 DH~~ | `-6%` | Herboda (295 DH), Herboda (315 DH) |
| 88 | `KG-0088` | **Arencia Arencia Fresh Green Rice Mochi Cleanser 120g** | **260 DH** | ~~270 DH~~ | `-4%` | KBeauty Maroc (270 DH), KBeauty Maroc (260 DH), KBeauty Maroc (270 DH), KBeauty Maroc (270 DH) |
| 95 | `KG-0095` | **SKIN1004 SKIN1004 Madagascar Centella Poremizing Fresh Ampoule 100ml** | **260 DH** | ~~290 DH~~ | `-10%` | KBeauty Maroc (275 DH), Herboda (260 DH), Herboda (235 DH), Herboda (225 DH), Herboda (290 DH) |

---

## 4. Nouveaux Produits avec Fourchette Concurrentielle (En Promo - 49 produits)

Produits qui n'avaient pas encore de prix et pour lesquels au moins 2 prix différents ont été identifiés sur le marché : le prix le plus bas devient le prix de vente (`price_dh`) et le plus élevé devient le prix barré (`compare_at_dh`).

| ID | Réf / SKU | Produit | Prix Promo (Min Marché) | Prix Barré (Max Marché) | Écart / Remise | Sources Marché |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 103 | `KSG-R-81E656B6B84F55` | **Anua Heartleaf 77 Soothing Toner** | **225 DH** | ~~280 DH~~ | `-20%` | Herboda (225 DH), Herboda (259 DH), Herboda (280 DH) |
| 109 | `KSG-R-4C1942CE355A09` | **Anua Peach 77 Niacin Essence Toner** | **279 DH** | ~~289 DH~~ | `-3%` | Herboda (289 DH), Herboda (279 DH) |
| 111 | `KSG-R-CA2D37DE129FC5` | **Anua Azelaic 10 Hyaluron Redness Soothing Pad** | **255 DH** | ~~310 DH~~ | `-18%` | KBeauty Maroc (310 DH), Herboda (255 DH) |
| 115 | `KSG-R-BF908994C37577` | **Anua Niacinamide 10 TXA 4 Serum for Brightening and Dark Spots** | **225 DH** | ~~339 DH~~ | `-34%` | KBeauty Maroc (269 DH), Herboda (225 DH), Herboda (339 DH), Herboda (289 DH) |
| 116 | `KSG-R-1CAD1EE86C29E9` | **Anua PDRN Hyaluronic Acid Capsule 100 Serum** | **235 DH** | ~~299 DH~~ | `-21%` | Velvet Glow (260 DH), KBeauty Maroc (275 DH), Herboda (235 DH), Herboda (299 DH) |
| 118 | `KSG-R-7CE8C97B4725C2` | **Anua Rice Ceramide 7 Hydrating Barrier Serum** | **260 DH** | ~~295 DH~~ | `-12%` | Herboda (260 DH), Herboda (295 DH) |
| 119 | `KSG-R-ACA8A6D988BF5E` | **Anua Heartleaf 80% Moisture Soothing Ampoule** | **270 DH** | ~~389 DH~~ | `-31%` | Herboda (270 DH), Herboda (389 DH) |
| 121 | `KSG-R-9C369631DFD3AC` | **Anua Heartleaf 70 Daily Lotion** | **265 DH** | ~~279 DH~~ | `-5%` | KBeauty Maroc (279 DH), Herboda (265 DH), Herboda (269 DH) |
| 131 | `KSG-R-BC323E829CCB3A` | **COSRX Advanced Snail 96 Mucin Power Essence** | **249 DH** | ~~279 DH~~ | `-11%` | KBeauty Maroc (249 DH), Herboda (255 DH), Herboda (279 DH) |
| 132 | `KSG-R-FD8F58215FC2FA` | **COSRX Advanced Snail 92 All in One Cream** | **259 DH** | ~~280 DH~~ | `-7%` | KBeauty Maroc (280 DH), Herboda (259 DH) |
| 148 | `KSG-R-E2E7CF15AFC948` | **COSRX Acne Pimple Master Patch** | **55 DH** | ~~69 DH~~ | `-20%` | Herboda (55 DH), Herboda (69 DH) |
| 153 | `KSG-R-9452B2E9EDA56B` | **COSRX The Retinol 0.1 Cream** | **269 DH** | ~~295 DH~~ | `-9%` | KBeauty Maroc (269 DH), Herboda (295 DH) |
| 154 | `KSG-R-A087334F52CA10` | **COSRX The Retinol 0.5 Oil** | **295 DH** | ~~349 DH~~ | `-15%` | KBeauty Maroc (349 DH), Herboda (310 DH), Herboda (295 DH) |
| 155 | `KSG-R-60E25D831D463B` | **COSRX The Niacinamide 15 Serum** | **245 DH** | ~~295 DH~~ | `-17%` | Herboda (245 DH), Herboda (295 DH) |
| 161 | `KSG-R-142C261DC92038` | **SKIN1004 Centella Light Cleansing Oil** | **245 DH** | ~~285 DH~~ | `-14%` | KBeauty Maroc (265 DH), Herboda (245 DH), Herboda (285 DH) |
| 167 | `KSG-R-5D86DFE6076BA3` | **SKIN1004 Poremizing Fresh Ampoule** | **260 DH** | ~~290 DH~~ | `-10%` | KBeauty Maroc (275 DH), Herboda (260 DH), Herboda (290 DH) |
| 169 | `KSG-R-3A5EBC8946FBCD` | **SKIN1004 Tone Brightening Capsule Ampoule** | **245 DH** | ~~320 DH~~ | `-23%` | KBeauty Maroc (245 DH), Herboda (320 DH) |
| 172 | `KSG-R-01F777E64511BE` | **SKIN1004 Probio-Cica Intensive Ampoule** | **255 DH** | ~~290 DH~~ | `-12%` | Herboda (255 DH), Herboda (290 DH) |
| 174 | `KSG-R-B27FC5423D749E` | **SKIN1004 Matrixyl 10 Boosting Shot Ampoule** | **245 DH** | ~~255 DH~~ | `-4%` | Herboda (255 DH), Herboda (245 DH) |
| 176 | `KSG-R-A06EE33DF19B14` | **SKIN1004 Hyalu-Cica First Ampoule** | **175 DH** | ~~225 DH~~ | `-22%` | Herboda (225 DH), Herboda (175 DH) |
| 178 | `KSG-R-34162ABF1169F1` | **SKIN1004 Probio-Cica Essence Toner** | **259 DH** | ~~279 DH~~ | `-7%` | KBeauty Maroc (259 DH), Herboda (279 DH) |
| 192 | `KSG-R-38CA7B83685DFA` | **SKIN1004 Probio-Cica Bakuchiol Eye Cream** | **235 DH** | ~~285 DH~~ | `-18%` | KBeauty Maroc (250 DH), Herboda (235 DH), Herboda (285 DH) |
| 193 | `KSG-R-209E9E790826A0` | **SKIN1004 Hyalu-Cica Water-Fit Sun Serum UV** | **179 DH** | ~~230 DH~~ | `-22%` | Velvet Glow (220 DH), KBeauty Maroc (230 DH), Herboda (225 DH), Herboda (225 DH), Herboda (179 DH) |
| 195 | `KSG-R-E1F9C8168939D2` | **Beauty of Joseon Ginseng Cleansing Oil** | **199 DH** | ~~275 DH~~ | `-28%` | Herboda (275 DH), Herboda (199 DH) |
| 202 | `KSG-R-7BA4480291F171` | **Beauty of Joseon Revive Eye Serum : Ginseng + Retinal** | **240 DH** | ~~279 DH~~ | `-14%` | KBeauty Maroc (279 DH), Herboda (240 DH) |
| 206 | `KSG-R-2E54F5CE0FA321` | **Beauty of Joseon Light On Serum : Centella + Vita C** | **235 DH** | ~~269 DH~~ | `-13%` | KBeauty Maroc (249 DH), Herboda (235 DH), Herboda (269 DH) |
| 209 | `KSG-R-DBE1407972A766` | **Beauty of Joseon Calming Barrier Mask** | **45 DH** | ~~65 DH~~ | `-31%` | Herboda (45 DH), Herboda (65 DH) |
| 210 | `KSG-R-83BDB3C57B4E31` | **Beauty of Joseon Revive Under Eye Patch: Ginseng + Retinal** | **240 DH** | ~~279 DH~~ | `-14%` | KBeauty Maroc (279 DH), Herboda (240 DH) |
| 211 | `KSG-R-FB23E6AC2760E9` | **Beauty of Joseon Ground Rice and Honey Glow Mask** | **250 DH** | ~~279 DH~~ | `-10%` | Velvet Glow (250 DH), KBeauty Maroc (275 DH), Herboda (279 DH), Herboda (279 DH) |
| 212 | `KSG-R-9628AF032D8FA4` | **Beauty of Joseon Red Bean Refreshing Pore Mask** | **250 DH** | ~~305 DH~~ | `-18%` | Velvet Glow (250 DH), Herboda (305 DH) |
| 213 | `KSG-R-EC9A5CE3D977A7` | **Beauty of Joseon Tinted Mineral Dayscreen SPF 30** | **215 DH** | ~~289 DH~~ | `-26%` | KBeauty Maroc (235 DH), KBeauty Maroc (215 DH), Herboda (289 DH) |
| 214 | `KSG-R-ED09387B959728` | **Beauty of Joseon Dayscreen Moisturizer SPF 30** | **175 DH** | ~~289 DH~~ | `-39%` | KBeauty Maroc (235 DH), KBeauty Maroc (215 DH), KBeauty Maroc (210 DH), Herboda (175 DH), Herboda (215 DH), Herboda (289 DH) |
| 215 | `KSG-R-CACB939A52C4B1` | **Beauty of Joseon Day Dew Sunscreen SPF 50** | **175 DH** | ~~289 DH~~ | `-39%` | Velvet Glow (220 DH), KBeauty Maroc (235 DH), KBeauty Maroc (215 DH), Herboda (175 DH), Herboda (215 DH), Herboda (289 DH), Herboda (289 DH) |
| 218 | `KSG-R-35196484960597` | **Medicube PDRN Pink Collagen Exosome Shot** | **265 DH** | ~~295 DH~~ | `-10%` | Herboda (265 DH), Herboda (295 DH) |
| 221 | `KSG-R-31CEACC3116C11` | **Medicube PDRN Pink Peptide Cream** | **255 DH** | ~~280 DH~~ | `-9%` | Herboda (255 DH), Herboda (280 DH) |
| 222 | `KSG-R-B92CE4138394E0` | **Medicube PDRN Pink Collagen Glow Jelly Mist Serum** | **275 DH** | ~~285 DH~~ | `-4%` | Herboda (275 DH), Herboda (285 DH) |
| 224 | `KSG-R-8B6FD13031DF73` | **Medicube Zero Pore Pads** | **285 DH** | ~~300 DH~~ | `-5%` | Velvet Glow (285 DH), Herboda (300 DH) |
| 227 | `KSG-R-026E752F4720E5` | **Medicube Collagen Niacinamide Jelly Cream** | **275 DH** | ~~299 DH~~ | `-8%` | Velvet Glow (280 DH), Herboda (299 DH), Herboda (275 DH) |
| 230 | `KSG-R-07BC7309373F51` | **Medicube PDRN Pink Peptide Eye Cream** | **245 DH** | ~~250 DH~~ | `-2%` | Herboda (245 DH), Herboda (250 DH) |
| 234 | `KSG-R-FA15A6FDFAB06C` | **Medicube TXA Niacinamide Capsule Cream** | **280 DH** | ~~295 DH~~ | `-5%` | Herboda (280 DH), Herboda (295 DH) |
| 237 | `KSG-R-439CD9295C0095` | **Medicube Zero Pore One-day Peptide Serum** | **285 DH** | ~~295 DH~~ | `-3%` | Herboda (285 DH), Herboda (295 DH) |
| 239 | `KSG-R-01329351107107` | **Medicube Zero Foam Cleanser** | **215 DH** | ~~295 DH~~ | `-27%` | Herboda (215 DH), Herboda (295 DH) |
| 240 | `KSG-R-0F60C61FA03944` | **Medicube Deep Vita C Capsule Cream** | **280 DH** | ~~285 DH~~ | `-2%` | Velvet Glow (280 DH), Herboda (285 DH) |
| 241 | `KSG-R-D6134879037738` | **Medicube Deep Vita C Pads** | **245 DH** | ~~295 DH~~ | `-17%` | Herboda (245 DH), Herboda (295 DH) |
| 251 | `KSG-R-1E76CB07DA7D81` | **Dr. Althea Pore Refresh Grinding Cleansing Balm** | **245 DH** | ~~265 DH~~ | `-8%` | Herboda (245 DH), Herboda (265 DH) |
| 280 | `KSG-R-CD5A25AF88A8C3` | **AXIS-Y TXA 3% Intensive Radiance Boosting Serum** | **250 DH** | ~~260 DH~~ | `-4%` | KBeauty Maroc (250 DH), Herboda (260 DH) |
| 292 | `KSG-R-388DFA1394252A` | **SOME BY MI Retinol Intense Advanced Triple Action Eye Cream** | **245 DH** | ~~249 DH~~ | `-2%` | KBeauty Maroc (249 DH), Herboda (245 DH) |
| 304 | `KSG-R-22AF5C8A47429C` | **Arencia Fresh Rosehip Rice Mochi Cleanser** | **260 DH** | ~~270 DH~~ | `-4%` | KBeauty Maroc (270 DH), KBeauty Maroc (260 DH), KBeauty Maroc (270 DH), KBeauty Maroc (270 DH) |
| 306 | `KSG-R-8D220F8693DE9B` | **Arencia Calendula Rice Mochi Cleanser** | **260 DH** | ~~270 DH~~ | `-4%` | KBeauty Maroc (270 DH), KBeauty Maroc (260 DH), KBeauty Maroc (270 DH), KBeauty Maroc (270 DH) |

---

## 5. Nouveaux Produits avec Prix Unique Constaté (60 produits)

Produits précédemment sans prix où un tarif unique a été relevé chez les concurrents.

| ID | Réf / SKU | Produit | Prix Attribué | Source & Prix Relevé |
| :---: | :--- | :--- | :---: | :--- |
| 97 | `KSG-R-31D479A7587CDC` | **Anua 8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser** | **230 DH** | Herboda (230 DH) |
| 99 | `KSG-R-423F6AF9B5E850` | **Anua Rice Enzyme Brightening Cleansing Powder** | **305 DH** | Herboda (305 DH) |
| 100 | `KSG-R-85179D17C6D165` | **Anua 8 Hyaluronic Acid Moisturizing Gentle Gel Cleanser** | **230 DH** | Herboda (230 DH) |
| 101 | `KSG-R-547C4789536E83` | **Anua Heartleaf Low pH Deep Cleansing Water** | **279 DH** | Herboda (279 DH) |
| 107 | `KSG-R-B7D9BCA94E8207` | **Anua Rice 70 Glow Milky Toner** | **279 DH** | Herboda (279 DH) |
| 108 | `KSG-R-F629C061D11220` | **Anua BHA 2% Gentle Exfoliating Toner** | **295 DH** | Herboda (295 DH) |
| 110 | `KSG-R-16795B7D53AA51` | **Anua Niacinamide 5 TXA Brightening Pad** | **275 DH** | Herboda (275 DH) |
| 112 | `KSG-R-5FC710922A92C6` | **Anua PDRN 100 Hyaluronic Acid Glow Pad** | **275 DH** | Herboda (275 DH) |
| 113 | `KSG-R-05945E9940EFD6` | **Anua Heartleaf 77 Clear Pad** | **275 DH** | Herboda (275 DH), Herboda (275 DH) |
| 117 | `KSG-R-3BAD780DAD8433` | **Anua Nano Retinol 0.3% + Niacin Renewing Serum** | **419 DH** | Herboda (419 DH) |
| 120 | `KSG-R-82DD1F322EB51B` | **Anua PDRN Hyaluronic Acid 100 Moisturizing Cream** | **260 DH** | Herboda (260 DH) |
| 127 | `KSG-R-16251BEE4ECFC0` | **COSRX The 6 Peptide Skin Booster Serum** | **295 DH** | Herboda (295 DH) |
| 128 | `KSG-R-4232659FBF6008` | **COSRX The Ceramide Skin Barrier Moisturizer** | **279 DH** | Herboda (279 DH) |
| 133 | `KSG-R-EBA2DF8DDB3D09` | **COSRX Advanced Snail Peptide Eye Cream** | **329 DH** | Herboda (329 DH) |
| 134 | `KSG-R-96F801778EBB8C` | **COSRX Hyaluronic Acid Intensive Cream** | **299 DH** | Herboda (299 DH) |
| 135 | `KSG-R-6A97861356ADF8` | **COSRX Advanced Snail Mucin Gel Cleanser** | **329 DH** | Herboda (329 DH) |
| 137 | `KSG-R-2818EBDA1E34DF` | **COSRX BHA Blackhead Power Liquid** | **239 DH** | Herboda (239 DH) |
| 138 | `KSG-R-C68A35991F30C6` | **COSRX Low pH Good Morning Gel Cleanser** | **165 DH** | Herboda (165 DH) |
| 140 | `KSG-R-7E524A508B78B0` | **COSRX Full Fit Propolis Synergy Toner** | **199 DH** | Herboda (199 DH) |
| 144 | `KSG-R-CE367CDA15EA42` | **COSRX Advanced Snail Mucin Glass Glow Hydrogel Mask** | **69 DH** | Herboda (69 DH) |
| 145 | `KSG-R-EE9F2845B1F300` | **COSRX Advanced Snail Radiance Dual Essence** | **340 DH** | Herboda (340 DH) |
| 149 | `KSG-R-D5DEFA19BEF41D` | **COSRX Advanced Snail Mucin Power Sheet Mask 10 Sheets** | **69 DH** | Herboda (69 DH) |
| 150 | `KSG-R-4AC6476FDA9374` | **COSRX AHA/BHA Clarifying Treatment Toner** | **265 DH** | Herboda (265 DH) |
| 151 | `KSG-R-B4EDAC55852054` | **COSRX Ultimate Nourishing Rice Overnight Spa Mask** | **260 DH** | KBeauty Maroc (260 DH) |
| 152 | `KSG-R-EB7946EAF29E13` | **COSRX The Vitamin C 13 Serum** | **299 DH** | Herboda (299 DH) |
| 162 | `KSG-R-8CB7D6C6EE572E` | **SKIN1004 Poremizing Deep Cleansing Foam** | **235 DH** | Herboda (235 DH) |
| 170 | `KSG-R-75C1A98E9D17DE` | **SKIN1004 Tea-Trica Relief Ampoule** | **235 DH** | Herboda (235 DH) |
| 173 | `KSG-R-FE4A8BD5F71113` | **SKIN1004 Retinol 0.2 Boosting Shot Ampoule** | **245 DH** | Herboda (245 DH) |
| 175 | `KSG-R-FD6C02A9280A6C` | **SKIN1004 Niacinamide 10 Boosting Shot Ampoule** | **255 DH** | Herboda (255 DH) |
| 190 | `KSG-R-92C08085C71050` | **SKIN1004 Hyalu-Cica Sleeping Pack** | **269 DH** | KBeauty Maroc (269 DH) |
| 191 | `KSG-R-E05B3DE633F905` | **SKIN1004 Poremizing Quick Clay Stick Mask** | **265 DH** | KBeauty Maroc (265 DH) |
| 194 | `KSG-R-1415AF2E3F4EC7` | **Beauty of Joseon Green Plum Refreshing Cleanser** | **180 DH** | Herboda (180 DH) |
| 196 | `KSG-R-E6C1B59D512BB9` | **Beauty of Joseon Radiance Cleansing Balm** | **270 DH** | Herboda (270 DH) |
| 197 | `KSG-R-017E9480E1BDD2` | **Beauty of Joseon Apricot Blossom Peeling Gel** | **189 DH** | Herboda (189 DH) |
| 198 | `KSG-R-B9FE42BD696781` | **Beauty of Joseon Ginseng Essence Water** | **269 DH** | Herboda (269 DH) |
| 199 | `KSG-R-4D6101834D4962` | **Beauty of Joseon Green Plum Refreshing Toner : AHA + BHA** | **199 DH** | Herboda (199 DH) |
| 203 | `KSG-R-9891A8020B75B5` | **Beauty of Joseon Glow Serum : Propolis + Niacinamide** | **240 DH** | Herboda (240 DH) |
| 204 | `KSG-R-E39FF7EB9FACC6` | **Beauty of Joseon Glow Deep Serum : Rice + Alpha-Arbutin** | **289 DH** | Herboda (289 DH) |
| 205 | `KSG-R-EC5D4EC4560B89` | **Beauty of Joseon Revive Serum : Ginseng + Snail Mucin** | **269 DH** | Herboda (269 DH) |
| 207 | `KSG-R-0FEA53CB784379` | **Beauty of Joseon Revive Firming Moisturizer : Ginseng + Retinol** | **295 DH** | Herboda (295 DH) |
| 208 | `KSG-R-ADF3211E30BFE5` | **Beauty of Joseon Red Bean Water Gel** | **259 DH** | Herboda (259 DH) |
| 220 | `KSG-R-5B2EE935152B00` | **Medicube PDRN Pink One Day Serum** | **280 DH** | Herboda (280 DH), Herboda (280 DH) |
| 225 | `KSG-R-8A746FAFBAD44A` | **Medicube Zero Pore Blackhead Deep Cleansing Oil** | **295 DH** | Herboda (295 DH) |
| 233 | `KSG-R-2091D5C9C98EAA` | **Medicube Kojic Acid Turmeric Overnight Wrapping Mask** | **290 DH** | Herboda (290 DH) |
| 235 | `KSG-R-8FC546E7B4F634` | **Medicube Zero Pore Capsule Cleansing Foam** | **295 DH** | Herboda (295 DH) |
| 236 | `KSG-R-196D999AB93F19` | **Medicube Zero Pore Cooling Mask** | **265 DH** | Herboda (265 DH) |
| 238 | `KSG-R-07C5B4B4ACC159` | **Medicube Zero Pore One-day Cream** | **295 DH** | Herboda (295 DH) |
| 242 | `KSG-R-96C325893A0225` | **Medicube Deep Reviving Bakuchiol Retinol Serum** | **250 DH** | Herboda (250 DH) |
| 243 | `KSG-R-779033FB9517DD` | **Dr. Althea 345 Relief Cream Mist** | **260 DH** | Velvet Glow (260 DH), KBeauty Maroc (260 DH) |
| 244 | `KSG-R-C3327CAD93EF19` | **Dr. Althea Rapid Hypochlorous Acid Rescue Mist** | **260 DH** | Velvet Glow (260 DH), KBeauty Maroc (260 DH) |
| 246 | `KSG-R-88115AA5FAB4DF` | **Dr. Althea 345 Relief Serum** | **270 DH** | KBeauty Maroc (270 DH) |
| 248 | `KSG-R-989513A977B239` | **Dr. Althea 0.1 Gentle Retinol Serum** | **265 DH** | Herboda (265 DH) |
| 250 | `KSG-R-224C44AB17375C` | **Dr. Althea ABC Glow Whipped Serum** | **270 DH** | Herboda (270 DH) |
| 268 | `KSG-R-B69FA06F88917A` | **AXIS-Y CALAMINE Pore Control Capsule Serum** | **220 DH** | Herboda (220 DH) |
| 270 | `KSG-R-FBBD56E54BB401` | **AXIS-Y Biome Ultimate Indulging Cream** | **230 DH** | Herboda (230 DH) |
| 307 | `KSG-R-DD562AC7EB436C` | **Arencia Fresh Blue Hyssop Rice Mochi Cleanser** | **270 DH** | KBeauty Maroc (270 DH) |
| 308 | `KSG-R-74124144D5E94C` | **Arencia Black Tea Rice Mochi Cleanser** | **270 DH** | KBeauty Maroc (270 DH) |
| 310 | `KSG-R-6EE5C01A59093E` | **Arencia NAD+ Time-Rewind Booster Shot** | **240 DH** | KBeauty Maroc (240 DH), KBeauty Maroc (240 DH), KBeauty Maroc (240 DH) |
| 311 | `KSG-R-86C40E4EE60B71` | **Arencia TXA Booster Shot** | **240 DH** | KBeauty Maroc (240 DH), KBeauty Maroc (240 DH), KBeauty Maroc (240 DH) |
| 322 | `KSG-R-FF5A3767E29E8B` | **Arencia Vitamin C Glutathione Booster Shot Essence** | **240 DH** | KBeauty Maroc (240 DH) |

---

## 6. Analyse Stratégique du Marché Marocain

1. **Positionnement Concurrentiel** :
   - **Velvet Glow** : Pratique généralement des tarifs agressifs et des promotions ponctuelles (ex. Solaires Beauty of Joseon à 220 DH, Anua Cleansing Foam à 219 DH).
   - **KBeauty Maroc** : Prix intermédiaires très réguliers, catalogue axé sur les formats standard 250ml/30ml (ex. Anua 77 Toner à 269 DH, Snail 96 Essence à 249 DH).
   - **Herboda** : Catalogue étendu avec de fortes variations entre produits réguliers et prix premium (ex. Anua 77 Toner à 280 DH, packs et crèmes collagène jusqu'à 295 DH).

2. **Impact Catalogue K-Skin Gallery** :
   - **72 produits** sont immédiatement mis en avant dans la section `/promotions` de la boutique.
   - Notre marge réelle est protégée sur l'intégralité des 96 produits initiaux (aucun prix de vente réel n'a été diminué).
   - 109 nouveaux produits de recherche sont désormais monétisables et affichables avec un prix public prêt pour la vente.