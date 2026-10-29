import { useNavigate } from "react-router";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import MenuItemReviewTable from "main/components/MenuItemReview/MenuItemReviewTable";
import { useCurrentUser, hasRole } from "main/utils/useCurrentUser";
import { useBackend, useBackendMutation } from "main/utils/useBackend";

export default function MenuItemReviewIndexPage() {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  const { data: reviews } = useBackend(
    // Stryker disable next-line all : don't test React Query caching
    ["/api/MenuItemReview/all"],
    {
      // Stryker disable next-line StringLiteral: Axios defaults to GET for an empty method
      method: "GET",
      url: "/api/MenuItemReview/all",
    },
    // Stryker disable next-line all : default empty list
    [],
  );

  const objectToAxiosParams = (review) => ({
    url: "/api/MenuItemReview",
    method: "DELETE",
    params: { id: review.id },
  });

  const onDeleteSuccess = (result) => {
    toast(result.message);
  };

  const deleteMutation = useBackendMutation(
    objectToAxiosParams,
    { onSuccess: onDeleteSuccess },
    // Stryker disable next-line all : don't test React Query caching
    ["/api/MenuItemReview/all"],
  );

  const editCallback = (cell) => {
    navigate(`/menuitemreview/edit/${cell.row.original.id}`);
  };

  const deleteCallback = (cell) => {
    deleteMutation.mutate(cell.row.original);
  };

  return (
    <BasicLayout>
      <div className="pt-2">
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <Button
            variant="primary"
            href="/menuitemreview/create"
            style={{ float: "right" }}
          >
            Create MenuItemReview
          </Button>
        )}

        <h1>MenuItemReviews</h1>

        <MenuItemReviewTable
          reviews={reviews}
          currentUser={currentUser}
          editCallback={editCallback}
          deleteCallback={deleteCallback}
        />
      </div>
    </BasicLayout>
  );
}
