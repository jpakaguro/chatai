import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";

// atoms
import { chatsAtom, openAISettingsAtom } from "@/atoms/chat";

// custom hooks
import { useAuth } from "@/lib/supabase/supabase-auth-provider";
import { useSupabase } from "@/lib/supabase/supabase-provider";

// types
import { ChatWithMessageCountAndSettings } from "@/types/collections";


const useChats = () => {
  // Auth & Supabase client
  const { user } = useAuth();
  const { supabase } = useSupabase();

  // States
  const openAISettings = useAtomValue(openAISettingsAtom);
  const [chats, setChats] = useAtom(chatsAtom);

  // navigation
  const router = useRouter();

  // supabase fetcher
  const fetcher = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select(`*, messages(count)`)
      .eq("owner", user?.id) // Only get chats that belong to the user defined in RLS
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((chat) => {
      return {
        ...chat,
        advanced_settings: JSON.parse(chat.advanced_settings as string),
      };
    }) as ChatWithMessageCountAndSettings[];
  };

  // SWR Hook automatically caches the data and updates it when it changes
  const { data, error, isLoading, mutate } = useSWR(
    user ? ["chats", user.id] : null, // Only fetch if user is logged in.
    fetcher
  );

  // Add New Chat Handler
  const addChatHandler = async () => {
    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({
        owner: user?.id,
        model: openAISettings.model,
        system_prompt: openAISettings.system_prompt,
        advanced_settings: JSON.stringify(openAISettings.advanced_settings),
        history_type: openAISettings.history_type,
        title: "New Conversation",
      })
      .select(`*`)
      .returns<ChatWithMessageCountAndSettings[]>()
      .single();

    if (error && !newChat) {
      console.log(error);
      return;
    }

    // mutate the state when we add a new chat, because we need to add the new chat to the list on the left sidebar
    // Add it to the top of the list
    mutate((prev: any) => {
      if (prev && prev.length > 0) {
        return [newChat, ...prev];
      } else {
        return [newChat];
      }
    });

    // Redirect to the new chat
    router.push(`/chat/${newChat.id}?new=true`);  // we add the new=true query param so that we know if it's a new chat or not
  };

  // Set Chats if we have data
  useEffect(() => {
    setChats(data ?? []);
  }, [data, setChats]);

  return {
    chats,
    isLoading,
    error,
    mutate,
    addChatHandler,
  };
};

export default useChats;
