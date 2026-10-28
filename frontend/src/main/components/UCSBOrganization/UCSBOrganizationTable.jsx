import OurTable from "main/components/OurTable";

export default function UCSBOrganizationTable({ organizations }) {
  const columns = [
    {
      header: "Organization Code",
      accessorKey: "orgCode",
    },
    {
      header: "Short Name",
      accessorKey: "orgTranslationShort",
    },
    {
      header: "Full Name",
      accessorKey: "orgTranslation",
    },
    {
      header: "Inactive",
      accessorKey: "inactive",
      cell: (info) => String(info.getValue()),
    },
  ];

  return (
    <OurTable
      data={organizations}
      columns={columns}
      testid="UCSBOrganizationTable"
    />
  );
}
