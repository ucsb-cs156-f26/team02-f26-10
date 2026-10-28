import { render, screen } from "@testing-library/react";

import UCSBOrganizationTable from "main/components/UCSBOrganization/UCSBOrganizationTable";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";

describe("UCSBOrganizationTable tests", () => {
  const testId = "UCSBOrganizationTable";

  const expectedHeaders = [
    "Organization Code",
    "Short Name",
    "Full Name",
    "Inactive",
  ];

  const expectedFields = [
    "orgCode",
    "orgTranslationShort",
    "orgTranslation",
    "inactive",
  ];

  test("renders an empty table with the expected headers", () => {
    render(<UCSBOrganizationTable organizations={[]} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    expect(screen.getAllByRole("columnheader")).toHaveLength(4);

    expectedFields.forEach((field) => {
      expect(
        screen.queryByTestId(`${testId}-cell-row-0-col-${field}`),
      ).not.toBeInTheDocument();
    });

    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  test("renders all fields for every organization", () => {
    const organizations = ucsbOrganizationFixtures.threeOrganizations;

    render(<UCSBOrganizationTable organizations={organizations} />);

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getAllByRole("row")).toHaveLength(4);

    organizations.forEach((organization, rowIndex) => {
      expectedFields.forEach((field) => {
        const cell = screen.getByTestId(
          `${testId}-cell-row-${rowIndex}-col-${field}`,
        );

        expect(cell).toHaveTextContent(String(organization[field]));
      });
    });
  });
});
