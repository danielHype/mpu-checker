import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

// Replace with the path to a test PDF file
const testFilePath = '/Users/daniel/HeyMPU/code/pdf-chatbot/gpt4-pdf-chatbot-langchain/docs/MPU-buch-1.pdf';

const testPDFLoader = async () => {
  try {
    const loader = new PDFLoader(testFilePath);
    const document = await loader.load();
    console.log("Test PDFLoader - Document:", document);
  } catch (error) {
    console.error("Test PDFLoader - Error:", error);
  }
};

testPDFLoader();
