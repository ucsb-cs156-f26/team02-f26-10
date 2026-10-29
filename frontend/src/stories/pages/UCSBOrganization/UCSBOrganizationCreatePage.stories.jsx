import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

import UCSBOrganizationCreatePage from "main/pages/UCSBOrganization/UCSBOrganizationCreatePage";

export default {
  title: "pages/UCSBOrganization/UCSBOrganizationCreatePage",
  component: UCSBOrganizationCreatePage,
};

const Template = () => <UCSBOrganizationCreatePage storybook={true} />;

export const Default = Template.bind({});

Default.parameters = {
  msw: [
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.adminUser, {
        status: 200,
      });
    }),

    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither, {
        status: 200,
      });
    }),

    http.post("/api/ucsborganizations/post", ({ request }) => {
      const url = new URL(request.url);

      return HttpResponse.json(
        {
          orgCode: url.searchParams.get("orgCode"),
          orgTranslationShort: url.searchParams.get("orgTranslationShort"),
          orgTranslation: url.searchParams.get("orgTranslation"),
          inactive: url.searchParams.get("inactive") === "true",
        },
        { status: 200 },
      );
    }),
  ],
};
