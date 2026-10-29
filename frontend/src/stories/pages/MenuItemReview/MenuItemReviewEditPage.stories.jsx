import React from "react";

import MenuItemReviewEditPage from "main/pages/MenuItemReview/MenuItemReviewEditPage";

import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import { http, HttpResponse } from "msw";

export default {
  title: "pages/MenuItemReview/MenuItemReviewEditPage",
  component: MenuItemReviewEditPage,
};

const Template = () => <MenuItemReviewEditPage storybook={true} />;

export const Default = Template.bind({});

Default.parameters = {
  msw: [
    http.get("/api/currentUser", () =>
      HttpResponse.json(apiCurrentUserFixtures.adminUser),
    ),

    http.get("/api/systemInfo", () =>
      HttpResponse.json(systemInfoFixtures.showingNeither),
    ),

    http.get("/api/MenuItemReview", () =>
      HttpResponse.json(menuItemReviewFixtures.oneMenuItemReview),
    ),

    http.put("/api/MenuItemReview", async ({ request }) => {
      const data = await request.json();

      return HttpResponse.json({
        ...menuItemReviewFixtures.oneMenuItemReview,
        ...data,
      });
    }),
  ],
};
