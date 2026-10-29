import RecommendationRequestCreatePage from "main/pages/RecommendationRequest/RecommendationRequestCreatePage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/RecommendationRequest/RecommendationRequestCreatePage",
  component: RecommendationRequestCreatePage,
};

const Template = () => <RecommendationRequestCreatePage storybook={true} />;
const userHandlers = [
  http.get("/api/currentUser", () =>
    HttpResponse.json(apiCurrentUserFixtures.adminUser),
  ),
  http.get("/api/systemInfo", () =>
    HttpResponse.json(systemInfoFixtures.showingNeither),
  ),
];

export const Default = Template.bind({});
Default.parameters = {
  msw: {
    handlers: [
      ...userHandlers,
      http.post("/api/recommendationrequests/post", ({ request }) => {
        const params = new URL(request.url).searchParams;
        return HttpResponse.json({
          id: 1,
          requesterEmail: params.get("requesterEmail"),
          professorEmail: params.get("professorEmail"),
          explanation: params.get("explanation"),
          dateRequested: params.get("dateRequested"),
          dateNeeded: params.get("dateNeeded"),
          done: params.get("done") === "true",
        });
      }),
    ],
  },
};

export const BackendError = Template.bind({});
BackendError.parameters = {
  msw: {
    handlers: [
      ...userHandlers,
      http.post("/api/recommendationrequests/post", () =>
        HttpResponse.json(
          { message: "Unable to create RecommendationRequest" },
          { status: 500 },
        ),
      ),
    ],
  },
};
