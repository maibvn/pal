const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function convertHtmlToPdf() {
  try {
    console.log("Starting PDF conversion...");

    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Read the HTML file
    const htmlPath = path.join(
      __dirname,
      "uploads",
      "TechFlow_Solutions_FAQ.html"
    );
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    // Set the content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfPath = path.join(
      __dirname,
      "uploads",
      "TechFlow_Solutions_FAQ.pdf"
    );
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();

    console.log(`✅ PDF created successfully: ${pdfPath}`);
    console.log(
      `📄 File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`
    );
  } catch (error) {
    console.error("❌ Error creating PDF:", error);
  }
}

// Run the conversion
convertHtmlToPdf();
