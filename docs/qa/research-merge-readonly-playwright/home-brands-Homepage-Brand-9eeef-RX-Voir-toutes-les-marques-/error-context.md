# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-brands.spec.mjs >> Homepage Brands Marquee Section >> verifies brand navigation clicks (ANUA, COSRX, Voir toutes les marques)
- Location: tests\e2e\home-brands.spec.mjs:103:3

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for locator('.home-brands__marquee-group').first().locator('a[href="/marques/anua"]')
    - locator resolved to <a aria-label="ANUA" href="/marques/anua" data-discover="true" class="home-brands__logo-item">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 100ms
    79 × waiting for element to be visible, enabled and stable
       - element is not stable
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "K-Skin Gallery, accueil" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "K-Skin Gallery — Korean Skincare" [ref=e7]
      - search [ref=e8]:
        - textbox "Rechercher un produit, une marque ou un soin" [ref=e11]:
          - /placeholder: Rechercher un produit, une marque, un soin…
      - generic [ref=e12]:
        - link "Compte" [ref=e13] [cursor=pointer]:
          - /url: /connexion
        - link "Favoris" [ref=e17] [cursor=pointer]:
          - /url: /favoris
        - button "Panier, 0 article" [ref=e21] [cursor=pointer]:
          - generic [ref=e22]: "0"
          - generic [ref=e26]: Panier
    - navigation "Navigation principale" [ref=e28]:
      - link "Nouveautés" [ref=e30] [cursor=pointer]:
        - /url: /nouveautes
      - generic [ref=e31]:
        - link "Marques" [ref=e32] [cursor=pointer]:
          - /url: /marques
        - button "Afficher le menu Marques" [ref=e33] [cursor=pointer]
      - generic [ref=e36]:
        - link "Soins" [ref=e37] [cursor=pointer]:
          - /url: /soins
        - button "Afficher le menu Soins" [ref=e38] [cursor=pointer]
      - generic [ref=e41]:
        - link "Peau" [ref=e42] [cursor=pointer]:
          - /url: /peau
        - button "Afficher le menu Peau" [ref=e43] [cursor=pointer]
      - generic [ref=e46]:
        - link "Routines & Packs" [ref=e47] [cursor=pointer]:
          - /url: /routines
        - button "Afficher le menu Routines & Packs" [ref=e48] [cursor=pointer]
      - link "Promotions" [ref=e52] [cursor=pointer]:
        - /url: /promotions
    - generic "Nos engagements" [ref=e53]:
      - generic [ref=e54]:
        - generic [ref=e55]:
          - generic [ref=e56]: Livraison 24–48h partout au Maroc
          - generic [aria-hidden] [ref=e60]: ✦
          - generic [ref=e61]: Paiement à la livraison
          - generic [aria-hidden] [ref=e65]: ✦
          - generic [ref=e66]: Produits authentiques
          - generic [aria-hidden] [ref=e70]: ✦
          - generic [ref=e71]: Assistance 7j/7
          - generic [aria-hidden] [ref=e75]: ✦
        - generic [aria-hidden] [ref=e76]:
          - generic [ref=e77]: Livraison 24–48h partout au Maroc
          - generic [aria-hidden] [ref=e81]: ✦
          - generic [ref=e82]: Paiement à la livraison
          - generic [aria-hidden] [ref=e86]: ✦
          - generic [ref=e87]: Produits authentiques
          - generic [aria-hidden] [ref=e91]: ✦
          - generic [ref=e92]: Assistance 7j/7
          - generic [aria-hidden] [ref=e96]: ✦
  - main [ref=e97]:
    - region "Sélections de la Gallery" [ref=e98]:
      - generic "Diapositive 3" [ref=e100]:
        - img "Grandes marques officielles de skincare coréenne sélectionnées par The K-Skin Gallery" [ref=e102]
      - generic [ref=e103]:
        - paragraph [ref=e104]: LES MARQUES DE LA GALLERY
        - heading [level=1] [ref=e105]:
          - generic [ref=e106]: Les références
          - generic [ref=e107]: K-Beauty que vous
          - generic [ref=e108]: recherchez.
        - paragraph [ref=e109]: "ANUA, COSRX, SKIN1004, Beauty of Joseon et Medicube : les marques cultes réunies dans notre catalogue officiel."
        - generic [ref=e110]:
          - link "Explorer la boutique" [ref=e111] [cursor=pointer]:
            - /url: /boutique
          - link "Découvrir les marques" [ref=e115] [cursor=pointer]:
            - /url: /marques
      - navigation "Sélection des diapositives" [ref=e119]:
        - button "Afficher la diapositive 1" [ref=e120] [cursor=pointer]
        - button "Afficher la diapositive 2" [ref=e122] [cursor=pointer]
        - button "Afficher la diapositive 3" [ref=e124] [cursor=pointer]
    - region [ref=e126]:
      - generic [ref=e127]:
        - generic [ref=e128]:
          - generic [ref=e129]: LA SÉLECTION DE LA GALLERY
          - heading "Nos marques coréennes" [level=2] [ref=e130]
        - link "Voir toutes les marques" [ref=e132] [cursor=pointer]:
          - /url: /marques
      - generic "Défilement des marques" [ref=e136]:
        - generic [ref=e137]:
          - generic [ref=e138]:
            - link "ANUA" [ref=e139] [cursor=pointer]:
              - /url: /marques/anua
              - generic [ref=e140]:
                - img "ANUA"
            - link "COSRX" [ref=e141] [cursor=pointer]:
              - /url: /marques/cosrx
              - generic [ref=e142]:
                - img "COSRX"
            - link "Beauty of Joseon" [ref=e143] [cursor=pointer]:
              - /url: /marques/beauty-of-joseon
              - generic [ref=e144]:
                - img "Beauty of Joseon"
            - link "SKIN1004" [ref=e145] [cursor=pointer]:
              - /url: /marques/skin1004
              - generic [ref=e146]:
                - img "SKIN1004"
            - link "Medicube" [ref=e147] [cursor=pointer]:
              - /url: /marques/medicube
              - generic [ref=e148]:
                - img "Medicube"
            - link "AXIS-Y" [ref=e149] [cursor=pointer]:
              - /url: /marques/axis-y
              - generic [ref=e150]:
                - img "AXIS-Y"
            - link "Dr. Althea" [ref=e151] [cursor=pointer]:
              - /url: /marques/dr-althea
              - generic [ref=e152]:
                - img "Dr. Althea"
            - link "Torriden" [ref=e153] [cursor=pointer]:
              - /url: /marques/torriden
              - generic [ref=e154]:
                - img "Torriden"
            - link "Biodance" [ref=e155] [cursor=pointer]:
              - /url: /marques/biodance
              - generic [ref=e156]:
                - img "Biodance"
            - link "SOME BY MI" [ref=e157] [cursor=pointer]:
              - /url: /marques/some-by-mi
              - generic [ref=e158]:
                - img "SOME BY MI"
            - link "Arencia" [ref=e159] [cursor=pointer]:
              - /url: /marques/arencia
              - generic [ref=e160]:
                - img "Arencia"
            - link "celimax" [ref=e161] [cursor=pointer]:
              - /url: /marques/celimax
              - generic [ref=e162]:
                - img "celimax"
            - link "numbuzin" [ref=e163] [cursor=pointer]:
              - /url: /marques/numbuzin
              - generic [ref=e164]:
                - img "numbuzin"
            - link "Dr.Melaxin" [ref=e165] [cursor=pointer]:
              - /url: /marques/dr-melaxin
              - generic [ref=e166]:
                - img "Dr.Melaxin"
            - link "Mary&May" [ref=e167] [cursor=pointer]:
              - /url: /marques/mary-may
              - generic [ref=e168]:
                - img "Mary&May"
            - link "Innisfree" [ref=e169] [cursor=pointer]:
              - /url: /marques/innisfree
              - generic [ref=e170]:
                - img "Innisfree"
            - link "Laneige" [ref=e171] [cursor=pointer]:
              - /url: /marques/laneige
              - generic [ref=e172]:
                - img "Laneige"
          - generic [aria-hidden] [ref=e173]:
            - link [ref=e174] [cursor=pointer]:
              - /url: /marques/anua
            - link [ref=e176] [cursor=pointer]:
              - /url: /marques/cosrx
            - link [ref=e178] [cursor=pointer]:
              - /url: /marques/beauty-of-joseon
            - link [ref=e180] [cursor=pointer]:
              - /url: /marques/skin1004
            - link [ref=e182] [cursor=pointer]:
              - /url: /marques/medicube
            - link [ref=e184] [cursor=pointer]:
              - /url: /marques/axis-y
            - link [ref=e186] [cursor=pointer]:
              - /url: /marques/dr-althea
            - link [ref=e188] [cursor=pointer]:
              - /url: /marques/torriden
            - link [ref=e190] [cursor=pointer]:
              - /url: /marques/biodance
            - link [ref=e192] [cursor=pointer]:
              - /url: /marques/some-by-mi
            - link [ref=e194] [cursor=pointer]:
              - /url: /marques/arencia
            - link [ref=e196] [cursor=pointer]:
              - /url: /marques/celimax
            - link [ref=e198] [cursor=pointer]:
              - /url: /marques/numbuzin
            - link [ref=e200] [cursor=pointer]:
              - /url: /marques/dr-melaxin
            - link [ref=e202] [cursor=pointer]:
              - /url: /marques/mary-may
            - link [ref=e204] [cursor=pointer]:
              - /url: /marques/innisfree
            - link [ref=e206] [cursor=pointer]:
              - /url: /marques/laneige
    - region [ref=e208]:
      - generic [ref=e210]:
        - paragraph [ref=e211]: Trois façons de commencer
        - heading "Entrez dans la Gallery" [level=2] [ref=e212]
      - generic [ref=e213]:
        - link "01 Je cherche un soin Nettoyants, sérums, crèmes, SPF… Explorer les soins" [ref=e214] [cursor=pointer]:
          - /url: /soins
          - generic [ref=e215]: "01"
          - generic [ref=e216]:
            - heading "Je cherche un soin" [level=3] [ref=e217]
            - paragraph [ref=e218]: Nettoyants, sérums, crèmes, SPF…
          - generic [ref=e219]: Explorer les soins
        - link "02 Je pars de ma peau Type de peau et besoins Trouver mes soins" [ref=e222] [cursor=pointer]:
          - /url: /peau
          - generic [ref=e223]: "02"
          - generic [ref=e224]:
            - heading "Je pars de ma peau" [level=3] [ref=e225]
            - paragraph [ref=e226]: Type de peau et besoins
          - generic [ref=e227]: Trouver mes soins
        - link "03 Je connais ma marque ANUA, COSRX, SKIN1004… Voir les marques" [ref=e230] [cursor=pointer]:
          - /url: /marques
          - generic [ref=e231]: "03"
          - generic [ref=e232]:
            - heading "Je connais ma marque" [level=3] [ref=e233]
            - paragraph [ref=e234]: ANUA, COSRX, SKIN1004…
          - generic [ref=e235]: Voir les marques
    - generic [ref=e238]:
      - generic [ref=e239]:
        - heading "Nos incontournables" [level=2] [ref=e241]
        - link "Voir toute la sélection" [ref=e242] [cursor=pointer]:
          - /url: /incontournables
      - generic [ref=e245]:
        - article [ref=e246]:
          - generic [ref=e247]:
            - link "Voir Anua Heartleaf Pore Control Cleansing Oil Mild 200ml" [ref=e248] [cursor=pointer]:
              - /url: /produits/anua-heartleaf-pore-control-cleansing-oil-mild-200ml-0006
              - img "Anua Anua Heartleaf Pore Control Cleansing Oil Mild 200ml" [ref=e249]
            - generic [ref=e250]: Nouveau
            - button "Ajouter aux favoris" [ref=e251] [cursor=pointer]
          - generic [ref=e254]:
            - paragraph [ref=e255]: Anua
            - link [ref=e256] [cursor=pointer]:
              - /url: /produits/anua-heartleaf-pore-control-cleansing-oil-mild-200ml-0006
              - heading "Anua Heartleaf Pore Control Cleansing Oil Mild 200ml" [level=3] [ref=e257]
            - paragraph [ref=e258]: 200ml
            - generic [ref=e259]:
              - strong [ref=e261]: 240 DH
              - button "Ajouter au panier" [ref=e262] [cursor=pointer]
        - article [ref=e265]:
          - generic [ref=e266]:
            - link "Voir COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++" [ref=e267] [cursor=pointer]:
              - /url: /produits/cosrx-ultra-light-invisible-sunscreen-spf50-pa-0010
              - img "COSRX COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++" [ref=e268]
            - generic [ref=e269]: Nouveau
            - button "Ajouter aux favoris" [ref=e270] [cursor=pointer]
          - generic [ref=e273]:
            - paragraph [ref=e274]: COSRX
            - link [ref=e275] [cursor=pointer]:
              - /url: /produits/cosrx-ultra-light-invisible-sunscreen-spf50-pa-0010
              - heading "COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++" [level=3] [ref=e276]
            - paragraph [ref=e277]: Protection solaire
            - generic [ref=e278]:
              - strong [ref=e280]: 230 DH
              - button "Ajouter au panier" [ref=e281] [cursor=pointer]
        - article [ref=e284]:
          - generic [ref=e285]:
            - link "Voir SKIN1004 Madagascar Centella Tea-Trica Relief Ampoule 100ml" [ref=e286] [cursor=pointer]:
              - /url: /produits/skin1004-madagascar-centella-tea-trica-relief-ampoule-100ml-0013
              - img "SKIN1004 SKIN1004 Madagascar Centella Tea-Trica Relief Ampoule 100ml" [ref=e287]
            - button "Ajouter aux favoris" [ref=e288] [cursor=pointer]
          - generic [ref=e291]:
            - paragraph [ref=e292]: SKIN1004
            - link [ref=e293] [cursor=pointer]:
              - /url: /produits/skin1004-madagascar-centella-tea-trica-relief-ampoule-100ml-0013
              - heading "SKIN1004 Madagascar Centella Tea-Trica Relief Ampoule 100ml" [level=3] [ref=e294]
            - paragraph [ref=e295]: 100ml
            - generic [ref=e296]:
              - strong [ref=e298]: 270 DH
              - button "Ajouter au panier" [ref=e299] [cursor=pointer]
        - article [ref=e302]:
          - generic [ref=e303]:
            - link "Voir Medicube PDRN Pink Collagen Capsule Cream 55g" [ref=e304] [cursor=pointer]:
              - /url: /produits/medicube-pdrn-pink-collagen-capsule-cream-55g-0053
              - img "Medicube Medicube PDRN Pink Collagen Capsule Cream 55g" [ref=e305]
            - button "Ajouter aux favoris" [ref=e306] [cursor=pointer]
          - generic [ref=e309]:
            - paragraph [ref=e310]: Medicube
            - link [ref=e311] [cursor=pointer]:
              - /url: /produits/medicube-pdrn-pink-collagen-capsule-cream-55g-0053
              - heading "Medicube PDRN Pink Collagen Capsule Cream 55g" [level=3] [ref=e312]
            - paragraph [ref=e313]: 55g
            - generic [ref=e314]:
              - strong [ref=e316]: 290 DH
              - button "Ajouter au panier" [ref=e317] [cursor=pointer]
        - article [ref=e320]:
          - generic [ref=e321]:
            - link "Voir Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++" [ref=e322] [cursor=pointer]:
              - /url: /produits/beauty-of-joseon-relief-sun-rice-probiotics-spf50-pa-0071
              - img "Beauty of Joseon Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++" [ref=e323]
            - button "Ajouter aux favoris" [ref=e324] [cursor=pointer]
          - generic [ref=e327]:
            - paragraph [ref=e328]: Beauty of Joseon
            - link [ref=e329] [cursor=pointer]:
              - /url: /produits/beauty-of-joseon-relief-sun-rice-probiotics-spf50-pa-0071
              - heading "Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++" [level=3] [ref=e330]
            - paragraph [ref=e331]: Protection solaire
            - generic [ref=e332]:
              - strong [ref=e334]: 220 DH
              - button "Ajouter au panier" [ref=e335] [cursor=pointer]
    - generic [ref=e338]:
      - generic [ref=e339]:
        - heading "Nouveautés dans la Gallery" [level=2] [ref=e341]
        - link "Voir toute la sélection" [ref=e342] [cursor=pointer]:
          - /url: /nouveautes
      - generic [ref=e345]:
        - article [ref=e346]:
          - generic [ref=e347]:
            - link "Voir Anua Heartleaf Pore Control Cleansing Oil Mild 200ml" [ref=e348] [cursor=pointer]:
              - /url: /produits/anua-heartleaf-pore-control-cleansing-oil-mild-200ml-0006
              - img "Anua Anua Heartleaf Pore Control Cleansing Oil Mild 200ml" [ref=e349]
            - generic [ref=e350]: Nouveau
            - button "Ajouter aux favoris" [ref=e351] [cursor=pointer]
          - generic [ref=e354]:
            - paragraph [ref=e355]: Anua
            - link [ref=e356] [cursor=pointer]:
              - /url: /produits/anua-heartleaf-pore-control-cleansing-oil-mild-200ml-0006
              - heading "Anua Heartleaf Pore Control Cleansing Oil Mild 200ml" [level=3] [ref=e357]
            - paragraph [ref=e358]: 200ml
            - generic [ref=e359]:
              - strong [ref=e361]: 240 DH
              - button "Ajouter au panier" [ref=e362] [cursor=pointer]
        - article [ref=e365]:
          - generic [ref=e366]:
            - link "Voir COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++" [ref=e367] [cursor=pointer]:
              - /url: /produits/cosrx-ultra-light-invisible-sunscreen-spf50-pa-0010
              - img "COSRX COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++" [ref=e368]
            - generic [ref=e369]: Nouveau
            - button "Ajouter aux favoris" [ref=e370] [cursor=pointer]
          - generic [ref=e373]:
            - paragraph [ref=e374]: COSRX
            - link [ref=e375] [cursor=pointer]:
              - /url: /produits/cosrx-ultra-light-invisible-sunscreen-spf50-pa-0010
              - heading "COSRX Ultra-Light Invisible Sunscreen SPF50+ PA++++" [level=3] [ref=e376]
            - paragraph [ref=e377]: Protection solaire
            - generic [ref=e378]:
              - strong [ref=e380]: 230 DH
              - button "Ajouter au panier" [ref=e381] [cursor=pointer]
        - article [ref=e384]:
          - generic [ref=e385]:
            - link "Voir SKIN1004 Madagascar Centella Tea-Trica Purifying Toner 210ml" [ref=e386] [cursor=pointer]:
              - /url: /produits/skin1004-madagascar-centella-tea-trica-purifying-toner-210ml-0012
              - img "SKIN1004 SKIN1004 Madagascar Centella Tea-Trica Purifying Toner 210ml" [ref=e387]
            - generic [ref=e388]: Nouveau
            - button "Ajouter aux favoris" [ref=e389] [cursor=pointer]
          - generic [ref=e392]:
            - paragraph [ref=e393]: SKIN1004
            - link [ref=e394] [cursor=pointer]:
              - /url: /produits/skin1004-madagascar-centella-tea-trica-purifying-toner-210ml-0012
              - heading "SKIN1004 Madagascar Centella Tea-Trica Purifying Toner 210ml" [level=3] [ref=e395]
            - paragraph [ref=e396]: 210ml
            - generic [ref=e397]:
              - strong [ref=e399]: 260 DH
              - button "Ajouter au panier" [ref=e400] [cursor=pointer]
        - article [ref=e403]:
          - generic [ref=e404]:
            - link "Voir Medicube Collagen Firming Sun Cream SPF50+ PA++++ 50ml" [ref=e405] [cursor=pointer]:
              - /url: /produits/medicube-collagen-firming-sun-cream-spf50-pa-50ml-0011
              - img "Medicube Medicube Collagen Firming Sun Cream SPF50+ PA++++ 50ml" [ref=e406]
            - generic [ref=e407]: Nouveau
            - button "Ajouter aux favoris" [ref=e408] [cursor=pointer]
          - generic [ref=e411]:
            - paragraph [ref=e412]: Medicube
            - link [ref=e413] [cursor=pointer]:
              - /url: /produits/medicube-collagen-firming-sun-cream-spf50-pa-50ml-0011
              - heading "Medicube Collagen Firming Sun Cream SPF50+ PA++++ 50ml" [level=3] [ref=e414]
            - paragraph [ref=e415]: 50ml
            - generic [ref=e416]:
              - strong [ref=e418]: 260 DH
              - button "Ajouter au panier" [ref=e419] [cursor=pointer]
        - article [ref=e422]:
          - generic [ref=e423]:
            - link "Voir Beauty of Joseon Stay Fresh Tone-Up Sunscreen Centella + Ceramide SPF50+ PA++++" [ref=e424] [cursor=pointer]:
              - /url: /produits/beauty-of-joseon-stay-fresh-tone-up-sunscreen-centella-ceramide-spf50-pa-0009
              - img "Beauty of Joseon Beauty of Joseon Stay Fresh Tone-Up Sunscreen Centella + Ceramide SPF50+ PA++++" [ref=e425]
            - generic [ref=e426]: Nouveau
            - button "Ajouter aux favoris" [ref=e427] [cursor=pointer]
          - generic [ref=e430]:
            - paragraph [ref=e431]: Beauty of Joseon
            - link [ref=e432] [cursor=pointer]:
              - /url: /produits/beauty-of-joseon-stay-fresh-tone-up-sunscreen-centella-ceramide-spf50-pa-0009
              - heading "Beauty of Joseon Stay Fresh Tone-Up Sunscreen Centella + Ceramide SPF50+ PA++++" [level=3] [ref=e433]
            - paragraph [ref=e434]: Protection solaire
            - generic [ref=e435]:
              - strong [ref=e437]: 260 DH
              - button "Ajouter au panier" [ref=e438] [cursor=pointer]
    - generic [ref=e441]:
      - generic [ref=e442]:
        - generic [ref=e443]:
          - paragraph [ref=e444]: Le bon geste, simplement
          - heading "Routines & Packs" [level=2] [ref=e445]
        - link "Voir toutes les routines" [ref=e446] [cursor=pointer]:
          - /url: /routines
      - generic [ref=e449]:
        - link [ref=e450] [cursor=pointer]:
          - /url: /routines/simple
          - heading "Routine simple" [level=3] [ref=e453]
          - paragraph [ref=e454]: Trois gestes suffisent pour commencer.
          - generic [ref=e455]: Découvrir
        - link [ref=e458] [cursor=pointer]:
          - /url: /routines/matin
          - heading "Routine du matin" [level=3] [ref=e461]
          - paragraph [ref=e462]: Une séquence courte pour commencer la journée.
          - generic [ref=e463]: Découvrir
        - link [ref=e466] [cursor=pointer]:
          - /url: /routines/soir
          - heading "Routine du soir" [level=3] [ref=e469]
          - paragraph [ref=e470]: Des gestes simples après la journée.
          - generic [ref=e471]: Découvrir
        - link [ref=e474] [cursor=pointer]:
          - /url: /packs/duo-double-nettoyage
          - heading "Duo Double Nettoyage" [level=3] [ref=e477]
          - paragraph [ref=e478]: 2 soins réunis dans un pack.
          - generic [ref=e479]: Voir le pack
    - generic [ref=e482]:
      - generic [ref=e483]:
        - heading "Choisir selon sa peau" [level=2] [ref=e484]
        - link "Types de peau & besoins" [ref=e485] [cursor=pointer]:
          - /url: /peau
      - generic [ref=e488]:
        - link "Peau grasse" [ref=e489] [cursor=pointer]:
          - /url: /type-de-peau/peau-grasse
        - link "Peau mixte" [ref=e493] [cursor=pointer]:
          - /url: /type-de-peau/peau-mixte
        - link "Peau sèche" [ref=e497] [cursor=pointer]:
          - /url: /type-de-peau/peau-seche
        - link "Peau sensible" [ref=e501] [cursor=pointer]:
          - /url: /type-de-peau/peau-sensible
    - generic [ref=e505]:
      - generic [ref=e506]:
        - paragraph [ref=e507]: Une attention pour votre routine
        - heading "Livraison offerte dès 500 DH." [level=2] [ref=e508]
      - link "Explorer la sélection" [ref=e509] [cursor=pointer]:
        - /url: /boutique
    - region "Vos achats en confiance" [ref=e512]:
      - generic [ref=e513]: Produits authentiques
      - generic [ref=e517]: Livraison partout au Maroc
      - generic [ref=e521]: Paiement à la livraison
      - generic [ref=e525]: Assistance 7j/7
  - contentinfo [ref=e529]:
    - generic [ref=e530]:
      - generic [ref=e531]:
        - link [ref=e532] [cursor=pointer]:
          - /url: /
          - img "K-Skin Gallery" [ref=e533]
        - paragraph [ref=e534]: Une sélection coréenne, tout près de vous.
      - generic [ref=e535]:
        - heading "La Gallery" [level=2] [ref=e536]
        - link "Boutique" [ref=e537] [cursor=pointer]:
          - /url: /boutique
        - link "Nouveautés" [ref=e538] [cursor=pointer]:
          - /url: /nouveautes
        - link "Promotions" [ref=e539] [cursor=pointer]:
          - /url: /promotions
        - link "Marques" [ref=e540] [cursor=pointer]:
          - /url: /marques
        - link "Routines" [ref=e541] [cursor=pointer]:
          - /url: /routines
        - link "Packs" [ref=e542] [cursor=pointer]:
          - /url: /packs
        - link "Conseils" [ref=e543] [cursor=pointer]:
          - /url: /conseils
      - generic [ref=e544]:
        - heading "Aide" [level=2] [ref=e545]
        - link "FAQ" [ref=e546] [cursor=pointer]:
          - /url: /faq
        - link "Livraison" [ref=e547] [cursor=pointer]:
          - /url: /livraison
        - link "Retours" [ref=e548] [cursor=pointer]:
          - /url: /retours
        - link "Contact" [ref=e549] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e550]:
        - heading "Informations" [level=2] [ref=e551]
        - link "Conditions de vente" [ref=e552] [cursor=pointer]:
          - /url: /cgv
        - link "Confidentialité" [ref=e553] [cursor=pointer]:
          - /url: /confidentialite
    - generic [ref=e554]:
      - generic [ref=e555]: © 2026 K-Skin Gallery
      - generic [ref=e556]: Paiement à la livraison · Livraison au Maroc · Produits authentiques
```

# Test source

```ts
  9   |       if (!main) return [];
  10  |       return Array.from(main.children).map((el) => {
  11  |         return {
  12  |           tagName: el.tagName.toLowerCase(),
  13  |           className: el.className,
  14  |           id: el.id,
  15  |           headingText: el.querySelector('h1, h2')?.textContent?.trim() || '',
  16  |         };
  17  |       });
  18  |     });
  19  | 
  20  |     // 1. HeroCarousel (.hero-carousel)
  21  |     // 2. HomeBrandsSection (.home-brands)
  22  |     // 3. GalleryEntry (.gallery-entry)
  23  |     // 4. Incontournables (.selection-section)
  24  |     const heroIndex = sectionTags.findIndex((s) => s.className.includes('hero-carousel'));
  25  |     const brandsIndex = sectionTags.findIndex((s) => s.className.includes('home-brands'));
  26  |     const entryIndex = sectionTags.findIndex((s) => s.className.includes('gallery-entry'));
  27  |     const bestSellersIndex = sectionTags.findIndex(
  28  |       (s) => s.className.includes('selection-section') && s.headingText.includes('Nos incontournables')
  29  |     );
  30  | 
  31  |     expect(heroIndex).toBeGreaterThanOrEqual(0);
  32  |     expect(brandsIndex).toBe(heroIndex + 1);
  33  |     expect(entryIndex).toBe(brandsIndex + 1);
  34  |     expect(bestSellersIndex).toBe(entryIndex + 1);
  35  | 
  36  |     // Old brand-strip must NOT exist anywhere
  37  |     const oldBrandStrip = await page.locator('.brand-strip').count();
  38  |     expect(oldBrandStrip).toBe(0);
  39  |   });
  40  | 
  41  |   test('verifies desktop brand marquee appearance, logos, links and seamless animation', async ({ page }) => {
  42  |     for (const width of [1024, 1280, 1440, 1600]) {
  43  |       await page.setViewportSize({ width, height: 900 });
  44  |       await page.goto('/');
  45  | 
  46  |       const brandsSection = page.locator('.home-brands');
  47  |       await expect(brandsSection).toBeVisible();
  48  | 
  49  |       // Heading and eyebrow
  50  |       const heading = brandsSection.locator('.home-brands__heading');
  51  |       await expect(heading).toContainText('Nos marques coréennes');
  52  |       const eyebrow = brandsSection.locator('.home-brands__eyebrow');
  53  |       await expect(eyebrow).toContainText('LA SÉLECTION DE LA GALLERY');
  54  | 
  55  |       // Decorative rose vertical line
  56  |       const accent = brandsSection.locator('.home-brands__heading-accent');
  57  |       await expect(accent).toBeVisible();
  58  | 
  59  |       // CTA link
  60  |       const cta = brandsSection.locator('.home-brands__cta');
  61  |       await expect(cta).toBeVisible();
  62  |       await expect(cta).toHaveAttribute('href', '/marques');
  63  | 
  64  |       // Marquee tracks
  65  |       const marqueeTrack = brandsSection.locator('.home-brands__marquee-track');
  66  |       await expect(marqueeTrack).toBeVisible();
  67  | 
  68  |       const groups = brandsSection.locator('.home-brands__marquee-group');
  69  |       await expect(groups).toHaveCount(2);
  70  | 
  71  |       // Accessibility: second group is aria-hidden
  72  |       await expect(groups.nth(1)).toHaveAttribute('aria-hidden', 'true');
  73  | 
  74  |       // Links in second group must have tabIndex = -1
  75  |       const duplicateLinks = groups.nth(1).locator('.home-brands__logo-item');
  76  |       const count = await duplicateLinks.count();
  77  |       expect(count).toBeGreaterThan(5);
  78  |       for (let i = 0; i < Math.min(count, 4); i++) {
  79  |         await expect(duplicateLinks.nth(i)).toHaveAttribute('tabindex', '-1');
  80  |       }
  81  | 
  82  |       // First track links are interactive
  83  |       const trackALinks = groups.nth(0).locator('.home-brands__logo-item');
  84  |       await expect(trackALinks.first()).toBeVisible();
  85  | 
  86  |       // Ensure logos render without broken image
  87  |       const images = groups.nth(0).locator('.home-brands__logo-img');
  88  |       const imgCount = await images.count();
  89  |       expect(imgCount).toBeGreaterThan(0);
  90  | 
  91  |       // Verify no naturalWidth === 0
  92  |       const brokenImages = await images.evaluateAll((imgs) =>
  93  |         imgs.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src)
  94  |       );
  95  |       expect(brokenImages).toEqual([]);
  96  | 
  97  |       // Check overflow
  98  |       const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  99  |       expect(overflow, `Overflow at ${width}px`).toBeLessThanOrEqual(2);
  100 |     }
  101 |   });
  102 | 
  103 |   test('verifies brand navigation clicks (ANUA, COSRX, Voir toutes les marques)', async ({ page }) => {
  104 |     await page.goto('/');
  105 | 
  106 |     // 1. Click ANUA
  107 |     const anuaLink = page.locator('.home-brands__marquee-group').first().locator('a[href="/marques/anua"]');
  108 |     await expect(anuaLink).toBeVisible();
> 109 |     await anuaLink.click();
      |                    ^ Error: locator.click: Test timeout of 45000ms exceeded.
  110 |     await expect(page).toHaveURL(/\/marques\/anua/);
  111 | 
  112 |     // 2. Back and click COSRX
  113 |     await page.goto('/');
  114 |     const cosrxLink = page.locator('.home-brands__marquee-group').first().locator('a[href="/marques/cosrx"]');
  115 |     await expect(cosrxLink).toBeVisible();
  116 |     await cosrxLink.click();
  117 |     await expect(page).toHaveURL(/\/marques\/cosrx/);
  118 | 
  119 |     // 3. Back and click "Voir toutes les marques"
  120 |     await page.goto('/');
  121 |     const seeAllLink = page.locator('.home-brands__cta');
  122 |     await expect(seeAllLink).toBeVisible();
  123 |     await seeAllLink.click();
  124 |     await expect(page).toHaveURL(/\/marques$/);
  125 |   });
  126 | 
  127 |   test('verifies mobile viewports (375, 390, 430px)', async ({ page }) => {
  128 |     for (const width of [375, 390, 430]) {
  129 |       await page.setViewportSize({ width, height: 844 });
  130 |       await page.goto('/');
  131 | 
  132 |       const brandsSection = page.locator('.home-brands');
  133 |       await expect(brandsSection).toBeVisible();
  134 | 
  135 |       const heading = brandsSection.locator('.home-brands__heading');
  136 |       await expect(heading).toBeVisible();
  137 |       await expect(heading).toContainText('Nos marques coréennes');
  138 | 
  139 |       const cta = brandsSection.locator('.home-brands__cta');
  140 |       await expect(cta).toBeVisible();
  141 |       // On mobile, short label "Voir tout" is visible
  142 |       const shortText = cta.locator('.home-brands__cta-text-short');
  143 |       await expect(shortText).toBeVisible();
  144 | 
  145 |       // Marquee track exists and is running
  146 |       const track = brandsSection.locator('.home-brands__marquee-track');
  147 |       await expect(track).toBeVisible();
  148 | 
  149 |       // Check no horizontal scroll on body
  150 |       const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  151 |       expect(overflow, `Mobile overflow at ${width}px`).toBeLessThanOrEqual(2);
  152 | 
  153 |       // Check next section starts cleanly
  154 |       const entrySection = page.locator('.gallery-entry');
  155 |       await expect(entrySection).toBeVisible();
  156 |     }
  157 |   });
  158 | 
  159 |   test('verifies reduced motion fallback disables animation', async ({ page }) => {
  160 |     await page.emulateMedia({ reducedMotion: 'reduce' });
  161 |     await page.goto('/');
  162 | 
  163 |     const track = page.locator('.home-brands__marquee-track');
  164 |     await expect(track).toBeVisible();
  165 | 
  166 |     const animationName = await track.evaluate((el) => window.getComputedStyle(el).animationName);
  167 |     expect(animationName).toBe('none');
  168 |   });
  169 | });
  170 | 
```