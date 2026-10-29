import React from "react";

import MenuItemReviewIndexPage from "main/pages/MenuItemReview/MenuItemReviewIndexPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";

import { http, HttpResponse } from "msw";

export default {
  title: "pages/MenuItemReview/MenuItemReviewIndexPage",
  component: MenuItemReviewIndexPage,
};

const Template = () => <MenuItemReviewIndexPage />;

const systemInfoHandler = http.get("/api/systemInfo", () =>
  HttpResponse.json(systemInfoFixtures.showingNeither),
);

export const Empty = Template.bind({});

Empty.parameters = {
  msw: [
    http.get("/api/currentUser", () =>
      HttpResponse.json(apiCurrentUserFixtures.userOnly),
    ),
    systemInfoHandler,
    http.get("/api/MenuItemReview/all", () => HttpResponse.json([])),
  ],
};

export const ThreeItemsOrdinaryUser = Template.bind({});

ThreeItemsOrdinaryUser.parameters = {
  msw: [
    http.get("/api/currentUser", () =>
      HttpResponse.json(apiCurrentUserFixtures.userOnly),
    ),
    systemInfoHandler,
    http.get("/api/MenuItemReview/all", () =>
      HttpResponse.json(menuItemReviewFixtures.threeMenuItemReviews),
    ),
  ],
};

let adminReviews = [...menuItemReviewFixtures.threeMenuItemReviews];

export const ThreeItemsAdminUser = Template.bind({});

ThreeItemsAdminUser.parameters = {
  msw: [
    http.get("/api/currentUser", () =>
      HttpResponse.json(apiCurrentUserFixtures.adminUser),
    ),
    systemInfoHandler,
    http.get("/api/MenuItemReview/all", () => HttpResponse.json(adminReviews)),
    http.delete("/api/MenuItemReview", ({ request }) => {
      const url = new URL(request.url);
      const id = Number(url.searchParams.get("id"));

      adminReviews = adminReviews.filter((review) => review.id !== id);

      return HttpResponse.json({
        message: `record ${id} deleted`,
      });
    }),
  ],
};
