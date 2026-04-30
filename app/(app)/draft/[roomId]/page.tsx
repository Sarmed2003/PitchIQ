import { DraftRoom } from "@/components/draft/DraftRoom";

export default async function LiveDraftPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <DraftRoom leagueId={roomId} />;
}
