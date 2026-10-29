import HelpRequestCreatePage from "main/pages/HelpRequest/HelpRequestCreatePage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/HelpRequest/HelpRequestCreatePage",
  component: HelpRequestCreatePage,
};

const Template = () => <HelpRequestCreatePage storybook={true} />;
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
      http.post("/api/helprequests/post", ({ request }) => {
        const params = new URL(request.url).searchParams;
        return HttpResponse.json({
          id: 1,
          requesterEmail: params.get("requesterEmail"),
          teamId: params.get("teamId"),
          tableOrBreakoutRoom: params.get("tableOrBreakoutRoom"),
          requestTime: params.get("requestTime"),
          explanation: params.get("explanation"),
          solved: params.get("solved") === "true",
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
      http.post("/api/helprequests/post", () =>
        HttpResponse.json(
          { message: "Unable to create HelpRequest" },
          { status: 500 },
        ),
      ),
    ],
  },
};
