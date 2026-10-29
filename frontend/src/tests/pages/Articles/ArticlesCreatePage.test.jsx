import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ArticlesCreatePage from "main/pages/Articles/ArticlesCreatePage";
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
  return {
    ...originalModule,
    toast: vi.fn((x) => mockToast(x)),
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    Navigate: vi.fn((x) => {
      mockNavigate(x);
      return null;
    }),
  };
});

describe("ArticlesCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const { id: _id, ...contents } = articlesFixtures.oneArticle;
  contents.dateAdded = "2026-10-21T12:00";
  const savedArticle = { ...contents, id: 7 };

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  const renderPage = (props = {}) => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/articles/create"]}>
          <ArticlesCreatePage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const fillForm = () => {
    for (const [field, value] of Object.entries(contents)) {
      fireEvent.change(screen.getByTestId(`ArticlesForm-${field}`), {
        target: { value },
      });
    }
  };

  test("renders the create form", () => {
    renderPage();

    expect(screen.getByText("Create New Article")).toBeInTheDocument();
    for (const label of [
      "Title",
      "URL",
      "Explanation",
      "Email",
      "Date Added",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
  });

  test("submits all fields to the backend and redirects to /articles", async () => {
    axiosMock.onPost("/api/Articles/post").reply(200, savedArticle);
    renderPage();
    fillForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/articles" }),
    );
    expect(axiosMock.history.post).toHaveLength(1);
    expect(axiosMock.history.post[0].params).toEqual(contents);
    expect(mockToast).toHaveBeenCalledWith(
      `New article Created - id: 7 title: ${contents.title}`,
    );
  });

  test("shows required messages without submitting or navigating", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Create"));

    for (const label of [
      "Title",
      "URL",
      "Explanation",
      "Email",
      "Date Added",
    ]) {
      expect(
        await screen.findByText(`${label} is required.`),
      ).toBeInTheDocument();
    }
    expect(axiosMock.history.post).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("invalid values prevent submission and keep the form visible", async () => {
    renderPage();
    fillForm();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByText("Create"));

    expect(
      await screen.findByText("Email must be a valid email address."),
    ).toBeInTheDocument();
    expect(axiosMock.history.post).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText("Create New Article")).toBeInTheDocument();
  });

  test("keeps the form visible when the backend rejects the request", async () => {
    axiosMock.onPost("/api/Articles/post").reply(500);
    renderPage();
    fillForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    expect(axiosMock.history.post).toHaveLength(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText("Create New Article")).toBeInTheDocument();
  });

  test("stays on the form after a successful submission in Storybook", async () => {
    axiosMock.onPost("/api/Articles/post").reply(200, savedArticle);
    renderPage({ storybook: true });
    fillForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        `New article Created - id: 7 title: ${contents.title}`,
      ),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText("Create New Article")).toBeInTheDocument();
  });
});
