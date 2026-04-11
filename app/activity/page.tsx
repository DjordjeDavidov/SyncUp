import { logoutAction } from "@/actions/feed";
import { submitMeetupFeedbackAction } from "@/actions/meetup-feedback";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getActivityPageData } from "@/server/queries";

export default async function ActivityPage() {
  const currentUser = await getCurrentUserOrRedirect();
  const data = await getActivityPageData(currentUser.id);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="py-8">
          <ActivityFeed
            activities={data.activities}
            communities={data.communities}
            currentUser={currentUser}
            feedbackPrompts={data.feedbackPrompts}
            notifications={data.notifications}
            people={data.people}
            submitFeedbackAction={submitMeetupFeedbackAction}
          />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
