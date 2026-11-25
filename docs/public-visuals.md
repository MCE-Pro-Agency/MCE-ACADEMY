# Visuels de la page publique MCE Academy

La composition reprend la référence « Modern School Website Design » fournie par l’utilisateur, avec des adultes et un contenu destiné aux entreprises. Les photos des cartes illustrent les domaines et ne sont pas présentées comme des sessions documentées de chaque formation.

## Illustration d’accueil

- Fichier consommé : `frontend/public/mce-hero-entreprise.png`.
- Génération : outil intégré `image_gen.imagegen`, sans recours au mode CLI.
- Nature : scène illustrative de formation entre adultes, sans identité de client réel.
- L’ancienne photo `/formation-mce.jpg` n’est plus utilisée dans l’accueil.

Prompt exact utilisé :

```text
Use case: photorealistic-natural. Asset type: hero photograph for a French-language corporate training platform serving businesses in Senegal, France and Morocco. Create a natural editorial photograph of an adult professional training workshop in a bright contemporary but realistic office meeting room in Dakar. Three Black West African adult colleagues, women and men aged 30 to 45, in professional navy, white and muted blue clothing. Main foreground subject a woman in a navy blazer thoughtfully engaged in an exercise with an open notebook; a friendly adult female trainer and another adult colleague collaboratively discuss the exercise at the table. Candid interaction, nobody posed looking at camera. Ordinary work notebooks, one laptop, natural hands, realistic skin and small imperfections. Large side windows with soft daylight, clean neutral office background, shallow but natural depth of field, composed premium institutional photography, restrained colors. Landscape 4:3 composition, medium shot, subjects occupying center and right, all adult faces comfortably within the middle 70 percent of the frame, leave a little breathing room around their heads for website cropping. The website will place text separately, so no text, no graphical elements, no logos, no watermark, no frame, no school children, no school uniforms, no graduation robes, no fake written certificates, no excessive smiles, no cinematic color grading, no glossy AI appearance. This is an illustrative scene, not a documented MCE client event.
```

## Photographies conservées et ajoutées

| Fichier local | Source |
| --- | --- |
| `frontend/public/formation-mce.jpg` | https://mceafrika.com/static/media/session-travail-mce.f08a64f5369a45a83b17.jpg |
| `frontend/public/mce-rencontres.jpeg` | https://mceafrika.com/static/media/WhatsApp%20Image%202026-08-24%20at%2012.32.26%20(1).975b20f47e2f82e15ca4.jpeg |
| `frontend/public/mce-partage.jpg` | https://mceafrika.com/static/media/partage-savoir-gofar.8159b5c032fbad8d6fa0.jpg |
| `frontend/public/mce-entrepreneurs.jpg` | https://mceafrika.com/static/media/women1.368bd5d06b0fc875215d.jpg |
| `frontend/public/mce-interview.jpeg` | https://mceafrika.com/static/media/interview4.60bf96198c386463e89d.jpeg |
| `frontend/public/mce-numerique.jpg` | https://images.unsplash.com/photo-1528901166007-3784c7dd3653?fm=jpg&w=1400&q=85 |
| `frontend/public/mce-collaboration.jpg` | https://images.unsplash.com/photo-1655720357872-ce227e4164ba?fm=jpg&w=940&q=85 |
| `frontend/public/mce-reunion.jpg` | https://images.unsplash.com/photo-1573164574511-73c773193279?fm=jpg&w=940&q=85 |
| `frontend/public/mce-prise-parole.jpg` | https://images.unsplash.com/photo-1550305080-4e029753abcf?fm=jpg&w=1400&q=85 |
| `frontend/public/mce-auditoire.jpeg` | https://mceafrika.com/static/media/stayup6.8307155045fa06a00536.jpeg |
| `frontend/public/mce-afterwork.jpg` | https://mceafrika.com/static/media/afterwork-gofar.3efacd5ccd3afc833ad6.jpg |
| `frontend/public/mce-stayup.jpg` | https://mceafrika.com/static/media/stayip1.0a2d08022a326beba6fd.jpeg |
| `frontend/public/mce-session-travail.jpg` | https://mceafrika.com/static/media/session-travail-mce.f08a64f5369a45a83b17.jpg |
| `frontend/public/mce-remise-prix.jpeg` | https://mceafrika.com/static/media/WhatsApp%20Image%202026-08-24%20at%2012.32.26.98a4b74fec12339e0969.jpeg |
| `frontend/public/mce-maroc.jpg` | https://mceafrika.com/static/media/network3.667fb683d2068ecf0d4f.jpg |
| `frontend/public/formation-vente.jpg` | https://mceafrika.com/static/media/wellness2.519d1f6b3af601f2d053.jpeg |
| `frontend/public/formation-leadership.jpg` | https://mceafrika.com/static/media/session-travail-mce.f08a64f5369a45a83b17.jpg |
| `frontend/public/formation-parole.jpg` | https://mceafrika.com/static/media/interview.24b2c84119d781585146.jpeg |
| `frontend/public/formation-relation-client.jpg` | https://mceafrika.com/static/media/wellness1.00b9dc3dc104f8a198f9.jpeg |
| `frontend/public/formation-entrepreneuriat.jpg` | https://mceafrika.com/static/media/women2.58ac046f4baf1c71c14f.jpg |
| `frontend/public/formation-insertion.jpg` | https://mceafrika.com/static/media/WhatsApp%20Image%202026-08-24%20at%2012.32.33.2755e8d92ee841384bd5.jpeg |
| `frontend/public/formation-finance.jpg` | https://mceafrika.com/static/media/event1.69668087406cd847faee.jpeg |
| `frontend/public/formation-digital.jpg` | https://mceafrika.com/static/media/digital.c40ccd20f28bca03634f.jpg |

Les photos des outils numériques, de la collaboration, de la réunion et de la prise de parole viennent d’Unsplash et sont déjà employées par le site MCE Afrika. Les autres photographies proviennent de sa galerie. Le catalogue privilégie des vues au format paysage. Toutes les photos de la page publique occupent leur largeur disponible et conservent leur hauteur naturelle (`width: 100%; height: auto`), sans cadre de hauteur ou de ratio imposé. Elles restent au-dessus du texte sur mobile, sans recadrage CSS ni modification des originaux. Le bloc de contact utilise désormais la photo paysage `mce-conference.jpeg` et place le texte sous celle-ci. Le fondu blanc de l’accueil est limité à 24 px sur le bord gauche, hors des visages ; il disparaît lorsque les deux blocs s’empilent sous 980 px.

Palette demandée : `#FFFFFF`, `#E5E5E5`, `#FCA311`, `#14213D`, `#000000`.

Exception demandée pour la carte « Entrepreneuriat » : cadrage CSS au niveau des hanches dans un cadre 3:2, avec un agrandissement de 20 % centré horizontalement et ancré en haut. Le fichier original et son affichage dans le bloc de contact restent entiers. Les autres photos du catalogue gardent leur format naturel. Les cartes réservent un espace image 3:2 indépendant des dimensions des fichiers et une zone de titre de deux lignes pour aligner les titres et le début des descriptions. La réserve de titre disparaît lorsque les cartes occupent une seule colonne.

Les sections C.L.E.F., présentation de MCE et partenaires utilisent les mêmes aplats bleu nuit, cartes blanches et accents orange, avec des rayons de 6 à 8 px. La présentation du groupe reste visible sans ouvrir un accordéon. VIGILUS est présenté comme un partenaire accompagné, avec son logo sur fond blanc.


## Mise à jour du 25 novembre 2026

Les photos liées à Keba Consulting, ancien partenaire (`mce-atelier.jpeg`, `mce-conference.jpeg`, `mce-partenariat.jpg`), ont été retirées du site. Les cartes de formation utilisent des fichiers `formation-*.jpg` recadrés au format 3:4 des cartes, à partir des originaux de la galerie MCE Afrika, pour éviter les recadrages automatiques et le flou.
