import React from "react";
import OurTable from "main/components/OurTable";

export default function ArticlesTable({
  articles,
  testIdPrefix = "ArticlesTable",
}) {
  const columns = [
    {
      header: "Id",
      accessorKey: "id",
    },
    {
      header: "Title",
      accessorKey: "title",
    },
    {
      header: "URL",
      accessorKey: "url",
    },
    {
      header: "Explanation",
      accessorKey: "explanation",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Date Added",
      accessorKey: "dateAdded",
    },
  ];

  return <OurTable data={articles} columns={columns} testid={testIdPrefix} />;
}
