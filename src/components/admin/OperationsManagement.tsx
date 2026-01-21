"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  X,
  Download,
  Eye,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

interface Operation {
  id: string;
  weekNumber: number;
  year: number;
  title: string;
  description: string | null;
  pdfData: string | null;
  pdfFilename: string | null;
  scheduleType: "this_week" | "next_week";
  teamType: "operations" | "maintenance";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RealtimeScheduleLink {
  id: string;
  teamType: "operations" | "maintenance";
  title: string;
  linkUrl: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OperationsManagementProps {
  className?: string;
}

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB limit for PDF files

const OperationsManagement: React.FC<OperationsManagementProps> = ({ className }) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [realtimeLinks, setRealtimeLinks] = useState<RealtimeScheduleLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<RealtimeScheduleLink | null>(null);
  const [viewingItem, setViewingItem] = useState<Operation | null>(null);
  const [editingItem, setEditingItem] = useState<Operation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [linkFormData, setLinkFormData] = useState({
    teamType: "operations" as "operations" | "maintenance",
    title: "",
    linkUrl: "",
    description: "",
  });

  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber(new Date());

  const [formData, setFormData] = useState({
    weekNumber: currentWeek,
    year: currentYear,
    title: "",
    description: "",
    pdfData: "",
    pdfFilename: "",
    scheduleType: "this_week" as "this_week" | "next_week",
    teamType: "operations" as "operations" | "maintenance",
  });

  const { toast } = useToast();

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const fetchOperations = useCallback(async () => {
    setIsLoading(true);
    try {
      const [operationsRes, linksRes] = await Promise.all([
        fetch("/api/operations"),
        fetch("/api/realtime-schedule-links"),
      ]);

      if (!operationsRes.ok) throw new Error("Failed to fetch operations");
      const operationsData = await operationsRes.json();
      setOperations(operationsData);

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setRealtimeLinks(linksData);
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch operations from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const handleFileToBase64 = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > maxSize) {
        reject(new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf"];
    const hasValidExtension = file.name.toLowerCase().endsWith(".pdf");

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast({
        title: "Error",
        description: "Please select a PDF file (.pdf)",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await handleFileToBase64(file, MAX_PDF_SIZE);
      setFormData((prev) => ({
        ...prev,
        pdfData: base64,
        pdfFilename: file.name,
      }));
      toast({
        title: "Success",
        description: "PDF file uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading PDF file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload PDF file",
        variant: "destructive",
      });
    }

    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const clearPdf = () => {
    setFormData((prev) => ({ ...prev, pdfData: "", pdfFilename: "" }));
  };

  const filteredOperations = operations.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      `week ${item.weekNumber}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && item.isActive) ||
      (filterStatus === "inactive" && !item.isActive);
    return matchesSearch && matchesStatus;
  });

  // Calculate the number of ISO weeks in a year
  // A year has 53 weeks if January 1 is Thursday, or if it's a leap year and January 1 is Wednesday
  const getWeeksInYear = (year: number): number => {
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const jan1DayOfWeek = jan1.getUTCDay();
    // Check if January 1 is Thursday (4) OR if it's a leap year and January 1 is Wednesday (3)
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (jan1DayOfWeek === 4 || (isLeapYear && jan1DayOfWeek === 3)) {
      return 53;
    }
    return 52;
  };

  // Calculate next week number and year
  const getNextWeek = (week: number, year: number) => {
    const maxWeeks = getWeeksInYear(year);

    if (week >= maxWeeks) {
      return { weekNumber: 1, year: year + 1 };
    }
    return { weekNumber: week + 1, year: year };
  };

  const nextWeekInfo = getNextWeek(currentWeek, currentYear);

  // Get current and next week schedules by scheduleType and teamType
  const opsThisWeekSchedule = operations.find(
    (op) => op.scheduleType === "this_week" && op.teamType === "operations" && op.isActive
  );
  const opsNextWeekSchedule = operations.find(
    (op) => op.scheduleType === "next_week" && op.teamType === "operations" && op.isActive
  );
  const maintThisWeekSchedule = operations.find(
    (op) => op.scheduleType === "this_week" && op.teamType === "maintenance" && op.isActive
  );
  const maintNextWeekSchedule = operations.find(
    (op) => op.scheduleType === "next_week" && op.teamType === "maintenance" && op.isActive
  );

  const handleCreateOperation = async () => {
    if (!formData.weekNumber || !formData.year || !formData.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Week, Year, Title)",
        variant: "destructive",
      });
      return;
    }

    // Validate week number matches the expected value for the schedule type
    const expectedWeek = formData.scheduleType === "this_week" ? currentWeek : nextWeekInfo.weekNumber;
    const expectedYear = formData.scheduleType === "this_week" ? currentYear : nextWeekInfo.year;

    if (formData.weekNumber !== expectedWeek || formData.year !== expectedYear) {
      toast({
        title: "Invalid Week Number",
        description: `For ${formData.scheduleType === "this_week" ? "this week" : "next week"}'s schedule, the week number should be Week ${expectedWeek}, ${expectedYear}. Please correct the values.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: formData.weekNumber,
          year: formData.year,
          title: formData.title,
          description: formData.description || null,
          pdfData: formData.pdfData || null,
          pdfFilename: formData.pdfFilename || null,
          scheduleType: formData.scheduleType,
          teamType: formData.teamType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create operation");
      }

      toast({
        title: "Success",
        description: "Operation schedule created successfully",
      });

      setFormData({
        weekNumber: currentWeek,
        year: currentYear,
        title: "",
        description: "",
        pdfData: "",
        pdfFilename: "",
        scheduleType: "this_week",
        teamType: "operations",
      });
      setIsCreateDialogOpen(false);
      fetchOperations();
    } catch (error) {
      console.error("Error creating operation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create operation",
        variant: "destructive",
      });
    }
  };

  const handleEditOperation = async () => {
    if (!editingItem) return;

    if (!formData.weekNumber || !formData.year || !formData.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate week number matches the expected value for the schedule type
    const expectedWeek = formData.scheduleType === "this_week" ? currentWeek : nextWeekInfo.weekNumber;
    const expectedYear = formData.scheduleType === "this_week" ? currentYear : nextWeekInfo.year;

    if (formData.weekNumber !== expectedWeek || formData.year !== expectedYear) {
      toast({
        title: "Invalid Week Number",
        description: `For ${formData.scheduleType === "this_week" ? "this week" : "next week"}'s schedule, the week number should be Week ${expectedWeek}, ${expectedYear}. Please correct the values.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/operations/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: formData.weekNumber,
          year: formData.year,
          title: formData.title,
          description: formData.description || null,
          pdfData: formData.pdfData || null,
          pdfFilename: formData.pdfFilename || null,
          scheduleType: formData.scheduleType,
          teamType: formData.teamType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update operations");
      }

      toast({
        title: "Success",
        description: "Operations schedule updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({
        weekNumber: currentWeek,
        year: currentYear,
        title: "",
        description: "",
        pdfData: "",
        pdfFilename: "",
        scheduleType: "this_week",
        teamType: "operations",
      });
      fetchOperations();
    } catch (error) {
      console.error("Error updating operation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update operation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    try {
      const response = await fetch(`/api/operations/${operationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete operation");

      toast({
        title: "Success",
        description: "Operation schedule deleted successfully",
      });

      fetchOperations();
    } catch (error) {
      console.error("Error deleting operation:", error);
      toast({
        title: "Error",
        description: "Failed to delete operation",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (operationId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/operations/${operationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `Operation ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      fetchOperations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update operation status",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = (scheduleType: "this_week" | "next_week" = "this_week", teamType: "operations" | "maintenance" = "operations") => {
    const weekNum = scheduleType === "this_week" ? currentWeek : nextWeekInfo.weekNumber;
    const yearNum = scheduleType === "this_week" ? currentYear : nextWeekInfo.year;
    const teamLabel = teamType === "operations" ? "Operations" : "Maintenance";
    setFormData({
      weekNumber: weekNum,
      year: yearNum,
      title: `${teamLabel} - Week ${weekNum} Schedule`,
      description: "",
      pdfData: "",
      pdfFilename: "",
      scheduleType: scheduleType,
      teamType: teamType,
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: Operation) => {
    setEditingItem(item);
    setFormData({
      weekNumber: item.weekNumber,
      year: item.year,
      title: item.title,
      description: item.description || "",
      pdfData: item.pdfData || "",
      pdfFilename: item.pdfFilename || "",
      scheduleType: item.scheduleType,
      teamType: item.teamType,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (item: Operation) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  // Realtime Schedule Link functions
  const openLinkDialog = (teamType: "operations" | "maintenance") => {
    const existingLink = realtimeLinks.find((l) => l.teamType === teamType);
    if (existingLink) {
      setEditingLink(existingLink);
      setLinkFormData({
        teamType: existingLink.teamType,
        title: existingLink.title,
        linkUrl: existingLink.linkUrl,
        description: existingLink.description || "",
      });
    } else {
      setEditingLink(null);
      setLinkFormData({
        teamType: teamType,
        title: teamType === "operations" ? "Operations Real-time Schedule" : "Maintenance Real-time Schedule",
        linkUrl: "",
        description: "",
      });
    }
    setIsLinkDialogOpen(true);
  };

  const handleSaveLink = async () => {
    if (!linkFormData.title || !linkFormData.linkUrl) {
      toast({
        title: "Error",
        description: "Please fill in title and link URL",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingLink) {
        // Update existing link
        const response = await fetch(`/api/realtime-schedule-links/${editingLink.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(linkFormData),
        });
        if (!response.ok) throw new Error("Failed to update link");
        toast({
          title: "Success",
          description: "Real-time schedule link updated successfully",
        });
      } else {
        // Create new link
        const response = await fetch("/api/realtime-schedule-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(linkFormData),
        });
        if (!response.ok) throw new Error("Failed to create link");
        toast({
          title: "Success",
          description: "Real-time schedule link created successfully",
        });
      }
      setIsLinkDialogOpen(false);
      setEditingLink(null);
      fetchOperations();
    } catch (error) {
      console.error("Error saving link:", error);
      toast({
        title: "Error",
        description: "Failed to save real-time schedule link",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/realtime-schedule-links/${linkId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete link");
      toast({
        title: "Success",
        description: "Real-time schedule link deleted successfully",
      });
      fetchOperations();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast({
        title: "Error",
        description: "Failed to delete real-time schedule link",
        variant: "destructive",
      });
    }
  };

  const opsRealtimeLink = realtimeLinks.find((l) => l.teamType === "operations");
  const maintRealtimeLink = realtimeLinks.find((l) => l.teamType === "maintenance");

  const operationStats = {
    total: operations.length,
    active: operations.filter((item) => item.isActive).length,
    inactive: operations.filter((item) => !item.isActive).length,
  };

  const renderFormContent = (prefix: string) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}-weekNumber`}>
            <Calendar className="inline h-4 w-4 mr-1" />
            Week Number *
          </Label>
          <Input
            id={`${prefix}-weekNumber`}
            type="number"
            min={1}
            max={53}
            value={formData.weekNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, weekNumber: parseInt(e.target.value) || 1 }))
            }
            placeholder="1-53"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-year`}>
            <Calendar className="inline h-4 w-4 mr-1" />
            Year *
          </Label>
          <Input
            id={`${prefix}-year`}
            type="number"
            min={2020}
            max={2100}
            value={formData.year}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) || currentYear }))
            }
            placeholder="2024"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`${prefix}-title`}>Title *</Label>
        <Input
          id={`${prefix}-title`}
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="e.g., Week 51 Schedule"
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-description`}>Description</Label>
        <Textarea
          id={`${prefix}-description`}
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Enter description or notes..."
        />
      </div>

      {/* PDF Upload */}
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-pdf`}>
          <FileText className="inline h-4 w-4 mr-1" />
          PDF Schedule File
        </Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              id={`${prefix}-pdf`}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfUpload}
              className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {formData.pdfData && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearPdf}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {formData.pdfFilename && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <FileText className="h-4 w-4 text-red-600" />
              <span className="text-sm text--700 dark:text-red-400">{formData.pdfFilename}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {MAX_PDF_SIZE / 1024 / 1024}MB. Supported: .pdf
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Planning Management</h2>
          <p className="text-muted-foreground">
            Manage weekly planning schedules with PDF file uploads
          </p>
        </div>

        <Button variant="outline" onClick={fetchOperations} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        {/* Create Dialog - triggered by "Create one" buttons on cards */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Planning Schedule</DialogTitle>
              <DialogDescription>
                Add a new weekly planning schedule with a PDF file.
              </DialogDescription>
            </DialogHeader>
            {renderFormContent("create")}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOperation}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Access Cards - Operations Team */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Operations Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week&apos;s Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {opsThisWeekSchedule ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold">Week {currentWeek}, {currentYear}</div>
                  <div className="text-sm text-muted-foreground">{opsThisWeekSchedule.title}</div>
                  {opsThisWeekSchedule.pdfData && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(opsThisWeekSchedule)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <a
                        href={opsThisWeekSchedule.pdfData}
                        download={opsThisWeekSchedule.pdfFilename || "schedule.pdf"}
                      >
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    No schedule for this week
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openCreateDialog("this_week", "operations")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create one
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Week&apos;s Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {opsNextWeekSchedule ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold">
                    Week {nextWeekInfo.weekNumber}, {nextWeekInfo.year}
                  </div>
                  <div className="text-sm text-muted-foreground">{opsNextWeekSchedule.title}</div>
                  {opsNextWeekSchedule.pdfData && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(opsNextWeekSchedule)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <a
                        href={opsNextWeekSchedule.pdfData}
                        download={opsNextWeekSchedule.pdfFilename || "schedule.pdf"}
                      >
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    No schedule for next week
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openCreateDialog("next_week", "operations")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create one
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Access Cards - Maintenance Team */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Maintenance Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week&apos;s Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {maintThisWeekSchedule ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold">Week {currentWeek}, {currentYear}</div>
                  <div className="text-sm text-muted-foreground">{maintThisWeekSchedule.title}</div>
                  {maintThisWeekSchedule.pdfData && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(maintThisWeekSchedule)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <a
                        href={maintThisWeekSchedule.pdfData}
                        download={maintThisWeekSchedule.pdfFilename || "schedule.pdf"}
                      >
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    No schedule for this week
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openCreateDialog("this_week", "maintenance")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create one
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Week&apos;s Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {maintNextWeekSchedule ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold">
                    Week {nextWeekInfo.weekNumber}, {nextWeekInfo.year}
                  </div>
                  <div className="text-sm text-muted-foreground">{maintNextWeekSchedule.title}</div>
                  {maintNextWeekSchedule.pdfData && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(maintNextWeekSchedule)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <a
                        href={maintNextWeekSchedule.pdfData}
                        download={maintNextWeekSchedule.pdfFilename || "schedule.pdf"}
                      >
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    No schedule for next week
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openCreateDialog("next_week", "maintenance")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create one
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Schedule Links */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Real-time Schedule Links</h3>
        <p className="text-sm text-muted-foreground">
          Configure links that will be displayed on the main website for users to check real-time schedules
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Operations Link */}
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operations Real-time Link</CardTitle>
              <LinkIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {opsRealtimeLink ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold">{opsRealtimeLink.title}</div>
                  {opsRealtimeLink.description && (
                    <div className="text-sm text-muted-foreground">{opsRealtimeLink.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={opsRealtimeLink.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </a>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLinkDialog("operations")}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Real-time Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this real-time schedule link? This will remove it from the main website.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteLink(opsRealtimeLink.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    No real-time link configured
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openLinkDialog("operations")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Link */}
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Real-time Link</CardTitle>
              <LinkIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {maintRealtimeLink ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold">{maintRealtimeLink.title}</div>
                  {maintRealtimeLink.description && (
                    <div className="text-sm text-muted-foreground">{maintRealtimeLink.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={maintRealtimeLink.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </a>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLinkDialog("maintenance")}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Real-time Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this real-time schedule link? This will remove it from the main website.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteLink(maintRealtimeLink.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    No real-time link configured
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openLinkDialog("maintenance")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationStats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schedules by title, description, or week..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Planning Schedules ({filteredOperations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No operation schedules found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Schedule Type</TableHead>
                    <TableHead>Week/Year</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>PDF File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <Badge
                          className={
                            operation.teamType === "operations"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                          }
                        >
                          {operation.teamType === "operations" ? "Operations" : "Maintenance"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            operation.scheduleType === "this_week"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                          }
                        >
                          {operation.scheduleType === "this_week" ? "This Week" : "Next Week"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          Week {operation.weekNumber}, {operation.year}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{operation.title}</div>
                      </TableCell>
                      <TableCell>
                        {operation.pdfData ? (
                          <a
                            href={operation.pdfData}
                            download={operation.pdfFilename || "schedule.pdf"}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            {operation.pdfFilename || "Download"}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No file
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={operation.isActive}
                            onCheckedChange={() =>
                              handleToggleStatus(operation.id, operation.isActive)
                            }
                          />
                          <Badge
                            className={
                              operation.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {operation.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(operation.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {operation.pdfData && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewDialog(operation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(operation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Planning Schedule</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {operation.title}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOperation(operation.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Planning Schedule</DialogTitle>
            <DialogDescription>
              Update the planning schedule information.
            </DialogDescription>
          </DialogHeader>
          {renderFormContent("edit")}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditOperation}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingItem?.title || "Planning Schedule"}
            </DialogTitle>
            <DialogDescription>
              Week {viewingItem?.weekNumber}, {viewingItem?.year}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewingItem?.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{viewingItem.description}</p>
              </div>
            )}
            {viewingItem?.pdfData && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">PDF File</Label>
                <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <FileText className="h-8 w-8 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium">{viewingItem.pdfFilename}</p>
                    <p className="text-sm text-muted-foreground">Click to download the schedule file</p>
                  </div>
                  <a
                    href={viewingItem.pdfData}
                    download={viewingItem.pdfFilename || "schedule.pdf"}
                  >
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Real-time Schedule Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit Real-time Schedule Link" : "Add Real-time Schedule Link"}
            </DialogTitle>
            <DialogDescription>
              Configure a link for users to check real-time schedules on the main website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="link-team">Team Type</Label>
              <Input
                id="link-team"
                value={linkFormData.teamType === "operations" ? "Operations" : "Maintenance"}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="link-title">Title *</Label>
              <Input
                id="link-title"
                value={linkFormData.title}
                onChange={(e) =>
                  setLinkFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter link title"
              />
            </div>

            <div>
              <Label htmlFor="link-url">
                <LinkIcon className="inline h-4 w-4 mr-1" />
                Link URL *
              </Label>
              <Input
                id="link-url"
                value={linkFormData.linkUrl}
                onChange={(e) =>
                  setLinkFormData((prev) => ({ ...prev, linkUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="link-description">Description</Label>
              <Textarea
                id="link-description"
                rows={2}
                value={linkFormData.description}
                onChange={(e) =>
                  setLinkFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsLinkDialogOpen(false);
                setEditingLink(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLink}>
              {editingLink ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationsManagement;
