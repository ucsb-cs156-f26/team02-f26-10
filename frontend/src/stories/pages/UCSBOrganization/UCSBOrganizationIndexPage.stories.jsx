import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";
import { http, HttpResponse } from "msw";

import UCSBOrganizationIndexPage from "main/pages/UCSBOrganization/UCSBOrganizationIndexPage";

export default {
  title: "pages/UCSBOrganization/UCSBOrganizationIndexPage",
  component: UCSBOrganizationIndexPage,
};

const Template = () => <UCSBOrganizationIndexPage />;

function makeHandlers(user, initialOrganizations) {
  let organizations = initialOrganizations.map((organization) => ({
    ...organization,
  }));

  return [
    http.get("/api/currentUser", () => HttpResponse.json(user)),
    http.get("/api/systemInfo", () =>
      HttpResponse.json(systemInfoFixtures.showingNeither),
    ),
    http.get("/api/ucsborganizations/all", () =>
      HttpResponse.json(organizations),
    ),
    http.delete("/api/ucsborganizations", ({ request }) => {
      const url = new URL(request.url);
      const orgCode = url.searchParams.get("orgCode");

      organizations = organizations.filter(
        (organization) => organization.orgCode !== orgCode,
      );

      return HttpResponse.json({
        message: `UCSBOrganization with id ${orgCode} deleted`,
      });
    }),
  ];
}

export const Empty = Template.bind({});
Empty.parameters = {
  msw: makeHandlers(apiCurrentUserFixtures.userOnly, []),
};

export const ThreeOrganizationsRegularUser = Template.bind({});
ThreeOrganizationsRegularUser.parameters = {
  msw: makeHandlers(
    apiCurrentUserFixtures.userOnly,
    ucsbOrganizationFixtures.threeOrganizations,
  ),
};

export const ThreeOrganizationsAdminUser = Template.bind({});
ThreeOrganizationsAdminUser.parameters = {
  msw: makeHandlers(
    apiCurrentUserFixtures.adminUser,
    ucsbOrganizationFixtures.threeOrganizations,
  ),
};
