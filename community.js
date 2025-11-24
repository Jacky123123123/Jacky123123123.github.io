// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 元素获取
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.getElementById('closeModal');
    const cancelUpload = document.getElementById('cancelUpload');
    const modalOverlay = document.querySelector('.modal-overlay');
    const uploadForm = document.querySelector('.upload-form');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort');
    const likeBtns = document.querySelectorAll('.like-btn');
    const postCards = document.querySelectorAll('.post-card');

    // 模态框控制
    function openModal() {
        uploadModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    function closeModalFunc() {
        uploadModal.classList.remove('active');
        document.body.style.overflow = ''; // 恢复背景滚动
    }

    uploadBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalFunc);
    cancelUpload.addEventListener('click', closeModalFunc);
    modalOverlay.addEventListener('click', closeModalFunc);

    // 筛选功能
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新按钮激活状态
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.textContent.toLowerCase();
            
            // 筛选帖子
            postCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    // 匹配分类（场景/配件/教程）
                    const category = card.dataset.category;
                    if (filter.includes(category)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });

    // 排序功能
    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        const postsContainer = document.querySelector('.posts-grid');
        
        // 将NodeList转换为数组以便排序
        const cardsArray = Array.from(postCards);
        
        // 根据选择的排序方式排序
        switch(sortBy) {
            case 'popular':
                // 按点赞数降序
                cardsArray.sort((a, b) => {
                    const likesA = parseInt(a.querySelector('.like-btn').textContent.trim());
                    const likesB = parseInt(b.querySelector('.like-btn').textContent.trim());
                    return likesB - likesA;
                });
                break;
            case 'latest':
                // 按模拟的时间戳排序（实际项目中应使用真实时间数据）
                cardsArray.sort((a, b) => {
                    // 假设卡片顺序越靠后发布时间越近
                    return Array.from(postsContainer.children).indexOf(b) - Array.from(postsContainer.children).indexOf(a);
                });
                break;
            case 'trending':
                // 趋势排序（结合点赞和时间，这里简化为点赞数*权重）
                cardsArray.sort((a, b) => {
                    const likesA = parseInt(a.querySelector('.like-btn').textContent.trim());
                    const likesB = parseInt(b.querySelector('.like-btn').textContent.trim());
                    const indexA = Array.from(postsContainer.children).indexOf(a);
                    const indexB = Array.from(postsContainer.children).indexOf(b);
                    // 权重公式：点赞数 * (1/(索引+1)) - 让新内容有更高权重
                    return (likesB * (1/(indexB+1))) - (likesA * (1/(indexA+1)));
                });
                break;
        }
        
        // 重新排列DOM元素
        cardsArray.forEach(card => {
            postsContainer.appendChild(card);
        });
    });

    // 点赞功能
    likeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            const countText = this.textContent.trim();
            let count = parseInt(countText);
            
            // 切换点赞状态
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.style.color = '#FF7E00';
                count++;
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.style.color = '';
                count--;
            }
            
            // 更新点赞数
            this.innerHTML = `<i class="${icon.classList.value}"></i> ${count}`;
        });
    });

    // 表单提交处理
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault(); // 阻止默认提交
        
        const title = document.getElementById('creationTitle').value;
        const category = document.getElementById('creationCategory').value;
        const description = document.getElementById('creationDescription').value;
        const images = document.getElementById('imageUpload').files;
        
        // 简单表单验证
        let isValid = true;
        if (!title) {
            alert('Please enter a title for your creation');
            isValid = false;
        } else if (!category) {
            alert('Please select a category');
            isValid = false;
        } else if (!description) {
            alert('Please add a description');
            isValid = false;
        } else if (images.length === 0) {
            alert('Please upload at least one image');
            isValid = false;
        }
        
        // 验证通过后的操作（实际项目中会发送到服务器）
        if (isValid) {
            alert('Your creation has been shared successfully!');
            closeModalFunc();
            uploadForm.reset(); // 重置表单
        }
    });

    // 加载更多功能（模拟）
    const loadMoreBtn = document.querySelector('.load-more .btn');
    loadMoreBtn.addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        // 模拟加载延迟
        setTimeout(() => {
            this.innerHTML = 'No More Content';
            this.disabled = true;
            this.style.opacity = '0.7';
        }, 1500);
    });
});