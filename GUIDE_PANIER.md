# 🛍️ JDENMO SHOP - Guide Complet du Système de Panier & Checkout

## 🎯 Nouvelles Fonctionnalités

### ✅ Système de Panier Complet
- **Panier local** : Les produits sont sauvegardés dans le navigateur (localStorage)
- **Gestion des tailles** : Chaque produit peut avoir une taille différente
- **Édition des quantités** : Augmenter/diminuer la quantité directement dans le panier
- **Icône panier** : Compteur visible en haut de la page

### ✅ Processus de Paiement en 3 Étapes
1. **Étape 1 : Récapitulatif** - Vérifier les produits et le total
2. **Étape 2 : Paiement** - Sélectionner le mode de paiement et les détails
3. **Étape 3 : Confirmation** - Envoyer la commande via WhatsApp

### ✅ Modes de Paiement
- 🟠 Orange Money
- 🟡 MTN Mobile Money
- 💳 Wave
- 📱 Flooz

---

## 📂 Nouveaux Fichiers

```
cart.js              - Gestion du panier (localStorage)
product.html         - Page de détail produit avec sélection de taille
cart.html            - Page du panier avec édition des quantités
checkout.html        - Processus de paiement (3 étapes)
```

---

## 🚀 Comment ça marche ?

### Pour les Clients

#### 1. Parcourir la Boutique
- Accéder à **http://localhost:3000**
- Voir tous les vêtements disponibles
- Cliquer sur un produit pour voir les détails

#### 2. Détails du Produit
- **Page produit** : http://localhost:3000/product.html?id=XXX
- Voir l'image, la description, le prix
- **Sélectionner une taille** : S, M, L, XL, XXL
- **Choisir la quantité** : +/- boutons
- **Ajouter au panier** : Le produit est enregistré avec sa taille

#### 3. Gestion du Panier
- **Accéder au panier** : http://localhost:3000/cart.html
- Voir tous les articles avec :
  - 📷 Image
  - 📝 Nom
  - 📊 Quantité modifiable
  - 💰 Prix total par article
- **Modifier les quantités** : Cliquer +/- ou entrer directement
- **Supprimer un article** : Bouton "Supprimer"
- **Total du panier** : Calculé automatiquement

#### 4. Processus de Paiement (Checkout)
- Cliquer sur **"Procéder au paiement"**
- **Étape 1** : Vérifier le récapitulatif (articles, prix)
- **Étape 2** : 
  - Choisir le mode de paiement (Orange Money, MTN, Wave, Flooz)
  - Remplir : Nom, Téléphone, Email, Adresse
- **Étape 3** :
  - Confirmer la commande
  - Cliquer **"Envoyer via WhatsApp"**
  - Un message pré-rempli s'envoie avec tous les détails
  - Le client finit le paiement sur WhatsApp

### Pour l'Admin

#### 1. Accéder au Panneau Admin
- Aller à **http://localhost:3000/login.html**
- Identifiant : `admin`
- Mot de passe : `jdenmo2026`

#### 2. Ajouter un Produit
- Nom du vêtement
- Prix en FCFA
- Description
- **Tailles disponibles** : Cocher S, M, L, XL, XXL
- **Image** : Upload depuis votre ordinateur
- Cliquer **"Ajouter le produit"**

#### 3. Gérer les Produits
- La liste s'affiche en temps réel
- Voir : Nom, Prix, Tailles disponibles, Image
- **Supprimer** : Bouton rouge "Supprimer"
- Les changements apparaissent immédiatement sur la boutique

---

## 🔧 Configuration Importante

### Changer le Numéro WhatsApp

**Dans `cart.js` et `checkout.html`, cherchez :**

```javascript
const WHATSAPP_NUMBER = "225000000000";
```

**Remplacez par votre numéro ivoirien :**

```javascript
const WHATSAPP_NUMBER = "22501234567"; // Votre vrai numéro
```

---

## 💾 Stockage des Données

- **Panier client** : Sauvegardé localement dans le navigateur (localStorage)
- **Produits** : Sauvegardés dans `products.json` sur le serveur
- **Images** : Uploadées dans le dossier `/uploads`
- **Commandes** : Envoyées via WhatsApp au numéro configuré

---

## 🔐 Sécurité

✅ Les clients ne voient **jamais** le lien admin
✅ Les uploads demandent l'authentification
✅ Les tailles sont gérées par produit
✅ Les quantités et le total sont validés

---

## 📱 Flux Cliente Complet

```
Index (Boutique) 
    ↓ (Clic sur un produit)
Product (Détail + Taille + Quantité)
    ↓ (Ajouter au panier)
Panier (Voir et modifier les articles)
    ↓ (Procéder au paiement)
Checkout Step 1 (Récapitulatif) 
    ↓
Checkout Step 2 (Paiement + Infos) 
    ↓
Checkout Step 3 (Confirmation)
    ↓ (Envoyer via WhatsApp)
Conversation WhatsApp (Finaliser paiement)
```

---

## 🎨 Style Ivoirien

- **Couleurs** : Bleu (#0a3d91) et Blanc
- **Modes de paiement ivoiriens** : Orange Money, MTN, Wave, Flooz
- **Langue** : Français
- **Devise** : FCFA

---

## 🚀 Redémarrer le Serveur

```bash
npm start
```

Le serveur démarre sur **http://localhost:3000** 🎉

---

## ⚠️ Important

Après avoir modifié les fichiers JavaScript ou le serveur, **redémarrez le serveur** :

1. Appuyez sur **Ctrl + C** dans le terminal
2. Tapez `npm start` à nouveau
3. Rafraîchissez votre navigateur (Ctrl + F5)

