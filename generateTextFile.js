const fs = require("fs");

// Function to generate and append orders to the text file
const generateOrderTextFile = (order) => {
    // Initialize text file content
    let textFileContent = "";

    // Append order details to text file content
    textFileContent += `${order.fullname}\n`;
    textFileContent += `${order.streetAddress}\n`;
    textFileContent += `${order.city} ${order.postalCode}\n`;

    // Check if orderItems is defined and is an object
    if (order.orderItems && typeof order.orderItems === 'object') {
        // Append each T-shirt size and its quantity (if above 0)
        Object.entries(order.orderItems).forEach(([size, quantity]) => {
            if (quantity > 0) {
                textFileContent += `\t${size}: ${quantity}\n`;
            }
        });
    } else {
        textFileContent += `\tNo items ordered.\n`;
    }

    // Add an empty line between orders
    textFileContent += "\n";

    // Append to the existing file or create a new one
    const filePath = "Orders.txt";
    
    if (fs.existsSync(filePath)) {
        // Read the existing content
        const existingContent = fs.readFileSync(filePath, "utf8");
        // Write the existing content followed by new content
        fs.writeFileSync(filePath, existingContent + textFileContent, "utf8");
    } else {
        // If the file does not exist, create it and write the new content
        fs.writeFileSync(filePath, textFileContent, "utf8");
    }
};

// Example usage
const orders = [
    {
        fullname: "John Doe",
        streetAddress: "123 Main St",
        city: "Anytown",
        postalCode: "12345",
        basketItems: [
            "Large - 1 pcs",
            "X-Large - 1 pcs"
        ],
        email: "john.doe@example.com",
        phoneNumber: "123-456-7890"
    }
];

module.exports = generateOrderTextFile;