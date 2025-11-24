// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // --------------------------
    // 全局变量与初始化
    // --------------------------
    let currentStep = 1;
    const totalSteps = 3;
    let scene, camera, renderer, controls;
    let baseObject = null;
    let panelObjects = [];
    let addedItems = []; // 存储已添加的物品信息
    let isRotating = false;



    // --------------------------
    // 元素获取
    // --------------------------
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const saveBtn = document.getElementById('save-btn');
    const progressSteps = document.querySelectorAll('.progress-step');
    const stepContents = document.querySelectorAll('.step-content');
    const addPanelsToggle = document.getElementById('add-panels');
    const panelOptions = document.querySelector('.panel-options');
    const panelColorGroup = document.querySelector('.panel-color-group');
    const baseSizeOptions = document.querySelectorAll('.base-sizes .option-item');
    const baseColorOptions = document.querySelectorAll('.color-options:first-of-type .color-item');
    const panelColorOptions = document.querySelectorAll('.panel-color-group .color-item');
    const panelCountSelect = document.getElementById('panel-count');
    const panelHeightSelect = document.getElementById('panel-height');
    const draggableItems = document.querySelectorAll('.draggable');
    const previewCanvas = document.getElementById('preview-canvas');
    const itemsList = document.getElementById('items-list');
    const rotateToggle = document.getElementById('rotate-toggle');
    const zoomIn = document.getElementById('zoom-out'); // 注意：Three.js中zoom值越小视图越大
    const zoomOut = document.getElementById('zoom-in');
    const resetView = document.getElementById('reset-view');
    // 初始化3D场景
    initThreeJS();
    // --------------------------
    // 步骤控制
    // --------------------------
    // 下一步按钮
    nextBtn.addEventListener('click', function() {
        if (currentStep < totalSteps) {
            // 验证第一步是否已选择底盘
            if (currentStep === 1 && !baseObject) {
                alert('Please select a base size first');
                return;
            }
            
            currentStep++;
            updateStepUI();
        }
    });

    // 上一步按钮
    prevBtn.addEventListener('click', function() {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });

    // 保存设计
    saveBtn.addEventListener('click', function() {
        alert('Your design has been saved successfully!');
    });

    // 更新步骤UI
    function updateStepUI() {
        // 更新进度指示器
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === currentStep);
        });

        // 显示当前步骤内容
        stepContents.forEach((content, index) => {
            content.style.display = (index + 1 === currentStep) ? 'block' : 'none';
        });

        // 更新按钮状态
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
        nextBtn.style.display = currentStep < totalSteps ? 'block' : 'none';
        saveBtn.style.display = currentStep === totalSteps ? 'block' : 'none';

        // 步骤1进入步骤2时，确保3D场景已初始化
        if (currentStep === 2 && !scene) {
            initThreeJS();
        }
    }

    // --------------------------
    // 底盘设置逻辑
    // --------------------------
    // 切换是否添加立面
    addPanelsToggle.addEventListener('change', function() {
        const isChecked = this.checked;
        panelOptions.style.display = isChecked ? 'block' : 'none';
        panelColorGroup.style.display = isChecked ? 'block' : 'none';
        
        // 更新3D立面
        updatePanels();
    });

    // 选择底盘大小
    baseSizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            baseSizeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const size = this.dataset.size;
            updateBase(size);
        });
    });

    // 选择底盘颜色
    baseColorOptions.forEach(option => {
        option.addEventListener('click', function() {
            baseColorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            if (baseObject) {
                const color = this.dataset.color;
                baseObject.material.color.set(color);
            }
        });
    });

    // 选择立面颜色
    panelColorOptions.forEach(option => {
        option.addEventListener('click', function() {
            panelColorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const color = this.dataset.color;
            panelObjects.forEach(panel => {
                panel.material.color.set(color);
            });
        });
    });

    // 立面数量变更
    panelCountSelect.addEventListener('change', function() {
        updatePanels();
    });

    // 立面高度变更
    panelHeightSelect.addEventListener('change', function() {
        updatePanels();
    });

    // 更新底盘
    function updateBase(size) {
        // 移除旧底盘
        if (baseObject) {
            scene.remove(baseObject);
        }

        // 底盘尺寸配置
        let scale = 1;
        switch(size) {
            case 'small': scale = 0.8; break;
            case 'medium': scale = 1; break;
            case 'large': scale = 1.2; break;
        }

        // 创建新底盘
        const geometry = new THREE.PlaneGeometry(10 * scale, 10 * scale);
        const material = new THREE.MeshStandardMaterial({ 
            color: '#FFFFFF',
            side: THREE.DoubleSide 
        });
        baseObject = new THREE.Mesh(geometry, material);
        baseObject.rotation.x = -Math.PI / 2; // 平放
        scene.add(baseObject);

        // 默认选中白色
        baseColorOptions[0].click();

        // 更新立面以匹配底盘大小
        updatePanels();
    }

    // 更新立面
    function updatePanels() {
        // 清除现有立面
        panelObjects.forEach(panel => {
            scene.remove(panel);
        });
        panelObjects = [];

        if (!addPanelsToggle.checked || !baseObject) return;

        // 获取配置
        const count = parseInt(panelCountSelect.value);
        let height = 1;
        switch(panelHeightSelect.value) {
            case 'low': height = 1; break;
            case 'medium': height = 2; break;
            case 'high': height = 3; break;
        }
        const baseScale = baseObject.scale.x; // 从底盘获取缩放比例
        const panelThickness = 0.1;
        const panelColor = document.querySelector('.panel-color-group .color-item.selected')?.dataset.color || '#FFFFFF';

        // 立面位置配置（围绕底盘）
        const positions = [
            { x: 5 * baseScale, y: 0, z: 0, rotation: Math.PI / 2, scale: { x: panelThickness, y: height, z: 10 * baseScale } }, // 右
            { x: -5 * baseScale, y: 0, z: 0, rotation: Math.PI / 2, scale: { x: panelThickness, y: height, z: 10 * baseScale } }, // 左
            { x: 0, y: 0, z: 5 * baseScale, rotation: 0, scale: { x: 10 * baseScale, y: height, z: panelThickness } }, // 后
            { x: 0, y: 0, z: -5 * baseScale, rotation: 0, scale: { x: 10 * baseScale, y: height, z: panelThickness } } // 前
        ];

        // 创建立面
        for (let i = 0; i < count; i++) {
            const pos = positions[i % positions.length];
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: panelColor });
            const panel = new THREE.Mesh(geometry, material);
            
            panel.position.set(pos.x, height/2, pos.z); // y轴居中
            panel.rotation.y = pos.rotation;
            panel.scale.set(pos.scale.x, pos.scale.y, pos.scale.z);
            
            scene.add(panel);
            panelObjects.push(panel);
        }
    }

    // --------------------------
    // 3D场景初始化（Three.js）
    // --------------------------
    function initThreeJS() {
        // 创建场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5); // 浅灰色背景

        // 创建相机
        camera = new THREE.PerspectiveCamera(75, previewCanvas.clientWidth / previewCanvas.clientHeight, 0.1, 1000);
        camera.position.set(10, 15, 20); // 初始位置（斜上方）

        // 创建渲染器
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(previewCanvas.clientWidth, previewCanvas.clientHeight);
        renderer.shadowMap.enabled = true;
        previewCanvas.innerHTML = ''; // 清除占位符
        previewCanvas.appendChild(renderer.domElement);

        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 15);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // 初始化控制器（允许旋转、缩放）
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.target.set(0, 0, 0); // 聚焦原点

        // 窗口大小调整
        window.addEventListener('resize', onWindowResize);

        // 动画循环
        function animate() {
            requestAnimationFrame(animate);
            if (isRotating) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
            } else {
                controls.autoRotate = false;
            }
            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }

    // 窗口大小调整
    function onWindowResize() {
        if (!camera || !renderer) return;
        camera.aspect = previewCanvas.clientWidth / previewCanvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(previewCanvas.clientWidth, previewCanvas.clientHeight);
    }

    // --------------------------
    // 拖拽功能实现
    // --------------------------
    // 为可拖拽元素添加事件
    draggableItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: this.dataset.id,
                type: this.dataset.type,
                category: this.dataset.category || '',
                name: this.querySelector('span').textContent
            }));
        });
    });

    // 预览区允许拖放
    previewCanvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    // 处理拖放
    previewCanvas.addEventListener('drop', function(e) {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        addItemToScene(data);
    });

    // 添加物品到场景
    function addItemToScene(itemData) {
        // 创建简单3D模型（实际项目中可替换为加载的模型）
        let geometry, material, mesh;
        
        // 根据类型创建不同模型
        switch(itemData.type) {
            case 'character':
                geometry = new THREE.CylinderGeometry(1.5, 1.5, 4); // 角色简化模型
                material = new THREE.MeshStandardMaterial({ color: '#4A6FA5' });
                break;
            case 'accessory':
                switch(itemData.category) {
                    case 'furniture':
                        geometry = new THREE.BoxGeometry(3, 2, 2); // 家具
                        material = new THREE.MeshStandardMaterial({ color: '#8B4513' });
                        break;
                    case 'decor':
                        geometry = new THREE.SphereGeometry(1, 32, 32); // 装饰
                        material = new THREE.MeshStandardMaterial({ color: '#60A86B' });
                        break;
                    case 'props':
                        geometry = new THREE.BoxGeometry(1, 0.5, 1.5); // 道具
                        material = new THREE.MeshStandardMaterial({ color: '#333333' });
                        break;
                    case 'clothes':
                        geometry = new THREE.TorusGeometry(1, 0.3, 16, 100); // 衣物
                        material = new THREE.MeshStandardMaterial({ color: '#FF7E00' });
                        break;
                    default:
                        geometry = new THREE.BoxGeometry(2, 2, 2);
                        material = new THREE.MeshStandardMaterial({ color: '#777777' });
                }
                break;
        }

        // 创建网格并添加到场景
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // 随机位置（在底盘范围内）
        const baseSize = baseObject ? baseObject.scale.x * 5 : 5;
        mesh.position.set(
            (Math.random() - 0.5) * baseSize * 1.5,
            mesh.geometry.parameters.height / 2, // 底部对齐地面
            (Math.random() - 0.5) * baseSize * 1.5
        );
        
        scene.add(mesh);

        // 记录物品信息
        const itemId = `item-${Date.now()}`;
        mesh.userData.id = itemId;
        addedItems.push({
            id: itemId,
            mesh: mesh,
            data: itemData
        });

        // 更新物品列表
        updateItemsList();
    }

    // 更新已添加物品列表
    function updateItemsList() {
        // 清空列表（保留空状态）
        itemsList.innerHTML = '';
        
        if (addedItems.length === 0) {
            itemsList.innerHTML = '<li class="empty-state">No items added yet</li>';
            return;
        }
        
        // 添加物品项
        addedItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.data.name}</span>
                <button class="remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            itemsList.appendChild(li);
        });
        
        // 添加删除事件
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.dataset.id;
                removeItem(itemId);
            });
        });
    }

    // 从场景中移除物品
    function removeItem(itemId) {
        const index = addedItems.findIndex(item => item.id === itemId);
        if (index !== -1) {
            // 从场景中移除
            scene.remove(addedItems[index].mesh);
            // 从数组中移除
            addedItems.splice(index, 1);
            // 更新列表
            updateItemsList();
        }
    }

    // --------------------------
    // 预览控制功能
    // --------------------------
    // 切换自动旋转
    rotateToggle.addEventListener('click', function() {
        isRotating = !isRotating;
        this.classList.toggle('active', isRotating);
    });

    // 缩小（实际是增大相机视野）
    zoomIn.addEventListener('click', function() {
        if (camera) {
            camera.zoom = Math.max(0.5, camera.zoom - 0.1);
            camera.updateProjectionMatrix();
        }
    });

    // 放大（实际是减小相机视野）
    zoomOut.addEventListener('click', function() {
        if (camera) {
            camera.zoom = Math.min(2, camera.zoom + 0.1);
            camera.updateProjectionMatrix();
        }
    });

    // 重置视图
    resetView.addEventListener('click', function() {
        if (controls) {
            controls.reset();
            camera.position.set(10, 15, 20);
            camera.zoom = 1;
            camera.updateProjectionMatrix();
            isRotating = false;
            rotateToggle.classList.remove('active');
        }
    });

    // --------------------------
    // 初始化默认状态
    // --------------------------
    // 默认选中中等大小底盘
    setTimeout(() => {
        document.querySelector('.base-sizes .option-item[data-size="medium"]').click();
    }, 100);
});