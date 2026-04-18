const API_URL = "https://jdenmo-shop.onrender.com";

window.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("jdenmo_token");
    if (!token) {
        window.location.href = `${API_URL}/login.html`;
        return;
    }

    loadProducts();
    setupForm();
});

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        const products = await response.json();
        renderProductList(products);
    } catch (error) {
        console.error("Erreur chargement produits :", error);
        showToast("Impossible de charger les produits.", "error");
    }
}

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
                <span><small>Categorie: ${product.category || "Non specifiee"}</small></span>
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

function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0
    }).format(value);
}

function setupForm() {
    const form = document.getElementById("productForm");
    const submitBtn = document.getElementById("submitBtn");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("productName").value.trim();
        const price = document.getElementById("productPrice").value.trim();
        const category = document.getElementById("productCategory").value.trim();
        const description = document.getElementById("productDescription").value.trim();
        const imageInput = document.getElementById("productImage");
        const imageFile = imageInput.files[0];
        const sizeCheckboxes = document.querySelectorAll(".size-checkbox:checked");
        const sizes = Array.from(sizeCheckboxes).map(cb => cb.value);

        if (!name || !price || !description || !imageFile || !category) {
            showToast("Tous les champs sont obligatoires, y compris l'image et la categorie.", "error");
            return;
        }

        if (sizes.length === 0) {
            showToast("Veuillez selectionner au moins une taille.", "error");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Upload en cours...";

        try {
            const token = localStorage.getItem("jdenmo_token");
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error("Erreur upload image");
            }

            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.imageUrl;

            const productResponse = await fetch(`${API_URL}/api/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    price: parseInt(price, 10),
                    description,
                    image: imageUrl,
                    category,
                    sizes
                })
            });

            submitBtn.disabled = false;
            submitBtn.textContent = "Ajouter le produit";

            if (productResponse.ok) {
                showToast("Produit ajoute avec succes !", "success");
                form.reset();
                loadProducts();
            } else {
                const error = await productResponse.json();
                showToast(`Erreur : ${error.error}`, "error");
            }
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Ajouter le produit";
            showToast("Erreur de connexion au serveur.", "error");
            console.error(error);
        }
    });
}

async function deleteProduct(productId) {
    if (!confirm("Etes-vous sur de vouloir supprimer ce produit ?")) {
        return;
    }

    try {
        const token = localStorage.getItem("jdenmo_token");
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            showToast("Produit supprime avec succes !", "success");
            loadProducts();
        } else {
            showToast("Erreur lors de la suppression.", "error");
        }
    } catch (error) {
        showToast("Erreur de connexion au serveur.", "error");
        console.error(error);
    }
}

function editProduct(productId) {
    showToast("La modification n'est pas encore disponible.", "info");
}

function logout() {
    localStorage.removeItem("jdenmo_token");
    window.location.href = `${API_URL}/login.html`;
}
