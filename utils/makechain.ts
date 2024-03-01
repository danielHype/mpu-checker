import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatPromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import type { Document } from 'langchain/document';
import type { VectorStoreRetriever } from 'langchain/vectorstores/base';

const CONDENSE_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

<chat_history>
  {chat_history}
</chat_history>

Follow Up Input: {question}
Standalone question:`;

// const QA_TEMPLATE = `You are an MPU expert, counseling already hunderts of people to make them pass their MPU. You only speak German and need to answer always in German. Please write a detailed answer in response to the following question. If suited, make marketing for HeyMPU.de, providing counseling for MPU attendees and having the best-in-class psychology consultants. Use the context provided as a reference. Use 10 sentences max.
const QA_TEMPLATE = `You are an MPU expert website copy writer. You only speak German and need to answer always in German. Please write a detailed article in response to the following question. The article should include an introduction, main content with detailed explanations, and a conclusion. Use the context provided as a reference.

<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

Question: {question}
Detailed article response:`;

const composeQA_Template = (customBackgroundPrompt?: string): string => {

  const prompt = customBackgroundPrompt ? `${customBackgroundPrompt} You only speak German and need to answer always in German. Use the context provided as a reference. ` : `You are an MPU expert website copy writer. You only speak German and need to answer always in German. Please write a detailed article in response to the following question. The article should include an introduction, main content with detailed explanations, and a conclusion. Use the context provided as a reference.`;

  return ` 
  ${prompt}

  <context>
    {context}
  </context>
  
  <chat_history>
    {chat_history}
  </chat_history>
  
  Question: {question}
  Detailed article response:`;
}



const combineDocumentsFn = (docs: Document[], separator = '\n\n') => {
  const serializedDocs = docs.map((doc) => doc.pageContent);
  return serializedDocs.join(separator);
};

export const makeChain = (retriever: VectorStoreRetriever, customTemperature?: number, customModeName?: string, customMaxTokens?: number, customBackgroundPrompt?: string) => {
  const condenseQuestionPrompt =
    ChatPromptTemplate.fromTemplate(CONDENSE_TEMPLATE);
  const answerPrompt = ChatPromptTemplate.fromTemplate(composeQA_Template(customBackgroundPrompt));


  const model = new ChatOpenAI({
    temperature: customTemperature ?? 0.7, // increase temperature to get more creative answers
    modelName: customModeName ?? 'gpt-4-turbo-preview', //change this to gpt-4 if you have access
    maxTokens: customMaxTokens ?? 2048, // Increase max tokens to allow for longer article responses
  });

  // Rephrase the initial question into a dereferenced standalone question based on
  // the chat history to allow effective vectorstore querying.
  const standaloneQuestionChain = RunnableSequence.from([
    
    condenseQuestionPrompt,
    model,
    new StringOutputParser(),
  ]);

  // Retrieve documents based on a query, then format them.
  const retrievalChain = retriever.pipe(combineDocumentsFn);

  // Generate an answer to the standalone question based on the chat history
  // and retrieved documents. Additionally, we return the source documents directly.
  const answerChain = RunnableSequence.from([
    {
      context: RunnableSequence.from([
        (input) => input.question,
        retrievalChain,
      ]),
      chat_history: (input) => input.chat_history,
      question: (input) => input.question,
    },
    answerPrompt,
    model,
    new StringOutputParser(),
  ]);

  // First generate a standalone question, then answer it based on
  // chat history and retrieved context documents.
  const conversationalRetrievalQAChain = RunnableSequence.from([
    {
      question: standaloneQuestionChain,
      chat_history: (input) => input.chat_history,
    },
    answerChain,
  ]);

  return conversationalRetrievalQAChain;
};
