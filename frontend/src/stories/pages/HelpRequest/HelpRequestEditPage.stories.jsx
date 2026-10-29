import { Navigate, Routes, Route } from "react-router";
import HelpRequestEditPage from "main/pages/HelpRequest/HelpRequestEditPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/HelpRequest/HelpRequestEditPage",
  component: HelpRequestEditPage,
};

const Template = () => (
  <Routes>
    <Route
      path="/helprequest/edit/:id"
      element={<HelpRequestEditPage storybook={true} />}
    />
    <Route path="*" element={<Navigate to="/helprequest/edit/1" replace />} />
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
function makeHandlers(solved, failUpdate = false) {
  let record = { ...helpRequestFixtures.oneHelpRequest, solved };
  return [
    ...userHandlers,
    http.get("/api/helprequests", () => HttpResponse.json(record)),
    http.put("/api/helprequests", async ({ request }) => {
      if (failUpdate)
        return HttpResponse.json(
          { message: "Unable to update HelpRequest" },
          { status: 500 },
        );
      record = { ...record, ...(await request.json()) };
      return HttpResponse.json(record);
    }),
  ];
}

export const Default = Template.bind({});
Default.parameters = { msw: { handlers: makeHandlers(false) } };

export const Solved = Template.bind({});
Solved.parameters = { msw: { handlers: makeHandlers(true) } };

export const BackendError = Template.bind({});
BackendError.parameters = { msw: { handlers: makeHandlers(false, true) } };

export const NotFound = Template.bind({});
NotFound.parameters = {
  msw: {
    handlers: [
      ...userHandlers,
      http.get("/api/helprequests", () =>
        HttpResponse.json(
          { message: "HelpRequest not found" },
          { status: 404 },
        ),
      ),
    ],
  },
};
