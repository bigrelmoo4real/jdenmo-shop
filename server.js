const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "JDENMO_SECRET_2026_IVORY_COAST";
const ADMIN_LOGIN = "admin";
const ADMIN_PASSWORD = "jdenmo2026";
const PRODUCTS_FILE = path.join(__dirname, "products.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Seules les images sont acceptees (JPEG, PNG, GIF, WebP)"));
        }
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use("/uploads", express.static(UPLOADS_DIR));

function loadProducts() {
    try {
        if (fs.existsSync(PRODUCTS_FILE)) {
            return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
        }
    } catch (error) {
        console.error("Erreur lecture produits :", error);
    }

    const defaults = [];
    saveProducts(defaults);
    return defaults;
}

function saveProducts(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Identifiant et mot de passe requis" });
    }

    if (username === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ admin: true }, SECRET_KEY, { expiresIn: "24h" });
        return res.json({ token, message: "Connexion reussie" });
    }

    return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
});

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Non autorise" });
    }

    try {
        jwt.verify(token, SECRET_KEY);
        return next();
    } catch (error) {
        return res.status(401).json({ error: "Token invalide" });
    }
}

app.post("/api/upload", verifyToken, upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucune image fournie" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    return res.json({ imageUrl, filename: req.file.filename });
});

app.get("/api/products", (req, res) => {
    let products = loadProducts();
    const { category } = req.query;

    if (category) {
        products = products.filter(product => product.category === category);
    }

    return res.json(products);
});

app.get("/api/categories", (req, res) => {
    const products = loadProducts();
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
    return res.json({ categories: categories.sort() });
});

app.post("/api/products", verifyToken, (req, res) => {
    const { name, price, description, image, category, sizes } = req.body;

    if (!name || !price || !description || !image || !category) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const products = loadProducts();
    const newProduct = {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        name,
        price: parseInt(price, 10),
        description,
        image,
        category,
        sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ["S", "M", "L", "XL", "XXL"]
    };

    if (products.some(product => product.id === newProduct.id)) {
        newProduct.id = `${newProduct.id}-${Date.now()}`;
    }

    products.unshift(newProduct);
    saveProducts(products);
    return res.json({ message: "Produit ajoute", product: newProduct });
});

app.delete("/api/products/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    const products = loadProducts();
    const updatedProducts = products.filter(product => product.id !== id);

    if (updatedProducts.length === products.length) {
        return res.status(404).json({ error: "Produit non trouve" });
    }

    saveProducts(updatedProducts);
    return res.json({ message: "Produit supprime" });
});

app.put("/api/products/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    const { name, price, description, image, category, sizes } = req.body;

    const products = loadProducts();
    const productIndex = products.findIndex(product => product.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: "Produit non trouve" });
    }

    products[productIndex] = {
        ...products[productIndex],
        name: name || products[productIndex].name,
        price: price ? parseInt(price, 10) : products[productIndex].price,
        description: description || products[productIndex].description,
        image: image || products[productIndex].image,
        category: category || products[productIndex].category,
        sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : products[productIndex].sizes
    };

    saveProducts(products);
    return res.json({ message: "Produit mis a jour", product: products[productIndex] });
});

const os = require("os");

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

const localIP = getLocalIP();

app.listen(PORT, "0.0.0.0", () => {
    console.log(`JDENMO SHOP server lance sur http://localhost:${PORT}`);
    console.log(`Acces depuis le telephone : http://${localIP}:${PORT}`);
    console.log(`API disponible sur http://localhost:${PORT}/api/products`);
    console.log(`Admin : http://localhost:${PORT}/login.html`);
});
