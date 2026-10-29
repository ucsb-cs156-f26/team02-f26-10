import React from "react";
import { Navigate, Route, Routes } from "react-router";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { articlesFixtures } from "fixtures/articlesFixtures";
import { http, HttpResponse } from "msw";

import ArticlesEditPage from "main/pages/Articles/ArticlesEditPage";

export default {
  title: "pages/Articles/ArticlesEditPage",
  component: ArticlesEditPage,
};

const Template = () => (
  <Routes>
    <Route
      path="/articles/edit/:id"
      element={<ArticlesEditPage storybook={true} />}
    />
    <Route path="*" element={<Navigate to="/articles/edit/1" replace />} />
  </Routes>
);

let article = { ...articlesFixtures.oneArticle };

export const Default = Template.bind({});
Default.parameters = {
  msw: {
    handlers: [
      http.get("/api/currentUser", () => {
        return HttpResponse.json(apiCurrentUserFixtures.adminUser);
      }),
      http.get("/api/systemInfo", () => {
        return HttpResponse.json(systemInfoFixtures.showingNeither);
      }),
      http.get("/api/Articles", () => {
        return HttpResponse.json(article);
      }),
      http.put("/api/Articles", async ({ request }) => {
        const changes = await request.json();
        article = { ...article, ...changes };
        return HttpResponse.json(article);
      }),
    ],
  },
};
