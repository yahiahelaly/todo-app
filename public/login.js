document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Load server errors on page load
    loadServerErrors();

    // Clear errors on input
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', function() {
            const errorSpan = document.getElementById(this.id + 'Error');
            if (errorSpan) {
                errorSpan.textContent = '';
            }
        });
    });

    form.addEventListener('submit', function(e) {
        let hasErrors = false;

        // Clear previous errors
        document.querySelectorAll('.error').forEach(el => el.textContent = '');

        // Validate email
        if (!emailInput.value.trim()) {
            document.getElementById('emailError').textContent = 'Email is required';
            hasErrors = true;
        }

        // Validate password
        if (!passwordInput.value.trim()) {
            document.getElementById('passwordError').textContent = 'Password is required';
            hasErrors = true;
        }

        if (hasErrors) {
            e.preventDefault();
        }
    });
});

async function loadServerErrors() {
    try {
        const response = await fetch('/api/errors');
        const data = await response.json();
        
        if (data.errors) {
            if (data.errors.general) {
                // Show general error at the top of the form
                const form = document.getElementById('loginForm');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error';
                errorDiv.style.textAlign = 'center';
                errorDiv.style.marginBottom = '20px';
                errorDiv.textContent = data.errors.general;
                form.insertBefore(errorDiv, form.firstChild);
            }
            if (data.errors.email) {
                document.getElementById('emailError').textContent = data.errors.email;
            }
            if (data.errors.password) {
                document.getElementById('passwordError').textContent = data.errors.password;
            }
        }
    } catch (error) {
        console.error('Error loading server errors:', error);
    }
}
