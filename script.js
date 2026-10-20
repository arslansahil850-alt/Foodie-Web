
document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const menuToggle = $(".menu-toggle");
    const navLinks = $(".nav-links");
    const searchInput = $("[data-search]");
    const menuGrid = $(".menu-grid");
    const cartButton = $(".cart-button");
    const cartCount = $(".cart-count");
    const cartDrawer = $("#cartDrawer");
    const cartItems = $("#cartItems");
    const cartTotal = $("#cartSubtotal");
    const categoryButtons = $$(".category-btn");
    const toastContainer = $(".toast-container");

    const money = amount =>
        new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            maximumFractionDigits: 0
        }).format(amount);

    const getFoodCards = () =>
        $$(".food-card", menuGrid || document);

    let activeCategory = "all";
    let searchTerm = "";
    let cart = [];
    let favorites = new Set();
    let toastTimer;
    let lastFocusedElement = null;

    const readCard = card => {
        const title = $(".food-title-row h3", card)?.textContent.trim()
            || card.dataset.name
            || "Food item";

        const priceElement = $(".food-price", card);
        const priceText = priceElement?.textContent || "";
        const price = Number(
            card.dataset.price
            || priceText.replace(/[^\d.]/g, "")
        ) || 0;

        const image = $("img", card)?.src || "";
        const category = (
            card.dataset.category
            || card.dataset.cat
            || ""
        ).toLowerCase();

        return {
            id: card.dataset.id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            title,
            price,
            image,
            category
        };
    };

    function showToast(message) {
        if (!toastContainer) {
            let toast = $("#app-toast");

            if (!toast) {
                toast = document.createElement("div");
                toast.id = "app-toast";
                toast.setAttribute("role", "status");
                toast.setAttribute("aria-live", "polite");
                Object.assign(toast.style, {
                    position: "fixed",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "12px 20px",
                    background: "#222",
                    color: "#fff",
                    borderRadius: "10px",
                    zIndex: "99999",
                    maxWidth: "90%",
                    textAlign: "center"
                });
                document.body.append(toast);
            }

            toast.textContent = message;
            toast.hidden = false;
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.hidden = true;
            }, 2600);
            return;
        }

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.textContent = message;
        toastContainer.append(toast);

        setTimeout(() => {
            toast.classList.add("toast-hide");
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }

    function closeNavigation() {
        if (!menuToggle || !navLinks) return;

        menuToggle.classList.remove("active");
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    }

    if (menuToggle && navLinks) {
        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");

            menuToggle.classList.toggle("active", isOpen);
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });

        $$(".nav-link", navLinks).forEach(link => {
            link.addEventListener("click", closeNavigation);
        });

        document.addEventListener("click", event => {
            if (
                navLinks.classList.contains("open")
                && !navLinks.contains(event.target)
                && !menuToggle.contains(event.target)
            ) {
                closeNavigation();
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") closeNavigation();
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 992) closeNavigation();
        });
    }

    function filterMenu() {
        getFoodCards().forEach(card => {
            const item = readCard(card);

            const matchesCategory =
                activeCategory === "all"
                || item.category === activeCategory;

            const matchesSearch =
                item.title.toLowerCase().includes(searchTerm)
                || item.category.includes(searchTerm);

            card.hidden = !(matchesCategory && matchesSearch);
        });

        const visibleCards = getFoodCards().filter(card => !card.hidden);
        let emptyMessage = $("#menu-empty-message");

        if (!emptyMessage && menuGrid) {
            emptyMessage = document.createElement("p");
            emptyMessage.id = "menu-empty-message";
            emptyMessage.textContent = "No matching dishes found. Try another search.";
            emptyMessage.style.cssText =
                "grid-column:1/-1;text-align:center;padding:30px;";
            menuGrid.after(emptyMessage);
        }

        if (emptyMessage) {
            emptyMessage.hidden = visibleCards.length > 0;
        }
    }

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            categoryButtons.forEach(item => {
                item.classList.remove("active");
                item.setAttribute("aria-pressed", "false");
            });

            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");

            activeCategory = (
                button.dataset.category
                || button.dataset.filter
                || button.textContent.trim().toLowerCase()
            ).toLowerCase();

            if (
                ["all", "all items", "all dishes"].includes(activeCategory)
            ) {
                activeCategory = "all";
            }

            filterMenu();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            searchTerm = searchInput.value.trim().toLowerCase();
            filterMenu();
        });
    }

    const searchToggle = $("[data-search-toggle]");
    const searchPanel = $("[data-search-panel]");

    if (searchToggle && searchPanel) {
        searchToggle.addEventListener("click", () => {
            const isHidden = searchPanel.hidden;
            searchPanel.hidden = !isHidden;

            searchToggle.setAttribute("aria-expanded", String(isHidden));

            if (isHidden) searchInput?.focus();
        });
    }

    function updateFavorites() {
        getFoodCards().forEach(card => {
            const item = readCard(card);
            const button = $(".favorite-btn", card);

            if (!button) return;

            const active = favorites.has(item.id);

            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
            button.setAttribute(
                "aria-label",
                active ? "Remove from favorites" : "Add to favorites"
            );

            if (button.textContent.trim() === "" || button.dataset.favoriteIcon) {
                button.textContent = active ? "♥" : "♡";
                button.dataset.favoriteIcon = "true";
            }
        });
    }

    document.addEventListener("click", event => {
        const button = event.target.closest(".favorite-btn");
        if (!button) return;

        const card = button.closest(".food-card");
        if (!card) return;

        const item = readCard(card);

        if (favorites.has(item.id)) {
            favorites.delete(item.id);
            showToast(`${item.title} removed from favorites`);
        } else {
            favorites.add(item.id);
            showToast(`${item.title} added to favorites`);
        }

        updateFavorites();
    });

    function getCartItem(id) {
        return cart.find(item => item.id === id);
    }

    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);

        if (cartCount) cartCount.textContent = count;
        cartButton?.setAttribute("aria-label", `Shopping cart, ${count} items`);
    }

    function calculateCartTotal() {
        return cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }

    function addToCart(card) {
        const product = readCard(card);
        const existing = getCartItem(product.id);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        renderCart();
        showToast(`${product.title} added to cart`);
    }

    function changeQuantity(id, amount) {
        const item = getCartItem(id);
        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            cart = cart.filter(product => product.id !== id);
        }

        renderCart();
    }

    function removeCartItem(id) {
        const item = getCartItem(id);
        if (!item) return;

        cart = cart.filter(product => product.id !== id);
        renderCart();
        showToast(`${item.title} removed from cart`);
    }

    function renderCart() {
        if (cartItems) {
            cartItems.replaceChildren();

            if (cart.length === 0) {
                const empty = document.createElement("div");
                empty.className = "cart-empty";
                empty.textContent = "Your cart is empty. Add something delicious!";
                cartItems.append(empty);
            }

            cart.forEach(item => {
                const row = document.createElement("div");
                row.className = "cart-item";
                row.dataset.id = item.id;

                const image = document.createElement("img");
                image.src = item.image;
                image.alt = item.title;
                image.loading = "lazy";

                const details = document.createElement("div");
                details.className = "cart-item-details";

                const title = document.createElement("h3");
                title.textContent = item.title;

                const price = document.createElement("p");
                price.className = "cart-item-price";
                price.textContent = money(item.price * item.quantity);

                const quantity = document.createElement("div");
                quantity.className = "quantity-control";

                const decrease = document.createElement("button");
                decrease.type = "button";
                decrease.dataset.action = "decrease";
                decrease.setAttribute("aria-label", `Decrease ${item.title} quantity`);
                decrease.textContent = "−";

                const amount = document.createElement("span");
                amount.textContent = item.quantity;

                const increase = document.createElement("button");
                increase.type = "button";
                increase.dataset.action = "increase";
                increase.setAttribute("aria-label", `Increase ${item.title} quantity`);
                increase.textContent = "+";

                quantity.append(decrease, amount, increase);
                details.append(title, price, quantity);

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "remove-cart-item";
                remove.dataset.action = "remove";
                remove.setAttribute("aria-label", `Remove ${item.title}`);
                remove.textContent = "×";

                row.append(image, details, remove);
                cartItems.append(row);
            });
        }

        const total = calculateCartTotal();

        if (cartTotal) cartTotal.textContent = money(total);

        const subtotal = $("#cartSubtotal");
        if (subtotal) subtotal.textContent = money(total);

        const checkoutTotal = $("#checkoutTotal");
        if (checkoutTotal) checkoutTotal.textContent = money(total);
        updateCartCount();

        const emptyState = cart.length === 0;

        $$("[data-checkout], .checkout-button, .checkout-btn, #checkoutButton").forEach(button => {
            button.disabled = emptyState;
            button.setAttribute("aria-disabled", String(emptyState));
        });
    }

    document.addEventListener("click", event => {
        const addButton = event.target.closest(".add-to-cart");

        if (addButton) {
            const card = addButton.closest(".food-card");
            if (card) addToCart(card);
            return;
        }

        const actionButton = event.target.closest("[data-action]");
        if (!actionButton || !cartItems?.contains(actionButton)) return;

        const row = actionButton.closest(".cart-item");
        if (!row) return;

        const id = row.dataset.id;
        const action = actionButton.dataset.action;

        if (action === "increase") changeQuantity(id, 1);
        if (action === "decrease") changeQuantity(id, -1);
        if (action === "remove") removeCartItem(id);
    });

    function openCart() {
        if (!cartDrawer) {
            showToast("Your cart is ready to use.");
            return;
        }

        lastFocusedElement = document.activeElement;
        cartDrawer.classList.add("open");
        cartDrawer.setAttribute("aria-hidden", "false");
        document.body.classList.add("cart-open");

        const closeButton = $(".cart-close", cartDrawer);
        closeButton?.focus();
    }

    function closeCart() {
        if (!cartDrawer) return;

        cartDrawer.classList.remove("open");
        cartDrawer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cart-open");

        lastFocusedElement?.focus();
    }

    const cartOverlay = document.getElementById("cartOverlay");
    const continueShopping = document.getElementById("continueShopping");

    function openCart() {
        if (!cartDrawer) return;

        lastFocusedElement = document.activeElement;
        cartDrawer.classList.add("open");
        cartOverlay?.classList.add("active");
        document.body.classList.add("cart-open");
        cartDrawer.setAttribute("aria-hidden", "false");

        $(".cart-close", cartDrawer)?.focus();
    }

    function closeCart() {
        cartDrawer?.classList.remove("open");
        cartOverlay?.classList.remove("active");
        document.body.classList.remove("cart-open");

        cartDrawer?.setAttribute("aria-hidden", "true");
        lastFocusedElement?.focus();
    }

    cartButton?.addEventListener("click", openCart);
    cartOverlay?.addEventListener("click", closeCart);
    continueShopping?.addEventListener("click", closeCart);

    $$(".cart-close, [data-cart-close]").forEach(button => {
        button.addEventListener("click", closeCart);
    });

    $$(".cart-close, [data-cart-close]").forEach(button => {
        button.addEventListener("click", closeCart);
    });

    cartDrawer?.addEventListener("click", event => {
        if (
            event.target === cartDrawer
            || event.target.classList.contains("cart-backdrop")
        ) {
            closeCart();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeCart();
        }
    });

    updateFavorites();
    renderCart();
    filterMenu();
});





document.addEventListener("DOMContentLoaded", () => {
    const menuGrid = document.getElementById("menuGrid");
    const moreMenuBtn = document.getElementById("moreMenuBtn");
    const showLessMenuBtn = document.getElementById("showLessMenuBtn");

    if (!menuGrid || !moreMenuBtn || !showLessMenuBtn) return;

    const menuCards = Array.from(menuGrid.querySelectorAll(".food-card"));
    const initialCount = 6;

    function showInitialMenu() {
        menuCards.forEach((card, index) => {
            card.hidden = index >= initialCount;
        });

        moreMenuBtn.hidden = menuCards.length <= initialCount;
        showLessMenuBtn.hidden = true;
    }

    moreMenuBtn.addEventListener("click", () => {
        menuCards.forEach(card => {
            card.hidden = false;
        });

        moreMenuBtn.hidden = true;
        showLessMenuBtn.hidden = false;
    });

    showLessMenuBtn.addEventListener("click", () => {
        showInitialMenu();

        document.getElementById("menu").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    showInitialMenu();
});

