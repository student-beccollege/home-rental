


const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const session = require('express-session');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));


// MongoDB connection

// Your MongoDB connection string
const uri = 'mongodb+srv://avinashkesanur:Avinash%40%23123@cluster0.4pndb.mongodb.net/houseRegistrationDB?retryWrites=true&w=majority';
const client = new MongoClient(uri);
const dbName = 'houseRegistrationDB';
mongoose.connect('mongodb://localhost:27017/houseRegistrationDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Owner schema
const ownerSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  houseImage: { type: String, required: true },
  price: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  role: { type: String, default: "Owner" },
  bhk: { type: Number, required: true },
  restrictions: {
    studentsAllowed: { type: Boolean, default: false },
    familiesAllowed: { type: Boolean, default: false }
  },
  available: { type: Boolean, default: true },
});

const Owner = mongoose.model('Owner', ownerSchema);

// Renter schema
const renterSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, default: 'renter' },
});

const Renter = mongoose.model('Renter', renterSchema);

// Renter handling
app.post('/register-renter', async (req, res) => {
  const { fname, email, phone, password, type } = req.body;

  try {
    if (!fname || !email || !phone || !password) {
      return res.status(400).send('All fields are required');
    }

    const existingRenter = await Renter.findOne({ email });
    if (existingRenter) {
      return res.status(400).send('Email already registered');
    }

    const newRenter = new Renter({
      fname,
      email,
      phone,
      password,
      type,
    });

    await newRenter.save();

    res.send(`
      <html>
        <body style="margin: 0; font-family: Arial, sans-serif; background-color: green; color: white; height: 100vh; display: flex; justify-content: center; align-items: center; text-align: center;">
          <div>
            <h2>Registration Successfull</h2>
            <p>You will be redirected to the home page shortly...</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = '/'; 
            }, 3000);
          </script>
        </body>
      </html>
    `);
    
  } catch (err) {
    console.error('Error registering renter:', err);
    res.status(500).send('Internal server error');
  }
});

// Image storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Owner registration handling
app.post('/register', upload.single('house-image'), async (req, res) => {
  try {
    const { fname, lname, phone, email, address, latitude, longitude, price, password, bhk } = req.body;

    const restrictions = {
      studentsAllowed: req.body.studentsAllowed === 'true',
      familiesAllowed: req.body.familiesAllowed === 'true',
    };

    const newOwner = new Owner({
      fname,
      lname,
      phone,
      email,
      address,
      houseImage: req.file ? req.file.path : null,
      latitude,
      longitude,
      price,
      password,
      bhk,
      restrictions,
    });

    await newOwner.save();
    res.send(`
      <html>
        <body style="margin: 0; font-family: Arial, sans-serif; background-color: green; color: white; height: 100vh; display: flex; justify-content: center; align-items: center; text-align: center;">
          <div>
            <h2>Registration Successfull</h2>
            <p>You will be redirected to the home page shortly...</p>
          </div>
          <script>
            setTimeout(() => {
              window.location.href = '/'; 
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/owner-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'O-register.html'));
  });
  const emailVerificationData = {};
  app.post('/send-code', async (req, res) => {
    const { email } = req.body;
    console.log('Email received:', email);

  
    if (!email || !email.includes('@')) {
      return res.status(400).send('Invalid email format');
    }
  
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    emailVerificationData[email] = verificationCode;
  
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Use domain, not IP
    port: 465,
    secure: true,
      auth: {
        user: 'avinashkesanur@gmail.com',
        pass: 'boqv sxtv kbud zvhc',
      },
    });
  
    const mailOptions = {
      from: '"Quick Rent Team"<avinashkesanur@gmail.com>',
      to: email,
      subject: 'Your Quick Rent Verification Code',
    text: `Hi there,

Thank you for registering with Quick Rent!

Your verification code is: ${verificationCode}

Please use this code to complete your registration. If you did not request this email, please ignore it.

Best regards,
The Quick Rent Team`,
  };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send('Verification code sent');
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to send email');
    }
  });
  
  app.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
  
    if (emailVerificationData[email] && emailVerificationData[email] == code) {
      delete emailVerificationData[email];
      res.send('Verification successful');
    } else {
      res.status(400).send('Invalid verification code');
    }
  });
// Handle login form submission
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  req.session.email = email;
  try {
    const owner = await Owner.findOne({ email });
    if (owner && owner.password === password) {
        req.session.role = 'owner';
        req.session.firstName = owner.fname;
        req.session.lastName = owner.lname;
        return res.redirect('/home');
    }

    const renter = await Renter.findOne({ email });
    if (renter && renter.password === password) {
        req.session.role = 'renter';
        req.session.firstName = renter.fname;
        req.session.lastName = renter.lname;
        return res.redirect('/home');
    }

    res.redirect('/?error=true');
  } catch (err) {
    console.error('Error during login:', err);
    return res.redirect('/');
  }
});
app.get('/signup-renter', (req, res) => {
    res.sendFile(path.join(__dirname, 'renter.html'));
  });


// Serve the home page after login
app.get('/home', (req, res) => {
  if (req.session.role && req.session.firstName) {
    const firstName = req.session.firstName; 
    const role = req.session.role;
    res.render('home', { firstName, role });
  } else {
    res.redirect('/'); 
  }
});
app.get('/owner-registration',(req,res)=>{
    res.sendFile(path.join(__dirname, 'views', 'ownerregister.html'));
  
  })

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error during session destruction:', err);
            return res.status(500).send('Could not log out. Please try again.');
        }
        res.redirect('/');
    });
});

app.get('/owners', (req, res) => {
    res.sendFile(path.join(__dirname, 'owners.html'));
  });


  app.get('/api/owners', async (req, res) => {
    try {
      const owners = await Owner.find({});
      res.json(owners);  // Sends the data as JSON
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching data');
    }
  });
  

  app.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'update.html'));
  });

  app.post('/update-availability', async (req, res) => {
    const email = req.session.email;  // Get the email from session
    
    const { available } = req.body;
  
    try {
      if (!email || available === undefined) {
        return res.status(400).send('Email and availability are required');
      }
  
      // Convert 'available' to a boolean if it's a string
      const availability = available === 'true';
  
      // Update the availability field in the Owner collection
      const updatedOwner = await Owner.findOneAndUpdate(
        { email },
        { available: availability },  // Update the availability
        { new: true }  // Return the updated document
      );
  
      if (!updatedOwner) {
        return res.status(404).send('Owner not found');
      }
  
      res.send(
        `<html>
          <body style="margin: 0; font-family: Arial, sans-serif; background-color: green; color: white; height: 100vh; display: flex; justify-content: center; align-items: center; text-align: center;">
            <div>
              <h2>Availability Updated Successfully</h2>
              <p>Owner: ${updatedOwner.fname} ${updatedOwner.lname}</p>
              <p>Availability: ${updatedOwner.available ? 'Yes' : 'No'}</p>
              <p>You will be redirected shortly...</p>
            </div>
            <script>
              setTimeout(() => {
                window.location.href = '/'; 
              }, 3000);
            </script>
          </body>
        </html>`
      );
    } catch (err) {
      console.error('Error updating availability:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
