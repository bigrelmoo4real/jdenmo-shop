const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Pool } = require("pg");
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "JDENMO_SECRET_2026_IVORY_COAST";
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "jdenmo2026";
const PRODUCTS_FILE = path.join(__dirname, "products.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const defaultProducts = [
    {
        id: "tshirt-noir",
        name: "T-shirt classique noir",
        price: 5000,
        description: "Coupe confortable, tissu leger pour le climat ivoirien.",
        image: "2.jpg",
        category: "t-shirts",
        sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
        id: "tshirt-blanc",
        name: "T-shirt classique blanc",
        price: 5000,
        description: "Style simple et elegant pour tous les jours.",
        image: "3.jpg",
        category: "t-shirts",
        sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
        id: "chemise-bleue",
        name: "Chemise bleue premium",
        price: 12000,
        description: "Chemise moderne pour ceremonie ou sortie en ville.",
        image: "4.jpg",
        category: "chemises",
        sizes: ["S", "M", "L", "XL", "XXL"]
    }
];

const pool = hasDatabase
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("sslmode=require")
            ? undefined
            : { rejectUnauthorized: false }
    })
    : null;

if (hasCloudinary) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const upload = multer({
    storage: hasCloudinary ? multer.memoryStorage() : multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
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

function createProductId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeProduct(product) {
    return {
        ...product,
        price: parseInt(product.price, 10),
        category: product.category || null,
        sizes: Array.isArray(product.sizes) && product.sizes.length > 0
            ? product.sizes
            : ["S", "M", "L", "XL", "XXL"]
    };
}

function saveProductsToFile(products) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function loadProductsFromFile() {
    try {
        if (fs.existsSync(PRODUCTS_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
            return parsed.map(normalizeProduct);
        }
    } catch (error) {
        console.error("Erreur lecture produits :", error);
    }

    saveProductsToFile(defaultProducts);
    return defaultProducts;
}

async function ensureDatabaseSchema() {
    if (!pool) return;

    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            category TEXT,
            sizes JSONB NOT NULL DEFAULT '["S","M","L","XL","XXL"]'::jsonb,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `);

    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
    if (rows[0].count === 0) {
        for (const product of defaultProducts) {
            const normalized = normalizeProduct(product);
            await pool.query(
                `INSERT INTO products (id, name, price, description, image, category, sizes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
                [
                    normalized.id,
                    normalized.name,
                    normalized.price,
                    normalized.description,
                    normalized.image,
                    normalized.category,
                    JSON.stringify(normalized.sizes)
                ]
            );
        }
    }
}

async function getAllProducts() {
    if (!pool) {
        return loadProductsFromFile();
    }

    const result = await pool.query(
        "SELECT id, name, price, description, image, category, sizes FROM products ORDER BY created_at DESC"
    );

    return result.rows.map(normalizeProduct);
}

async function addProduct(productInput) {
    const product = normalizeProduct(productInput);

    if (!pool) {
        const products = loadProductsFromFile();
        let id = product.id;
        if (products.some(item => item.id === id)) {
            id = `${id}-${Date.now()}`;
        }

        const newProduct = { ...product, id };
        products.unshift(newProduct);
        saveProductsToFile(products);
        return newProduct;
    }

    let id = product.id;
    const existing = await pool.query("SELECT id FROM products WHERE id = $1", [id]);
    if (existing.rowCount > 0) {
        id = `${id}-${Date.now()}`;
    }

    const result = await pool.query(
        `INSERT INTO products (id, name, price, description, image, category, sizes)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING id, name, price, description, image, category, sizes`,
        [
            id,
            product.name,
            product.price,
            product.description,
            product.image,
            product.category,
            JSON.stringify(product.sizes)
        ]
    );

    return normalizeProduct(result.rows[0]);
}

async function deleteProductById(id) {
    if (!pool) {
        const products = loadProductsFromFile();
        const updated = products.filter(product => product.id !== id);
        if (updated.length === products.length) {
            return false;
        }

        saveProductsToFile(updated);
        return true;
    }

    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return result.rowCount > 0;
}

async function updateProductById(id, updates) {
    if (!pool) {
        const products = loadProductsFromFile();
        const index = products.findIndex(product => product.id === id);
        if (index === -1) {
            return null;
        }

        const current = products[index];
        products[index] = normalizeProduct({
            ...current,
            name: updates.name || current.name,
            price: updates.price ?? current.price,
            description: updates.description || current.description,
            image: updates.image || current.image,
            category: updates.category || current.category,
            sizes: updates.sizes || current.sizes
        });

        saveProductsToFile(products);
        return products[index];
    }

    const currentResult = await pool.query(
        "SELECT id, name, price, description, image, category, sizes FROM products WHERE id = $1",
        [id]
    );

    if (currentResult.rowCount === 0) {
        return null;
    }

    const current = normalizeProduct(currentResult.rows[0]);
    const next = normalizeProduct({
        ...current,
        name: updates.name || current.name,
        price: updates.price ?? current.price,
        description: updates.description || current.description,
        image: updates.image || current.image,
        category: updates.category || current.category,
        sizes: updates.sizes || current.sizes
    });

    const result = await pool.query(
        `UPDATE products
         SET name = $2, price = $3, description = $4, image = $5, category = $6, sizes = $7::jsonb
         WHERE id = $1
         RETURNING id, name, price, description, image, category, sizes`,
        [
            id,
            next.name,
            next.price,
            next.description,
            next.image,
            next.category,
            JSON.stringify(next.sizes)
        ]
    );

    return normalizeProduct(result.rows[0]);
}

async function uploadImageToCloudinary(file) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "jdenmo-shop",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
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

app.post("/api/upload", verifyToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Aucune image fournie" });
        }

        if (hasCloudinary) {
            const imageUrl = await uploadImageToCloudinary(req.file);
            return res.json({ imageUrl });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        return res.json({ imageUrl, filename: req.file.filename });
    } catch (error) {
        console.error("Erreur upload image :", error);
        return res.status(500).json({ error: "Echec de l'upload de l'image" });
    }
});

app.get("/api/products", async (req, res) => {
    try {
        let products = await getAllProducts();
        const { category } = req.query;

        if (category) {
            products = products.filter(product => product.category === category);
        }

        return res.json(products);
    } catch (error) {
        console.error("Erreur recuperation produits :", error);
        return res.status(500).json({ error: "Impossible de charger les produits" });
    }
});

app.get("/api/categories", async (req, res) => {
    try {
        const products = await getAllProducts();
        const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
        return res.json({ categories: categories.sort() });
    } catch (error) {
        console.error("Erreur recuperation categories :", error);
        return res.status(500).json({ error: "Impossible de charger les categories" });
    }
});

app.post("/api/products", verifyToken, async (req, res) => {
    try {
        const { name, price, description, image, category, sizes } = req.body;

        if (!name || !price || !description || !image || !category) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        const newProduct = await addProduct({
            id: createProductId(name),
            name,
            price: parseInt(price, 10),
            description,
            image,
            category,
            sizes
        });

        return res.json({ message: "Produit ajoute", product: newProduct });
    } catch (error) {
        console.error("Erreur ajout produit :", error);
        return res.status(500).json({ error: "Impossible d'ajouter le produit" });
    }
});

app.delete("/api/products/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await deleteProductById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Produit non trouve" });
        }

        return res.json({ message: "Produit supprime" });
    } catch (error) {
        console.error("Erreur suppression produit :", error);
        return res.status(500).json({ error: "Impossible de supprimer le produit" });
    }
});

app.put("/api/products/:id", verifyToken, async (req, res) => {
    try {
        const product = await updateProductById(req.params.id, req.body);
        if (!product) {
            return res.status(404).json({ error: "Produit non trouve" });
        }

        return res.json({ message: "Produit mis a jour", product });
    } catch (error) {
        console.error("Erreur mise a jour produit :", error);
        return res.status(500).json({ error: "Impossible de mettre a jour le produit" });
    }
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: error.message });
    }

    if (error) {
        return res.status(400).json({ error: error.message || "Erreur inconnue" });
    }

    return next();
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

async function startServer() {
    try {
        if (pool) {
            await ensureDatabaseSchema();
            console.log("Base Postgres connectee.");
        } else {
            console.log("Mode fichier local actif.");
        }

        if (hasCloudinary) {
            console.log("Upload Cloudinary actif.");
        } else {
            console.log("Upload local actif.");
        }

        const localIP = getLocalIP();
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`JDENMO SHOP server lance sur http://localhost:${PORT}`);
            console.log(`Acces depuis le telephone : http://${localIP}:${PORT}`);
            console.log(`API disponible sur http://localhost:${PORT}/api/products`);
            console.log(`Admin : http://localhost:${PORT}/login.html`);
        });
    } catch (error) {
        console.error("Impossible de demarrer le serveur :", error);
        process.exit(1);
    }
}

startServer();
