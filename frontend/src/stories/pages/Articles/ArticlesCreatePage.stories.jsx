import React from "react";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

import ArticlesCreatePage from "main/pages/Articles/ArticlesCreatePage";

export default {
  title: "pages/Articles/ArticlesCreatePage",
  component: ArticlesCreatePage,
};

const Template = () => <ArticlesCreatePage storybook={true} />;

export const Default = Template.bind({});
Default.parameters = {
  msw: {
    handlers: [
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
      http.post("/api/Articles/post", ({ request }) => {
        const params = new URL(request.url).searchParams;
        return HttpResponse.json(
          {
            id: 7,
            title: params.get("title"),
            url: params.get("url"),
            explanation: params.get("explanation"),
            email: params.get("email"),
            dateAdded: params.get("dateAdded"),
          },
          { status: 200 },
        );
      }),
    ],
  },
};
