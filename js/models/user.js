
class User {
    constructor(id, name, email, password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password; // In a real app, never store plain passwords
        this.createdAt = new Date();
    }
    
    static create(name, email, password) {
        const id = 'user_' + Date.now();
        return new User(id, name, email, password);
    }
}

class UserManager {
    constructor() {
        this.storageKey = 'taskify_users';
        this.currentUserKey = 'taskify_current_user';
        this.loadUsers();
    }
    
    loadUsers() {
        const usersJSON = localStorage.getItem(this.storageKey);
        this.users = usersJSON ? JSON.parse(usersJSON) : {};
    }
    
    saveUsers() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.users));
    }
    
    getCurrentUser() {
        const currentUserJSON = localStorage.getItem(this.currentUserKey);
        return currentUserJSON ? JSON.parse(currentUserJSON) : null;
    }
    
    setCurrentUser(user) {
        if (user) {
            // Store user without password
            const { password, ...userWithoutPassword } = user;
            localStorage.setItem(this.currentUserKey, JSON.stringify(userWithoutPassword));
        } else {
            localStorage.removeItem(this.currentUserKey);
        }
    }
    
    register(name, email, password) {
        // Check if email already exists
        for (const userId in this.users) {
            if (this.users[userId].email === email) {
                throw new Error('Email already registered');
            }
        }
        
        const newUser = User.create(name, email, password);
        this.users[newUser.id] = newUser;
        this.saveUsers();
        
        // Return user without password
        const { password: pwd, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
    
    login(email, password) {
        for (const userId in this.users) {
            const user = this.users[userId];
            if (user.email === email && user.password === password) {
                // Return user without password
                const { password: pwd, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
        }
        throw new Error('Invalid email or password');
    }
    
    logout() {
        this.setCurrentUser(null);
    }
}

// Export for other modules
window.UserManager = UserManager;
