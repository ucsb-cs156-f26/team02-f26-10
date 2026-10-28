import { fireEvent, render, screen } from "@testing-library/react";
import MenuItemReviewTable from "main/components/MenuItemReview/MenuItemReviewTable";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

describe("MenuItemReviewTable tests", () => {
  const testId = "MenuItemReviewTable";

  const fields = {
    id: "ID",
    itemId: "Item ID",
    reviewerEmail: "Reviewer Email",
    stars: "Stars",
    dateReviewed: "Date Reviewed",
    comments: "Comments",
  };

  const reviews = menuItemReviewFixtures.threeMenuItemReviews;

  const renderTable = ({
    reviewsToShow = reviews,
    currentUser = currentUserFixtures.userOnly,
    editCallback = vi.fn(),
    deleteCallback = vi.fn(),
  } = {}) => {
    render(
      <MenuItemReviewTable
        reviews={reviewsToShow}
        currentUser={currentUser}
        editCallback={editCallback}
        deleteCallback={deleteCallback}
      />,
    );
  };

  test("renders an empty table with all six headers", () => {
    renderTable({ reviewsToShow: [] });

    expect(screen.getByTestId(testId)).toBeInTheDocument();

    Object.entries(fields).forEach(([field, label]) => {
      expect(screen.getByTestId(`${testId}-header-${field}`)).toHaveTextContent(
        label,
      );

      expect(
        screen.queryByTestId(`${testId}-cell-row-0-col-${field}`),
      ).not.toBeInTheDocument();
    });
  });

  test("renders all six fields for three reviews", () => {
    renderTable();

    Object.entries(fields).forEach(([field, label]) => {
      expect(screen.getByTestId(`${testId}-header-${field}`)).toHaveTextContent(
        label,
      );
    });

    reviews.forEach((review, rowIndex) => {
      Object.keys(fields).forEach((field) => {
        expect(
          screen.getByTestId(`${testId}-cell-row-${rowIndex}-col-${field}`),
        ).toHaveTextContent(String(review[field]));
      });
    });
  });

  test("ordinary users cannot see Edit or Delete buttons", () => {
    renderTable({
      currentUser: currentUserFixtures.userOnly,
    });

    expect(
      screen.queryByTestId(`${testId}-header-Edit`),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-header-Delete`),
    ).not.toBeInTheDocument();
  });

  test("admin users see Edit and Delete buttons", () => {
    renderTable({
      currentUser: currentUserFixtures.adminUser,
    });

    const editButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Edit-button`,
    );

    const deleteButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );

    expect(editButton).toHaveTextContent("Edit");
    expect(editButton).toHaveClass("btn-primary");

    expect(deleteButton).toHaveTextContent("Delete");
    expect(deleteButton).toHaveClass("btn-danger");
  });

  test("Edit button passes the correct review to callback", () => {
    const editCallback = vi.fn();

    renderTable({
      currentUser: currentUserFixtures.adminUser,
      editCallback,
    });

    fireEvent.click(screen.getByTestId(`${testId}-cell-row-1-col-Edit-button`));

    expect(editCallback).toHaveBeenCalledOnce();
    expect(editCallback.mock.calls[0][0].row.original).toEqual(reviews[1]);
  });

  test("Delete button passes the correct review to callback", () => {
    const deleteCallback = vi.fn();

    renderTable({
      currentUser: currentUserFixtures.adminUser,
      deleteCallback,
    });

    fireEvent.click(
      screen.getByTestId(`${testId}-cell-row-2-col-Delete-button`),
    );

    expect(deleteCallback).toHaveBeenCalledOnce();
    expect(deleteCallback.mock.calls[0][0].row.original).toEqual(reviews[2]);
  });
});
