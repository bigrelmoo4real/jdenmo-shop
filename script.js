// API_URL est déjà défini dans cart.js
const whatsappNumber = "22505069735221"; // Remplacez par votre numéro Orange/MTN/WhatsApp

function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0
    }).format(value);
}

async function renderProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        const products = await response.json();
        const grid = document.getElementById("productsGrid");

        grid.innerHTML = products.map(product => `
            <article class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="card-body">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price">${formatPrice(product.price)}</div>
                    <button class="btn-order" onclick="event.stopPropagation(); quickAddToCart('${product.id}', '${product.name}', ${product.price}, '${product.image}')">
                        Ajouter au panier
                    </button>
                </div>
            </article>
        `).join("");
    } catch (error) {
        console.error("Erreur chargement produits :", error);
        document.getElementById("productsGrid").innerHTML = "<p style='color: #4a5d8a;'>Erreur de chargement. Assurez-vous que le serveur est en cours d'exécution.</p>";
    }
}

function quickAddToCart(productId, productName, productPrice, productImage) {
    const product = { id: productId, name: productName, price: productPrice, image: productImage };
    addToCart(product, 1, "S");
    alert(`✅ ${productName} ajouté au panier !`);
}

window.addEventListener("DOMContentLoaded", renderProducts);
