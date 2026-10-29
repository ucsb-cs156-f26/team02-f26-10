import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import MenuItemReviewForm from "main/components/MenuItemReview/MenuItemReviewForm";

import { useParams, Navigate } from "react-router";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function MenuItemReviewEditPage({ storybook = false }) {
  const { id } = useParams();

  const { data: review } = useBackend(
    // Stryker disable next-line all : React Query caching
    [`/api/MenuItemReview?id=${id}`],
    {
      // Stryker disable next-line all : Axios defaults to GET
      method: "GET",
      url: "/api/MenuItemReview",
      params: { id },
    },
  );

  const objectToAxiosPutParams = (data) => ({
    url: "/api/MenuItemReview",
    method: "PUT",
    params: { id },
    data: {
      itemId: data.itemId,
      reviewerEmail: data.reviewerEmail,
      stars: data.stars,
      dateReviewed: data.dateReviewed,
      comments: data.comments,
    },
  });

  const onSuccess = (updatedReview) => {
    toast(`MenuItemReview Updated - id: ${updatedReview.id}`);
  };

  const mutation = useBackendMutation(
    objectToAxiosPutParams,
    { onSuccess },
    // Stryker disable next-line all : React Query caching
    [`/api/MenuItemReview?id=${id}`],
  );

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (mutation.isSuccess && !storybook) {
    return <Navigate to="/menuitemreview" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit MenuItemReview</h1>

        {review && (
          <MenuItemReviewForm
            initialContents={review}
            submitAction={onSubmit}
            buttonLabel="Update"
          />
        )}
      </div>
    </BasicLayout>
  );
}
