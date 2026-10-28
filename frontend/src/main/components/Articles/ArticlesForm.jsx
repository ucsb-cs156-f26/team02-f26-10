import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

function ArticlesForm({
    initialContents,
    submitAction,
    buttonLabel = "Create",
}) {
  // Stryker disable all
    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm({ defaultValues: initialContents || {} });
  // Stryker restore all

    const navigate = useNavigate();
    const testIdPrefix = "ArticlesForm";

  // Stryker disable Regex
    const url_regex = /^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i;
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isodate_regex =
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?$/;
  // Stryker restore Regex

    return (
    <Form noValidate onSubmit={handleSubmit(submitAction)}>
        {initialContents && (
        <Form.Group className="mb-3">
            <Form.Label htmlFor="id">Id</Form.Label>
            <Form.Control
            data-testid={testIdPrefix + "-id"}
            id="id"
            type="text"
            {...register("id")}
            value={initialContents.id}
            readOnly
            />
        </Form.Group>
        )}

        <Form.Group className="mb-3">
        <Form.Label htmlFor="title">Title</Form.Label>
        <Form.Control
            data-testid={testIdPrefix + "-title"}
            id="title"
            type="text"
            isInvalid={Boolean(errors.title)}
            {...register("title", {
            required: "Title is required.",
            maxLength: {
                value: 255,
                message: "Max length 255 characters",
            },
            pattern: {
                value: /\S/,
                message: "Title is required.",
            },
            })}
        />
        <Form.Control.Feedback type="invalid">
            {errors.title?.message}
        </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
        <Form.Label htmlFor="url">URL</Form.Label>
        <Form.Control
            data-testid={testIdPrefix + "-url"}
            id="url"
            type="url"
            isInvalid={Boolean(errors.url)}
            {...register("url", {
            required: "URL is required.",
            maxLength: {
                value: 255,
                message: "Max length 255 characters",
            },
            pattern: {
                value: url_regex,
                message: "URL must start with http:// or https:// and be valid.",
            },
            })}
        />
        <Form.Control.Feedback type="invalid">
            {errors.url?.message}
        </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
        <Form.Label htmlFor="explanation">Explanation</Form.Label>
        <Form.Control
            data-testid={testIdPrefix + "-explanation"}
            id="explanation"
            type="text"
            isInvalid={Boolean(errors.explanation)}
            {...register("explanation", {
            required: "Explanation is required.",
            maxLength: {
                value: 255,
                message: "Max length 255 characters",
            },
            pattern: {
                value: /\S/,
                message: "Explanation is required.",
            },
            })}
        />
        <Form.Control.Feedback type="invalid">
            {errors.explanation?.message}
        </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Control
            data-testid={testIdPrefix + "-email"}
            id="email"
            type="email"
            isInvalid={Boolean(errors.email)}
            {...register("email", {
            required: "Email is required.",
            maxLength: {
                value: 255,
                message: "Max length 255 characters",
            },
            pattern: {
                value: email_regex,
                message: "Email must be a valid email address.",
            },
            })}
        />
        <Form.Control.Feedback type="invalid">
            {errors.email?.message}
        </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
        <Form.Label htmlFor="dateAdded">Date Added</Form.Label>
        <Form.Control
            data-testid={testIdPrefix + "-dateAdded"}
            id="dateAdded"
            type="datetime-local"
            isInvalid={Boolean(errors.dateAdded)}
            {...register("dateAdded", {
            required: "Date Added is required.",
            pattern: {
                value: isodate_regex,
                message: "Date Added must be a valid date and time.",
            },
            })}
        />
        <Form.Control.Feedback type="invalid">
            {errors.dateAdded?.message}
        </Form.Control.Feedback>
        </Form.Group>

        <Button type="submit" data-testid={testIdPrefix + "-submit"}>
        {buttonLabel}
        </Button>
        <Button
        variant="secondary"
        onClick={() => navigate(-1)}
        data-testid={testIdPrefix + "-cancel"}
        >
        Cancel
        </Button>
    </Form>
    );
}

export default ArticlesForm;
