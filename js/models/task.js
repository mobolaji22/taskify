class Task {
    constructor(id, userId, title, description = '', dueDate = null, priority = 'medium', status = 'pending', category = 'personal') {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.status = status;
        this.category = category;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    
    static create(userId, title, description, dueDate, priority, status, category) {
        const id = 'task_' + Date.now();
        return new Task(id, userId, title, description, dueDate, priority, status, category);
    }
    
    update(data) {
        Object.assign(this, data);
        this.updatedAt = new Date();
    }
    
    isCompleted() {
        return this.status === 'completed';
    }
    
    toggleComplete() {
        this.status = this.isCompleted() ? 'pending' : 'completed';
        this.updatedAt = new Date();
    }
    
    isOverdue() {
        if (!this.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(this.dueDate);
        return dueDate < today && this.status !== 'completed';
    }
    
    isDueToday() {
        if (!this.dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(this.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
    }
}

class TaskManager {
    constructor() {
        this.storageKey = 'taskify_tasks';
        this.loadTasks();
    }
    
    loadTasks() {
        const tasksJSON = localStorage.getItem(this.storageKey);
        const rawTasks = tasksJSON ? JSON.parse(tasksJSON) : {};
        
        // Convert plain objects back to Task instances
        this.tasks = {};
        for (const taskId in rawTasks) {
            const taskData = rawTasks[taskId];
            this.tasks[taskId] = new Task(
                taskData.id,
                taskData.userId,
                taskData.title,
                taskData.description,
                taskData.dueDate,
                taskData.priority,
                taskData.status,
                taskData.category
            );
            
            // Restore dates
            this.tasks[taskId].createdAt = new Date(taskData.createdAt);
            this.tasks[taskId].updatedAt = new Date(taskData.updatedAt);
        }
    }
    
    saveTasks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }
    
    createTask(userId, title, description, dueDate, priority, status, category) {
        const newTask = Task.create(userId, title, description, dueDate, priority, status, category);
        this.tasks[newTask.id] = newTask;
        this.saveTasks();
        return newTask;
    }
    
    getTask(taskId) {
        return this.tasks[taskId];
    }
    
    updateTask(taskId, data) {
        const task = this.tasks[taskId];
        if (!task) {
            throw new Error('Task not found');
        }
        
        task.update(data);
        this.saveTasks();
        return task;
    }
    
    deleteTask(taskId) {
        if (!this.tasks[taskId]) {
            throw new Error('Task not found');
        }
        
        delete this.tasks[taskId];
        this.saveTasks();
    }
    
    getUserTasks(userId, filter = 'all', category = null) {
        const userTasks = Object.values(this.tasks).filter(task => task.userId === userId);
        
        // Apply category filter if provided and not "all"
        let filteredTasks = (category && category !== 'all') 
            ? userTasks.filter(task => task.category === category) 
            : userTasks;
        
        // Apply additional filters
        switch (filter) {
            case 'today':
                filteredTasks = filteredTasks.filter(task => {
                    if (!task.dueDate) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                });
                break;
            case 'upcoming':
                filteredTasks = filteredTasks.filter(task => {
                    if (!task.dueDate || task.status === 'completed') return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate >= today;
                });
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.status === 'completed');
                break;
        }
        
        return filteredTasks;
    }
    
    sortTasks(tasks, sortBy) {
        return [...tasks].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityValues = { 'low': 0, 'medium': 1, 'high': 2 };
                    return priorityValues[b.priority] - priorityValues[a.priority];
                case 'status':
                    const statusValues = { 'completed': 0, 'in-progress': 1, 'pending': 2 };
                    return statusValues[a.status] - statusValues[b.status];
                default:
                    return a.createdAt - b.createdAt;
            }
        });
    }
    
    getCompletedToday(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return Object.values(this.tasks).filter(task => {
            if (task.userId !== userId || task.status !== 'completed') 
                return false;
            
            const completedDate = new Date(task.updatedAt);
            completedDate.setHours(0, 0, 0, 0);  
            return completedDate.getTime() === today.getTime();
        }).length;
    }
    
    getPendingCount(userId) {
        return Object.values(this.tasks).filter(
            task => task.userId === userId && task.status !== 'completed'
        ).length;
    }
    
    getUserCategories(userId) {
        const categories = new Set();
        Object.values(this.tasks)
            .filter(task => task.userId === userId)
            .forEach(task => categories.add(task.category));
        return Array.from(categories);
    }
    
    // Add this method to the TaskManager class
    cleanupCompletedTasks(userId) {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        const oldCompletedTasks = Object.entries(this.tasks)
            .filter(([_, task]) => {
                if (task.userId !== userId || task.status !== 'completed') 
                    return false;
                
                const completedDate = new Date(task.updatedAt);
                return completedDate < tenDaysAgo;
            });
        
        if (oldCompletedTasks.length > 0) {
            // Delete old completed tasks
            oldCompletedTasks.forEach(([taskId, _]) => {
                delete this.tasks[taskId];
            });
            
            this.saveTasks();
            
            // Return count for notification
            return oldCompletedTasks.length;
        }
        
        return 0;
    }
}

// Export for other modules
window.Task = Task;
window.TaskManager = TaskManager;
