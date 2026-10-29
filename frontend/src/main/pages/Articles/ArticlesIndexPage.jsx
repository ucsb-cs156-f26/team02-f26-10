import React from "react";
import { useBackend } from "main/utils/useBackend";

import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import ArticlesTable from "main/components/Articles/ArticlesTable";
import { useCurrentUser, hasRole } from "main/utils/useCurrentUser";
import { Button } from "react-bootstrap";

export default function ArticlesIndexPage() {
  const currentUser = useCurrentUser();

  const {
    data: articles,
    error: _error,
    status: _status,
  } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    ["/api/Articles/all"],
    { method: "GET", url: "/api/Articles/all" },
    // Stryker disable next-line all : don't test default value of empty list
    [],
  );

  const createButton = () => {
    if (hasRole(currentUser, "ROLE_ADMIN")) {
      return (
        <Button
          variant="primary"
          href="/articles/create"
          style={{ float: "right" }}
        >
          Create Article
        </Button>
      );
    }
  };

  return (
    <BasicLayout>
      <div className="pt-2">
        {createButton()}
        <h1>Articles</h1>
        <ArticlesTable articles={articles} currentUser={currentUser} />
      </div>
    </BasicLayout>
  );
}
