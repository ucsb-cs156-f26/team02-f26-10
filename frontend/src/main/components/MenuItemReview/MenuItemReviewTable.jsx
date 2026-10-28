import OurTable, { ButtonColumn } from "main/components/OurTable";
import { hasRole } from "main/utils/useCurrentUser";

export default function MenuItemReviewTable({
  reviews,
  currentUser,
  editCallback,
  deleteCallback,
}) {
  const testIdPrefix = "MenuItemReviewTable";

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Item ID",
      accessorKey: "itemId",
    },
    {
      header: "Reviewer Email",
      accessorKey: "reviewerEmail",
    },
    {
      header: "Stars",
      accessorKey: "stars",
    },
    {
      header: "Date Reviewed",
      accessorKey: "dateReviewed",
    },
    {
      header: "Comments",
      accessorKey: "comments",
    },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(ButtonColumn("Edit", "primary", editCallback, testIdPrefix));

    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, testIdPrefix),
    );
  }

  return <OurTable data={reviews} columns={columns} testid={testIdPrefix} />;
}
