const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const app = express();
const port = 8080;
const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure session
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Example user data (replace with your database queries)
const users = [
    { id: 1, username: 'user', password: '$2b$10$8/BtqgF2SkVjSRX0.wJbgOmb8ByuNOdsBCesxqWbcGqZ3Iu/VNh6y', role: 'client' }
];

passport.use(new LocalStrategy((username, password, done) => {
    console.log('Attempting login for username:', username);

    const user = users.find(u => u.username === username);
    if (!user) {
        console.log('User not found:', username);
        return done(null, false);
    }

    if (!bcrypt.compareSync(password, user.password)) {
        console.log('Incorrect password for user:', username);
        return done(null, false);
    }

    console.log('Login successful for user:', username);
    return done(null, user);
}));
  

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user
  passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
  });
  
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert user data into the database
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error registering:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});
  

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if (err) {
          console.error('Error during authentication:', err);
          return res.status(500).json({ error: 'An error occurred during authentication' });
      }
      if (!user) {
          console.log('Invalid credentials for login:', req.body.username);
          return res.status(401).json({ error: 'Invalid credentials' });
      }
      req.logIn(user, err => {
          if (err) {
              console.error('Error during login:', err);
              return res.status(500).json({ error: 'An error occurred during login' });
          }
          console.log('Login successful for user:', user.username);
          return res.json({ message: 'Login successful' });
      });
  })(req, res, next);
});



const db = new sqlite3.Database('database.db');


db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        date TEXT NOT NULL,
        img TEXT NOT NULL,
        body TEXT NOT NULL
      )
    `);
  
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blogId INTEGER NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (blogId) REFERENCES blogs (id)
      )
    `);
  });



  app.use(express.static('public')); // Vous pouvez remplacer 'public' par le dossier où vous souhaitez stocker les images
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'public', 'images')); // Chemin vers le dossier public/images
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage });

  app.post('/blogs', upload.single('image'), (req, res) => {
    const { title, body, author, date } = req.body;
    const image = req.file.filename; // Obtenez le nom du fichier image
  
    db.run(
      'INSERT INTO blogs (title, body, author, date, img) VALUES (?, ?, ?, ?, ?)',
      [title, body, author, date, image], // Utilisez le nom du fichier image
      function (err) {
        if (err) {
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
        }
  
        res.json({ success: true });
      }
    );
  });


  app.post('/gallery', upload.single('image'), (req, res) => {
    const { title, body, author, date } = req.body;
    const image = req.file.filename; // Obtenez le nom du fichier image
  
    db.run(
      'INSERT INTO gallery (title, body, author, date, img) VALUES (?, ?, ?, ?, ?)',
      [title, body, author, date, image], // Utilisez le nom du fichier image
      function (err) {
        if (err) {
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
        }
  
        res.json({ success: true });
      }
    );
  });
  





  app.get('/blogs', (req, res) => {
    db.all('SELECT * FROM blogs', (err, blogs) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      const blogsList = blogs.map(blog => {
        const comments = db.all('SELECT * FROM comments WHERE blogId = ?', [blog.id]);
        return { ...blog, comments };
      });
  
      res.json(blogsList);
    });
  });




app.get('/blogs/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM blogs WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json(row);
    });
  });
  app.get('/blogs/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM blogs WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json(row);
    });
  });
  
 
  app.put('/blogs/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, date, img, body } = req.body;
    const query = 'UPDATE blogs SET title = ?, author = ?, date = ?, img = ?, body = ? WHERE id = ?';
    db.run(query, [title, author, date, img, body, id], err => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ message: 'Blog updated successfully' });
    });
  });
  
  app.delete('/blogs/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM blogs WHERE id = ?', [id], err => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ message: 'Blog deleted successfully' });
    });
  });

  




  app.post('/comments', (req, res) => {
    const { blogId, text } = req.body;
    const query = 'INSERT INTO comments (blogId, text) VALUES (?, ?)';
    db.run(query, [blogId, text], function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json({ id: this.lastID });
    });
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
