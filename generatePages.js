const { Document, Packer, Paragraph, TextRun, PageBreak } = require("docx");
const fs = require("fs");

const generateOrderDocument = async (orders) => {
    const doc = new Document({
        sections: [],
    });

    orders.forEach((order, index) => {
        const orderParagraphs = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${order.fullname}`,
                        bold: true,
                    }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${order.streetAddress}`,
                    }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${order.city} ${order.postalCode}`,
                    }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${order.tshirtSize} ${order.quantity}`,
                    }),
                ],
            }),
        ];

        if (index > 0) {
            orderParagraphs.unshift(new Paragraph(new PageBreak()));
        }

        doc.addSection({
            children: orderParagraphs,
        });
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync("Orders.docx", buffer);
};

module.exports = generateOrderDocument;
