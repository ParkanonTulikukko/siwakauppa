const { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel, Alignment } = require("docx");
const fs = require("fs");

const generateOrderDocument = async (orders) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: []
            }
        ]
    });

    const FONT_SIZE = 12;

    const addOrderToDocument = (order, isNewPage = false) => {
        const orderParagraphs = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: order.fullname,
                        size: FONT_SIZE * 2,  // 12 pt font size
                    }),
                ],
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: order.streetAddress,
                        size: FONT_SIZE * 2,
                    }),
                ],
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${order.city} ${order.postalCode}`,
                        size: FONT_SIZE * 2,
                    }),
                ],
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: order.sizes.map(size => 
                    new TextRun({
                        text: `${size.size} ${size.quantity}`,
                        size: FONT_SIZE * 2,
                        italics: true,
                    })
                ),
                spacing: { after: 200 },
            })
        ];

        if (isNewPage) {
            doc.addSection({
                properties: {},
                children: [new Paragraph({ children: [new PageBreak()] })]
            });
        }

        doc.addSection({
            properties: {},
            children: orderParagraphs
        });
    };

    let currentPageContentHeight = 0;
    const PAGE_HEIGHT_LIMIT = 1000;  // Arbitrary page height limit; adjust as needed

    orders.forEach((order, index) => {
        // Calculate content height for the current order
        const estimatedOrderHeight = 400;  // Rough estimate of the height of one order
        
        if (currentPageContentHeight + estimatedOrderHeight > PAGE_HEIGHT_LIMIT) {
            // Add a new page if needed
            addOrderToDocument(order, true);
            currentPageContentHeight = estimatedOrderHeight;  // Reset content height
        } else {
            addOrderToDocument(order);
            currentPageContentHeight += estimatedOrderHeight;  // Increment content height
        }
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync("Orders.docx", buffer);
};

module.exports = generateOrderDocument;
