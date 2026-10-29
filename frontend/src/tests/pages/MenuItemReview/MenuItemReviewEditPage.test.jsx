import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import MenuItemReviewEditPage from "main/pages/MenuItemReview/MenuItemReviewEditPage";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockToast = vi.fn();
const mockRedirect = vi.fn();
const mockBack = vi.fn();

vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal()),
  toast: vi.fn((message) => mockToast(message)),
}));

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: vi.fn(() => ({ id: "17" })),
  useNavigate: vi.fn(() => mockBack),
  Navigate: vi.fn(({ to }) => {
    mockRedirect(to);
    return null;
  }),
}));

describe("MenuItemReviewEditPage tests", () => {
  let axiosMock;

  const originalReview = {
    ...menuItemReviewFixtures.oneMenuItemReview,
    id: 17,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock = new AxiosMockAdapter(axios);

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  afterEach(() => {
    axiosMock.restore();
  });

  const setupReview = () => {
    axiosMock
      .onGet("/api/MenuItemReview", { params: { id: "17" } })
      .reply(200, originalReview);
  };

  const renderPage = (storybook = false) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MenuItemReviewEditPage {...(storybook ? { storybook: true } : {})} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("loads the existing review into the form", async () => {
    setupReview();
    renderPage();

    const idField = await screen.findByTestId("MenuItemReviewForm-id");

    expect(screen.getByText("Edit MenuItemReview")).toBeInTheDocument();

    expect(idField).toHaveValue(17);
    expect(idField).toHaveAttribute("readonly");

    expect(screen.getByTestId("MenuItemReviewForm-itemId")).toHaveValue(1);

    expect(screen.getByTestId("MenuItemReviewForm-reviewerEmail")).toHaveValue(
      "student1@example.com",
    );

    expect(screen.getByTestId("MenuItemReviewForm-stars")).toHaveValue(5);

    expect(
      screen.getByTestId("MenuItemReviewForm-dateReviewed").value,
    ).toContain("2026-10-27T15:00");

    expect(screen.getByTestId("MenuItemReviewForm-comments")).toHaveValue(
      "Great food and excellent service!",
    );

    expect(screen.getByTestId("MenuItemReviewForm-submit")).toHaveTextContent(
      "Update",
    );
  });

  test("valid changes are sent as PUT JSON and redirect", async () => {
    setupReview();

    axiosMock.onPut("/api/MenuItemReview").reply(200, {
      ...originalReview,
      stars: 4,
      comments: "Updated review",
    });

    renderPage();

    await screen.findByTestId("MenuItemReviewForm-id");

    fireEvent.change(screen.getByTestId("MenuItemReviewForm-stars"), {
      target: { value: "4" },
    });

    fireEvent.change(screen.getByTestId("MenuItemReviewForm-comments"), {
      target: { value: "Updated review" },
    });

    fireEvent.click(screen.getByTestId("MenuItemReviewForm-submit"));

    await waitFor(() => {
      expect(axiosMock.history.put).toHaveLength(1);
    });

    const request = axiosMock.history.put[0];
    const body = JSON.parse(request.data);

    expect(request.url).toBe("/api/MenuItemReview");
    expect(request.params).toEqual({ id: "17" });
    expect(body.itemId).toBe(1);
    expect(body.reviewerEmail).toBe("student1@example.com");
    expect(body.stars).toBe(4);
    expect(body.comments).toBe("Updated review");
    expect(body.dateReviewed).toMatch(/^2026-10-27T15:00/);
    expect(body).not.toHaveProperty("id");

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("MenuItemReview Updated - id: 17");
    });

    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith("/menuitemreview");
    });
  });

  test("invalid input shows errors and does not send PUT", async () => {
    setupReview();
    renderPage();

    await screen.findByTestId("MenuItemReviewForm-id");

    fireEvent.change(screen.getByTestId("MenuItemReviewForm-stars"), {
      target: { value: "9" },
    });

    fireEvent.change(screen.getByTestId("MenuItemReviewForm-reviewerEmail"), {
      target: { value: "invalid-email" },
    });

    fireEvent.click(screen.getByTestId("MenuItemReviewForm-submit"));

    expect(
      await screen.findByText("Stars cannot exceed 5."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();

    expect(axiosMock.history.put).toHaveLength(0);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  test("Cancel goes back without saving changes", async () => {
    setupReview();
    renderPage();

    await screen.findByTestId("MenuItemReviewForm-id");

    fireEvent.change(screen.getByTestId("MenuItemReviewForm-comments"), {
      target: { value: "Unsaved changes" },
    });

    fireEvent.click(screen.getByTestId("MenuItemReviewForm-cancel"));

    expect(mockBack).toHaveBeenCalledWith(-1);
    expect(axiosMock.history.put).toHaveLength(0);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  test("does not show form when no review is returned", async () => {
    axiosMock
      .onGet("/api/MenuItemReview", { params: { id: "17" } })
      .reply(200, null);

    renderPage();

    await waitFor(() => {
      expect(
        axiosMock.history.get.some(
          (request) => request.url === "/api/MenuItemReview",
        ),
      ).toBe(true);
    });

    expect(screen.getByText("Edit MenuItemReview")).toBeInTheDocument();
    expect(
      screen.queryByTestId("MenuItemReviewForm-id"),
    ).not.toBeInTheDocument();
  });

  test("storybook mode does not redirect after successful update", async () => {
    setupReview();

    axiosMock.onPut("/api/MenuItemReview").reply(200, originalReview);

    renderPage(true);

    await screen.findByTestId("MenuItemReviewForm-id");

    fireEvent.click(screen.getByTestId("MenuItemReviewForm-submit"));

    await waitFor(() => {
      expect(axiosMock.history.put).toHaveLength(1);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("MenuItemReview Updated - id: 17");
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(screen.getByTestId("MenuItemReviewForm-submit")).toBeInTheDocument();
  });
});
