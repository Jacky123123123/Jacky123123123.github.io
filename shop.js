// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let cart = [];
    const cartToggle = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckout = document.getElementById('closeCheckout');
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const checkoutSummary = document.getElementById('checkoutSummary');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const productCards = document.querySelectorAll('.product-card');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');

    // 初始化事件监听
    function setupEventListeners() {
        // 分类筛选按钮
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // 更新按钮状态
                categoryBtns.forEach(b => {
                    b.classList.remove('active', 'bg-primary', 'text-white');
                    b.classList.add('bg-white', 'text-neutral-800', 'hover:bg-neutral-200');
                });
                this.classList.add('active', 'bg-primary', 'text-white');
                this.classList.remove('bg-white', 'text-neutral-800', 'hover:bg-neutral-200');
                
                // 筛选商品
                const category = this.getAttribute('data-category');
                filterProducts(category);
            });
        });

        // 加入购物车按钮
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const productName = this.getAttribute('data-name');
                const productPrice = parseFloat(this.getAttribute('data-price'));
                const productImg = this.getAttribute('data-img');
                
                addToCart(productId, productName, productPrice, productImg);
            });
        });

        // 购物车侧边栏控制
        cartToggle.addEventListener('click', openCart);
        closeCart.addEventListener('click', closeCartSidebar);
        overlay.addEventListener('click', function() {
            closeCartSidebar();
            closeCheckoutModal();
        });

        // 结账流程控制
        checkoutBtn.addEventListener('click', openCheckoutModal);
        closeCheckout.addEventListener('click', closeCheckoutModal);
    }

    // 筛选商品
    function filterProducts(category) {
        productCards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // 添加商品到购物车
    function addToCart(id, name, price, img) {
        // 检查商品是否已在购物车中
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            // 已存在则增加数量
            existingItem.quantity++;
        } else {
            // 不存在则添加新商品
            cart.push({
                id,
                name,
                price,
                img,
                quantity: 1
            });
        }

        // 更新购物车显示
        updateCartDisplay();
        
        // 显示添加成功提示
        showAddToCartNotification(name);
    }

    // 更新购物车显示
    function updateCartDisplay() {
        // 更新购物车数量标记
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // 更新购物车内容
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center text-neutral-500 py-10">
                    <i class="fa fa-shopping-cart text-4xl mb-3 text-neutral-300"></i>
                    <p>Your cart is empty</p>
                    <p class="text-sm mt-1">Add some items to get started</p>
                </div>
            `;
            checkoutBtn.disabled = true;
            cartSubtotal.textContent = '$0.00';
        } else {
            let cartHTML = '';
            let subtotal = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                cartHTML += `
                    <div class="flex items-center space-x-3 pb-3 border-b">
                        <img src="${item.img}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                        <div class="flex-grow">
                            <h4 class="font-medium">${item.name}</h4>
                            <div class="flex items-center justify-between mt-1">
                                <div class="flex items-center border rounded">
                                    <button class="decrease-qty px-2 py-1 text-neutral-500 hover:text-primary" data-id="${item.id}">-</button>
                                    <span class="px-2">${item.quantity}</span>
                                    <button class="increase-qty px-2 py-1 text-neutral-500 hover:text-primary" data-id="${item.id}">+</button>
                                </div>
                                <span class="font-medium">$${itemTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button class="remove-item text-neutral-400 hover:text-red-500" data-id="${item.id}">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            
            cartItems.innerHTML = cartHTML;
            cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
            checkoutBtn.disabled = false;
            
            // 添加数量调整和删除事件监听
            setupCartItemListeners();
        }
        
        // 更新结账摘要
        updateCheckoutSummary();
    }

    // 设置购物车项目的事件监听
    function setupCartItemListeners() {
        // 减少数量
        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const item = cart.find(item => item.id === id);
                
                if (item.quantity > 1) {
                    item.quantity--;
                } else {
                    cart = cart.filter(item => item.id !== id);
                }
                
                updateCartDisplay();
            });
        });
        
        // 增加数量
        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const item = cart.find(item => item.id === id);
                item.quantity++;
                updateCartDisplay();
            });
        });
        
        // 删除商品
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                cart = cart.filter(item => item.id !== id);
                updateCartDisplay();
            });
        });
    }

    // 更新结账摘要
    function updateCheckoutSummary() {
        if (cart.length === 0) {
            checkoutSummary.innerHTML = '<p class="text-neutral-500 text-sm">No items in cart</p>';
            checkoutTotal.textContent = '$0.00';
        } else {
            let summaryHTML = '';
            let total = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                
                summaryHTML += `
                    <div class="flex justify-between text-sm">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>$${itemTotal.toFixed(2)}</span>
                    </div>
                `;
            });
            
            checkoutSummary.innerHTML = summaryHTML;
            checkoutTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    // 显示添加到购物车的提示
    function showAddToCartNotification(productName) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-y-10 opacity-0 transition-all duration-300';
        notification.innerHTML = `
            <i class="fa fa-check mr-2"></i>
            <span>"${productName}" added to cart</span>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => {
            notification.classList.remove('translate-y-10', 'opacity-0');
        }, 10);
        
        // 3秒后隐藏通知
        setTimeout(() => {
            notification.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 打开购物车
    function openCart() {
        cartSidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // 关闭购物车
    function closeCartSidebar() {
        cartSidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // 打开结账模态框
    function openCheckoutModal() {
        checkoutModal.classList.remove('hidden');
        closeCartSidebar();
    }

    // 关闭结账模态框
    function closeCheckoutModal() {
        checkoutModal.classList.add('hidden');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // 初始化
    setupEventListeners();
});