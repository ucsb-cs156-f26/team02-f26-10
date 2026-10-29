import HelpRequestIndexPage from "main/pages/HelpRequest/HelpRequestIndexPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "pages/HelpRequest/HelpRequestIndexPage",
  component: HelpRequestIndexPage,
};

function makeHandlers(user, initialRecords) {
  let records = [...initialRecords];
  return [
    http.get("/api/currentUser", () => HttpResponse.json(user)),
    http.get("/api/systemInfo", () =>
      HttpResponse.json(systemInfoFixtures.showingNeither),
    ),
    http.get("/api/helprequests/all", () => HttpResponse.json(records)),
    http.delete("/api/helprequests", ({ request }) => {
      const id = Number(new URL(request.url).searchParams.get("id"));
      records = records.filter((record) => record.id !== id);
      return HttpResponse.json(`HelpRequest with id ${id} deleted`);
    }),
  ];
}

const Template = () => <HelpRequestIndexPage />;
export const Empty = Template.bind({});
Empty.parameters = {
  msw: { handlers: makeHandlers(apiCurrentUserFixtures.userOnly, []) },
};

export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.parameters = {
  msw: {
    handlers: makeHandlers(
      apiCurrentUserFixtures.userOnly,
      helpRequestFixtures.threeHelpRequests,
    ),
  },
};

export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.parameters = {
  msw: {
    handlers: makeHandlers(
      apiCurrentUserFixtures.adminUser,
      helpRequestFixtures.threeHelpRequests,
    ),
  },
};
