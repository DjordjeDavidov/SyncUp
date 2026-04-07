import { logoutAction } from "@/actions/feed";
import { ExploreGrid } from "@/components/explore/explore-grid";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getExplorePageData } from "@/server/queries";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await getCurrentUserOrRedirect();
  const resolvedSearchParams = (await searchParams) ?? {};
  const tab = typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : undefined;
  const theme = typeof resolvedSearchParams.theme === "string" ? resolvedSearchParams.theme : undefined;
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const pageValue = typeof resolvedSearchParams.page === "string" ? Number.parseInt(resolvedSearchParams.page, 10) : 1;
  const data = await getExplorePageData(currentUser.id, {
    tab,
    theme,
    query,
    page: Number.isFinite(pageValue) ? pageValue : 1,
  });

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar logoutAction={logoutAction} user={currentUser} />
        <main className="py-8">
          <ExploreGrid data={data} />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
