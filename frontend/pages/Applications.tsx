import { apiFetch } from "../services/apiClient";
import React, { useState, useEffect } from "react";
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { dataService } from "../services/dataService";
import {
  formatInterviewDay,
  formatInterviewTime,
  toInterviewInputValue,
  toStoredInterviewDate,
} from "../lib/interviewDate";
import { BackButton } from "../components/BackButton";
import { addNotification } from "../components/NotificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Calendar,
  Clock,
  Building2,
  Briefcase,
  ExternalLink,
  Edit2,
  Trash2,
  Plus,
  CalendarPlus,
  Bell,
  Filter,
  LayoutList,
  LayoutGrid,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors = {
  applied: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-green-100 text-green-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function Applications() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login } = useAuth();
  const [viewMode, setViewMode] = useState("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingApp, setEditingApp] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newApp, setNewApp] = useState<any>({
    job_title: "",
    company: "",
    status: "applied",
    notes: "",
    interview_date: "",
  });
  const openEditor = (app: any) =>
    setEditingApp({
      ...app,
      interview_date: toInterviewInputValue(app.interview_date),
    });

  const {
    data: applications = [],
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["applications", user?.email],
    queryFn: async () => {
      return await dataService.getApplications(user.email);
    },
    enabled: !!user?.email,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = Object.prototype.hasOwnProperty.call(
        data,
        "interview_date",
      )
        ? {
            ...data,
            interview_date: toStoredInterviewDate(data.interview_date),
          }
        : data;
      await dataService.updateApplication(id, payload);
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application updated!");
      addNotification(
        "Application Updated",
        "Your job application has been successfully updated",
        "success",
      );
      setEditingApp(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "Could not save the application."),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await dataService.createApplication(user.email, {
        ...data,
        interview_date: toStoredInterviewDate(data.interview_date),
        applied_date: new Date().toISOString().split("T")[0],
      });
      return data;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application added!");
      addNotification(
        "Application Added",
        "New job application has been added to your tracker",
        "success",
      );

      // Track application in progress system
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
        await apiFetch(`${API_BASE_URL}/progress/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "application_submitted",
          }),
        });

        // Track activity
        await apiFetch(`${API_BASE_URL}/activity/${user.email}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: "job_application",
            activityData: {
              jobTitle: data.job_title,
              company: data.company,
              status: data.status,
            },
          }),
        });
      } catch (err) {
        console.warn("Progress tracking failed (non-critical):", err);
      }

      setShowAddDialog(false);
      setNewApp({
        job_title: "",
        company: "",
        status: "applied",
        notes: "",
        interview_date: "",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await dataService.deleteApplication(id, user.email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application deleted");
      addNotification(
        "Application Deleted",
        "Job application has been removed from your tracker",
        "info",
      );
    },
  });

  const addToCalendar = (app) => {
    if (!app.interview_date) {
      toast.error("No interview date set");
      return;
    }

    const startDate = new Date(app.interview_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      text: `Interview: ${app.job_title} at ${app.company}`,
      dates: `${startDate.toISOString().replace(/-|:|\.\d+/g, "")}/${endDate.toISOString().replace(/-|:|\.\d+/g, "")}`,
      details: `Job Interview for ${app.job_title} position at ${app.company}`,
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&dates=${event.dates}&details=${encodeURIComponent(event.details)}`;

    window.open(googleCalendarUrl, "_blank");

    updateMutation.mutate({ id: app.id, data: { calendar_added: true } });
    toast.success("Opening Google Calendar...");
  };

  const filteredApps =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  const stats = {
    total: applications.length,
    active: applications.filter((a) =>
      ["applied", "under_review", "interview"].includes(a.status),
    ).length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer").length,
  };

  const upcomingInterviews = applications
    .filter((a) => a.status === "interview" && a.interview_date)
    .filter((a) => new Date(a.interview_date) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.interview_date).getTime() -
        new Date(b.interview_date).getTime(),
    );

  if (loadError)
    return (
      <div role="alert" className="p-6 bg-red-50 rounded-xl">
        {loadError.message}
        <Button onClick={() => queryClient.invalidateQueries()}>Retry</Button>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Applications
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage your job applications
          </p>
        </div>
        <Button
          className="bg-teal-500 hover:bg-teal-600"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Application
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Briefcase className="w-5 h-5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-900">
                {stats.total}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Total Applications</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">
                {stats.active}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Active Applications</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">
                {stats.interviews}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Interviews</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Bell className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">
                {stats.offers}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Offers Received</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInterviews.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.company}
                      </p>
                      <p className="text-sm text-slate-500">{app.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {formatInterviewDay(app.interview_date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatInterviewTime(app.interview_date)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToCalendar(app)}
                      className={app.calendar_added ? "text-green-600" : ""}
                    >
                      <CalendarPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              All Applications
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  aria-label="Table view"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  aria-label="Card view"
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
              <p className="text-slate-500">Loading applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No applications yet
              </h3>
              <p className="text-slate-500 mb-4">
                Start applying to jobs to track them here
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </Button>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Step</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.company}
                      </TableCell>
                      <TableCell>{app.job_title}</TableCell>
                      <TableCell className="text-slate-500">
                        {app.applied_date
                          ? format(new Date(app.applied_date), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={app.status}
                          onValueChange={(value) =>
                            updateMutation.mutate({
                              id: app.id,
                              data: { status: value },
                            })
                          }
                        >
                          <SelectTrigger
                            className={`w-[130px] h-8 ${statusColors[app.status]} border-0`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="under_review">
                              Under Review
                            </SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[150px] truncate">
                        {app.next_step || "-"}
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[150px] truncate">
                        {app.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {app.status === "interview" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => addToCalendar(app)}
                              className={
                                app.calendar_added
                                  ? "text-green-600"
                                  : "text-slate-400"
                              }
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${app.company} application`}
                            onClick={() => openEditor(app)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteMutation.mutate(app.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <Card
                  key={app.id}
                  className="border hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {app.job_title}
                        </h4>
                        <p className="text-sm text-slate-500">{app.company}</p>
                      </div>
                      <Badge className={`${statusColors[app.status]} border-0`}>
                        {app.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        Applied:{" "}
                        {app.applied_date
                          ? format(new Date(app.applied_date), "MMM d, yyyy")
                          : "-"}
                      </div>
                      {app.interview_date && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Clock className="w-4 h-4" />
                          Interview: {formatInterviewDay(
                            app.interview_date,
                          )}, {formatInterviewTime(app.interview_date)}
                        </div>
                      )}
                      {app.notes && (
                        <p className="text-slate-500 truncate">{app.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${app.company} application`}
                        onClick={() => openEditor(app)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => deleteMutation.mutate(app.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingApp} onOpenChange={() => setEditingApp(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          {editingApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={editingApp.company}
                    onChange={(e) =>
                      setEditingApp({ ...editingApp, company: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    value={editingApp.job_title}
                    onChange={(e) =>
                      setEditingApp({
                        ...editingApp,
                        job_title: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editingApp.status}
                    onValueChange={(value) =>
                      setEditingApp({ ...editingApp, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-interview-date"
                    className="text-sm font-medium"
                  >
                    Interview Date (Singapore time)
                  </label>
                  <Input
                    id="edit-interview-date"
                    type="datetime-local"
                    value={editingApp.interview_date || ""}
                    onInput={(e) =>
                      setEditingApp({
                        ...editingApp,
                        interview_date: (e.target as HTMLInputElement).value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Next Step</label>
                <Input
                  value={editingApp.next_step || ""}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, next_step: e.target.value })
                  }
                  placeholder="e.g., Technical interview on Friday"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={editingApp.notes || ""}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, notes: e.target.value })
                  }
                  placeholder="Add any notes..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingApp(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-teal-500 hover:bg-teal-600"
                  onClick={() =>
                    updateMutation.mutate({
                      id: editingApp.id,
                      data: editingApp,
                    })
                  }
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={newApp.company}
                  onChange={(e) =>
                    setNewApp({ ...newApp, company: e.target.value })
                  }
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={newApp.job_title}
                  onChange={(e) =>
                    setNewApp({ ...newApp, job_title: e.target.value })
                  }
                  placeholder="Position title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={newApp.notes}
                onChange={(e) =>
                  setNewApp({ ...newApp, notes: e.target.value })
                }
                placeholder="Add any notes..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-teal-500 hover:bg-teal-600"
                onClick={() => createMutation.mutate(newApp)}
                disabled={!newApp.company || !newApp.job_title}
              >
                Add Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
