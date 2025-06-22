const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'users.json');
const PORTFOLIOS_DB_PATH = path.join(__dirname, 'portfolios.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const portfolioId = req.params.id;
        const portfolioDir = path.join(UPLOADS_DIR, portfolioId);
        if (!fs.existsSync(portfolioDir)) {
            fs.mkdirSync(portfolioDir, { recursive: true });
        }
        cb(null, portfolioDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files (HTML, CSS, JS) from the project root
app.use(express.static(__dirname));

// Optional: Redirect root to home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ho.html'));
});

// Helper function to read users from the database file
const getUsers = () => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
};

// Helper function to save users to the database file
const saveUsers = (users) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
};

// Helper function to read portfolios from the database file
const getPortfolios = () => {
    if (!fs.existsSync(PORTFOLIOS_DB_PATH)) {
        fs.writeFileSync(PORTFOLIOS_DB_PATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(PORTFOLIOS_DB_PATH);
    return JSON.parse(data);
};

// Helper function to save portfolios to the database file
const savePortfolios = (portfolios) => {
    fs.writeFileSync(PORTFOLIOS_DB_PATH, JSON.stringify(portfolios, null, 2));
};

// Registration endpoint
app.post('/register', (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const users = getUsers();
    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const newUser = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        password, // In a real app, you should hash the password!
        profilePicture: ""
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({ message: 'User registered successfully!' });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const users = getUsers();
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        res.status(200).json({ message: 'Login successful!', user });
    } else {
        res.status(400).json({ message: 'Invalid email or password.' });
    }
});

// Update user profile endpoint
app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { firstName, lastName, sex, other, profilePicture } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required.' });
    }

    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Update user data, preserving existing optional fields if not provided
    users[userIndex] = {
        ...users[userIndex],
        firstName,
        lastName,
        sex: sex || users[userIndex].sex || "",
        other: other || users[userIndex].other || "",
        profilePicture: profilePicture !== undefined ? profilePicture : users[userIndex].profilePicture
    };
    
    saveUsers(users);

    res.status(200).json({ message: 'Profile updated successfully!', user: users[userIndex] });
});

// Get all portfolios
app.get('/portfolios', (req, res) => {
    const portfolios = getPortfolios();
    res.status(200).json(portfolios);
});

// Create a new portfolio
app.post('/portfolios', (req, res) => {
    const { title, description, imageUrl, userId } = req.body;

    if (!title || !description || !imageUrl || !userId) {
        return res.status(400).json({ message: 'Missing required portfolio data.' });
    }

    const portfolios = getPortfolios();
    const newPortfolio = {
        id: Date.now(),
        userId,
        title,
        description,
        imageUrl,
        date: new Date().toISOString(),
        files: []
    };

    portfolios.push(newPortfolio);
    savePortfolios(portfolios);

    res.status(201).json({ message: 'Portfolio created successfully!', portfolio: newPortfolio });
});

// Add a file to a portfolio
app.post('/portfolios/:id/files', upload.single('file'), (req, res) => {
    const portfolioId = parseInt(req.params.id, 10);
    
    if (!req.file) {
        return res.status(400).json({ message: 'File is required.' });
    }

    const portfolios = getPortfolios();
    const portfolioIndex = portfolios.findIndex(p => p.id === portfolioId);

    if (portfolioIndex === -1) {
        return res.status(404).json({ message: 'Portfolio not found.' });
    }
    
    // Save the relative path to the file
    const filePath = path.join('uploads', req.params.id, req.file.filename).replace(/\\/g, "/");
    portfolios[portfolioIndex].files.push({
        name: req.file.originalname,
        path: filePath
    });
    savePortfolios(portfolios);

    res.status(200).json({ message: 'File added successfully!', portfolio: portfolios[portfolioIndex] });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 