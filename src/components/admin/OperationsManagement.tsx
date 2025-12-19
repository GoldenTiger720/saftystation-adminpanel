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
  FileSpreadsheet,
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
} from "lucide-react";

interface Operation {
  id: string;
  weekNumber: number;
  year: number;
  title: string;
  description: string | null;
  excelData: string | null;
  excelFilename: string | null;
  scheduleType: "this_week" | "next_week";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OperationsManagementProps {
  className?: string;
}

const MAX_EXCEL_SIZE = 20 * 1024 * 1024; // 20MB limit for Excel files

const OperationsManagement: React.FC<OperationsManagementProps> = ({ className }) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Operation | null>(null);
  const [editingItem, setEditingItem] = useState<Operation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber(new Date());

  const [formData, setFormData] = useState({
    weekNumber: currentWeek,
    year: currentYear,
    title: "",
    description: "",
    excelData: "",
    excelFilename: "",
    scheduleType: "this_week" as "this_week" | "next_week",
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
      const response = await fetch("/api/operations");
      if (!response.ok) throw new Error("Failed to fetch operations");
      const data = await response.json();
      setOperations(data);
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

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.oasis.opendocument.spreadsheet",
    ];
    const validExtensions = [".xls", ".xlsx", ".ods"];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast({
        title: "Error",
        description: "Please select an Excel file (.xls, .xlsx, or .ods)",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await handleFileToBase64(file, MAX_EXCEL_SIZE);
      setFormData((prev) => ({
        ...prev,
        excelData: base64,
        excelFilename: file.name,
      }));
      toast({
        title: "Success",
        description: "Excel file uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading Excel file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload Excel file",
        variant: "destructive",
      });
    }

    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const clearExcel = () => {
    setFormData((prev) => ({ ...prev, excelData: "", excelFilename: "" }));
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

  // Get current and next week schedules by scheduleType
  const currentWeekSchedule = operations.find(
    (op) => op.scheduleType === "this_week" && op.isActive
  );
  const nextWeekSchedule = operations.find(
    (op) => op.scheduleType === "next_week" && op.isActive
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
          excelData: formData.excelData || null,
          excelFilename: formData.excelFilename || null,
          scheduleType: formData.scheduleType,
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
        excelData: "",
        excelFilename: "",
        scheduleType: "this_week",
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
          excelData: formData.excelData || null,
          excelFilename: formData.excelFilename || null,
          scheduleType: formData.scheduleType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update operation");
      }

      toast({
        title: "Success",
        description: "Operation schedule updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({
        weekNumber: currentWeek,
        year: currentYear,
        title: "",
        description: "",
        excelData: "",
        excelFilename: "",
        scheduleType: "this_week",
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

  const openCreateDialog = (scheduleType: "this_week" | "next_week" = "this_week") => {
    const weekNum = scheduleType === "this_week" ? currentWeek : nextWeekInfo.weekNumber;
    const yearNum = scheduleType === "this_week" ? currentYear : nextWeekInfo.year;
    setFormData({
      weekNumber: weekNum,
      year: yearNum,
      title: `Week ${weekNum} Schedule`,
      description: "",
      excelData: "",
      excelFilename: "",
      scheduleType: scheduleType,
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
      excelData: item.excelData || "",
      excelFilename: item.excelFilename || "",
      scheduleType: item.scheduleType,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (item: Operation) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

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

      {/* Excel Upload */}
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-excel`}>
          <FileSpreadsheet className="inline h-4 w-4 mr-1" />
          Excel Schedule File
        </Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              id={`${prefix}-excel`}
              type="file"
              accept=".xls,.xlsx,.ods,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleExcelUpload}
              className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {formData.excelData && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearExcel}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {formData.excelFilename && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">{formData.excelFilename}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {MAX_EXCEL_SIZE / 1024 / 1024}MB. Supported: .xls, .xlsx, .ods
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
          <h2 className="text-2xl font-bold">Operations Management</h2>
          <p className="text-muted-foreground">
            Manage weekly operation schedules with Excel file uploads
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
              <DialogTitle>Create New Operation Schedule</DialogTitle>
              <DialogDescription>
                Add a new weekly operation schedule with an Excel file.
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

      {/* Quick Access Cards - This Week & Next Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week&apos;s Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {currentWeekSchedule ? (
              <div className="space-y-2">
                <div className="text-lg font-bold">Week {currentWeek}, {currentYear}</div>
                <div className="text-sm text-muted-foreground">{currentWeekSchedule.title}</div>
                {currentWeekSchedule.excelData && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openViewDialog(currentWeekSchedule)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <a
                      href={currentWeekSchedule.excelData}
                      download={currentWeekSchedule.excelFilename || "schedule.xlsx"}
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
                  onClick={() => openCreateDialog("this_week")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create one
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Week&apos;s Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {nextWeekSchedule ? (
              <div className="space-y-2">
                <div className="text-lg font-bold">
                  Week {nextWeekInfo.weekNumber}, {nextWeekInfo.year}
                </div>
                <div className="text-sm text-muted-foreground">{nextWeekSchedule.title}</div>
                {nextWeekSchedule.excelData && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openViewDialog(nextWeekSchedule)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <a
                      href={nextWeekSchedule.excelData}
                      download={nextWeekSchedule.excelFilename || "schedule.xlsx"}
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
                  onClick={() => openCreateDialog("next_week")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create one
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
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

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Operation Schedules ({filteredOperations.length})
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
                    <TableHead>Schedule Type</TableHead>
                    <TableHead>Week/Year</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Excel File</TableHead>
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
                            operation.scheduleType === "this_week"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
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
                        {operation.excelData ? (
                          <a
                            href={operation.excelData}
                            download={operation.excelFilename || "schedule.xlsx"}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            {operation.excelFilename || "Download"}
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
                          {operation.excelData && (
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
                                <AlertDialogTitle>Delete Operation Schedule</AlertDialogTitle>
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
            <DialogTitle>Edit Operation Schedule</DialogTitle>
            <DialogDescription>
              Update the operation schedule information.
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
              {viewingItem?.title || "Operation Schedule"}
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
            {viewingItem?.excelData && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Excel File</Label>
                <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">{viewingItem.excelFilename}</p>
                    <p className="text-sm text-muted-foreground">Click to download the schedule file</p>
                  </div>
                  <a
                    href={viewingItem.excelData}
                    download={viewingItem.excelFilename || "schedule.xlsx"}
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
    </div>
  );
};

export default OperationsManagement;
