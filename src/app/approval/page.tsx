"use client";

import * as React from "react";

export default function ApprovalPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Approval</h1>
        <p className="text-muted-foreground">
          Review and approve requests.
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            No pending approvals
          </h3>
          <p className="text-sm text-muted-foreground">
            There are currently no items that require your approval.
          </p>
        </div>
      </div>
    </div>
  );
}
