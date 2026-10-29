import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import RecommendationRequestForm from "main/components/RecommendationRequest/RecommendationRequestForm";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mockedNavigate,
}));

const labels = {
  requesterEmail: "Requester Email",
  professorEmail: "Professor Email",
  explanation: "Explanation",
  dateRequested: "Date Requested",
  dateNeeded: "Date Needed",
};
const shownDates = {
  dateRequested: "2026-10-01T10:00",
  dateNeeded: "2026-12-01T17:00",
};
const fixture = recommendationRequestFixtures.oneRecommendationRequest;

function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <RecommendationRequestForm {...props} />
    </MemoryRouter>,
  );
}
function fillForm() {
  for (const [field, label] of Object.entries(labels)) {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: fixture[field] },
    });
  }
}
function submit() {
  fireEvent.click(screen.getByTestId("RecommendationRequestForm-submit"));
}

beforeEach(() => vi.clearAllMocks());

test("create mode shows labeled empty inputs, date pickers, and unchecked done", () => {
  renderForm();
  expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
  for (const label of Object.values(labels))
    expect(screen.getByLabelText(label)).toHaveValue("");
  for (const label of ["Requester Email", "Professor Email"])
    expect(screen.getByLabelText(label)).toHaveAttribute("type", "email");
  for (const label of ["Date Requested", "Date Needed"])
    expect(screen.getByLabelText(label)).toHaveAttribute(
      "type",
      "datetime-local",
    );
  expect(screen.getByLabelText("Explanation").tagName).toBe("TEXTAREA");
  expect(screen.getByLabelText("Done")).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
    "type",
    "submit",
  );
  expect(
    screen.getByTestId("RecommendationRequestForm-cancel"),
  ).toBeInTheDocument();
});

test.each([false, true])(
  "edit mode prepopulates all values and done=%s",
  (done) => {
    renderForm({
      initialContents: { ...fixture, done },
      buttonLabel: "Update",
    });
    expect(screen.getByLabelText("Id")).toHaveValue("1");
    expect(screen.getByLabelText("Id")).toBeDisabled();
    expect(screen.getByTestId("RecommendationRequestForm-id")).toHaveValue("1");
    for (const [field, label] of Object.entries(labels)) {
      expect(screen.getByLabelText(label)).toHaveValue(
        shownDates[field] ?? fixture[field],
      );
    }
    expect(screen.getByLabelText("Done").checked).toBe(done);
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  },
);

test("empty required fields show feedback and block submission", async () => {
  const submitAction = vi.fn();
  renderForm({ submitAction });
  submit();
  for (const label of Object.values(labels)) {
    expect(
      await screen.findByText(`${label} is required.`),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(label)).toHaveClass("is-invalid");
  }
  expect(submitAction).not.toHaveBeenCalled();
});

test("rejects whitespace-only explanation", async () => {
  const submitAction = vi.fn();
  renderForm({ submitAction });
  fillForm();
  fireEvent.change(screen.getByLabelText("Explanation"), {
    target: { value: "   " },
  });
  submit();
  expect(
    await screen.findByText("Explanation must not be blank."),
  ).toBeInTheDocument();
  expect(submitAction).not.toHaveBeenCalled();
});

test.each(["requesterEmail", "professorEmail", "explanation"])(
  "rejects %s exceeding the database limit",
  async (field) => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillForm();
    fireEvent.change(screen.getByLabelText(labels[field]), {
      target: { value: "a".repeat(244) + "@example.com" },
    });
    submit();
    expect(
      await screen.findByText("Max length 255 characters"),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  },
);

test.each([
  ["Requester Email", "not-an-email"],
  ["Requester Email", "bad@@student@ucsb.edu"],
  ["Professor Email", "prof@ucsb.edu@bad"],
  ["Professor Email", "has space@ucsb.edu"],
])("%s rejects invalid email %s", async (label, email) => {
  const submitAction = vi.fn();
  renderForm({ submitAction });
  fillForm();
  fireEvent.change(screen.getByLabelText(label), {
    target: { value: email },
  });
  submit();
  expect(
    await screen.findByText("Enter a valid email address."),
  ).toBeInTheDocument();
  expect(submitAction).not.toHaveBeenCalled();
});

test.each([false, true])(
  "valid create submission sends field values and boolean done=%s",
  async (done) => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillForm();
    if (done) fireEvent.click(screen.getByLabelText("Done"));
    submit();
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    const { id: _id, ...expected } = fixture;
    expect(submitAction.mock.calls[0][0]).toEqual({
      ...expected,
      ...shownDates,
      done,
    });
    for (const label of Object.values(labels))
      expect(screen.getByLabelText(label)).not.toHaveClass("is-invalid");
  },
);

test("edit submission preserves ID and allows done to become false", async () => {
  const submitAction = vi.fn();
  renderForm({
    initialContents: { ...fixture, done: true },
    submitAction,
    buttonLabel: "Update",
  });
  fireEvent.click(screen.getByLabelText("Done"));
  fireEvent.change(screen.getByLabelText("Explanation"), {
    target: { value: "Updated reason" },
  });
  submit();
  await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
  expect(submitAction.mock.calls[0][0]).toEqual({
    ...fixture,
    explanation: "Updated reason",
    done: false,
  });
});

test("cancel navigates back without submitting", () => {
  const submitAction = vi.fn();
  renderForm({ initialContents: fixture, submitAction });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mockedNavigate).toHaveBeenCalledWith(-1);
  expect(submitAction).not.toHaveBeenCalled();
});
