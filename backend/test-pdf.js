const processor = require("./src/services/documentProcessor");
const path = require("path");

async function testPdfProcessing() {
  try {
    console.log("🧪 Testing PDF processing...");

    const pdfPath = path.join(
      __dirname,
      "uploads",
      "TechFlow_Solutions_FAQ.pdf"
    );

    // Test PDF processing
    const content = await processor.processPDF(pdfPath);

    console.log("✅ PDF processed successfully!");
    console.log(`📄 Extracted content length: ${content.length} characters`);
    console.log("📝 First 200 characters:");
    console.log(content.substring(0, 200) + "...");

    // Test if it contains expected content
    if (
      content.includes("TechFlow Solutions") &&
      content.toLowerCase().includes("frequently asked questions")
    ) {
      console.log("✅ PDF content validation passed!");
      console.log("🔍 Found key terms: TechFlow Solutions, FAQ content");
    } else {
      console.log("⚠️ PDF content might be incomplete");
      console.log(
        "🔍 Contains TechFlow:",
        content.includes("TechFlow Solutions")
      );
      console.log(
        "🔍 Contains FAQ:",
        content.toLowerCase().includes("frequently asked questions")
      );
    }
  } catch (error) {
    console.error("❌ Error testing PDF processing:", error);
  }
}

testPdfProcessing();
