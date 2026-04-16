# Configuration Neon + Cloudinary

Ce projet peut maintenant fonctionner en 2 modes :

- mode local/fichier : sans `DATABASE_URL`, les produits restent dans `products.json`
- mode persistant : avec `DATABASE_URL` + variables Cloudinary, les produits vont dans Neon et les images dans Cloudinary

## 1. Creer la base Neon

1. Creez un compte sur Neon
2. Creez un projet Postgres
3. Copiez la chaine de connexion `DATABASE_URL`
4. Collez-la dans Render > votre service > Environment

Exemple :

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

## 2. Creer le compte Cloudinary

1. Creez un compte Cloudinary
2. Recuperez :
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Ajoutez-les dans Render > Environment

## 3. Variables Render a ajouter

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SECRET_KEY=change-me
ADMIN_LOGIN=admin
ADMIN_PASSWORD=change-me
```

## 4. Installer les dependances localement

```bash
npm install
```

## 5. Redepoyer

Une fois les variables ajoutees :

1. poussez le code sur GitHub
2. laissez Render redeployer
3. ajoutez un produit depuis l'admin
4. verifiez qu'il reste apres redemarrage

## 6. Important

- les anciens produits de `products.json` sont importes automatiquement dans la base si la table est vide
- les nouvelles images seront envoyees sur Cloudinary
- si les variables Neon/Cloudinary ne sont pas renseignees, le projet continue en mode local
