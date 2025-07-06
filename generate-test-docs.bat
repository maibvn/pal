@echo off
echo ===============================================
echo Pal Test Documentation Generator
echo ===============================================
echo.

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo Error: Please run this script from the Pal project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Create test-documentation directory if it doesn't exist
if not exist "test-documentation" (
    echo Creating test-documentation directory...
    mkdir test-documentation
)

echo Test documentation files created in: test-documentation\
echo.
echo Available files:
echo - FAQ.md (Comprehensive FAQ in Markdown)
echo - Testing-Instructions.md (Detailed testing guide)
echo - FAQ-and-Testing-Guide.html (Combined guide, ready for PDF conversion)
echo.

REM Create sample test data files
echo Creating sample test data files...
mkdir test-documentation\sample-data 2>nul

echo Q: What is our return policy? > test-documentation\sample-data\sample-faq.txt
echo A: We offer a 30-day return policy for all items in original condition. >> test-documentation\sample-data\sample-faq.txt
echo. >> test-documentation\sample-data\sample-faq.txt
echo Q: How long does shipping take? >> test-documentation\sample-data\sample-faq.txt
echo A: Standard shipping takes 3-5 business days, expedited shipping takes 1-2 days. >> test-documentation\sample-data\sample-faq.txt
echo. >> test-documentation\sample-data\sample-faq.txt
echo Q: Do you offer international shipping? >> test-documentation\sample-data\sample-faq.txt
echo A: Yes, we ship to most countries worldwide. International shipping takes 7-14 days. >> test-documentation\sample-data\sample-faq.txt
echo. >> test-documentation\sample-data\sample-faq.txt
echo Q: What payment methods do you accept? >> test-documentation\sample-data\sample-faq.txt
echo A: We accept all major credit cards, PayPal, and bank transfers. >> test-documentation\sample-data\sample-faq.txt
echo. >> test-documentation\sample-data\sample-faq.txt
echo Q: How can I track my order? >> test-documentation\sample-data\sample-faq.txt
echo A: You will receive a tracking number via email once your order ships. >> test-documentation\sample-data\sample-faq.txt

echo About Our Company > test-documentation\sample-data\company-info.txt
echo We are a leading provider of innovative solutions since 2020. >> test-documentation\sample-data\company-info.txt
echo Our mission is to make technology accessible to everyone. >> test-documentation\sample-data\company-info.txt
echo We have offices in New York, London, and Tokyo. >> test-documentation\sample-data\company-info.txt
echo Our customer service is available 24/7. >> test-documentation\sample-data\company-info.txt
echo Contact us at support@company.com or call 1-800-555-0123. >> test-documentation\sample-data\company-info.txt

echo Product Information > test-documentation\sample-data\products-info.txt
echo. >> test-documentation\sample-data\products-info.txt
echo Premium Plan: $99/month >> test-documentation\sample-data\products-info.txt
echo - Unlimited document uploads >> test-documentation\sample-data\products-info.txt
echo - Priority customer support >> test-documentation\sample-data\products-info.txt
echo - Advanced AI features >> test-documentation\sample-data\products-info.txt
echo - Custom integrations >> test-documentation\sample-data\products-info.txt
echo. >> test-documentation\sample-data\products-info.txt
echo Standard Plan: $49/month >> test-documentation\sample-data\products-info.txt
echo - Up to 100 document uploads >> test-documentation\sample-data\products-info.txt
echo - Email support >> test-documentation\sample-data\products-info.txt
echo - Standard AI features >> test-documentation\sample-data\products-info.txt
echo. >> test-documentation\sample-data\products-info.txt
echo Basic Plan: $19/month >> test-documentation\sample-data\products-info.txt
echo - Up to 20 document uploads >> test-documentation\sample-data\products-info.txt
echo - Community support >> test-documentation\sample-data\products-info.txt
echo - Basic AI features >> test-documentation\sample-data\products-info.txt

echo ✓ Sample test data files created in: test-documentation\sample-data\
echo.

echo ===============================================
echo Next Steps:
echo ===============================================
echo.
echo 1. Convert to PDF:
echo    - Open test-documentation\FAQ-and-Testing-Guide.html in your browser
echo    - Press Ctrl+P to print
echo    - Choose "Save as PDF" as destination
echo.
echo 2. Alternative PDF conversion methods:
echo    - Use online Markdown to PDF converters for .md files
echo    - Use Microsoft Word to open and convert files
echo    - Use browser extensions for webpage to PDF conversion
echo.
echo 3. Test the application:
echo    - Use the sample data files in test-documentation\sample-data\
echo    - Follow the testing instructions in the documentation
echo    - Upload the sample files to test document processing
echo.
echo 4. Start Pal for testing:
echo    - Run: start-pal.bat (to start the application)
echo    - Open browser to: http://localhost:3000
echo    - Upload sample files and test the FAQ functionality
echo.

echo Documentation generation complete!
pause
