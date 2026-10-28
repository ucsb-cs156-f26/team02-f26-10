import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router";

import UCSBOrganizationForm from "main/components/UCSBOrganization/UCSBOrganizationForm";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");

  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

function renderForm(props = {}) {
  return render(
    <Router>
      <UCSBOrganizationForm {...props} />
    </Router>,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Organization Code"), {
    target: { value: "TEST" },
  });

  fireEvent.change(screen.getByLabelText("Short Name"), {
    target: { value: "TEST CLUB" },
  });

  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: "TEST CLUB AT UCSB" },
  });
}

describe("UCSBOrganizationForm tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the create form", () => {
    renderForm();

    const orgCode = screen.getByTestId("UCSBOrganizationForm-orgCode");
    expect(orgCode).toHaveValue("");
    expect(orgCode).not.toHaveAttribute("readonly");

    expect(
      screen.getByTestId("UCSBOrganizationForm-orgTranslationShort"),
    ).toHaveValue("");

    expect(
      screen.getByTestId("UCSBOrganizationForm-orgTranslation"),
    ).toHaveValue("");

    expect(
      screen.getByTestId("UCSBOrganizationForm-inactive"),
    ).not.toBeChecked();

    expect(screen.getByTestId("UCSBOrganizationForm-submit")).toHaveTextContent(
      "Create",
    );

    expect(screen.getByTestId("UCSBOrganizationForm-cancel")).toHaveTextContent(
      "Cancel",
    );
  });

  test("prefills the update form and makes orgCode read-only", () => {
    const initialContents = {
      ...ucsbOrganizationFixtures.oneOrganization,
      inactive: true,
    };

    renderForm({
      initialContents,
      buttonLabel: "Update",
    });

    expect(screen.getByLabelText("Organization Code")).toHaveValue(
      initialContents.orgCode,
    );
    expect(screen.getByLabelText("Organization Code")).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByLabelText("Short Name")).toHaveValue(
      initialContents.orgTranslationShort,
    );
    expect(screen.getByLabelText("Full Name")).toHaveValue(
      initialContents.orgTranslation,
    );
    expect(screen.getByLabelText("Inactive")).toBeChecked();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  test("rejects empty required fields", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Organization code is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Short name is required.")).toBeInTheDocument();
    expect(screen.getByText("Full name is required.")).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("rejects fields containing only spaces", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.change(screen.getByLabelText("Organization Code"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Short Name"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "   " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Organization code cannot be blank."),
    ).toBeInTheDocument();
    expect(screen.getByText("Short name cannot be blank.")).toBeInTheDocument();
    expect(screen.getByText("Full name cannot be blank.")).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each([
    ["Organization Code", "Organization code must be 255 characters or fewer."],
    ["Short Name", "Short name must be 255 characters or fewer."],
    ["Full Name", "Full name must be 255 characters or fewer."],
  ])("rejects more than 255 characters in %s", async (label, message) => {
    const submitAction = vi.fn();
    renderForm({ submitAction });
    fillValidForm();

    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "x".repeat(256) },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each(["Organization Code", "Short Name", "Full Name"])(
    "accepts exactly 255 characters in %s",
    async (label) => {
      const submitAction = vi.fn();
      renderForm({ submitAction });
      fillValidForm();

      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "x".repeat(255) },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => {
        expect(submitAction).toHaveBeenCalledTimes(1);
      });
    },
  );

  test.each([false, true])(
    "submits create data with inactive=%s",
    async (inactive) => {
      const submitAction = vi.fn();
      renderForm({ submitAction });
      fillValidForm();

      if (inactive) {
        fireEvent.click(screen.getByLabelText("Inactive"));
      }

      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => {
        expect(submitAction).toHaveBeenCalledTimes(1);
      });

      expect(submitAction.mock.calls[0][0]).toEqual({
        orgCode: "TEST",
        orgTranslationShort: "TEST CLUB",
        orgTranslation: "TEST CLUB AT UCSB",
        inactive,
      });
    },
  );

  test("submits edited data while preserving orgCode", async () => {
    const submitAction = vi.fn();
    const initialContents = {
      ...ucsbOrganizationFixtures.oneOrganization,
      inactive: true,
    };

    renderForm({
      initialContents,
      submitAction,
      buttonLabel: "Update",
    });

    fireEvent.change(screen.getByLabelText("Short Name"), {
      target: { value: "UPDATED SHORT NAME" },
    });
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "UPDATED FULL NAME" },
    });
    fireEvent.click(screen.getByLabelText("Inactive"));

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledTimes(1);
    });

    expect(submitAction.mock.calls[0][0]).toEqual({
      orgCode: initialContents.orgCode,
      orgTranslationShort: "UPDATED SHORT NAME",
      orgTranslation: "UPDATED FULL NAME",
      inactive: false,
    });
  });

  test("navigates back when Cancel is clicked", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockedNavigate).toHaveBeenCalledWith(-1);
  });
});
