import React from "react";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

import MenuItemReviewCreatePage from "main/pages/MenuItemReview/MenuItemReviewCreatePage";

export default {
  title: "pages/MenuItemReview/MenuItemReviewCreatePage",
  component: MenuItemReviewCreatePage,
};

const Template = () => <MenuItemReviewCreatePage storybook={true} />;

export const Default = Template.bind({});

Default.parameters = {
  msw: [
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.userOnly, {
        status: 200,
      });
    }),

    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither, {
        status: 200,
      });
    }),

    http.post("/api/MenuItemReview/post", () => {
      return HttpResponse.json(
        {
          id: 42,
          itemId: 7,
          reviewerEmail: "student@example.com",
          stars: 5,
          dateReviewed: "2026-10-28T13:30:00",
          comments: "Excellent food!",
        },
        { status: 201 },
      );
    }),
  ],
};
