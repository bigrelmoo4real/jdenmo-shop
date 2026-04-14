const API_URL = "https://jdenmo-shop.onrender.com";

// Vérifier l'authentification au chargement
window.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("jdenmo_token");
    if (!token) {
        alert("Vous devez vous connecter d'abord.");
        window.location.href = `${API_URL}/login.html`;
        return;
    }
    loadProducts();
    setupForm();
});

// CHARGER LES PRODUITS
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        const products = await response.json();
        renderProductList(products);
    } catch (error) {
        console.error("Erreur chargement produits :", error);
    }
}

// AFFICHER LA LISTE DES PRODUITS
function renderProductList(products) {
    const list = document.getElementById("productList");
    if (!products || products.length === 0) {
        list.innerHTML = "<p style='text-align: center; color: #4a5d8a;'>Aucun produit pour le moment.</p>";
        return;
    }

    list.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <div>
                <strong>${product.name}</strong>
                <span>${formatPrice(product.price)}</span>
                <span>${product.description}</span>
                <span><small>Tailles: ${(product.sizes || ["S", "M", "L", "XL", "XXL"]).join(", ")}</small></span>
                <span><small>Image: ${product.image}</small></span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-edit" onclick="editProduct('${product.id}')">Modifier</button>
                <button type="button" class="btn-delete" onclick="deleteProduct('${product.id}')">Supprimer</button>
            </div>
        </div>
    `).join("");
}

// FORMATER LE PRIX
function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0
    }).format(value);
}

// CONFIGURER LE FORMULAIRE
function setupForm() {
    const form = document.getElementById("productForm");
    const submitBtn = document.getElementById("submitBtn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("productName").value.trim();
        const price = document.getElementById("productPrice").value.trim();
        const description = document.getElementById("productDescription").value.trim();
        const imageInput = document.getElementById("productImage");
        const imageFile = imageInput.files[0];

        // Récupérer les tailles sélectionnées
        const sizeCheckboxes = document.querySelectorAll(".size-checkbox:checked");
        const sizes = Array.from(sizeCheckboxes).map(cb => cb.value);

        if (!name || !price || !description || !imageFile) {
            alert("Tous les champs sont obligatoires, y compris l'image");
            return;
        }

        if (sizes.length === 0) {
            alert("Veuillez sélectionner au moins une taille");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Upload en cours...";

        try {
            const token = localStorage.getItem("jdenmo_token");

            // D'abord uploader l'image
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error("Erreur upload image");
            }

            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.imageUrl;

            // Puis ajouter le produit avec l'URL de l'image et les tailles
            const productResponse = await fetch(`${API_URL}/api/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    price: parseInt(price),
                    description,
                    image: imageUrl,
                    sizes
                })
            });

            submitBtn.disabled = false;
            submitBtn.textContent = "Ajouter le produit";

            if (productResponse.ok) {
                alert("✅ Produit ajouté avec succès !");
                form.reset();
                loadProducts();
            } else {
                const error = await productResponse.json();
                alert("❌ Erreur : " + error.error);
            }
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Ajouter le produit";
            alert("❌ Erreur de connexion au serveur");
            console.error(error);
        }
    });
}

// SUPPRIMER UN PRODUIT
async function deleteProduct(productId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
        return;
    }

    try {
        const token = localStorage.getItem("jdenmo_token");
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("✅ Produit supprimé avec succès !");
            loadProducts();
        } else {
            alert("❌ Erreur lors de la suppression");
        }
    } catch (error) {
        alert("❌ Erreur de connexion au serveur");
        console.error(error);
    }
}

// MODIFIER UN PRODUIT (placeholder pour future amélioration)
function editProduct(productId) {
    alert("La modification est disponible prochainement. Pour le moment, supprimez et ajoutez le produit modifié.");
}

// DÉCONNEXION
function logout() {
    localStorage.removeItem("jdenmo_token");
    alert("Déconnecté.");
    window.location.href = `${API_URL}/login.html`;
}
