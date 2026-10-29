import { Navigate, Routes, Route } from "react-router";
import RecommendationRequestEditPage from "main/pages/RecommendationRequest/RecommendationRequestEditPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/RecommendationRequest/RecommendationRequestEditPage",
  component: RecommendationRequestEditPage,
};

const Template = () => (
  <Routes>
    <Route
      path="/recommendationrequest/edit/:id"
      element={<RecommendationRequestEditPage storybook={true} />}
    />
    <Route
      path="*"
      element={<Navigate to="/recommendationrequest/edit/1" replace />}
    />
  </Routes>
);
const userHandlers = [
  http.get("/api/currentUser", () =>
    HttpResponse.json(apiCurrentUserFixtures.adminUser),
  ),
  http.get("/api/systemInfo", () =>
    HttpResponse.json(systemInfoFixtures.showingNeither),
  ),
];
function makeHandlers(done, failUpdate = false) {
  let record = {
    ...recommendationRequestFixtures.oneRecommendationRequest,
    done,
  };
  return [
    ...userHandlers,
    http.get("/api/recommendationrequests", () => HttpResponse.json(record)),
    http.put("/api/recommendationrequests", async ({ request }) => {
      if (failUpdate)
        return HttpResponse.json(
          { message: "Unable to update RecommendationRequest" },
          { status: 500 },
        );
      record = { ...record, ...(await request.json()) };
      return HttpResponse.json(record);
    }),
  ];
}

export const Default = Template.bind({});
Default.parameters = { msw: { handlers: makeHandlers(false) } };

export const Done = Template.bind({});
Done.parameters = { msw: { handlers: makeHandlers(true) } };

export const BackendError = Template.bind({});
BackendError.parameters = { msw: { handlers: makeHandlers(false, true) } };

export const NotFound = Template.bind({});
NotFound.parameters = {
  msw: {
    handlers: [
      ...userHandlers,
      http.get("/api/recommendationrequests", () =>
        HttpResponse.json(
          { message: "RecommendationRequest not found" },
          { status: 404 },
        ),
      ),
    ],
  },
};
