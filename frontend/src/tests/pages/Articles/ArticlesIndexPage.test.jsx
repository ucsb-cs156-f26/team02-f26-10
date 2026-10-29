import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ArticlesIndexPage from "main/pages/Articles/ArticlesIndexPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { articlesFixtures } from "fixtures/articlesFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockToast = vi.fn();
vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return { ...originalModule, toast: vi.fn((x) => mockToast(x)) };
});

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return { ...originalModule, useNavigate: () => mockNavigate };
});

describe("ArticlesIndexPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const articles = articlesFixtures.threeArticles;

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  const renderPage = (user = apiCurrentUserFixtures.adminUser) => {
    axiosMock.onGet("/api/currentUser").reply(200, user);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/articles"]}>
          <ArticlesIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("shows all article fields and no actions for regular users", async () => {
    axiosMock.onGet("/api/Articles/all").reply(200, articles);
    renderPage(apiCurrentUserFixtures.userOnly);

    await screen.findByText(articles[0].title);
    for (const [index, article] of articles.entries()) {
      for (const [field, value] of Object.entries(article)) {
        expect(
          screen.getByTestId(`ArticlesTable-cell-row-${index}-col-${field}`),
        ).toHaveTextContent(String(value));
      }
    }
    expect(screen.queryByText("Create Article")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  test("shows create, edit and delete controls for admins", async () => {
    axiosMock.onGet("/api/Articles/all").reply(200, articles);
    renderPage();

    const createButton = await screen.findByText("Create Article");
    expect(createButton).toHaveAttribute("href", "/articles/create");
    expect(createButton).toHaveClass("btn-primary");
    expect(createButton).toHaveStyle({ float: "right" });
    await screen.findByText(articles[0].title);
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
    expect(
      screen.getByTestId("ArticlesTable-cell-row-0-col-Edit-button"),
    ).toHaveClass("btn-primary");
    expect(
      screen.getByTestId("ArticlesTable-cell-row-0-col-Delete-button"),
    ).toHaveClass("btn-danger");
    expect(
      screen.getByRole("heading", { name: "Articles" }),
    ).toBeInTheDocument();
  });

  test("edit navigates to the selected article", async () => {
    axiosMock.onGet("/api/Articles/all").reply(200, articles);
    renderPage();

    fireEvent.click(
      await screen.findByTestId("ArticlesTable-cell-row-1-col-Edit-button"),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      `/articles/edit/${articles[1].id}`,
    );
  });

  test("deletes the selected article and reloads the remaining rows", async () => {
    let remaining = [...articles];
    axiosMock.onGet("/api/Articles/all").reply(() => [200, remaining]);
    axiosMock.onDelete("/api/Articles").reply((config) => {
      remaining = remaining.filter(
        (article) => article.id !== config.params.id,
      );
      return [200, { message: `record ${config.params.id} deleted` }];
    });
    renderPage();

    fireEvent.click(
      await screen.findByTestId("ArticlesTable-cell-row-1-col-Delete-button"),
    );

    await waitFor(() =>
      expect(screen.queryByText(articles[1].title)).not.toBeInTheDocument(),
    );
    expect(axiosMock.history.delete).toHaveLength(1);
    expect(axiosMock.history.delete[0].params).toEqual({ id: articles[1].id });
    expect(mockToast).toHaveBeenCalledWith(`record ${articles[1].id} deleted`);
    expect(screen.getByText(articles[0].title)).toBeInTheDocument();
    expect(screen.getByText(articles[2].title)).toBeInTheDocument();
  });

  test("renders an empty table when the API fails", async () => {
    axiosMock.onGet("/api/Articles/all").reply(500);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderPage(apiCurrentUserFixtures.userOnly);
      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          "Error communicating with backend via GET on /api/Articles/all",
        ),
      );
      expect(screen.getByTestId("ArticlesTable")).toBeInTheDocument();
      expect(
        screen.queryByTestId("ArticlesTable-row-0"),
      ).not.toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
