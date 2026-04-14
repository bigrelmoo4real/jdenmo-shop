// Gestion du panier avec localStorage et tailles
const CART_STORAGE_KEY = "jdenmo_cart";
const API_URL = "http://localhost:3000";

// Initialiser le panier
function getCart() {
    try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(product, quantity = 1, size = null) {
    if (quantity < 1) return;
    
    const cart = getCart();
    const cartItemKey = `${product.id}-${size || 'default'}`;
    
    // Chercher si le produit avec cette taille existe déjà
    const existingItem = cart.find(item => 
        item.id === product.id && item.size === size
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    updateCartCount();
    return true;
}

function removeFromCart(productId, size = null) {
    let cart = getCart();
    cart = cart.filter(item => !(item.id === productId && item.size === size));
    saveCart(cart);
    updateCartCount();
}

function updateCartItemQuantity(productId, size, quantity) {
    if (quantity < 1) {
        removeFromCart(productId, size);
        return;
    }
    
    const cart = getCart();
    const item = cart.find(i => i.id === productId && i.size === size);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
        updateCartCount();
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartCount() {
    const count = getCartItemCount();
    const cartIcon = document.querySelector(".cart-count");
    if (cartIcon) {
        cartIcon.textContent = count;
        cartIcon.style.display = count > 0 ? "flex" : "none";
    }
}

function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartCount();
}

function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0
    }).format(value);
}

// Initialiser le compteur au chargement
window.addEventListener("DOMContentLoaded", updateCartCount);
