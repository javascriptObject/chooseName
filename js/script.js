/**
 * 随机点名系统 - JavaScript 主程序
 * 使用 ES6+ 语法和现代 Web API
 * 功能：随机选择学生、本地存储、声音效果、文件导入导出
 */

// 使用立即执行函数避免全局污染
(function() {
    'use strict';

    /**
     * 学生数据配置
     * @type {Array<string>} 默认学生名单数组
     */
    const DEFAULT_STUDENTS = [
        "李国威", "李卓锟", "韦雄", "孙燕春", "张辉", "范玉伟", "严波", "李凯晴",
        "崔明勇", "李毅强", "谭浩根", "赵来荣", "叶旭秋", "吴荣荣",
        "陈炫林", "幸文杰", "黎家晖"
    ];

    /**
     * 应用状态管理
     * 使用对象存储所有状态，便于统一管理
     */
    const appState = {
        /** @type {Array<string>} 剩余未点名的学生 */
        remainingStudents: [],
        /** @type {Array<string>} 已点名的学生 */
        selectedStudents: [],
        /** @type {boolean} 是否正在运行点名动画 */
        isRunning: false,
        /** @type {number|null} 动画定时器ID */
        animationTimer: null,
        /** @type {boolean} 声音是否启用 */
        soundEnabled: true,
        /** @type {AudioContext|null} Web Audio API 音频上下文 */
        audioContext: null,
        /** @type {Array<string>} 完整学生名单 */
        allStudents: []
    };

    /**
     * DOM 元素引用缓存
     * 使用对象存储所有DOM引用，避免重复查询
     */
    const elements = {
        nameContainer: null,
        startBtn: null,
        resetBtn: null,
        totalCount: null,
        remainingCount: null,
        selectedCount: null,
        soundToggle: null,
        fileInput: null,
        exportBtn: null
    };

    /**
     * 初始化函数 - 页面加载完成后执行
     * 使用箭头函数和异步操作
     */
    const init = () => {
        // 缓存DOM元素引用
        cacheElements();
        
        // 初始化音频上下文（必须在用户交互后）
        initAudioContext();
        
        // 加载本地存储数据
        loadStoredData();
        
        // 绑定事件监听器
        bindEvents();
        
        // 渲染初始界面
        render();
        
        // 检查是否需要重置
        checkResetNeeded();
    };

    /**
     * 缓存所有DOM元素引用
     * 使用解构赋值简化代码
     */
    const cacheElements = () => {
        ({
            nameContainer: elements.nameContainer = document.getElementById('nameContainer'),
            startBtn: elements.startBtn = document.getElementById('startBtn'),
            resetBtn: elements.resetBtn = document.getElementById('resetBtn'),
            totalCount: elements.totalCount = document.getElementById('totalCount'),
            remainingCount: elements.remainingCount = document.getElementById('remainingCount'),
            selectedCount: elements.selectedCount = document.getElementById('selectedCount'),
            soundToggle: elements.soundToggle = document.getElementById('soundToggle'),
            fileInput: elements.fileInput = document.getElementById('fileInput'),
            exportBtn: elements.exportBtn = document.getElementById('exportBtn')
        });
    };

    /**
     * 初始化Web Audio API
     * 解决浏览器限制：音频上下文必须在用户交互后创建
     */
    const initAudioContext = () => {
        try {
            // 使用可选链操作符安全创建音频上下文
            appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API 不支持:', error);
            appState.soundEnabled = false;
        }
    };

    /**
     * 从本地存储加载数据
     * 使用空值合并运算符提供默认值
     */
    const loadStoredData = () => {
        // 加载自定义学生名单
        const customStudents = JSON.parse(localStorage.getItem('students') || 'null');
        appState.allStudents = (Array.isArray(customStudents) && customStudents.length > 0) 
            ? customStudents 
            : [...DEFAULT_STUDENTS]; // 使用扩展运算符(...)复制数组，避免直接引用原数组

        // 加载剩余学生名单
        const savedRemaining = JSON.parse(localStorage.getItem('remainingStudents') || 'null');
        appState.remainingStudents = (Array.isArray(savedRemaining) && savedRemaining.length > 0)
            ? savedRemaining
            : [...appState.allStudents]; // 使用扩展运算符(...)创建新数组副本，避免引用同一个数组对象

        // 加载已点名学生名单
        appState.selectedStudents = JSON.parse(localStorage.getItem('selectedStudents') || '[]');

        // 加载声音设置
        appState.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    };

    /**
     * 绑定所有事件监听器
     * 使用事件委托和防抖优化性能
     */
    const bindEvents = () => {
        elements.startBtn?.addEventListener('click', handleStartClick);
        elements.resetBtn?.addEventListener('click', handleResetClick);
        elements.soundToggle?.addEventListener('click', handleSoundToggle);
        elements.fileInput?.addEventListener('change', handleFileImport);
        elements.exportBtn?.addEventListener('click', handleFileExport);
        
        // 防止文本选择
        document.addEventListener('selectstart', e => e.preventDefault());
    };

    /**
     * 渲染整个界面
     * 包含学生列表和统计信息
     */
    const render = () => {
        renderStudentList();
        updateStats();
        updateSoundButton();
    };

    /**
     * 渲染学生列表
     * 使用模板字符串和数组方法
     */
    const renderStudentList = () => {
        if (!elements.nameContainer) return;

        const studentElements = appState.allStudents.map(student => {
            const isSelected = appState.selectedStudents.includes(student);
            const className = `stu_name ${isSelected ? 'selected' : ''}`;
            return `<div class="${className}">${student}</div>`;
        }).join('');

        elements.nameContainer.innerHTML = studentElements;
    };

    /**
     * 更新统计信息
     * 使用模板字面量显示数据
     */
    const updateStats = () => {
        if (!elements.totalCount || !elements.remainingCount || !elements.selectedCount) return;

        elements.totalCount.textContent = appState.allStudents.length;
        elements.remainingCount.textContent = appState.remainingStudents.length;
        elements.selectedCount.textContent = appState.selectedStudents.length;
    };

    /**
     * 更新声音按钮状态
     */
    const updateSoundButton = () => {
        if (!elements.soundToggle) return;

        elements.soundToggle.textContent = appState.soundEnabled ? '🔊' : '🔇';
        elements.soundToggle.title = appState.soundEnabled ? '关闭声音' : '开启声音';
    };

    /**
     * 处理开始点名按钮点击
     * 包含音频上下文恢复和动画启动
     */
    const handleStartClick = async () => {
        // 确保音频上下文已激活（解决浏览器限制）
        if (appState.audioContext?.state === 'suspended') {
            await appState.audioContext.resume();
        }

        if (appState.isRunning) return;

        // 播放开始音效
        playSound(600, 0.1, 'triangle');

        appState.isRunning = true;
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = '点名中...';

        startAnimation();
    };

    /**
     * 开始点名动画
     * 使用requestAnimationFrame优化性能
     */
    const startAnimation = () => {
        const studentElements = document.querySelectorAll('.stu_name:not(.selected)');
        if (studentElements.length === 0) {
            handleNoStudents();
            return;
        }

        let frameCount = 0;
        const totalFrames = 60; // 约2秒的动画

        const animate = () => {
            studentElements.forEach(el => {
                // 添加视觉反馈
                el.style.transform = `scale(${1 + Math.random() * 0.1})`;
                el.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
            });

            frameCount++;
            if (frameCount < totalFrames) {
                appState.animationTimer = requestAnimationFrame(animate);
            } else {
                stopAnimation();
            }
        };

        animate();
    };

    /**
     * 处理没有学生的情况
     */
    const handleNoStudents = () => {
        playSound(200, 0.3, 'sawtooth'); // 错误音效
        alert('所有学生都已点名完毕！');
        resetAnimationState();
    };

    /**
     * 停止动画并选择学生
     */
    const stopAnimation = () => {
        if (appState.animationTimer) {
            cancelAnimationFrame(appState.animationTimer);
            appState.animationTimer = null;
        }

        const selectedStudent = selectRandomStudent();
        if (selectedStudent) {
            selectStudent(selectedStudent);
            highlightSelectedStudent(selectedStudent);
        }

        resetAnimationState();
    };

    /**
     * 重置动画状态
     */
    const resetAnimationState = () => {
        appState.isRunning = false;
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '开始点名';

        // 清除所有样式
        document.querySelectorAll('.stu_name').forEach(el => {
            el.style.transform = '';
            el.style.filter = '';
        });
    };

    /**
     * 随机选择学生
     * @returns {string|null} 选中的学生姓名
     */
    const selectRandomStudent = () => {
        if (appState.remainingStudents.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * appState.remainingStudents.length);
        return appState.remainingStudents[randomIndex];
    };

    /**
     * 选择学生并更新数据
     * @param {string} studentName - 选中的学生姓名
     */
    const selectStudent = (studentName) => {
        // 更新数据
        appState.remainingStudents = appState.remainingStudents.filter(name => name !== studentName);
        appState.selectedStudents.push(studentName);

        // 保存到本地存储
        saveToStorage();

        // 播放选中音效
        playSound(800, 0.2, 'sine');

        // 更新界面
        updateStats();
        renderStudentList();
    };

    /**
     * 高亮显示选中的学生
     * @param {string} studentName - 学生姓名
     */
    const highlightSelectedStudent = (studentName) => {
        const selectedElement = Array.from(document.querySelectorAll('.stu_name'))
            .find(el => el.textContent === studentName);

        if (selectedElement) {
            selectedElement.classList.add('selected');
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    /**
     * 处理重置按钮点击
     */
    const handleResetClick = () => {
        playSound(400, 0.2, 'square');
        
        if (confirm('确定要重置所有点名记录吗？')) {
            resetData();
            render();
        }
    };

    /**
     * 重置所有数据
     * 使用扩展运算符(...)创建allStudents的浅拷贝，避免引用同一数组
     * 扩展运算符用法：
     * 1. 数组复制：[...arr] 创建新数组
     * 2. 对象复制：{...obj} 创建新对象
     * 3. 合并数组：[...arr1, ...arr2]
     * 4. 合并对象：{...obj1, ...obj2}
     * 5. 剩余参数：function(...args) 收集参数为数组
     */
    const resetData = () => {
        appState.remainingStudents = [...appState.allStudents];
        appState.selectedStudents = [];
        
        localStorage.removeItem('remainingStudents');
        localStorage.removeItem('selectedStudents');
    };

    /**
     * 处理声音开关切换
     */
    const handleSoundToggle = () => {
        appState.soundEnabled = !appState.soundEnabled;
        localStorage.setItem('soundEnabled', appState.soundEnabled);
        updateSoundButton();

        // 播放测试音
        if (appState.soundEnabled) {
            playSound(440, 0.1);
        }
    };

    /**
     * 播放声音效果
     * @param {number} frequency - 频率 (Hz)
     * @param {number} duration - 持续时间 (秒)
     * @param {string} type - 波形类型 ('sine', 'square', 'sawtooth', 'triangle')
     */
    const playSound = (frequency, duration, type = 'sine') => {
        if (!appState.soundEnabled || !appState.audioContext) return;

        try {
            // 创建振荡器
            const oscillator = appState.audioContext.createOscillator();
            const gainNode = appState.audioContext.createGain();

            // 连接音频节点
            oscillator.connect(gainNode);
            gainNode.connect(appState.audioContext.destination);

            // 设置音频参数
            oscillator.frequency.value = frequency;
            oscillator.type = type;

            // 设置音量包络
            const now = appState.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            // 播放和停止
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (error) {
            console.warn('播放声音失败:', error);
        }
    };

    /**
     * 保存数据到本地存储
     * 使用扩展运算符(...)创建数组副本，确保数据独立性
     */
    const saveToStorage = () => {
        localStorage.setItem('remainingStudents', JSON.stringify([...appState.remainingStudents]));
        localStorage.setItem('selectedStudents', JSON.stringify([...appState.selectedStudents]));
    };

    /**
     * 检查是否需要重置
     * 当所有学生都已点名时提示用户
     */
    const checkResetNeeded = () => {
        if (appState.remainingStudents.length === 0 && appState.selectedStudents.length === appState.allStudents.length) {
            setTimeout(() => {
                if (confirm('所有学生都已点名完毕！是否重置名单？')) {
                    resetData();
                    render();
                }
            }, 1000);
        }
    };

    /**
     * 文件导入处理
     * @param {Event} event - 文件选择事件
     */
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let newStudents = [];

                if (file.name.endsWith('.json')) {
                    newStudents = JSON.parse(e.target.result);
                } else {
                    // 处理CSV或纯文本格式
                    newStudents = e.target.result
                        .split(/[,\r]+/)
                        .map(name => name.trim())
                        .filter(name => name.length > 0);
                }

                if (Array.isArray(newStudents) && newStudents.length > 0) {
                    if (confirm(`确定要导入 ${newStudents.length} 个学生名单吗？`)) {
                        localStorage.setItem('students', JSON.stringify(newStudents));
                        location.reload(); // 重新加载页面以应用新名单
                    }
                }
            } catch (error) {
                playSound(150, 0.3, 'sawtooth');
                alert('文件格式错误，请检查文件内容！');
            }
        };

        reader.readAsText(file);
        event.target.value = ''; // 重置文件输入
    };

    /**
     * 文件导出处理
     */
    const handleFileExport = () => {
        const exportData = {
            students: appState.allStudents,
            selected: appState.selectedStudents,
            remaining: appState.remainingStudents,
            date: new Date().toLocaleString('zh-CN')
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `点名记录_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();

        URL.revokeObjectURL(url);
        playSound(600, 0.2, 'triangle');
    };

    // 页面加载完成后初始化应用
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init(); // DOM已经加载完成
    }

})();