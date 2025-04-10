class TaskView {
    constructor(taskManager, updateAnalyticsCallback) {
        this.taskManager = taskManager;
        this.taskListElement = document.getElementById('task-list');
        this.categorySelectElement = document.getElementById('task-category');
        this.updateAnalyticsCallback = updateAnalyticsCallback;
    }
    
    renderTasks(tasks) {
        this.taskListElement.innerHTML = '';
        
        if (tasks.length === 0) {
            this.taskListElement.innerHTML = `
                <div class="no-tasks">
                    <p>No tasks to display. Add a new task to get started!</p>
                </div>
            `;
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskListElement.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item priority-${task.priority}`;
        if (task.status === 'completed') {
            taskElement.classList.add('completed');
        }
        taskElement.dataset.id = task.id;
        
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const dueDateClass = task.isOverdue() ? 'overdue' : (task.isDueToday() ? 'due-today' : '');
        
        taskElement.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''}>
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${task.description || 'No description'}</p>
                <div class="task-meta">
                    <span class="task-meta-item ${dueDateClass}">
                        <i class="far fa-calendar"></i>
                        ${dueDate}
                    </span>
                    <span class="task-meta-item">
                        <i class="fas fa-folder"></i>
                        ${task.category}
                    </span>
                    <span class="task-status status-${task.status}">
                        ${task.status.replace('-', ' ')}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-task" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-task" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            this.toggleTaskComplete(task.id);
        });
        
        const editButton = taskElement.querySelector('.edit-task');
        editButton.addEventListener('click', () => {
            this.openEditTaskModal(task.id);
        });
        
        const deleteButton = taskElement.querySelector('.delete-task');
        deleteButton.addEventListener('click', () => {
            this.deleteTask(task.id);
        });
        
        return taskElement;
    }
    
    toggleTaskComplete(taskId) {
        const task = this.taskManager.getTask(taskId);
        task.toggleComplete();
        this.taskManager.saveTasks();
        
        // Update UI
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (task.isCompleted()) {
            taskElement.classList.add('completed');
        } else {
            taskElement.classList.remove('completed');
        }
        
        // Update status badge
        const statusBadge = taskElement.querySelector('.task-status');
        statusBadge.className = `task-status status-${task.status}`;
        statusBadge.textContent = task.status.replace('-', ' ');
        
        // Update analytics using the callback
        if (this.updateAnalyticsCallback) {
            this.updateAnalyticsCallback();
        }
    }
    
    openEditTaskModal(taskId) {
        const task = this.taskManager.getTask(taskId);
        
        // Fill form with task data
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-due-date').value = task.dueDate || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-category').value = task.category;
        
        // Update modal title
        document.getElementById('modal-title').textContent = 'Edit Task';
        
        // Show modal
        document.getElementById('task-modal').classList.remove('hidden');
    }
    
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.taskManager.deleteTask(taskId);
            
            // Remove task from UI
            const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
            taskElement.remove();
            
            // Update analytics using the callback
            if (this.updateAnalyticsCallback) {
                this.updateAnalyticsCallback();
            }
        }
    }
    
    updateCategoriesDropdown(categories) {
        // Clear existing options
        this.categorySelectElement.innerHTML = '';
        
        // Default categories
        const defaultCategories = ['work', 'personal', 'errands'];
        
        // Add all categories (default and custom)
        const allCategories = [...new Set([...defaultCategories, ...categories])];
        
        // Sort categories alphabetically, but keep default categories at the top
        allCategories.sort((a, b) => {
            const aIsDefault = defaultCategories.includes(a);
            const bIsDefault = defaultCategories.includes(b);
            
            if (aIsDefault && !bIsDefault) return -1;
            if (!aIsDefault && bIsDefault) return 1;
            return a.localeCompare(b);
        });
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            this.categorySelectElement.appendChild(option);
        });
    }
    
    // Add this method to TaskView
    deleteCategory(categoryName) {
        if (confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
            const currentUser = userManager.getCurrentUser();
            if (!currentUser) return false;
            
            // Get tasks in this category
            const categoryTasks = this.taskManager.getUserTasks(currentUser.id)
                .filter(task => task.category === categoryName);
            
            if (categoryTasks.length > 0) {
                const reassign = confirm(`This category has ${categoryTasks.length} tasks. Would you like to reassign them to another category instead of deleting?`);
                
                if (reassign) {
                    const newCategory = prompt("Enter the category to reassign tasks to:", "personal");
                    if (newCategory) {
                        // Update all tasks in this category
                        categoryTasks.forEach(task => {
                            this.taskManager.updateTask(task.id, { category: newCategory });
                        });
                    } else {
                        return false; // User cancelled
                    }
                }
            }
            
            // Reload tasks to reflect changes
            loadTasks();
            
            return true;
        }
        return false;
    }
}

// Export for other modules
window.TaskView = TaskView;

