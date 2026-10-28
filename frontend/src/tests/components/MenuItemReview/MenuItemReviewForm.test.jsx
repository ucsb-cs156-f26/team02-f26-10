import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import MenuItemReviewForm from "main/components/MenuItemReview/MenuItemReviewForm";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("MenuItemReviewForm tests", () => {
  const prefix = "MenuItemReviewForm";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(
      <MemoryRouter>
        <MenuItemReviewForm submitAction={vi.fn()} {...props} />
      </MemoryRouter>,
    );
  };

  const fillValidFields = () => {
    fireEvent.change(screen.getByTestId(`${prefix}-itemId`), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-reviewerEmail`), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-stars`), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-dateReviewed`), {
      target: { value: "2026-10-27T15:00:00" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-comments`), {
      target: { value: "Great food!" },
    });
  };

  test("renders create form without ID", () => {
    renderForm();

    expect(screen.getByText("Item ID")).toBeInTheDocument();
    expect(screen.getByText("Reviewer Email")).toBeInTheDocument();
    expect(screen.getByText("Stars (1-5)")).toBeInTheDocument();
    expect(screen.getByText("Review Date and Time")).toBeInTheDocument();
    expect(screen.getByText("Comments")).toBeInTheDocument();

    expect(screen.queryByTestId(`${prefix}-id`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`${prefix}-submit`)).toHaveTextContent("Create");
    expect(screen.getByTestId(`${prefix}-dateReviewed`)).toHaveAttribute(
      "type",
      "datetime-local",
    );
  });

  test("renders update form with initial values and readonly ID", () => {
    renderForm({
      initialContents: menuItemReviewFixtures.oneMenuItemReview,
      buttonLabel: "Update",
    });

    expect(screen.getByTestId(`${prefix}-id`)).toHaveValue(1);
    expect(screen.getByTestId(`${prefix}-id`)).toHaveAttribute("readonly");

    expect(screen.getByTestId(`${prefix}-itemId`)).toHaveValue(1);
    expect(screen.getByTestId(`${prefix}-reviewerEmail`)).toHaveValue(
      "student1@example.com",
    );
    expect(screen.getByTestId(`${prefix}-stars`)).toHaveValue(5);
    expect(screen.getByTestId(`${prefix}-comments`)).toHaveValue(
      "Great food and excellent service!",
    );
    expect(screen.getByTestId(`${prefix}-submit`)).toHaveTextContent("Update");
  });

  test("shows required field validation errors", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.click(screen.getByTestId(`${prefix}-submit`));

    expect(await screen.findByText("Item ID is required.")).toBeInTheDocument();
    expect(screen.getByText("Reviewer Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Stars is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Review Date and Time is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Comments is required.")).toBeInTheDocument();

    expect(submitAction).not.toHaveBeenCalled();
  });

  test("rejects invalid item ID, email, stars, and blank comments", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fillValidFields();

    fireEvent.change(screen.getByTestId(`${prefix}-itemId`), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-reviewerEmail`), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-stars`), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-comments`), {
      target: { value: "   " },
    });

    fireEvent.click(screen.getByTestId(`${prefix}-submit`));

    expect(
      await screen.findByText("Item ID must be positive."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(screen.getByText("Stars cannot exceed 5.")).toBeInTheDocument();
    expect(screen.getByText("Comments cannot be blank.")).toBeInTheDocument();

    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each(["bad@@student@example.com", "student@example.com@@bad"])(
    "rejects email with invalid prefix or suffix: %s",
    async (email) => {
      const submitAction = vi.fn();
      renderForm({ submitAction });

      fillValidFields();

      fireEvent.change(screen.getByTestId(`${prefix}-reviewerEmail`), {
        target: { value: email },
      });

      fireEvent.click(screen.getByTestId(`${prefix}-submit`));

      expect(
        await screen.findByText("Enter a valid email address."),
      ).toBeInTheDocument();

      expect(submitAction).not.toHaveBeenCalled();
    },
  );

  test("rejects noninteger IDs and ratings", async () => {
    renderForm();
    fillValidFields();

    fireEvent.change(screen.getByTestId(`${prefix}-itemId`), {
      target: { value: "1.5" },
    });
    fireEvent.change(screen.getByTestId(`${prefix}-stars`), {
      target: { value: "2.5" },
    });

    fireEvent.click(screen.getByTestId(`${prefix}-submit`));

    expect(
      await screen.findByText("Item ID must be an integer."),
    ).toBeInTheDocument();
    expect(screen.getByText("Stars must be an integer.")).toBeInTheDocument();
  });

  test("rejects ratings below 1", async () => {
    renderForm();
    fillValidFields();

    fireEvent.change(screen.getByTestId(`${prefix}-stars`), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByTestId(`${prefix}-submit`));

    expect(
      await screen.findByText("Stars must be at least 1."),
    ).toBeInTheDocument();
  });

  test("submits valid values in create mode", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillValidFields();

    fireEvent.click(screen.getByTestId(`${prefix}-submit`));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 2,
          reviewerEmail: "student@example.com",
          stars: 4,
          dateReviewed: "2026-10-27T15:00",
          comments: "Great food!",
        }),
        expect.anything(),
      );
    });
  });

  test("submits existing review in update mode", async () => {
    const submitAction = vi.fn();
    renderForm({
      initialContents: menuItemReviewFixtures.oneMenuItemReview,
      submitAction,
      buttonLabel: "Update",
    });

    fireEvent.click(screen.getByTestId(`${prefix}-submit`));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalled();
    });

    expect(submitAction.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        id: 1,
        itemId: 1,
        reviewerEmail: "student1@example.com",
        stars: 5,
      }),
    );
  });

  test("cancel navigates back", async () => {
    renderForm();

    fireEvent.click(screen.getByTestId(`${prefix}-cancel`));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
