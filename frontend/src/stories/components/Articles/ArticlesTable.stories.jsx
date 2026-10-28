import React from "react";
import ArticlesTable from "main/components/Articles/ArticlesTable";
import { articlesFixtures } from "fixtures/articlesFixtures";

export default {
  title: "components/Articles/ArticlesTable",
  component: ArticlesTable,
};

const Template = (args) => {
  return <ArticlesTable {...args} />;
};

export const Empty = Template.bind({});

Empty.args = {
  articles: [],
};

export const ThreeArticles = Template.bind({});

ThreeArticles.args = {
  articles: articlesFixtures.threeArticles,
};
