require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const generateOrderTextFile = require('./generateTextFile');
const res = require('express/lib/response');

const app = express();
const port = process.env.PORT || 3000;

let orders = []; // Store orders

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // To handle JSON requests
// Serve static files from the 'public' directory
//

// Enable CORS
app.use(cors());

const kuukausi = '08';

//console.log(path.resolve('public'));

// Määrittele päivämäärät ja ajat
const startDate = new Date('2024-' + kuukausi + '-10T10:00:00');
const endDate = new Date('2024-' + kuukausi + '-20T18:00:00');

// Määritellään päivämäärän ja ajan näyttö suomalaisessa muodossa
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
const formattedStartDate = new Intl.DateTimeFormat('fi-FI', options).format(startDate);

// Middleware tarkistaa päivämäärän ja ajan ja vastaa oikealla sivulla
// Middleware to handle requests
// Middleware to handle both "/" and "/siwakauppa" requests
app.get(['/', '/siwakauppa'], (req, res) => {
    const currentDate = new Date();

    // Date checks
    if (currentDate < startDate) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="fi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ennakkomyynti alkamassa</title>
            </head>
            <body>
                <h1>"Tekis mieli ryöstää Siwa" -t-paitojen ennakkomyynti alkaa pian!</h1>
                <p>Ennakkomyynti alkaa ${formattedStartDate}. Pysy kuulolla!</p>
            </body>
            </html>
        `);
    }

    if (currentDate > endDate) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="fi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ennakkomyynti päättynyt</title>
            </head>
            <body>
                <h1>Ennakkomyynti päättynyt</h1>
                <p>"Tekis mieli ryöstää Siwa" -t-paitojen ennakkotilaus on täynnä tai päättynyt. </p>
            </body>
            </html>
        `);
    }

    // If the date is within the start and end date, serve the main content
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

/*
app.get('/', (req, res) => {
    console.log("index");
    res.redirect('/siwakauppa');
});
*/

// Serve static files (e.g., the HTML form)
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.resolve('public')));
//app.use(express.static(path.join(process.cwd(), 'public')));
/*
app.get('/siwakauppa', (req, res) => {
    const currentDate = new Date();
    console.log("currentDate");
    console.log(currentDate);
    console.log("startDate");
    console.log(startDate);
    console.log(currentDate < startDate);
    if (currentDate < startDate) {
        // HTML-vastaus ennen ennakkomyyntikautta
        return res.send(`
            <!DOCTYPE html>
            <html lang="fi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ennakkomyynti alkamassa</title>
            </head>
            <body>
                <h1>"Tekis mieli ryöstää Siwa" -t-paitojen ennakkomyynti alkaa pian!</h1>
                <p>Ennakkomyynti alkaa ${formattedStartDate}. Pysy kuulolla!</p>
            </body>
            </html>
        `);
    } 
    else if (currentDate > endDate) {
        // HTML-vastaus ennakkomyyntikauden jälkeen
        return res.send(`
            <!DOCTYPE html>
            <html lang="fi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ennakkomyynti päättynyt</title>
            </head>
            <body>
                <h1>Ennakkomyynti päättynyt</h1>
                <p>"Tekis mieli ryöstää Siwa" -t-paitojen ennakkotilaus on täynnä tai päättynyt. </p>
            </body>
            </html>
        `);
    } 
    else if (currentDate > startDate && currentDate < endDate) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }   
})
    */

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

app.get('/thank-you', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank You</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                }
                .thank-you-message {
                    text-align: center;
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
            </style>
        </head>
        <body>
            <div class="thank-you-message">
                <h1>Kiitos tilauksestasi!</h1>
                <p>Saat maksuohjeet sähköpostitse.</p>
            </div>
        </body>
        </html>
    `);
});


// Handle form submission
app.post('/submit-order', async (req, res) => {
    const orderData = req.body;

    generateOrderTextFile(orderData);

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
            ${Object.entries(orderData.orderItems).map(([size, quantity]) => 
                quantity > 0 ? `<li>${size}: ${quantity}</li>` : ''
            ).join('')}
        </ul>
        <strong>Total Price:</strong> ${orderData.totalPrice} EUR <br/>
        <p><strong>Additional Information:</strong> ${orderData.additionalInfo}</p>
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
