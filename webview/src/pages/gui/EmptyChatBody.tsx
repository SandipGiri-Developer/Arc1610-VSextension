const OnboardingCard = () => <></>;
import { ConversationStarterCards } from "../../components/ConversationStarters";


export interface EmptyChatBodyProps {
  showOnboardingCard?: boolean;
}

export function EmptyChatBody({ showOnboardingCard }: EmptyChatBodyProps) {
  if (showOnboardingCard) {
    return (
      <div className="mx-2 mt-6">
        <OnboardingCard />
      </div>
    );
  }

  return (
    <div className="mx-2 mt-2">
      <ConversationStarterCards />
    </div>
  );
}
