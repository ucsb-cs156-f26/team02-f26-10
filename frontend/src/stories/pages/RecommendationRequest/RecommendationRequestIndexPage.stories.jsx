import RecommendationRequestIndexPage from "main/pages/RecommendationRequest/RecommendationRequestIndexPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/RecommendationRequest/RecommendationRequestIndexPage",
  component: RecommendationRequestIndexPage,
};

function makeHandlers(user, initialRecords) {
  let records = [...initialRecords];
  return [
    http.get("/api/currentUser", () => HttpResponse.json(user)),
    http.get("/api/systemInfo", () =>
      HttpResponse.json(systemInfoFixtures.showingNeither),
    ),
    http.get("/api/recommendationrequests/all", () =>
      HttpResponse.json(records),
    ),
    http.delete("/api/recommendationrequests", ({ request }) => {
      const id = Number(new URL(request.url).searchParams.get("id"));
      records = records.filter((record) => record.id !== id);
      return HttpResponse.json(`RecommendationRequest with id ${id} deleted`);
    }),
  ];
}

const Template = () => <RecommendationRequestIndexPage />;
export const Empty = Template.bind({});
Empty.parameters = {
  msw: { handlers: makeHandlers(apiCurrentUserFixtures.userOnly, []) },
};

export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.parameters = {
  msw: {
    handlers: makeHandlers(
      apiCurrentUserFixtures.userOnly,
      recommendationRequestFixtures.threeRecommendationRequests,
    ),
  },
};

export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.parameters = {
  msw: {
    handlers: makeHandlers(
      apiCurrentUserFixtures.adminUser,
      recommendationRequestFixtures.threeRecommendationRequests,
    ),
  },
};
