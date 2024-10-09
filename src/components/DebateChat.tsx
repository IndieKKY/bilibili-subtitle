import { useAppSelector } from '@/hooks/redux';
import React from 'react';

const DebateChat: React.FC<DebateProps> = ({ messages }) => {
    const fontSize = useAppSelector(state => state.env.envData.fontSize)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex mb-4 ${
              message.side === 'pro' ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-md relative ${
                message.side === 'pro'
                  ? 'bg-blue-100 text-blue-800 ml-2'
                  : 'bg-green-100 text-green-800 mr-2'
              }`}
            >
              <p className={`${fontSize === 'large' ? 'text-sm' : 'text-xs'} font-bold mb-1`}>
                {message.side === 'pro' ? '正方' : '反方'}
              </p>
              <p className={fontSize === 'large' ? 'text-sm' : 'text-xs'}>{message.content}</p>
              <div
                className={`absolute w-4 h-4 ${
                  message.side === 'pro'
                    ? 'bg-blue-100 -left-2 top-2 rounded-bl-full'
                    : 'bg-green-100 -right-2 top-2 rounded-br-full'
                }`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebateChat;