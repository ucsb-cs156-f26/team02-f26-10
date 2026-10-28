import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router";

import ArticlesForm from "main/components/Articles/ArticlesForm";
import { articlesFixtures } from "fixtures/articlesFixtures";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("ArticlesForm tests", () => {
  const article = articlesFixtures.oneArticle;
  const testId = "ArticlesForm";
  const expectedLabels = ["Title", "URL", "Explanation", "Email", "Date Added"];

  test("renders empty fields and a Create button without initialContents", () => {
    render(
      <Router>
        <ArticlesForm />
      </Router>,
    );

    expectedLabels.forEach((label) => {
      expect(screen.getByLabelText(label)).toHaveValue("");
    });
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.queryByTestId(`${testId}-id`)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Date Added")).toHaveAttribute(
      "type",
      "datetime-local",
    );
  });

  test("prefills every field and displays a read-only ID when editing", () => {
    render(
      <Router>
        <ArticlesForm initialContents={article} buttonLabel="Update" />
      </Router>,
    );

    expect(screen.getByLabelText("Id")).toHaveValue(String(article.id));
    expect(screen.getByTestId(`${testId}-id`)).toHaveValue(String(article.id));
    expect(screen.getByLabelText("Id")).toHaveAttribute("readonly");
    for (const field of ["title", "url", "explanation", "email"]) {
      expect(screen.getByTestId(`${testId}-${field}`)).toHaveValue(
        article[field],
      );
    }
    expect(screen.getByLabelText("Date Added")).toHaveValue("2026-10-21T12:00");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  test("calls navigate(-1) when Cancel is clicked", () => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm submitAction={submitAction} />
      </Router>,
    );

    fireEvent.click(screen.getByTestId(`${testId}-cancel`));

    expect(mockedNavigate).toHaveBeenCalledWith(-1);
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("shows required messages for every missing field and blocks submission", async () => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm submitAction={submitAction} />
      </Router>,
    );

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    for (const label of expectedLabels) {
      expect(
        await screen.findByText(`${label} is required.`),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(label)).toHaveClass("is-invalid");
    }
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("shows validation messages for invalid input", async () => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm initialContents={article} submitAction={submitAction} />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "a".repeat(256) },
    });
    fireEvent.change(screen.getByLabelText("Explanation"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "not-a-url" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Max length 255 characters"),
    ).toBeInTheDocument();
    expect(screen.getByText("Explanation is required.")).toBeInTheDocument();
    expect(
      screen.getByText("URL must start with http:// or https:// and be valid."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Email must be a valid email address."),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("submits a new article with the editable fields and no ID", async () => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm submitAction={submitAction} />
      </Router>,
    );

    const { id: _id, ...contents } = article;
    contents.title = "UCSB";
    contents.dateAdded = "2026-10-21T12:00";
    for (const [field, value] of Object.entries(contents)) {
      fireEvent.change(screen.getByTestId(`${testId}-${field}`), {
        target: { value },
      });
    }
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual(contents);
    expect(screen.getByLabelText("Title")).not.toHaveClass("is-invalid");
  });

  test("rejects a whitespace-only title", async () => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm initialContents={article} submitAction={submitAction} />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each([
    ["URL", "https://news.ucsb.edu/" + "a".repeat(256)],
    ["Explanation", "a".repeat(256)],
    ["Email", "a".repeat(256) + "@ucsb.edu"],
  ])("rejects %s longer than 255 characters", async (label, value) => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm initialContents={article} submitAction={submitAction} />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Max length 255 characters"),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("rejects a date outside the four-digit year format", async () => {
    const submitAction = vi.fn();
    render(
      <Router>
        <ArticlesForm initialContents={article} submitAction={submitAction} />
      </Router>,
    );

    // The picker accepts five-digit years, but the registered format does not.
    fireEvent.change(screen.getByLabelText("Date Added"), {
      target: { value: "10000-01-01T12:00" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Date Added must be a valid date and time."),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });
});
