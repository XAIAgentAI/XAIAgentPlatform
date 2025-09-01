import { Metadata } from "next";
import New from "@/components/create/New";

export const metadata: Metadata = {
  title: "Edit Agent",
  description: "Edit your AI agent",
};

interface EditAgentPageProps {
  params: {
    id: string;
  };
}

export default function EditAgentPage({ params }: EditAgentPageProps) {
  return (
    <New mode="edit" agentId={params.id} />
  );
} 