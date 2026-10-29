import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

function HelpRequestForm({
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

  return (
    <Form noValidate onSubmit={handleSubmit(submitAction)}>
      {initialContents && (
        <Form.Group className="mb-3">
          <Form.Label htmlFor="id">Id</Form.Label>
          <Form.Control
            id="id"
            data-testid="HelpRequestForm-id"
            value={initialContents.id}
            disabled
          />
        </Form.Group>
      )}
      <Form.Group className="mb-3">
        <Form.Label htmlFor="requesterEmail">Requester Email</Form.Label>
        <Form.Control
          id="requesterEmail"
          data-testid="HelpRequestForm-requesterEmail"
          type="email"
          isInvalid={Boolean(errors.requesterEmail)}
          {...register("requesterEmail", {
            required: "Requester Email is required.",
            maxLength: { value: 255, message: "Max length 255 characters" },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.requesterEmail?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="teamId">Team ID</Form.Label>
        <Form.Control
          id="teamId"
          data-testid="HelpRequestForm-teamId"
          type="text"
          isInvalid={Boolean(errors.teamId)}
          {...register("teamId", {
            required: "Team ID is required.",
            validate: (value) =>
              value.trim().length > 0 || "Team ID must not be blank.",
            maxLength: { value: 255, message: "Max length 255 characters" },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.teamId?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="tableOrBreakoutRoom">
          Table or Breakout Room
        </Form.Label>
        <Form.Control
          id="tableOrBreakoutRoom"
          data-testid="HelpRequestForm-tableOrBreakoutRoom"
          type="text"
          isInvalid={Boolean(errors.tableOrBreakoutRoom)}
          {...register("tableOrBreakoutRoom", {
            required: "Table or Breakout Room is required.",
            validate: (value) =>
              value.trim().length > 0 ||
              "Table or Breakout Room must not be blank.",
            maxLength: { value: 255, message: "Max length 255 characters" },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.tableOrBreakoutRoom?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="requestTime">Request Time</Form.Label>
        <Form.Control
          id="requestTime"
          data-testid="HelpRequestForm-requestTime"
          type="datetime-local"
          isInvalid={Boolean(errors.requestTime)}
          {...register("requestTime", {
            required: "Request Time is required.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.requestTime?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="explanation">Explanation</Form.Label>
        <Form.Control
          id="explanation"
          data-testid="HelpRequestForm-explanation"
          type="text"
          as="textarea"
          rows={3}
          isInvalid={Boolean(errors.explanation)}
          {...register("explanation", {
            required: "Explanation is required.",
            validate: (value) =>
              value.trim().length > 0 || "Explanation must not be blank.",
            maxLength: { value: 255, message: "Max length 255 characters" },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.explanation?.message}
        </Form.Control.Feedback>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Check
          id="solved"
          data-testid="HelpRequestForm-solved"
          type="checkbox"
          label="Solved"
          {...register("solved")}
        />
      </Form.Group>
      <Button type="submit" data-testid="HelpRequestForm-submit">
        {buttonLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate(-1)}
        data-testid="HelpRequestForm-cancel"
      >
        Cancel
      </Button>
    </Form>
  );
}

export default HelpRequestForm;
