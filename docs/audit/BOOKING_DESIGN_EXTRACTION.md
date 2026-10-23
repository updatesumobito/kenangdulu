# BOOKING design extraction

Read-only source: C:/Users/user/Music/BOOKING. Commit 91c4ccecdade7399c46c2bea13e11743da53088b. Existing dirty files preserved; see status-before/after.

| Source | Value | Destination | Evidence |
|---|---|---|---|
| --paper | #FEFCFA | --paper | C:/Users/user/Music/BOOKING/src/app/globals.css:11 |
| --ink | #1A1523 | --ink | C:/Users/user/Music/BOOKING/src/app/globals.css:12 |
| --muted | #7E7487 | --muted | C:/Users/user/Music/BOOKING/src/app/globals.css:13 |
| --line | #EFEAF2 | --line | C:/Users/user/Music/BOOKING/src/app/globals.css:14 |
| --olive | #682692 | --purple | C:/Users/user/Music/BOOKING/src/app/globals.css:15 |
| --brand-deep | #A51E61 | --primary | C:/Users/user/Music/BOOKING/src/app/globals.css:21 |
| --plum | #2D1245 | --plum | C:/Users/user/Music/BOOKING/src/app/globals.css:22 |
| --soft | #FAF6FC | --soft | C:/Users/user/Music/BOOKING/src/app/globals.css:18 |
| --lavender | #EFE4F5 | --lavender | C:/Users/user/Music/BOOKING/src/app/globals.css:23 |

Muted is intentionally darkened in the target for text contrast. Typography: layout.tsx:7 Plus Jakarta Sans and :14 Playfair Display. Marketing source CSS:153 explicitly uses Georgia editorial headings; implemented likewise. Mono font not loaded because not needed. Font files are sourced independently from Fontsource (OFL), not copied from source builds.

Components: globals.css:115 47px buttons, 5px radius; :125 48px inputs; :181 editorial pricing cards; :294 dashboard metric rhythm. Adapted for 44px touch targets and 16px inputs. Palette is BOOKING purple/plum/berry, not the provisional maroon palette. Maroon is an optional event theme only.

Source screenshots are not taken by starting/modifying BOOKING. Target screenshots are produced during final Playwright suite. No claim of pixel-identical source parity.
