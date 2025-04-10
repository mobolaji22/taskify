class TaskView {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.taskListElement = document.getElementById('task-list');
        this.categorySelectElement = document.getElementById('task-category');
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
        
        // Update analytics
        updateAnalytics();
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
            
            // Update analytics
            updateAnalytics();
        }
    }
    
    updateCategoriesDropdown(categories) {
        // Clear existing options except the default ones
        const defaultCategories = ['work', 'personal', 'errands'];
        
        // Keep only default categories
        this.categorySelectElement.innerHTML = '';
        
        // Add all categories (default and custom)
        const allCategories = [...new Set([...defaultCategories, ...categories])];
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.categorySelectElement.appendChild(option);
        });
    }
}

// Export for other modules
window.TaskView = TaskView;

