require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
//const generateOrderTextFile = require('./generateTextFile');
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

const kuukausi = '09';

//console.log(path.resolve('public'));

// Määrittele päivämäärät ja ajat
const startDate = new Date('2024-' + kuukausi + '-03T10:00:00');
const endDate = new Date('2024-' + kuukausi + '-05T12:00:00');

// Määritellään päivämäärän ja ajan näyttö suomalaisessa muodossa
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
const formattedStartDate = new Intl.DateTimeFormat('fi-FI', options).format(startDate);

// Middleware tarkistaa päivämäärän ja ajan ja vastaa oikealla sivulla
// Middleware to handle requests
app.get(['/'], (req, res) => {
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
                <p>Ennakkomyynti alkaa ${formattedStartDate}. Pysy linjoilla!</p>
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

app.get('/api/mode', (req, res) => {
    res.json({ mode: process.env.NODE_ENV });
});


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

// Function to send confirmation email to the customer
function sendConfirmationEmail(customerEmail, orderDetails) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: 'SIWAPAIDAN TILAUSVAHVISTUS',
        html: `
        <p>Moro,</p>
        <p>Siwapaitatilauksesi tuli perille!</p>
        <p>Tässä yhteenveto:</p>
        <ul>
            <li><strong>Nimi:</strong> ${orderDetails.fullname}</li>
            <li><strong>Osoite:</strong> ${orderDetails.streetAddress}</li>
            <li><strong>Kaupunki ja postinumero:</strong> ${orderDetails.city} ${orderDetails.postalCode}</li>
            <li><strong>Sähköposti:</strong> ${orderDetails.email}</li>
            <li><strong>Puhelinnumero:</strong> ${orderDetails.phoneNumber}</li>
            <li><strong>Tilaus:</strong></li>
            <ul>
                ${Object.entries(orderDetails.orderItems).map(([size, quantity]) => 
                    quantity > 0 ? `<li>${size}: ${quantity}</li>` : ''
                ).join('')}
            </ul>
            <li><strong>T-paitojen hinta:</strong> ${orderDetails.totalTshirtPrice} EUR</li>
            <li><strong>Postikulut:</strong> ${orderDetails.totalPostage} EUR</li>
            <li><strong>Kokonaishinta:</strong> ${orderDetails.totalPrice} EUR</li>
            <li><strong>Lisätiedot:</strong> ${orderDetails.additionalInfo}</li>
        </ul>
        <p><strong>MAKSUOHJEET</strong></p>
        <p><strong>Tilisiirrolla</strong> tilinumeroon FI77 1685 2932 9583 13 / Heikki Kuivala<br/>
        Viestiksi siwapaitatilaus.</p>
        <p><strong>Tai</strong></p>
        <p><strong>MobilePaylla</strong>: 040-7702181 / Heikki Juhani Kuivala<br/>
        Viestiksi siwapaitatilaus.</p>
        <p>Kun olet maksanut, niin laitathan tähän <strong>sähköpostiin kuvankaappauksen maksusta</strong> tai maksun ajankohdan, niin olet mukana ennakkotilauksessa!</p>
        <p>Terveisin,<br/>
        Heikki Kuivala<br/>
        heikki.kuivala@parkanontulikukko.fi<br/>
        Tmi Maisteri Kuivala<br/>
        y-tunnus: 3405845-4</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending confirmation email:', error);
        } else {
            console.log('Confirmation email sent:', info.response);
        }
    });
}

// Handle form submission
app.post('/submit-order', async (req, res) => {
    const orderData = req.body;

    //generateOrderTextFile(orderData);

    // Email content
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New T-Shirt Order',
        html: `
        <p>You have a new T-Shirt order:</p><br/>
        <strong>Full Name:</strong> ${orderData.fullname} <br/>  
        <strong>Street Address:</strong> ${orderData.streetAddress} <br/>
        <strong>City & Postal Code:</strong> ${orderData.city} ${orderData.postalCode} <br/>
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

            // Send confirmation email to customer
            sendConfirmationEmail(orderData.email, orderData);

            res.send('Order received. Thank you!');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`App running in ${process.env.NODE_ENV} mode`);
});
