# Guide Utilisateur - Bonecole

**Version 1.0.0**

---

## Introduction

Bienvenue dans **Bonecole** - votre école au bout du doigt !

Bonecole est une application mobile d'apprentissage **hors ligne** conçue pour les élèves sénégalais. Elle vous permet de télécharger des cours, des leçons et des livres depuis le kiosque Wi-Fi de votre école, puis d'y accéder à tout moment, même sans connexion Internet.

L'application s'adapte automatiquement à votre niveau scolaire et vous propose uniquement les contenus pertinents pour votre classe.

---

## 1. Première Connexion

### Se Connecter à l'Application

Lors de votre première utilisation, vous devrez vous connecter avec vos identifiants :

1. **ID Élève** : Entrez votre identifiant étudiant (fourni par votre école)
2. **PIN / Mot de passe** : Entrez votre code PIN personnel (fourni par votre école)

#### Identifiants de Test

Pour tester l'application, vous pouvez utiliser ces identifiants :
- **ID Élève** : `eleve1`
- **PIN** : `1234`

### Message de Bienvenue Personnalisé

Une fois connecté, l'application vous accueille avec :
- Votre **nom complet**
- Le nom de votre **école**
- Votre **niveau scolaire** (classe)

### Filtrage Automatique par Niveau

**Important** : Bonecole filtre automatiquement tous les cours selon votre niveau scolaire. Vous ne verrez que les cours adaptés à votre classe (10ème, 11ème ou 12ème Année). Ce filtrage garantit que vous accédez uniquement aux contenus pertinents pour vos études.

---

## 2. Navigation

L'application comporte **4 onglets principaux** accessibles via la barre de navigation en bas de l'écran :

### 🏠 Cours (Accueil)
- Affiche un message de bienvenue personnalisé
- Montre vos **activités récentes** ("Continuer l'apprentissage")
- Permet de découvrir de nouveaux cours et livres (en ligne uniquement)
- Contient le **simulateur de connexion** pour basculer entre les modes en ligne/hors ligne

### 📚 Bibliothèque
- Liste complète des **livres disponibles** (en ligne)
- Parcourez la collection de livres numériques
- Téléchargez vos livres préférés pour les lire hors ligne

### 💾 Téléchargements
- Affiche **tous vos contenus téléchargés**
- Organisé en 2 sections : **Cours** et **Bibliothèque**
- Indique la **barre de stockage utilisé**
- Permet de **supprimer** des contenus pour libérer de l'espace

### 👤 Profil
- Affiche vos **informations personnelles** (nom, école, niveau, ID)
- Indique le **statut de synchronisation** (En ligne / Hors ligne / En cours)
- Affiche des **statistiques** (cours suivis, leçons complétées, temps d'étude, livres lus)
- Contient les **Outils de développement** pour tester les notifications
- Permet de se **déconnecter**

---

## 3. Comprendre le Mode En Ligne vs Hors Ligne

Bonecole est conçu pour **économiser la bande passante du kiosque** tout en permettant un apprentissage fluide hors ligne.

### 🟢 Mode En Ligne (Connecté au Kiosque)

**Utilisé uniquement pour : Découverte & Téléchargement**

Lorsque vous êtes connecté au Wi-Fi de l'école (kiosque) :
- ✅ Vous pouvez **parcourir** tous les cours et livres disponibles
- ✅ Vous pouvez **télécharger** des cours complets ou des leçons individuelles
- ✅ Vous pouvez **télécharger** des livres numériques
- ❌ **La lecture est désactivée** pour économiser la bande passante

**Pourquoi la lecture est désactivée en ligne ?**
Le kiosque de l'école a une bande passante limitée. Pour permettre à tous les élèves de télécharger rapidement, la lecture en streaming est désactivée. Téléchargez d'abord, puis étudiez hors ligne !

### 🔴 Mode Hors Ligne

**Utilisé pour : Apprentissage & Lecture**

Lorsque vous n'êtes pas connecté au kiosque :
- ✅ Vous pouvez **étudier** tous vos cours téléchargés
- ✅ Vous pouvez **regarder des vidéos**, **écouter des audios** et **lire des PDFs**
- ✅ Votre **progression est automatiquement sauvegardée**
- ✅ Vous pouvez **reprendre là où vous vous êtes arrêté**
- ❌ Vous ne pouvez **pas découvrir** de nouveaux contenus
- ❌ Vous ne pouvez **pas télécharger** de nouveaux contenus

### 🔄 Simulateur de Connexion

Pour faciliter les tests, l'application inclut un **simulateur de connexion** visible sur l'écran d'accueil :

- **Basculez** entre "🟢 En Ligne" et "🔴 Hors Ligne" avec le bouton
- Utile pour comprendre les différences entre les deux modes
- En mode hors ligne, l'application affiche : *"Mode Hors Ligne - Connectez-vous au Wi-Fi de l'école pour découvrir et télécharger de nouveaux contenus."*

---

## 4. Découverte et Téléchargement

### Parcourir les Cours

#### Depuis l'Onglet "Cours" (Accueil)
1. Assurez-vous d'être **connecté au kiosque** (🟢 En Ligne)
2. Faites défiler jusqu'à la section **"Mes Cours"**
3. Cliquez sur **"Voir tout"** pour voir tous les cours disponibles pour votre niveau
4. Cliquez sur un cours pour ouvrir la **page de détails**

#### Depuis la Page "Tous les Cours"
- Accédez à la liste complète des cours filtrés par votre niveau
- Chaque cours affiche :
  - Un emoji représentant la matière
  - Le titre du cours
  - La description
  - Le niveau scolaire

### Page de Détails d'un Cours

La page de détails vous montre :
- **Informations du cours** : titre, description, nombre de leçons
- **Liste des leçons** avec :
  - Type de média (🎥 Vidéo, 🎵 Audio, 📄 PDF)
  - Durée estimée
  - Taille du fichier
  - Statut de téléchargement
- **Boutons d'action** :
  - **"Télécharger tout le cours"** : télécharge toutes les leçons en une fois
  - Bouton de téléchargement individuel pour chaque leçon

### Télécharger un Cours

#### Option 1 : Télécharger Tout le Cours
1. Ouvrez la page de détails du cours
2. Cliquez sur **"Télécharger tout le cours"**
3. Attendez la confirmation (simulation de 3 secondes)
4. Toutes les leçons sont maintenant disponibles hors ligne !

#### Option 2 : Télécharger des Leçons Individuelles
1. Ouvrez la page de détails du cours
2. Cliquez sur le bouton **"Télécharger"** (icône de nuage) à côté d'une leçon spécifique
3. La leçon est téléchargée individuellement

### Parcourir et Télécharger des Livres

#### Depuis l'Onglet "Bibliothèque"
1. Connectez-vous au kiosque (🟢 En Ligne)
2. Parcourez la liste des livres disponibles
3. Cliquez sur un livre pour voir les détails :
   - Titre
   - Auteur
   - Description
4. Cliquez sur **"Télécharger"** pour ajouter le livre à votre bibliothèque hors ligne

#### Depuis l'Accueil
- La section **"Bibliothèque"** sur l'écran d'accueil affiche un aperçu des livres
- Cliquez sur **"Voir tout"** pour accéder à la bibliothèque complète

---

## 5. Apprentissage (Lecteurs Multimédias)

Une fois vos contenus téléchargés, vous pouvez les étudier **à tout moment, même hors ligne**.

### 🎥 Lecteur Vidéo

**Accès** : Cliquez sur une leçon vidéo depuis l'onglet "Téléchargements"

Fonctionnalités :
- **Plein écran automatique** pour une expérience immersive
- **Contrôles vidéo** : lecture/pause, barre de progression, volume
- **Sauvegarde automatique de la progression** :
  - Votre position dans la vidéo est enregistrée toutes les 3 secondes
  - Reprenez là où vous vous êtes arrêté, même après avoir fermé l'app
- **Marque automatiquement la leçon comme complétée** à 95% de visionnage
- **Bouton de fermeture** (X) en haut à gauche pour revenir à la liste

### 🎵 Lecteur Audio

**Accès** : Cliquez sur une leçon audio depuis l'onglet "Téléchargements"

Fonctionnalités :
- **Interface en plein écran** avec pochette
- **Contrôles audio** : lecture/pause, avance/recul de 10 secondes, volume
- **Barre de progression** avec temps écoulé et durée totale
- **Sauvegarde automatique de la progression**
- **Marque comme complété** à 95% d'écoute
- **Mode portrait** optimisé

### 📄 Lecteur PDF

**Accès** : Cliquez sur une leçon PDF ou un livre depuis l'onglet "Téléchargements"

Fonctionnalités :
- **Lecteur PDF intégré** natif et performant
- **Navigation** : faites défiler verticalement pour changer de page
- **Zoom** : pincez pour zoomer/dézoomer sur le texte
- **Numéro de page actuel** affiché en haut
- **Sauvegarde automatique de la dernière page consultée** :
  - Reprenez votre lecture au bon endroit à chaque ouverture
- **Bouton de fermeture** pour revenir à la liste

### Section "Continuer l'apprentissage"

Sur l'écran d'accueil, la section **"Continuer l'apprentissage"** affiche vos **3 dernières activités** avec :
- Le titre du contenu (cours ou livre)
- Le sous-titre (description ou auteur)
- **La barre de progression** avec pourcentage
- La date du dernier accès ("Il y a 2 heures", "Hier", etc.)

Cliquez sur une activité pour revenir directement à l'onglet "Téléchargements" et reprendre votre étude.

---

## 6. Gestion du Stockage

### Barre de Stockage

L'onglet **"Téléchargements"** affiche une **barre de stockage** en haut de l'écran :

**Informations affichées :**
- **Stockage utilisé** : par exemple "245 MB / 2 GB"
- **Pourcentage d'utilisation** : barre visuelle colorée
  - 🟦 **Bleu** (0-50%) : espace suffisant
  - 🟨 **Jaune** (50-80%) : espace modéré
  - 🟥 **Rouge** (80-100%) : espace faible

**Alerte d'espace faible** : Si le stockage dépasse 80%, un message d'avertissement apparaît :
> ⚠️ "Espace faible - Supprimez des contenus pour libérer de l'espace"

### Supprimer des Contenus

Vous pouvez supprimer des contenus pour libérer de l'espace :

#### Supprimer un Cours Complet
1. Allez dans l'onglet **"Téléchargements"**
2. Cliquez sur le bouton **"Supprimer"** (rouge) sous le cours
3. Confirmez la suppression
4. Toutes les leçons du cours sont effacées

#### Supprimer une Leçon Individuelle
1. Allez dans l'onglet **"Téléchargements"**
2. Développez le cours (cliquez dessus)
3. Cliquez sur l'icône **"poubelle"** 🗑️ à côté d'une leçon
4. Confirmez la suppression
5. Seule cette leçon est effacée

#### Supprimer un Livre
1. Allez dans l'onglet **"Téléchargements"** > **"Bibliothèque"**
2. Cliquez sur **"Supprimer"** sous le livre
3. Confirmez la suppression

**Note** : Les suppressions sont **définitives**. Vous devrez retélécharger les contenus si vous en avez besoin à nouveau.

---

## 7. Synchronisation et Profil

### Statut de Synchronisation

Dans l'onglet **"Profil"**, la section **"Statut de Synchronisation"** indique l'état actuel :

#### 🟢 Synchronisé (En Ligne)
- Icône : ✅ Coche verte
- Message : *"Toutes vos données sont à jour"*
- Badge : **"🟢 En Ligne"**

#### 🔄 Synchronisation en cours
- Icône : ♻️ Icône de synchronisation animée
- Message : *"Mise à jour de vos données..."*
- Apparaît pendant 2 secondes lors de la reconnexion au kiosque

#### 🔴 Données en attente (Hors Ligne)
- Icône : ⏰ Horloge
- Message : *"Connectez-vous pour synchroniser"*
- Badge : **"🔴 Hors Ligne"**

### Statistiques

Le profil affiche vos statistiques d'apprentissage :

| Statistique | Icône | Description |
|------------|-------|-------------|
| **Cours suivis** | 📖 | Nombre de cours que vous avez consultés |
| **Leçons complétées** | ✅ | Nombre de leçons terminées (≥95% de progression) |
| **Temps d'étude** | ⏱️ | Temps total passé à étudier (en heures) |
| **Livres lus** | 📚 | Nombre de livres consultés |

### Outils de Développement

La section **"Outils de développement"** permet de tester les **6 types de notifications** de l'application :

1. **Notification d'inactivité** 🕒
   - *"On dirait que vous nous avez manqué !"*
   - Se déclenche après 48h d'inactivité

2. **Notification de fin de cours** 🏆
   - *"Félicitations ! Vous avez terminé..."*
   - Se déclenche lorsque toutes les leçons d'un cours sont complétées

3. **Notification de continuation** 📖
   - *"N'oubliez pas de finir votre leçon..."*
   - Rappelle de terminer une leçon en cours

4. **Notification de nouveau contenu** 📥
   - *"De nouvelles leçons et livres sont disponibles..."*
   - Informe de l'arrivée de nouveaux contenus sur le kiosque

5. **Notification de prochaine séance** 📅
   - *"Ta prochaine révision n'est pas encore enregistrée..."*
   - Rappelle de planifier votre prochaine session d'étude

6. **Notification d'espace faible** ⚠️
   - *"Tu n'as presque plus d'espace..."*
   - Alerte quand le stockage est presque plein

**Comment tester une notification :**
1. Cliquez sur l'une des options
2. Une alerte apparaît : *"Notification programmée ✅ - La notification apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir."*
3. Appuyez sur **"OK"** et minimisez l'application
4. La notification s'affiche après 5 secondes

### Se Déconnecter

Pour vous déconnecter :
1. Allez dans l'onglet **"Profil"**
2. Faites défiler jusqu'en bas
3. Cliquez sur le bouton rouge **"Déconnexion"**
4. Confirmez votre choix

**Attention** : La déconnexion supprime vos identifiants locaux. Vous devrez vous reconnecter avec votre ID Élève et PIN.

---

## Astuces et Bonnes Pratiques

### ✅ À Faire
- ✅ **Téléchargez vos cours à l'école** (connecté au kiosque) pour économiser vos données mobiles
- ✅ **Étudiez hors ligne** pour une expérience fluide sans interruption
- ✅ **Surveillez votre stockage** et supprimez les contenus terminés
- ✅ **Reprenez régulièrement** vos activités dans "Continuer l'apprentissage"
- ✅ **Complétez vos leçons à 100%** pour débloquer les notifications de félicitations

### ❌ À Éviter
- ❌ **Ne tentez pas de lire en ligne** : la lecture est désactivée pour économiser la bande passante
- ❌ **N'accumulez pas trop de contenus** : gérez votre espace de stockage
- ❌ **Ne partagez pas vos identifiants** : ils sont personnels et liés à votre progression

---

## Questions Fréquentes (FAQ)

### Q : Pourquoi je ne peux pas lire de vidéos quand je suis connecté au kiosque ?
**R** : Pour économiser la bande passante de l'école, la lecture est désactivée en mode en ligne. Téléchargez d'abord vos contenus, puis étudiez hors ligne.

### Q : Mes vidéos se téléchargent trop lentement, que faire ?
**R** : Essayez de télécharger pendant les heures creuses (tôt le matin ou en fin de journée) quand moins d'élèves utilisent le kiosque.

### Q : Pourquoi je ne vois pas tous les cours de mon école ?
**R** : Bonecole filtre automatiquement les cours selon votre niveau (classe). Vous ne voyez que les cours adaptés à votre année scolaire.

### Q : Comment savoir si ma progression est sauvegardée ?
**R** : Bonecole sauvegarde automatiquement votre progression toutes les 3 secondes pendant la lecture. Pas besoin d'action manuelle !

### Q : Que se passe-t-il si je supprime une leçon puis change d'avis ?
**R** : Vous devrez la retélécharger depuis le kiosque. Les suppressions sont définitives.

### Q : Les statistiques sont-elles réelles ?
**R** : Actuellement, les statistiques affichées dans le profil sont des valeurs de démonstration. Dans une version future, elles refléteront votre vraie progression.

### Q : Comment fonctionne le simulateur de connexion ?
**R** : Le simulateur (toggle 🟢/🔴 sur l'accueil) permet de basculer artificiellement entre les modes en ligne et hors ligne, même si votre connexion réelle est différente. C'est un outil de test.

---

## Support et Assistance

Si vous rencontrez des problèmes techniques ou avez des questions :

1. **Contactez votre enseignant** ou le responsable informatique de votre école
2. **Vérifiez que vous utilisez la dernière version** de Bonecole (version affichée en bas du profil)
3. **Redémarrez l'application** si elle ne répond plus

**Version actuelle** : 1.0.0

---

## À Propos de Bonecole

**Bonecole** est une application mobile éducative conçue pour démocratiser l'accès à l'éducation au Sénégal. Elle permet aux élèves d'accéder à des contenus pédagogiques de qualité, même dans les zones à faible connectivité.

**Développé avec** : React Native, Expo, TypeScript

**© 2024 Bonecole - Votre école au bout du doigt**
