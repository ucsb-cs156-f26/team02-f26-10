import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

function MenuItemReviewForm({
  initialContents,
  submitAction,
  buttonLabel = "Create",
}) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: initialContents || {},
  });

  const navigate = useNavigate();
  const testIdPrefix = "MenuItemReviewForm";

  return (
    <Form noValidate onSubmit={handleSubmit(submitAction)}>
      {initialContents && (
        <Form.Group className="mb-3">
          <Form.Label htmlFor="id">ID</Form.Label>
          <Form.Control
            id="id"
            data-testid={`${testIdPrefix}-id`}
            type="number"
            readOnly
            {...register("id")}
          />
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label htmlFor="itemId">Item ID</Form.Label>
        <Form.Control
          id="itemId"
          data-testid={`${testIdPrefix}-itemId`}
          type="number"
          min="1"
          step="1"
          isInvalid={Boolean(errors.itemId)}
          {...register("itemId", {
            required: "Item ID is required.",
            valueAsNumber: true,
            min: {
              value: 1,
              message: "Item ID must be positive.",
            },
            validate: (value) =>
              Number.isInteger(value) || "Item ID must be an integer.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.itemId?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="reviewerEmail">Reviewer Email</Form.Label>
        <Form.Control
          id="reviewerEmail"
          data-testid={`${testIdPrefix}-reviewerEmail`}
          type="email"
          isInvalid={Boolean(errors.reviewerEmail)}
          {...register("reviewerEmail", {
            required: "Reviewer Email is required.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.reviewerEmail?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="stars">Stars (1-5)</Form.Label>
        <Form.Control
          id="stars"
          data-testid={`${testIdPrefix}-stars`}
          type="number"
          min="1"
          max="5"
          step="1"
          isInvalid={Boolean(errors.stars)}
          {...register("stars", {
            required: "Stars is required.",
            valueAsNumber: true,
            min: {
              value: 1,
              message: "Stars must be at least 1.",
            },
            max: {
              value: 5,
              message: "Stars cannot exceed 5.",
            },
            validate: (value) =>
              Number.isInteger(value) || "Stars must be an integer.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.stars?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="dateReviewed">Review Date and Time</Form.Label>
        <Form.Control
          id="dateReviewed"
          data-testid={`${testIdPrefix}-dateReviewed`}
          type="datetime-local"
          step="1"
          isInvalid={Boolean(errors.dateReviewed)}
          {...register("dateReviewed", {
            required: "Review Date and Time is required.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.dateReviewed?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="comments">Comments</Form.Label>
        <Form.Control
          id="comments"
          data-testid={`${testIdPrefix}-comments`}
          as="textarea"
          rows={3}
          isInvalid={Boolean(errors.comments)}
          {...register("comments", {
            required: "Comments is required.",
            validate: (value) =>
              value.trim().length > 0 || "Comments cannot be blank.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.comments?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button type="submit" data-testid={`${testIdPrefix}-submit`}>
        {buttonLabel}
      </Button>

      <Button
        variant="secondary"
        onClick={() => navigate(-1)}
        data-testid={`${testIdPrefix}-cancel`}
      >
        Cancel
      </Button>
    </Form>
  );
}

export default MenuItemReviewForm;
