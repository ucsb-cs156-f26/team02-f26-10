import { Navigate, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";

import UCSBOrganizationEditPage from "main/pages/UCSBOrganization/UCSBOrganizationEditPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";

export default {
  title: "pages/UCSBOrganization/UCSBOrganizationEditPage",
  component: UCSBOrganizationEditPage,
};

const Template = () => (
  <Routes>
    <Route
      path="/ucsborganization/edit/:id"
      element={<UCSBOrganizationEditPage storybook={true} />}
    />
    <Route
      path="*"
      element={<Navigate to="/ucsborganization/edit/SKY" replace />}
    />
  </Routes>
);

let organization = {
  ...ucsbOrganizationFixtures.oneOrganization,
};

export const Default = Template.bind({});

Default.parameters = {
  msw: [
    http.get("/api/currentUser", () =>
      HttpResponse.json(apiCurrentUserFixtures.adminUser),
    ),

    http.get("/api/systemInfo", () =>
      HttpResponse.json(systemInfoFixtures.showingNeither),
    ),

    http.get("/api/ucsborganizations", () => HttpResponse.json(organization)),

    http.put("/api/ucsborganizations", async ({ request }) => {
      const changes = await request.json();

      organization = {
        ...organization,
        ...changes,
      };

      return HttpResponse.json(organization);
    }),
  ],
};
