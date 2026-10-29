import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import MenuItemReviewIndexPage from "main/pages/MenuItemReview/MenuItemReviewIndexPage";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal()),
  toast: vi.fn((message) => mockToast(message)),
}));

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

describe("MenuItemReviewIndexPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const prefix = "MenuItemReviewTable";

  const setup = (user = apiCurrentUserFixtures.userOnly) => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();

    axiosMock.onGet("/api/currentUser").reply(200, user);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  };

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MenuItemReviewIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("admin can see Create button with empty list", async () => {
    setup(apiCurrentUserFixtures.adminUser);
    axiosMock.onGet("/api/MenuItemReview/all").reply(200, []);

    renderPage();

    const button = await screen.findByText("Create MenuItemReview");
    expect(button).toHaveAttribute("href", "/menuitemreview/create");
    expect(button).toHaveAttribute("style", "float: right;");

    expect(screen.getByText("MenuItemReviews")).toBeInTheDocument();
  });

  test("regular user sees reviews but no admin buttons", async () => {
    setup();

    axiosMock
      .onGet("/api/MenuItemReview/all")
      .reply(200, menuItemReviewFixtures.threeMenuItemReviews);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId(`${prefix}-cell-row-0-col-id`),
      ).toHaveTextContent("1");
    });

    expect(screen.getByTestId(`${prefix}-cell-row-1-col-id`)).toHaveTextContent(
      "2",
    );

    expect(screen.getByTestId(`${prefix}-cell-row-2-col-id`)).toHaveTextContent(
      "3",
    );

    expect(
      screen.getByText("Great food and excellent service!"),
    ).toBeInTheDocument();

    expect(screen.queryByText("Create MenuItemReview")).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${prefix}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${prefix}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
  });

  test("admin can edit a review", async () => {
    setup(apiCurrentUserFixtures.adminUser);

    axiosMock
      .onGet("/api/MenuItemReview/all")
      .reply(200, menuItemReviewFixtures.threeMenuItemReviews);

    renderPage();

    const editButton = await screen.findByTestId(
      `${prefix}-cell-row-0-col-Edit-button`,
    );

    expect(editButton).toBeInTheDocument();
    expect(
      screen.getByTestId(`${prefix}-cell-row-0-col-Delete-button`),
    ).toBeInTheDocument();

    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith("/menuitemreview/edit/1");
  });

  test("admin deletes a review and list refreshes", async () => {
    setup(apiCurrentUserFixtures.adminUser);

    let reviews = [...menuItemReviewFixtures.threeMenuItemReviews];

    axiosMock.onGet("/api/MenuItemReview/all").reply(() => [200, reviews]);

    axiosMock.onDelete("/api/MenuItemReview").reply((config) => {
      const id = Number(config.params.id);
      reviews = reviews.filter((review) => review.id !== id);

      return [200, { message: `record ${id} deleted` }];
    });

    renderPage();

    const deleteButton = await screen.findByTestId(
      `${prefix}-cell-row-0-col-Delete-button`,
    );

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axiosMock.history.delete.length).toBe(1);
    });

    expect(axiosMock.history.delete[0].url).toBe("/api/MenuItemReview");
    expect(axiosMock.history.delete[0].method).toBe("delete");
    expect(axiosMock.history.delete[0].params).toEqual({ id: 1 });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("record 1 deleted");
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`${prefix}-cell-row-0-col-id`),
      ).toHaveTextContent("2");
    });

    expect(
      screen.queryByText("Great food and excellent service!"),
    ).not.toBeInTheDocument();

    expect(
      axiosMock.history.get.filter(
        (request) => request.url === "/api/MenuItemReview/all",
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
