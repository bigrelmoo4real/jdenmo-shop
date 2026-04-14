const adminStorageKey = "jdenmo-products";
const defaultProducts = [
    {
        id: "tshirt-noir",
        name: "T-shirt classique noir",
        price: 5000,
        description: "Coupe confortable, tissu léger pour le climat ivoirien.",
        image: "2.jpg"
    },
    {
        id: "tshirt-blanc",
        name: "T-shirt classique blanc",
        price: 5000,
        description: "Style simple et élégant pour tous les jours.",
        image: "3.jpg"
    },
    {
        id: "chemise-bleue",
        name: "Chemise bleue premium",
        price: 12000,
        description: "Chemise moderne pour cérémonie ou sortie en ville.",
        image: "4.jpg"
    }
];

function loadAdminProducts() {
    const stored = localStorage.getItem(adminStorageKey);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return defaultProducts;
        }
    }
    saveAdminProducts(defaultProducts);
    return defaultProducts;
}

function saveAdminProducts(products) {
    localStorage.setItem(adminStorageKey, JSON.stringify(products));
}

function renderAdminList() {
    const products = loadAdminProducts();
    const list = document.getElementById("productList");
    list.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <div>
                <strong>${product.name}</strong>
                <span>${formatPrice(product.price)}</span>
                <span>${product.description}</span>
                <span>Image : ${product.image}</span>
            </div>
            <button type="button" onclick="deleteProduct('${product.id}')">Supprimer</button>
        </div>
    `).join("");
}

function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0
    }).format(value);
}

function deleteProduct(productId) {
    const products = loadAdminProducts();
    const updated = products.filter(item => item.id !== productId);
    saveAdminProducts(updated);
    renderAdminList();
}

function createProductId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function setupAdminForm() {
    const form = document.getElementById("productForm");
    const resetButton = document.getElementById("resetButton");

    form.addEventListener("submit", event => {
        event.preventDefault();
        const name = document.getElementById("productName").value.trim();
        const price = parseInt(document.getElementById("productPrice").value, 10);
        const description = document.getElementById("productDescription").value.trim();
        const image = document.getElementById("productImage").value.trim();
        if (!name || !price || !description || !image) return;

        const products = loadAdminProducts();
        const newProduct = {
            id: createProductId(name),
            name,
            price,
            description,
            image
        };

        const filtered = products.filter(item => item.id !== newProduct.id);
        filtered.unshift(newProduct);
        saveAdminProducts(filtered);
        renderAdminList();
        form.reset();
    });

    resetButton.addEventListener("click", () => {
        if (confirm("Réinitialiser la liste vers les produits par défaut ?")) {
            saveAdminProducts(defaultProducts);
            renderAdminList();
        }
    });
}

window.addEventListener("DOMContentLoaded", () => {
    setupAdminForm();
    renderAdminList();
});
