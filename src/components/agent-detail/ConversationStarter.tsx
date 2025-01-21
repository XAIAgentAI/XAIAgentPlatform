import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";

export function ConversationStarter() {
  const suggestions = [
    "Find the latest research about AI",
    "I'll provide a research paper link. Please analyze it",
    "I will upload a PDF paper! Use critical skills to read it",
    "Type 'LS' to list my built-in critical reading skills",
  ];

  return (
    <Card className="p-6 bg-[#1C1C1C]">
      <h2 className="text-lg font-semibold mb-4">Conversation starter</h2>
      <div className="grid grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="p-4 bg-[#2C2C2C] rounded-lg text-sm text-gray-300 hover:bg-[#3C3C3C] cursor-pointer transition-colors"
          >
            {suggestion}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <CustomButton 
          className="flex items-center gap-2"
        >
          <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
          Chatting
        </CustomButton>
      </div>
    </Card>
  );
} 