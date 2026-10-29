import { render as testingLibraryRender, screen } from "@testing-library/react";
import { articlesFixtures } from "fixtures/articlesFixtures";
import ArticlesTable from "main/components/Articles/ArticlesTable";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

const render = (component) => {
  const queryClient = new QueryClient();
  return testingLibraryRender(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ArticlesTable tests", () => {
  const expectedHeaders = [
    "Id",
    "Title",
    "URL",
    "Explanation",
    "Email",
    "Date Added",
  ];
  const expectedFields = [
    "id",
    "title",
    "url",
    "explanation",
    "email",
    "dateAdded",
  ];
  const testId = "ArticlesTable";

  test("renders an empty table with all column headers", () => {
    render(<ArticlesTable articles={[]} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`${testId}-row-0`)).not.toBeInTheDocument();
  });

  test("renders all fields for each article", () => {
    render(<ArticlesTable articles={articlesFixtures.threeArticles} />);

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });
    articlesFixtures.threeArticles.forEach((article, index) => {
      expectedFields.forEach((field) => {
        expect(
          screen.getByTestId(`${testId}-cell-row-${index}-col-${field}`),
        ).toHaveTextContent(String(article[field]));
      });
    });
  });

  test("uses a custom test ID prefix", () => {
    render(
      <ArticlesTable
        articles={[articlesFixtures.oneArticle]}
        testIdPrefix="CustomArticlesTable"
        currentUser={currentUserFixtures.adminUser}
      />,
    );

    expect(screen.getByTestId("CustomArticlesTable")).toBeInTheDocument();
    expect(
      screen.getByTestId("CustomArticlesTable-cell-row-0-col-Edit-button"),
    ).toHaveClass("btn-primary");
    expect(
      screen.getByTestId("CustomArticlesTable-cell-row-0-col-Delete-button"),
    ).toHaveClass("btn-danger");
    expect(
      screen.getByTestId("CustomArticlesTable-cell-row-0-col-title"),
    ).toHaveTextContent(articlesFixtures.oneArticle.title);
  });
});
