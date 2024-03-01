import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip } from 'react-tooltip';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(400);
  const [aiModel, setAiModel] = useState<string>('gpt-3.5-turbo');
  const [customPrompt, setCustomPrompt] =
    useState<string>('You are an MPU expert website copy writer. You only speak German and need to answer always in German. Please write a detailed article in response to the following question. The article should include an introduction, main content with detailed explanations, and a conclusion. Use the context provided as a reference.');

  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn about the MPU?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
          temperature,
          maxTokens,
          aiModel,
          customPrompt,
        }),
      });
      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <Layout>
      <div className="mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
          Chat With Your Docs
        </h1>
        <main className={styles.main}>
          <div className={styles.cloud}>
            <div ref={messageListRef} className={styles.messagelist}>
              {messages.map((message, index) => {
                let icon;
                let className;
                if (message.type === 'apiMessage') {
                  icon = (
                    <Image
                      key={index}
                      src="/bot-image.png"
                      alt="AI"
                      width="40"
                      height="40"
                      className={styles.boticon}
                      priority
                    />
                  );
                  className = styles.apimessage;
                } else {
                  icon = (
                    <Image
                      key={index}
                      src="/usericon.png"
                      alt="Me"
                      width="30"
                      height="30"
                      className={styles.usericon}
                      priority
                    />
                  );
                  // The latest message sent by the user will be animated while waiting for a response
                  className =
                    loading && index === messages.length - 1
                      ? styles.usermessagewaiting
                      : styles.usermessage;
                }
                return (
                  <>
                    <div key={`chatMessage-${index}`} className={className}>
                      {icon}
                      <div className={styles.markdownanswer}>
                        <ReactMarkdown linkTarget="_blank">
                          {message.message}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {message.sourceDocs && (
                      <div className="p-5" key={`sourceDocsAccordion-${index}`}>
                        <Accordion
                          type="single"
                          collapsible
                          className="flex-col"
                        >
                          {message.sourceDocs.map((doc, index) => (
                            <div key={`messageSourceDocs-${index}`}>
                              <AccordionItem value={`item-${index}`}>
                                <AccordionTrigger>
                                  <h3>Source {index + 1}</h3>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <ReactMarkdown linkTarget="_blank">
                                    {doc.pageContent}
                                  </ReactMarkdown>
                                  <p className="mt-2">
                                    <b>Source:</b> {doc.metadata.source}
                                  </p>
                                </AccordionContent>
                              </AccordionItem>
                            </div>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </>
                );
              })}
            </div>
          </div>
          <div className={styles.center}>
            <div className={styles.cloudform}>
              <form onSubmit={handleSubmit}>
                <textarea
                  disabled={loading}
                  // onKeyDown={handleEnter}
                  ref={textAreaRef}
                  autoFocus={false}
                  rows={1}
                  maxLength={512}
                  id="userInput"
                  name="userInput"
                  placeholder={
                    loading
                      ? 'Waiting for response...'
                      : 'Stell mir deine MPU Frage'
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.textarea}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.generatebutton}
                >
                  {loading ? (
                    <div className={styles.loadingwheel}>
                      <LoadingDots color="#000" />
                    </div>
                  ) : (
                    // Send icon SVG in input field
                    <svg
                      viewBox="0 0 20 20"
                      className={styles.svgicon}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                    </svg>
                  )}
                </button>
              </form>
              <div className="mb-8">
                <Accordion type="single" collapsible className="flex-col">
                  <AccordionItem value={`item`}>
                    <AccordionTrigger>
                      <h3>Advanced Settings </h3>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mt-4">
                        <label
                          className="block mb-2 text-sm font-medium text-gray-900"
                        >
                          Temperature - {temperature} - Increase temperature to
                          get more creative answers
                        </label>
                        <input
                          id="temperature-range"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(Number(e.target.value))}
                          className="w-full h-2 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        ></input>
                      </div>
                      <div className="mt-4">
                        <label
                          className="block mb-2 text-sm font-medium text-gray-900 "
                        >
                          Max{' '}
                          <u
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="A helpful rule of thumb is that one token generally corresponds to ~4 characters of text for common English text. This translates to roughly ¾ of a word (so 100 tokens ~= 75 words)."
                            data-tooltip-place="bottom"
                            data-tooltip-variant="info"
                            style={{ zIndex: 100 }}
                          >
                            Token
                          </u>{' '}
                          Length - {maxTokens} - Increase max tokens to allow
                          for longer article responses
                        </label>
                        <input
                          id="tokens-range"
                          type="range"
                          min="1"
                          max="4000"
                          step="1"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(Number(e.target.value))}
                          className="w-full h-2 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        ></input>
                      </div>
                      <div className="mt-4">
                        <label                         
                          className="block mb-2 text-sm font-medium text-gray-900"
                        >
                          Your Custom Input
                        </label>
                        <textarea
                          autoFocus={false}
                          rows={1}
                          maxLength={512}
                          id="userInput"
                          name="userInput"
                          placeholder={
                            loading
                              ? 'Waiting for response...'
                              : 'Add your Custom Prompt'
                          }
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className={`${styles.textareaSmall} w-full text-`}
                        ></textarea>
                      </div>
                      <div className="mt-4">
                        <label
                          className="block mb-2 text-sm font-medium text-gray-900"
                        >
                          Pick Model
                        </label>

                        <select
                          id="underline_select"
                          className="block py-2.5 px-0 w-full text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
                          onChange={(e) => setAiModel(e.target.value)}
                          value={aiModel}
                        >
                          <option value="" hidden>
                            Choose your Model
                          </option>
                          <option value="gpt-4-turbo-preview">
                            gpt-4-turbo-preview
                          </option>
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        </select>
                      </div>
                      <Tooltip id="my-tooltip" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
          {error && (
            <div className="border border-red-400 rounded-md p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
