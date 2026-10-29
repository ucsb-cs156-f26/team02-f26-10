import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import HelpRequestForm from "main/components/HelpRequest/HelpRequestForm";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mockedNavigate,
}));

const labels = {
  requesterEmail: "Requester Email",
  teamId: "Team ID",
  tableOrBreakoutRoom: "Table or Breakout Room",
  requestTime: "Request Time",
  explanation: "Explanation",
};
const fixture = helpRequestFixtures.oneHelpRequest;

function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <HelpRequestForm {...props} />
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
  fireEvent.click(screen.getByTestId("HelpRequestForm-submit"));
}

beforeEach(() => vi.clearAllMocks());

test("create mode shows labeled empty inputs, a date picker, and unchecked solved", () => {
  renderForm();
  expect(screen.queryByLabelText("Id")).not.toBeInTheDocument();
  for (const label of Object.values(labels))
    expect(screen.getByLabelText(label)).toHaveValue("");
  expect(screen.getByLabelText("Requester Email")).toHaveAttribute(
    "type",
    "email",
  );
  expect(screen.getByLabelText("Request Time")).toHaveAttribute(
    "type",
    "datetime-local",
  );
  expect(screen.getByLabelText("Explanation").tagName).toBe("TEXTAREA");
  expect(screen.getByLabelText("Solved")).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
    "type",
    "submit",
  );
});

test.each([false, true])(
  "edit mode prepopulates all values and solved=%s",
  (solved) => {
    renderForm({
      initialContents: { ...fixture, solved },
      buttonLabel: "Update",
    });
    expect(screen.getByLabelText("Id")).toHaveValue("1");
    expect(screen.getByLabelText("Id")).toBeDisabled();
    for (const [field, label] of Object.entries(labels)) {
      const expected =
        field === "requestTime" ? "2026-10-28T15:20" : fixture[field];
      expect(screen.getByLabelText(label)).toHaveValue(expected);
    }
    expect(screen.getByLabelText("Solved").checked).toBe(solved);
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

test.each(["requesterEmail", "teamId", "tableOrBreakoutRoom", "explanation"])(
  "rejects whitespace-only %s",
  async (field) => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillForm();
    fireEvent.change(screen.getByLabelText(labels[field]), {
      target: { value: "   " },
    });
    submit();
    expect(
      await screen.findByText(
        field === "requesterEmail"
          ? "Requester Email is required."
          : `${labels[field]} must not be blank.`,
      ),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  },
);

test.each(["requesterEmail", "teamId", "tableOrBreakoutRoom", "explanation"])(
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

test.each(["not-an-email", "bad@@student@ucsb.edu", "student@ucsb.edu@bad"])(
  "rejects invalid email %s",
  async (email) => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillForm();
    fireEvent.change(screen.getByLabelText("Requester Email"), {
      target: { value: email },
    });
    submit();
    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  },
);

test.each([false, true])(
  "valid create submission sends field values and boolean solved=%s",
  async (solved) => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillForm();
    if (solved) fireEvent.click(screen.getByLabelText("Solved"));
    submit();
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    const { id: _id, ...expected } = fixture;
    expect(submitAction.mock.calls[0][0]).toEqual({
      ...expected,
      requestTime: "2026-10-28T15:20",
      solved,
    });
    for (const label of Object.values(labels))
      expect(screen.getByLabelText(label)).not.toHaveClass("is-invalid");
  },
);

test("edit submission preserves ID and allows solved to become false", async () => {
  const submitAction = vi.fn();
  renderForm({
    initialContents: { ...fixture, solved: true },
    submitAction,
    buttonLabel: "Update",
  });
  fireEvent.click(screen.getByLabelText("Solved"));
  fireEvent.change(screen.getByLabelText("Explanation"), {
    target: { value: "Need more help" },
  });
  submit();
  await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
  expect(submitAction.mock.calls[0][0]).toEqual({
    ...fixture,
    explanation: "Need more help",
    solved: false,
  });
});

test("cancel navigates back without submitting", () => {
  const submitAction = vi.fn();
  renderForm({ initialContents: fixture, submitAction });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mockedNavigate).toHaveBeenCalledWith(-1);
  expect(submitAction).not.toHaveBeenCalled();
});
