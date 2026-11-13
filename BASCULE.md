# Bascule de meribel-restaurants.com vers ce site

Préparée le 10/11/2026, PAS ENCORE FAITE : on attend l'accord de Valérie.

## Ce que contient cette branche
- Les anciennes adresses du site (QR codes et supports déjà imprimés, autres noms de domaine) renvoient vers les nouvelles pages :
  - /index.php -> /
  - /index.php/la-galette.html -> /galette.html
  - /index.php/la-coursive-des-alpes.html -> /coursive.html
  - /index.php/l-igloo.html -> / (L'Igloo est vendu, sa page est masquée)

## Le jour de la bascule
1. Relire les pages avec Valérie (accueil, La Coursive, La Galette).
2. Faire une copie de la zone DNS actuelle chez OVH.
3. Fusionner cette branche dans main, brancher le nom de domaine sur l'hébergement.
4. Chez OVH, ne changer QUE les lignes du site (A de meribel-restaurants.com et www). Ne pas toucher aux lignes MX ni à la ligne TXT « v=spf1 » : le mail info@meribel-restaurants.com (renvoyé vers Christophe) doit continuer.
5. Vérifier : le site en https, les 4 anciennes adresses, restaurant-lagalette-meribel.com, le mail.
6. Ne résilier ESDI qu'après quelques jours sans souci.

## Les fichiers PDF de l'ancien site
La page L'Igloo citait des PDF de l'ancien site (meribel-restaurants.com/images/...). À vérifier avant la bascule : d'autres liens imprimés mènent-ils à des fichiers de l'ancien site ?
