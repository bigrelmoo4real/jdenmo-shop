const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;
const SECRET_KEY = "JDENMO_SECRET_2026_IVORY_COAST";
const ADMIN_LOGIN = "admin";
const ADMIN_PASSWORD = "jdenmo2026";
const PRODUCTS_FILE = path.join(__dirname, "products.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Seules les images sont acceptées (JPEG, PNG, GIF, WebP)"));
        }
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use("/uploads", express.static(UPLOADS_DIR));

// Charger les produits depuis le fichier
function loadProducts() {
    try {
        if (fs.existsSync(PRODUCTS_FILE)) {
            return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
        }
    } catch (error) {
        console.error("Erreur lecture produits :", error);
    }
    const defaults = [
        {
            id: "tshirt-noir",
            name: "T-shirt classique noir",
            price: 5000,
            description: "Coupe confortable, tissu léger pour le climat ivoirien.",
            image: "2.jpg",
            sizes: ["S", "M", "L", "XL", "XXL"]
        },
        {
            id: "tshirt-blanc",
            name: "T-shirt classique blanc",
            price: 5000,
            description: "Style simple et élégant pour tous les jours.",
            image: "3.jpg",
            sizes: ["S", "M", "L", "XL", "XXL"]
        },
        {
            id: "chemise-bleue",
            name: "Chemise bleue premium",
            price: 12000,
            description: "Chemise moderne pour cérémonie ou sortie en ville.",
            image: "4.jpg",
            sizes: ["S", "M", "L", "XL", "XXL"]
        }
    ];
    saveProducts(defaults);
    return defaults;
}

// Sauvegarder les produits dans le fichier
function saveProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

// Route: LOGIN
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Identifiant et mot de passe requis" });
    }

    if (username === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ admin: true }, SECRET_KEY, { expiresIn: "24h" });
        return res.json({ token, message: "Connexion réussie" });
    }

    res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
});

// Middleware: Vérifier le token
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Non autorisé" });
    }

    try {
        jwt.verify(token, SECRET_KEY);
        next();
    } catch (error) {
        res.status(401).json({ error: "Token invalide" });
    }
}

// Route: UPLOADER une image (protégé)
app.post("/api/upload", verifyToken, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucune image fournie" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl, filename: req.file.filename });
});

// Route: GET tous les produits (public)
app.get("/api/products", (req, res) => {
    const products = loadProducts();
    res.json(products);
});

// Route: AJOUTER un produit (protégé)
app.post("/api/products", verifyToken, (req, res) => {
    const { name, price, description, image, sizes } = req.body;

    if (!name || !price || !description || !image) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const products = loadProducts();
    const newProduct = {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        name,
        price: parseInt(price),
        description,
        image,
        sizes: sizes && Array.isArray(sizes) && sizes.length > 0 ? sizes : ["S", "M", "L", "XL", "XXL"]
    };

    // Vérifier que l'ID est unique
    if (products.some(p => p.id === newProduct.id)) {
        newProduct.id = newProduct.id + "-" + Date.now();
    }

    products.unshift(newProduct);
    saveProducts(products);
    res.json({ message: "Produit ajouté", product: newProduct });
});

// Route: SUPPRIMER un produit (protégé)
app.delete("/api/products/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    let products = loadProducts();
    const initial = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initial) {
        return res.status(404).json({ error: "Produit non trouvé" });
    }

    saveProducts(products);
    res.json({ message: "Produit supprimé" });
});

// Route: METTRE À JOUR un produit (protégé)
app.put("/api/products/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    const { name, price, description, image } = req.body;

    let products = loadProducts();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Produit non trouvé" });
    }

    products[productIndex] = {
        ...products[productIndex],
        name: name || products[productIndex].name,
        price: price ? parseInt(price) : products[productIndex].price,
        description: description || products[productIndex].description,
        image: image || products[productIndex].image
    };

    saveProducts(products);
    res.json({ message: "Produit mis à jour", product: products[productIndex] });
});

const os = require("os");

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Ignorer les adresses internes et les IPv6
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

const localIP = getLocalIP();

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🛍️  JDENMO SHOP server lancé sur http://localhost:${PORT}`);
    console.log(`📱 Accès depuis le téléphone : http://${localIP}:${PORT}`);
    console.log(`📊 API disponible sur http://localhost:${PORT}/api/products`);
    console.log(`🔐 Admin : http://localhost:${PORT}/login.html`);
});
