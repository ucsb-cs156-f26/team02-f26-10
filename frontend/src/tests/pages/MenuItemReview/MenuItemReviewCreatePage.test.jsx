import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MenuItemReviewCreatePage from "main/pages/MenuItemReview/MenuItemReviewCreatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    toast: vi.fn((message) => mockToast(message)),
  };
});

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    Navigate: vi.fn((props) => {
      mockNavigate(props);
      return null;
    }),
  };
});

describe("MenuItemReviewCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const review = {
    id: 42,
    itemId: 7,
    reviewerEmail: "student@example.com",
    stars: 5,
    dateReviewed: "2026-10-28T13:30:00",
    comments: "Excellent food!",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  const renderPage = (props = {}) => {
    const queryClient = new QueryClient();

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MenuItemReviewCreatePage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const fillValidForm = () => {
    fireEvent.change(screen.getByLabelText("Item ID"), {
      target: { value: String(review.itemId) },
    });

    fireEvent.change(screen.getByLabelText("Reviewer Email"), {
      target: { value: review.reviewerEmail },
    });

    fireEvent.change(screen.getByLabelText("Stars (1-5)"), {
      target: { value: String(review.stars) },
    });

    fireEvent.change(screen.getByLabelText("Review Date and Time"), {
      target: { value: review.dateReviewed },
    });

    fireEvent.change(screen.getByLabelText("Comments"), {
      target: { value: review.comments },
    });
  };

  test("renders the create form", () => {
    renderPage();

    expect(screen.getByText("Create New MenuItemReview")).toBeInTheDocument();

    expect(screen.getByLabelText("Item ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Reviewer Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Stars (1-5)")).toBeInTheDocument();
    expect(screen.getByLabelText("Review Date and Time")).toBeInTheDocument();
    expect(screen.getByLabelText("Comments")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();

    expect(
      screen.queryByTestId("MenuItemReviewForm-id"),
    ).not.toBeInTheDocument();
  });

  test("submits valid data and redirects to index", async () => {
    axiosMock.onPost("/api/MenuItemReview/post").reply(201, review);

    renderPage();

    fillValidForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(1);
    });

    expect(axiosMock.history.post[0].params).toEqual({
      itemId: 7,
      reviewerEmail: "student@example.com",
      stars: 5,
      dateReviewed: "2026-10-28T13:30",
      comments: "Excellent food!",
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "New MenuItemReview Created - id: 42",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/menuitemreview",
    });
  });

  test("does not submit invalid form data", async () => {
    renderPage();

    fireEvent.click(screen.getByText("Create"));

    expect(
      await screen.findByText("Reviewer Email is required."),
    ).toBeInTheDocument();

    expect(axiosMock.history.post.length).toBe(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("storybook mode does not redirect after success", async () => {
    axiosMock.onPost("/api/MenuItemReview/post").reply(201, review);

    renderPage({ storybook: true });

    fillValidForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "New MenuItemReview Created - id: 42",
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
