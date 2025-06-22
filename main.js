const API_BASE_URL = 'https://YOUR_RENDER_URL_HERE'; // <-- IMPORTANT: REPLACE WITH YOUR LIVE URL

// script.js

document.addEventListener('DOMContentLoaded', () => {
    const navbarMenuOblong = document.getElementById('navbarMenuOblong');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    
    if (navbarMenuOblong && sidebarMenu && sidebarCloseBtn) {
        // Show sidebar when oblong menu is clicked
        navbarMenuOblong.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarMenu.classList.add('show');
            sidebarMenu.style.display = 'flex';
        });
        
        // Hide sidebar when close button is clicked
        sidebarCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarMenu.classList.remove('show');
            setTimeout(() => { sidebarMenu.style.display = 'none'; }, 300);
        });
        
        // Hide sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebarMenu.classList.contains('show') && !sidebarMenu.contains(e.target) && !navbarMenuOblong.contains(e.target)) {
                sidebarMenu.classList.remove('show');
                setTimeout(() => { sidebarMenu.style.display = 'none'; }, 300);
            }
        });
        
        // Prevent click inside sidebar from closing it
        sidebarMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});

// Login form handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorDiv = document.getElementById('login-error');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                errorDiv.style.display = 'none';
                alert('Login successful!');
                // Save user info to localStorage to be used across the site
                localStorage.setItem('loggedInUser', JSON.stringify(result.user));
                window.location.href = 'ho.html'; // Redirect to dashboard
            } else {
                errorDiv.textContent = result.message || 'Invalid email or password!';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'An error occurred. Please try again later.';
            errorDiv.style.display = 'block';
        }
    });
}


// Registration form handling
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstname').value.trim();
        const lastName = document.getElementById('lastname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!firstName || !lastName || !email || password.length < 6) {
            alert('Please fill in all fields and use a password with at least 6 characters.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ firstName, lastName, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                alert('Registration successful!');
                // Automatically log in the user after registration
                const loginResponse = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const loginResult = await loginResponse.json();
                if (loginResponse.ok) {
                    localStorage.setItem('loggedInUser', JSON.stringify(loginResult.user));
                    window.location.href = 'ho.html'; // Redirect to dashboard
                } else {
                    window.location.href = 'log.html'; // Redirect to login page if auto-login fails
                }
            } else {
                alert(`Registration failed: ${result.message}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again.');
        }
    });
}

// Profile page handling
document.addEventListener('DOMContentLoaded', () => {
    const changeProfileBtn = document.querySelector('.change-profile-btn');
    const profileImageLarge = document.querySelector('.profile-image-large');
    const profilePicNavbar = document.getElementById('profilePic');
    const updateProfileBtn = document.querySelector('.update-profile-btn');
    const profileInputs = document.querySelectorAll('.profile-input');
    
    const loggedInUserStr = localStorage.getItem('loggedInUser');
    let loggedInUser = null;

    if (loggedInUserStr) {
        loggedInUser = JSON.parse(loggedInUserStr);
    } else if (window.location.pathname.endsWith('q.html')) {
        alert('You must be logged in to view this page.');
        window.location.href = 'log.html';
        return; 
    }
    
    // Populate form fields on q.html
    const firstNameInput = document.getElementById('profile-firstname');
    const lastNameInput = document.getElementById('profile-lastname');
    const emailInput = document.getElementById('profile-email');
    const sexInput = document.getElementById('profile-sex');
    const otherInput = document.getElementById('profile-other');

    if (firstNameInput && loggedInUser) {
        firstNameInput.value = loggedInUser.firstName || '';
        lastNameInput.value = loggedInUser.lastName || '';
        emailInput.value = loggedInUser.email || '';
        sexInput.value = loggedInUser.sex || '';
        otherInput.value = loggedInUser.other || '';
    }
    
    if (changeProfileBtn && profileImageLarge && profilePicNavbar) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        changeProfileBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const imageUrl = e.target.result;
                    
                    // Immediately update the backend with the new profile picture
                    const updatedData = {
                        ...loggedInUser, // Preserve existing data
                        profilePicture: imageUrl
                    };
                    
                    try {
                        const response = await fetch(`${API_BASE_URL}/users/${loggedInUser.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedData)
                        });

                        const result = await response.json();

                        if (response.ok) {
                            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
                            loggedInUser = result.user; // Update the global user object
                            
                            profileImageLarge.style.backgroundImage = `url('${imageUrl}')`;
                            profilePicNavbar.style.backgroundImage = `url('${imageUrl}')`;

                            alert('Profile picture updated successfully!');
                        } else {
                            alert(`Update failed: ${result.message}`);
                        }
                    } catch (error) {
                        console.error('Profile picture update error:', error);
                        alert('An error occurred while updating the profile picture.');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Load profile image from the loggedInUser object on page load
    if (loggedInUser && loggedInUser.profilePicture) {
        if (profileImageLarge) {
            profileImageLarge.style.backgroundImage = `url('${loggedInUser.profilePicture}')`;
        }
        if (profilePicNavbar) {
            profilePicNavbar.style.backgroundImage = `url('${loggedInUser.profilePicture}')`;
        }
    }
    
    if (updateProfileBtn && loggedInUser) {
        updateProfileBtn.addEventListener('click', async () => {
            const updatedData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                sex: sexInput.value.trim(),
                other: otherInput.value.trim()
            };

            try {
                const response = await fetch(`${API_BASE_URL}/users/${loggedInUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('loggedInUser', JSON.stringify(result.user));
                    alert(result.message);

                    // Reload the profile image to ensure it is in sync
                    const savedProfileImage = result.user.profilePicture;
                    if (savedProfileImage) {
                        if (profileImageLarge) {
                            profileImageLarge.style.backgroundImage = `url('${savedProfileImage}')`;
                        }
                        if (profilePicNavbar) {
                            profilePicNavbar.style.backgroundImage = `url('${savedProfileImage}')`;
                        }
                    }
                } else {
                    alert(`Update failed: ${result.message}`);
                }
            } catch (error) {
                console.error('Profile update error:', error);
                alert('An error occurred during profile update. Please try again.');
            }
        });
    }
});

// Search bar handling
document.addEventListener('DOMContentLoaded', () => {
    const searchBoxes = document.querySelectorAll('.search-box');
    searchBoxes.forEach(searchBox => {
        searchBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = searchBox.value.trim();
                window.location.href = `do.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    });
});

// --- PORTFOLIO SCRIPT ---

document.addEventListener('DOMContentLoaded', async () => {
    let portfolios = [];
    try {
        const response = await fetch(`${API_BASE_URL}/portfolios`);
        if (response.ok) {
            portfolios = await response.json();
        } else {
            console.error('Failed to fetch portfolios.');
            portfolios = [];
        }
    } catch (error) {
        console.error('Error fetching portfolios:', error);
        portfolios = [];
    }

    const urlParams = new URLSearchParams(window.location.search);
    const portfolioId = urlParams.get('id');
    const searchTerm = urlParams.get('search');

    const portfolioGrid = document.querySelector('.portfolio-grid');
    const docsSection = document.querySelector('.docs-section');
    const mainContent = document.querySelector('.main-content');
    const heroSection = document.querySelector('.hero-section');

    // --- FILTERING LOGIC ---
    let portfoliosToDisplay = portfolios;
    if (searchTerm) {
        portfoliosToDisplay = portfolios.filter(p =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        // Update the hero section on the docs page to reflect the search
        if (heroSection && docsSection) {
            const titleElement = heroSection.querySelector('.main-title');
            const subtitleElement = heroSection.querySelector('.subtitle');
            if (titleElement) titleElement.textContent = `Search Results for "${searchTerm}"`;
            if (subtitleElement) subtitleElement.textContent = `${portfoliosToDisplay.length} portfolio(s) found.`;
        }
    }

    // --- RENDER LOGIC ---

    if (portfolioId) {
        // Display a single portfolio's details
        const portfolio = portfolios.find(p => p.id == portfolioId);
        if (portfolio && mainContent) {
            const portfolioDetailHtml = `
                <section class="portfolio-detail">
                    <h1 class="main-title">${portfolio.title}</h1>
                    <img src="${portfolio.imageUrl}" alt="${portfolio.title}" class="portfolio-detail-image">
                    <p class="portfolio-detail-description">${portfolio.description}</p>
                    <div class="portfolio-detail-date"><strong>Date:</strong> ${new Date(portfolio.date).toLocaleDateString()}</div>
                    <div class="portfolio-files">
                        <h3>Associated Files & Folders:</h3>
                        <ul>
                            ${portfolio.files.map(file => `<li><a href="${API_BASE_URL}/${file.path}" target="_blank">${file.name}</a></li>`).join('')}
                        </ul>
                    </div>
                    <a href="do.html" class="btn-back">Back to All Docs</a>
                </section>
            `;
            // Hide other sections and show the detail view
            if(document.querySelector('.hero-section')) document.querySelector('.hero-section').style.display = 'none';
            if(docsSection) docsSection.style.display = 'none';

            mainContent.insertAdjacentHTML('beforeend', portfolioDetailHtml);
        }
    } else {
        // Display all portfolios
        if (portfolioGrid) {
            // Home page
            const latestPortfolios = portfolios.slice(0, 3);
            portfolioGrid.innerHTML = latestPortfolios.map(p => `
                <article class="portfolio-card" data-id="${p.id}">
                    <div class="card-image" style="background-image: url('${p.imageUrl}');"></div>
                    <div class="card-content">
                        <h3 class="card-title">${p.title}</h3>
                        <p class="card-description">${p.description.substring(0, 70)}...</p>
                    </div>
                </article>
            `).join('');
        }

        if (docsSection) {
            // Docs page
            if (portfoliosToDisplay.length > 0) {
                docsSection.innerHTML = portfoliosToDisplay.map(p => `
                    <article class="doc-item" data-id="${p.id}">
                        <div class="doc-image-container" style="background-image: url('${p.imageUrl}');"></div>
                        <div class="doc-content">
                            <h3 class="doc-title">${p.title}</h3>
                            <div class="doc-description">${p.description}</div>
                        </div>
                        <div class="doc-date">${new Date(p.date).toLocaleDateString()}</div>
                    </article>
                `).join('');
            } else if (searchTerm) {
                docsSection.innerHTML = `<p class="subtitle" style="text-align: center;">No portfolios found for "${searchTerm}".</p>`;
            } else {
                docsSection.innerHTML = `<p class="subtitle" style="text-align: center;">No portfolios have been created yet.</p>`;
            }
        }
    }

    // --- EVENT LISTENERS ---

    document.body.addEventListener('click', (e) => {
        const targetCard = e.target.closest('.portfolio-card, .doc-item');
        if (targetCard) {
            const id = targetCard.dataset.id;
            if (id) {
                window.location.href = `do.html?id=${id}`;
            }
        }
    });

    // --- CREATE PORTFOLIO SCRIPT ---
    const addPortfolioForm = document.getElementById('addPortfolioForm');
    if (addPortfolioForm) {
        const backgroundBtn = document.getElementById('backgroundBtn');
        const backgroundInput = document.getElementById('portfolio-background-input');
        const imagePreview = document.getElementById('imagePreview').querySelector('img');
        const imageUrlInput = document.getElementById('portfolio-image-url');

        if (backgroundBtn && backgroundInput) {
            backgroundBtn.addEventListener('click', () => {
                backgroundInput.click();
            });

            backgroundInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imageUrl = e.target.result;
                        imagePreview.src = imageUrl;
                        imageUrlInput.value = imageUrl; // Store as Base64
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        addPortfolioForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('portfolio-title').value.trim();
            const description = document.getElementById('portfolio-description').value.trim();
            const imageUrl = imageUrlInput.value;
            
            if (!title || !description || !imageUrl) {
                alert('Please fill out all fields and select a background image.');
                return;
            }

            const loggedInUserStr = localStorage.getItem('loggedInUser');
            if (!loggedInUserStr) {
                alert('You must be logged in to create a portfolio.');
                window.location.href = 'log.html';
                return;
            }
            const loggedInUser = JSON.parse(loggedInUserStr);

            const newPortfolioData = {
                title,
                description,
                imageUrl,
                userId: loggedInUser.id
            };

            try {
                const response = await fetch(`${API_BASE_URL}/portfolios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPortfolioData)
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Portfolio created successfully!');
                    window.location.href = 'do.html';
                } else {
                    alert(`Failed to create portfolio: ${result.message}`);
                }
            } catch (error) {
                console.error('Error creating portfolio:', error);
                alert('An error occurred while creating the portfolio.');
            }
        });
    }

    // --- ADD DOCS SCRIPT ---
    const addDocsContainer = document.getElementById('addDocsContainer');
    if (addDocsContainer) {
        const portfolioSelect = document.getElementById('portfolio-select');
        const currentFilesContainer = document.getElementById('current-files-container');
        const currentFilesList = document.getElementById('current-files-list');
        const addFileForm = document.getElementById('addFileForm');
        const newFileNameInput = document.getElementById('new-file-name');

        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (loggedInUserStr) {
            const loggedInUser = JSON.parse(loggedInUserStr);
            const userPortfolios = portfolios.filter(p => p.userId === loggedInUser.id);
    
            // Populate dropdown
            userPortfolios.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.title;
                portfolioSelect.appendChild(option);
            });
        } else if (window.location.pathname.endsWith('add-docs.html')) {
            alert('You must be logged in to add documents.');
            window.location.href = 'log.html';
        }

        // Handle portfolio selection
        portfolioSelect.addEventListener('change', () => {
            const selectedId = portfolioSelect.value;
            if (!selectedId) {
                currentFilesContainer.style.display = 'none';
                addFileForm.style.display = 'none';
                return;
            }

            const selectedPortfolio = portfolios.find(p => p.id == selectedId);
            if (selectedPortfolio) {
                // Display current files
                currentFilesList.innerHTML = selectedPortfolio.files.map(file => `<li><a href="${API_BASE_URL}/${file.path}" target="_blank">${file.name}</a></li>`).join('');
                currentFilesContainer.style.display = 'block';
                addFileForm.style.display = 'block';
            }
        });

        // Handle file addition
        addFileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedId = portfolioSelect.value;
            const fileInput = document.getElementById('new-file-input');
            const file = fileInput.files[0];

            if (selectedId && file) {
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`${API_BASE_URL}/portfolios/${selectedId}/files`, {
                        method: 'POST',
                        body: formData
                    });
    
                    const result = await response.json();
    
                    if (response.ok) {
                        const portfolioIndex = portfolios.findIndex(p => p.id == selectedId);
                        if (portfolioIndex !== -1) {
                            portfolios[portfolioIndex] = result.portfolio;
                        }
                        
                        currentFilesList.innerHTML = result.portfolio.files.map(file => `<li><a href="${API_BASE_URL}/${file.path}" target="_blank">${file.name}</a></li>`).join('');
                        fileInput.value = ''; // Clear input
                        alert('File added successfully!');
                    } else {
                        alert(`Failed to add file: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Error adding file:', error);
                    alert('An error occurred while adding the file.');
                }
            }
        });
    }

    // --- SIGN OUT SCRIPT ---
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            alert('You have been signed out.');
            window.location.href = 'log.html';
        });
    }
});