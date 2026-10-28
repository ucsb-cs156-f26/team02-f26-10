import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

function UCSBOrganizationForm({
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
  const testIdPrefix = "UCSBOrganizationForm";

  return (
    <Form onSubmit={handleSubmit(submitAction)}>
      <Form.Group className="mb-3">
        <Form.Label htmlFor="orgCode">Organization Code</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-orgCode"}
          id="orgCode"
          type="text"
          readOnly={Boolean(initialContents)}
          isInvalid={Boolean(errors.orgCode)}
          {...register("orgCode", {
            required: "Organization code is required.",
            pattern: {
              value: /\S/,
              message: "Organization code cannot be blank.",
            },
            maxLength: {
              value: 255,
              message: "Organization code must be 255 characters or fewer.",
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.orgCode?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="orgTranslationShort">Short Name</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-orgTranslationShort"}
          id="orgTranslationShort"
          type="text"
          isInvalid={Boolean(errors.orgTranslationShort)}
          {...register("orgTranslationShort", {
            required: "Short name is required.",
            pattern: {
              value: /\S/,
              message: "Short name cannot be blank.",
            },
            maxLength: {
              value: 255,
              message: "Short name must be 255 characters or fewer.",
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.orgTranslationShort?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="orgTranslation">Full Name</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-orgTranslation"}
          id="orgTranslation"
          type="text"
          isInvalid={Boolean(errors.orgTranslation)}
          {...register("orgTranslation", {
            required: "Full name is required.",
            pattern: {
              value: /\S/,
              message: "Full name cannot be blank.",
            },
            maxLength: {
              value: 255,
              message: "Full name must be 255 characters or fewer.",
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.orgTranslation?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          data-testid={testIdPrefix + "-inactive"}
          id="inactive"
          type="checkbox"
          label="Inactive"
          {...register("inactive")}
        />
      </Form.Group>

      <Button type="submit" data-testid={testIdPrefix + "-submit"}>
        {buttonLabel}
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate(-1)}
        data-testid={testIdPrefix + "-cancel"}
      >
        Cancel
      </Button>
    </Form>
  );
}

export default UCSBOrganizationForm;
