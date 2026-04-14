# 🛍️ JDENMO SHOP - Guide de démarrage

## ✅ Installation et lancement

### 1. Installer les dépendances Node.js
```bash
npm install
```

### 2. Lancer le serveur
```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

---

## 🌐 Accès au site

### 👥 Pour les clients
- **Boutique** : http://localhost:3000
- Peuvent parcourir et commander les produits
- Aucun accès à l'administration

### 🔐 Pour l'administrateur
- **Page de connexion** : http://localhost:3000/login.html
- **Identifiant** : `admin`
- **Mot de passe** : `jdenmo2026`
- Accès complet à l'administration après connexion

---

## 📝 Fonctionnalités

### Boutique (index.html)
✅ Affichage dynamique des produits depuis le serveur
✅ Intégration WhatsApp pour les commandes
✅ Modes de paiement locaux (Orange Money, MTN, Wave, Flooz)
✅ Design bleu/blanc ivoirien

### Administration (login.html + admin.html)
✅ Authentification sécurisée par token JWT
✅ Ajouter des produits
✅ Supprimer des produits
✅ Les produits sont sauvegardés dans `products.json`
✅ Seul l'admin peut accéder à cette section

---

## 🔧 Configuration importante

**Changer votre numéro WhatsApp :**

Ouvrez [script.js](script.js) et trouvez cette ligne :
```javascript
const whatsappNumber = "225000000000";
```

Remplacez par votre vrai numéro ivoirien :
```javascript
const whatsappNumber = "225XXXXXXXXX"; // Par exemple : 22501234567
```

---

## 📱 API Endpoints (protégés par authentification)

- `GET /api/products` - Lister tous les produits (public)
- `POST /api/products` - Ajouter un produit (admin)
- `DELETE /api/products/:id` - Supprimer un produit (admin)
- `POST /api/login` - Connexion admin

---

## 🚀 Prochaines étapes possibles

1. Ajouter une vraie base de données (MongoDB, MySQL)
2. Intégrer un vrai système de paiement en ligne
3. Ajouter la page de modification des produits
4. Créer un système d'historique des commandes
5. Déployer le serveur en ligne (Heroku, DigitalOcean, etc.)

---

## ⚠️ Important

- Les produits sont sauvegardés dans `products.json`
- Le token JWT expire après 24 heures
- Les images peuvent être locales (ex : `2.jpg`) ou des URLs externes
"# jdenmo-shop"  
"# jdenmo-shop"  
