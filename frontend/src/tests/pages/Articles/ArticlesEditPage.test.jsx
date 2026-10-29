import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import ArticlesEditPage from "main/pages/Articles/ArticlesEditPage";
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
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
    Navigate: vi.fn((props) => {
      mockNavigate(props);
      return null;
    }),
  };
});

describe("ArticlesEditPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const article = { ...articlesFixtures.oneArticle, id: 17 };
  const changes = {
    title: "Updated UCSB research",
    url: "https://news.ucsb.edu/",
    explanation: "An updated explanation of UCSB research.",
    email: "updated.reader@example.com",
    dateAdded: "2026-10-28T14:30",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock
      .onGet("/api/Articles", { params: { id: "17" } })
      .reply(200, article);
  });

  const renderPage = (props = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={["/articles", "/articles/edit/17"]}
          initialIndex={1}
        >
          <Routes>
            <Route
              path="/articles/edit/:id"
              element={<ArticlesEditPage {...props} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const editForm = async () => {
    await screen.findByLabelText("Title");
    for (const [field, value] of Object.entries(changes)) {
      fireEvent.change(screen.getByTestId(`ArticlesForm-${field}`), {
        target: { value },
      });
    }
  };

  test("loads the requested article and prefills all fields", async () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Edit Article" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Edit Article").parentElement).toHaveClass("pt-2");
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();

    const idField = await screen.findByLabelText("Id");
    expect(idField).toHaveValue("17");
    expect(idField).toHaveAttribute("readonly");
    for (const field of ["title", "url", "explanation", "email"]) {
      expect(screen.getByTestId(`ArticlesForm-${field}`)).toHaveValue(
        article[field],
      );
    }
    expect(screen.getByLabelText("Date Added")).toHaveValue("2026-10-21T12:00");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(
      axiosMock.history.get.find((request) => request.url === "/api/Articles")
        .params,
    ).toEqual({ id: "17" });
  });

  test("saves valid edits with the original ID and redirects to /articles", async () => {
    axiosMock.onPut("/api/Articles").reply(200, { ...changes, id: 17 });
    renderPage();
    await editForm();
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/articles" }),
    );
    expect(axiosMock.history.put).toHaveLength(1);
    expect(axiosMock.history.put[0].params).toEqual({ id: 17 });
    expect(JSON.parse(axiosMock.history.put[0].data)).toEqual(changes);
    expect(mockToast).toHaveBeenCalledWith(
      "Article Updated - id: 17 title: Updated UCSB research",
    );
  });

  test("invalid edits show errors without saving or navigating", async () => {
    renderPage();
    await editForm();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Email must be a valid email address."),
    ).toBeInTheDocument();
    expect(axiosMock.history.put).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("Cancel navigates back without saving the edits", async () => {
    renderPage();
    await editForm();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(axiosMock.history.put).toHaveLength(0);
  });

  test("does not show an editable form when the record cannot be loaded", async () => {
    axiosMock.onGet("/api/Articles", { params: { id: "17" } }).reply(404);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderPage();
      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          "Error communicating with backend via GET on /api/Articles",
        ),
      );
      expect(screen.getByText("Edit Article")).toBeInTheDocument();
      expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test("a failed save keeps the edited form visible", async () => {
    axiosMock.onPut("/api/Articles").reply(500);
    renderPage();
    await editForm();
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(mockToast).toHaveBeenCalled());
    expect(axiosMock.history.put).toHaveLength(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Title")).toHaveValue(changes.title);
  });

  test("Storybook keeps the form visible after a successful update", async () => {
    axiosMock.onPut("/api/Articles").reply(200, { ...changes, id: 17 });
    renderPage({ storybook: true });
    await editForm();
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        "Article Updated - id: 17 title: Updated UCSB research",
      ),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });
});
