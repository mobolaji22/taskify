document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    const userManager = new UserManager();
    const taskManager = new TaskManager();
    const taskView = new TaskView(taskManager);
    
    // DOM elements
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const switchToLoginBtn = document.getElementById('switch-to-login');
    const switchToRegisterBtn = document.getElementById('switch-to-register');
    const logoutBtn = document.getElementById('logout-btn');
    const userAuth = document.getElementById('user-auth');
    const loginRegister = document.getElementById('login-register');
    const usernameDisplay = document.getElementById('username-display');
    const themeToggle = document.getElementById('theme-toggle');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close-modal');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const taskForm = document.getElementById('task-form');
    const filterItems = document.querySelectorAll('.filters li');
    const categoryItems = document.getElementById('categories-list');
    const sortBySelect = document.getElementById('sort-by');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category');
    
    // App state
    let currentFilter = 'all';
    let currentCategory = null;
    let currentSortBy = 'date';
    
    // Check if user is logged in
    const currentUser = userManager.getCurrentUser();
    if (currentUser) {
        showLoggedInUI(currentUser);
        loadTasks();
    }
    
    // Event Listeners for Auth
    loginBtn.addEventListener('click', function() {
        authContainer.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });
    
    registerBtn.addEventListener('click', function() {
        authContainer.classList.remove('hidden');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    
    switchToLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });
    
    switchToRegisterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });
    
    document.getElementById('login-form-element').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const user = userManager.login(email, password);
            userManager.setCurrentUser(user);
            authContainer.classList.add('hidden');
            showLoggedInUI(user);
            loadTasks();
        } catch (error) {
            alert(error.message);
        }
    });
    
    document.getElementById('register-form-element').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const user = userManager.register(name, email, password);
            userManager.setCurrentUser(user);
            authContainer.classList.add('hidden');
            showLoggedInUI(user);
            loadTasks();
        } catch (error) {
            alert(error.message);
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        userManager.logout();
        showLoggedOutUI();
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('taskify_theme', 'dark');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('taskify_theme', 'light');
        }
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('taskify_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
    
    // Task modal
    addTaskBtn.addEventListener('click', function() {
        // Reset form
        document.getElementById('task-id').value = '';
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-status').value = 'pending';
        document.getElementById('task-category').value = 'personal';
        
        // Update modal title
        document.getElementById('modal-title').textContent = 'Add New Task';
        
        // Show modal
        taskModal.classList.remove('hidden');
    });
    
    closeModal.addEventListener('click', function() {
        taskModal.classList.add('hidden');
    });
    
    cancelTaskBtn.addEventListener('click', function() {
        taskModal.classList.add('hidden');
    });
    
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target === taskModal) {
            taskModal.classList.add('hidden');
        }
        if (e.target === authContainer) {
            authContainer.classList.add('hidden');
        }
    });
    
    // Task form submission
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) {
            alert('You must be logged in to create tasks');
            return;
        }
        
        const taskId = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const status = document.getElementById('task-status').value;
        const category = document.getElementById('task-category').value;
        
        try {
            if (taskId) {
                // Update existing task
                taskManager.updateTask(taskId, {
                    title,
                    description,
                    dueDate,
                    priority,
                    status,
                    category
                });
            } else {
                // Create new task
                taskManager.createTask(
                    currentUser.id,
                    title,
                    description,
                    dueDate,
                    priority,
                    status,
                    category
                );
            }
            
            // Close modal and reload tasks
            taskModal.classList.add('hidden');
            loadTasks();
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Filter tasks
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active filter
            filterItems.forEach(filter => filter.classList.remove('active'));
            this.classList.add('active');
            
            // Set current filter
            currentFilter = this.dataset.filter;
            document.getElementById('current-filter').textContent = this.textContent;
            
            // Reload tasks
            loadTasks();
        });
    });
    
    // Category filter
    categoryItems.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            // Update active category
            Array.from(categoryItems.children).forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Set current category
            currentCategory = e.target.dataset.category;
            
            // Reload tasks
            loadTasks();
        }
    });
    
    // Sort tasks
    sortBySelect.addEventListener('change', function() {
        currentSortBy = this.value;
        loadTasks();
    });
    
    // Add new category
    addCategoryBtn.addEventListener('click', function() {
        const categoryName = newCategoryInput.value.trim().toLowerCase();
        if (categoryName) {
            // Add to UI
            const categoryItem = document.createElement('li');
            categoryItem.textContent = categoryName;
            categoryItem.dataset.category = categoryName;
            categoryItems.appendChild(categoryItem);
            
            // Clear input
            newCategoryInput.value = '';
            
            // Reload tasks to refresh category dropdowns
            loadUserCategories();
        }
    });
    
    // Helper functions
    function showLoggedInUI(user) {
        userAuth.classList.remove('hidden');
        loginRegister.classList.add('hidden');
        usernameDisplay.textContent = user.name;
    }
    
    function showLoggedOutUI() {
        userAuth.classList.add('hidden');
        loginRegister.classList.remove('hidden');
        taskView.renderTasks([]);
    }
    
    function loadTasks() {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return;
        
        // Get tasks with current filters
        const tasks = taskManager.getUserTasks(currentUser.id, currentFilter, currentCategory);
        
        // Sort tasks
        const sortedTasks = taskManager.sortTasks(tasks, currentSortBy);
        
        // Render tasks
        taskView.renderTasks(sortedTasks);
        
        // Update analytics
        updateAnalytics();
        
        // Load user categories
        loadUserCategories();
    }
    
    function loadUserCategories() {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return;
        
        const categories = taskManager.getUserCategories(currentUser.id);
        taskView.updateCategoriesDropdown(categories);
    }
    
    function updateAnalytics() {
        const currentUser = userManager.getCurrentUser();
        if (!currentUser) return;
        
        document.getElementById('completed-today').textContent = taskManager.getCompletedToday(currentUser.id);
        document.getElementById('pending-count').textContent = taskManager.getPendingCount(currentUser.id);
    }
});