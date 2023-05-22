"use client";

import { useAtomValue } from "jotai";
import Message from "./message";

// chat atoms
import { chatboxRefAtom, messagesAtom } from "@/atoms/chat";

// types
import { ChatWithMessageCountAndSettings, MessageT } from "@/types/collections";

// custom hooks
import useChat from "@/hooks/useChat";

const Messages = () => {
  const containerRef = useAtomValue(chatboxRefAtom);  // to auto scroll to bottom when streaming new messages
  const messages = useAtomValue(messagesAtom);

  return (
    <div ref={containerRef} className="h-full overflow-y-scroll">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
};

export default Messages;
