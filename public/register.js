document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Load server errors on page load
    loadServerErrors();

    // Clear errors on input
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
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

        // Validate name
        if (!nameInput.value.trim()) {
            document.getElementById('nameError').textContent = 'Name is required';
            hasErrors = true;
        }

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

        // Validate confirm password
        if (!confirmPasswordInput.value.trim()) {
            document.getElementById('confirmPasswordError').textContent = 'Confirm password is required';
            hasErrors = true;
        } else if (passwordInput.value !== confirmPasswordInput.value) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
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
            if (data.errors.name) {
                document.getElementById('nameError').textContent = data.errors.name;
            }
            if (data.errors.email) {
                document.getElementById('emailError').textContent = data.errors.email;
            }
            if (data.errors.password) {
                document.getElementById('passwordError').textContent = data.errors.password;
            }
            if (data.errors.confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = data.errors.confirmPassword;
            }
        }
    } catch (error) {
        console.error('Error loading server errors:', error);
    }
}
