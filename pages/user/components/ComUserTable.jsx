"use client";

import { useState } from "react";
import { useAllUsers } from "@/hooks/UseAllUsersFetch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersTable() {
  const { users, count, loading, error } = useAllUsers();
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(q) ||
      user.mail?.toLowerCase().includes(q) ||
      user.jobTitle?.toLowerCase().includes(q) ||
      user.department?.toLowerCase().includes(q) ||
      user.officeLocation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-4">
    
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${count} total users`}
          </p>
        </div>
        <Input
          placeholder="Search by name, email, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Office Location</TableHead>
              <TableHead>Mobile Phone</TableHead>
              <TableHead>Business Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-10"
                >
                  {search ? "No users match your search." : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">
                    {user.displayName || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.mail || user.userPrincipalName || "—"}
                  </TableCell>
                  <TableCell>
                    {user.jobTitle ? (
                      <Badge variant="secondary">{user.jobTitle}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{user.department || "—"}</TableCell>
                  <TableCell>{user.officeLocation || "—"}</TableCell>
                  <TableCell className="text-sm">{user.mobilePhone || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {user.businessPhones?.length > 0
                      ? user.businessPhones[0]
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filteredUsers.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {filteredUsers.length} of {count} users
        </p>
      )}
    </div>
  );
}