let deleteTodoId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    setupAddTodo();
    setupEditModal();
    setupDeleteModal();
});

async function loadTodos() {
    try {
        const response = await fetch('/api/todos');
        const data = await response.json();
        
        document.getElementById('greeting').textContent = `Hi, ${data.userName}`;
        renderTodos(data.todos);
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

function renderTodos(todos) {
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');

    const openTasksCount = todos.filter(todo => Number(todo.is_done) === 0).length;
    document.getElementById('openTasksCount').textContent = openTasksCount;

    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    todos.forEach(todo => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.is_done ? 'done' : ''}`;
        todoItem.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.is_done ? 'checked' : ''} data-id="${todo.todo_id}">
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                <div class="todo-date">${formatDate(todo.created_at)}</div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-secondary btn-edit" data-id="${todo.todo_id}">Edit</button>
                <button class="btn btn-danger btn-delete" data-id="${todo.todo_id}">Delete</button>
            </div>
        `;
        todoList.appendChild(todoItem);
    });
    
    // Add event listeners
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleTodo(this.dataset.id, this.checked);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            openEditModal(this.dataset.id);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            openDeleteModal(this.dataset.id);
        });
    });
}

function setupAddTodo() {
    const form = document.getElementById('addTodoForm');
    const input = document.getElementById('newTodo');
    const errorSpan = document.getElementById('newTodoError');
    
    input.addEventListener('input', function() {
        errorSpan.textContent = '';
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = input.value.trim();
        
        if (!title) {
            errorSpan.textContent = 'Title is required';
            return;
        }
        
        if (title.length > 200) {
            errorSpan.textContent = 'Title is too long (200 characters at most)';
            return;
        }
        
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                input.value = '';
                loadTodos();
            } else if (data.errors) {
                errorSpan.textContent = data.errors.title || 'Failed to add todo';
            }
        } catch (error) {
            console.error('Error adding todo:', error);
            errorSpan.textContent = 'Failed to add todo';
        }
    });
}

function setupEditModal() {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editTodoForm');
    const cancelBtn = document.getElementById('cancelEdit');
    const titleInput = document.getElementById('editTitle');
    const errorSpan = document.getElementById('editTitleError');
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        errorSpan.textContent = '';
    });
    
    titleInput.addEventListener('input', function() {
        errorSpan.textContent = '';
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const todoId = document.getElementById('editTodoId').value;
        const title = titleInput.value.trim();
        
        if (!title) {
            errorSpan.textContent = 'Title is required';
            return;
        }
        
        if (title.length > 200) {
            errorSpan.textContent = 'Title is too long (200 characters at most)';
            return;
        }
        
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                modal.style.display = 'none';
                loadTodos();
            } else if (data.errors) {
                errorSpan.textContent = data.errors.title || 'Failed to edit todo';
            }
        } catch (error) {
            console.error('Error editing todo:', error);
            errorSpan.textContent = 'Failed to edit todo';
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            errorSpan.textContent = '';
        }
    });
}

function setupDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        deleteTodoId = null;
    });
    
    confirmBtn.addEventListener('click', async function() {
        if (deleteTodoId) {
            try {
                const response = await fetch(`/api/todos/${deleteTodoId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    modal.style.display = 'none';
                    deleteTodoId = null;
                    loadTodos();
                }
            } catch (error) {
                console.error('Error deleting todo:', error);
            }
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            deleteTodoId = null;
        }
    });
}

async function openEditModal(todoId) {
    try {
        const response = await fetch('/api/todos');
        const data = await response.json();
        const todo = data.todos.find(t => t.todo_id == todoId);
        
        if (todo) {
            document.getElementById('editTodoId').value = todoId;
            document.getElementById('editTitle').value = todo.title;
            document.getElementById('editTitleError').textContent = '';
            document.getElementById('editModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error fetching todo:', error);
    }
}

function openDeleteModal(todoId) {
    deleteTodoId = todoId;
    document.getElementById('deleteModal').style.display = 'flex';
}

async function toggleTodo(todoId, isDone) {
    try {
        const response = await fetch(`/api/todos/${todoId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_done: isDone })
        });
        
        if (response.ok) {
            loadTodos();
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
