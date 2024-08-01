require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const generateOrderDocument = require('./generatePages'); // Import the new module

const app = express();
const port = process.env.PORT || 3000;

let orders = []; // Store orders

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To handle JSON requests

// Enable CORS
app.use(cors());

// Serve static files (e.g., the HTML form)
app.use(express.static(path.join(__dirname, 'public')));

// Configure Nodemailer with custom SMTP settings
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test route
app.get('/test', (req, res) => {
    res.send('The server is up and running!');
});

// Handle form submission
app.post('/submit-order', async (req, res) => {
    const orderData = req.body;
    orders.push(orderData); // Add order to the list

    // Generate the order document
    await generateOrderDocument(orders);

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New T-Shirt Order',
        text: `
            You have a new T-Shirt order:
            
            Full Name: ${orderData.fullname}
            Street Address: ${orderData.streetAddress}
            City: ${orderData.city}
            Postal Code: ${orderData.postalCode}
            Email: ${orderData.email}
            Phone: ${orderData.phone}
            T-Shirt Size: ${orderData.tshirtsize}
            Quantity: ${orderData.quantity}
            Additional Information: ${orderData.additional_info}
        `
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Email sent:', info.response);
            res.send('Order received. Thank you!');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
