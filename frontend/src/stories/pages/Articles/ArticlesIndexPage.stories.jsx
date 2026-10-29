import React from "react";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { articlesFixtures } from "fixtures/articlesFixtures";
import { http, HttpResponse } from "msw";

import ArticlesIndexPage from "main/pages/Articles/ArticlesIndexPage";

export default {
  title: "pages/Articles/ArticlesIndexPage",
  component: ArticlesIndexPage,
};

const Template = () => <ArticlesIndexPage />;

const storyParameters = (currentUser, initialArticles) => {
  let articles = [...initialArticles];
  return {
    msw: {
      handlers: [
        http.get("/api/currentUser", () => {
          return HttpResponse.json(currentUser);
        }),
        http.get("/api/systemInfo", () => {
          return HttpResponse.json(systemInfoFixtures.showingNeither);
        }),
        http.get("/api/Articles/all", () => {
          return HttpResponse.json(articles);
        }),
        http.delete("/api/Articles", ({ request }) => {
          const id = Number(new URL(request.url).searchParams.get("id"));
          articles = articles.filter((article) => article.id !== id);
          return HttpResponse.json({ message: `record ${id} deleted` });
        }),
      ],
    },
  };
};

export const Empty = Template.bind({});
Empty.parameters = storyParameters(apiCurrentUserFixtures.userOnly, []);

export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.parameters = storyParameters(
  apiCurrentUserFixtures.userOnly,
  articlesFixtures.threeArticles,
);

export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.parameters = storyParameters(
  apiCurrentUserFixtures.adminUser,
  articlesFixtures.threeArticles,
);
