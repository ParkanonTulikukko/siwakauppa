require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const generateOrderDocument = require('./generatePages');
const generateOrderTextFile = require('./generateTextFile');

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
    //await generateOrderDocument(orders);
    generateOrderTextFile(orders);

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New T-Shirt Order',
        html: `
        <p>You have a new T-Shirt order:</p><br/>
        <strong>Full Name:</strong> ${orderData.fullname} <br/>  
        <strong>Street Address:</strong> ${orderData.streetAddress} <br/>
        <strong>City & Postal Code:</strong> ${orderData.city}, ${orderData.postalCode} <br/>
        <strong>Email:</strong> ${orderData.email} <br/>     
        <strong>Phone Number:</strong> ${orderData.phoneNumber} <br/> 
        <strong>Basket Items:</strong>  
        <ul>
            ${orderData.basketItems.map(item => `<li><strong>${item}</strong></li>`).join('')}
        </ul>
        <p><strong>Additional Information:</strong> ${orderData.additionalInfo}</p>
    `
    };

    // Send email
    /*
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Email sent:', info.response);
            res.send('Order received. Thank you!');
        }
    });*/
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
