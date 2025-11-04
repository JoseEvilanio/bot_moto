
import React from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-dark-blue" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.99 8.89c0-3.23-2.63-5.86-5.86-5.86s-5.86 2.63-5.86 5.86c0 1.25.4 2.4 1.08 3.34-1.42.4-2.85.86-4.22 1.48-.68 1.63-1.07 3.42-1.07 5.29H2c-1.1 0-2 .9-2 2v2h2v-2h2.06c.01-.01 0 0 0 0 .1-.63.29-1.24.54-1.81.33-.74.75-1.42 1.24-2.03.6-.72 1.3-1.35 2.08-1.87 1.43-.94 3.09-1.57 4.9-1.87.68.96 1.62 1.76 2.76 2.22 1.13.46 2.36.6 3.63.4 1.27-.2 2.44-.7 3.45-1.45.28-.2.54-.42.79-.65.25-.23.49-.47.71-.72.63-.73 1.13-1.59 1.46-2.54.34-.94.52-1.95.52-3.02zm-5.86 3.14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM20 18h2v2h-2zM4 14.12C4.01 14.07 4 14.02 4 14c0-.79.13-1.54.38-2.25.25-.71.6-1.37 1.04-1.96.44-.59.97-1.11 1.58-1.54 1.76-1.25 3.86-2.03 6.09-2.24.03.18.06.36.08.54.02.18.04.37.04.56 0 2.29-1.04 4.35-2.71 5.67-1.11.88-2.45 1.45-3.89 1.64C5.7 15.69 4.67 14.99 4 14.12z" />
    </svg>
);


const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const wrapperClasses = `flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`;
  const messageContainerClasses = `flex flex-col max-w-sm md:max-w-md lg:max-w-lg ${isUser ? 'items-end' : 'items-start'}`;
  const bubbleClasses = `px-4 py-3 rounded-2xl ${isUser ? 'bg-brand-dark-blue text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`;

  const Icon = isUser ? UserIcon : BotIcon;
  const iconContainerClasses = `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-gray-200'}`;

  const renderMessageWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={isUser ? "text-blue-300 hover:underline" : "text-blue-600 hover:underline"}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={wrapperClasses}>
      {!isUser && (
        <div className={iconContainerClasses}>
          <Icon />
        </div>
      )}
      <div className={messageContainerClasses}>
        <div className={bubbleClasses}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageWithLinks(message.text)}</p>
        </div>
      </div>
       {isUser && (
        <div className={iconContainerClasses}>
          <Icon />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
