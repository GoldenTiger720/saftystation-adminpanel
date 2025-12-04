"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  FileText,
  Calendar,
  X,
  Download,
} from "lucide-react";

interface SafetyAlert {
  id: string;
  weekNumber: number;
  year: number;
  category: string;
  title: string;
  content: string;
  thumbnailData: string | null;
  pdfData: string | null;
  pdfFilename: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SafetyAlertsManagementProps {
  className?: string;
}

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB limit for base64 images
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB limit for PDFs

const SafetyAlertsManagement: React.FC<SafetyAlertsManagementProps> = ({ className }) => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SafetyAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber(new Date());

  const [formData, setFormData] = useState({
    weekNumber: currentWeek,
    year: currentYear,
    category: "",
    title: "",
    content: "",
    thumbnailData: "",
    pdfData: "",
    pdfFilename: "",
  });

  const { toast } = useToast();

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/safety-alerts");
      if (!response.ok) throw new Error("Failed to fetch safety alerts");
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching safety alerts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch safety alerts from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await handleFileToBase64(file, MAX_IMAGE_SIZE);
      setFormData((prev) => ({ ...prev, thumbnailData: base64 }));
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Please select a PDF file",
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
        description: "PDF uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    }
  };

  const clearImage = () => {
    setFormData((prev) => ({ ...prev, thumbnailData: "" }));
  };

  const clearPdf = () => {
    setFormData((prev) => ({ ...prev, pdfData: "", pdfFilename: "" }));
  };

  const filteredAlerts = alerts.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && item.isActive) ||
      (filterStatus === "inactive" && !item.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleCreateAlert = async () => {
    if (!formData.weekNumber || !formData.year || !formData.category || !formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/safety-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: formData.weekNumber,
          year: formData.year,
          category: formData.category,
          title: formData.title,
          content: formData.content,
          thumbnailData: formData.thumbnailData || null,
          pdfData: formData.pdfData || null,
          pdfFilename: formData.pdfFilename || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create safety alert");
      }

      toast({
        title: "Success",
        description: "Safety alert created successfully",
      });

      setFormData({
        weekNumber: currentWeek,
        year: currentYear,
        category: "",
        title: "",
        content: "",
        thumbnailData: "",
        pdfData: "",
        pdfFilename: "",
      });
      setIsCreateDialogOpen(false);
      fetchAlerts();
    } catch (error) {
      console.error("Error creating safety alert:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create safety alert",
        variant: "destructive",
      });
    }
  };

  const handleEditAlert = async () => {
    if (!editingItem) return;

    if (!formData.weekNumber || !formData.year || !formData.category || !formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/safety-alerts/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: formData.weekNumber,
          year: formData.year,
          category: formData.category,
          title: formData.title,
          content: formData.content,
          thumbnailData: formData.thumbnailData || null,
          pdfData: formData.pdfData || null,
          pdfFilename: formData.pdfFilename || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update safety alert");
      }

      toast({
        title: "Success",
        description: "Safety alert updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({
        weekNumber: currentWeek,
        year: currentYear,
        category: "",
        title: "",
        content: "",
        thumbnailData: "",
        pdfData: "",
        pdfFilename: "",
      });
      fetchAlerts();
    } catch (error) {
      console.error("Error updating safety alert:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update safety alert",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/safety-alerts/${alertId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete safety alert");

      toast({
        title: "Success",
        description: "Safety alert deleted successfully",
      });

      fetchAlerts();
    } catch (error) {
      console.error("Error deleting safety alert:", error);
      toast({
        title: "Error",
        description: "Failed to delete safety alert",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (alertId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/safety-alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `Safety alert ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      fetchAlerts();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update safety alert status",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setFormData({
      weekNumber: currentWeek,
      year: currentYear,
      category: "",
      title: "",
      content: "",
      thumbnailData: "",
      pdfData: "",
      pdfFilename: "",
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: SafetyAlert) => {
    setEditingItem(item);
    setFormData({
      weekNumber: item.weekNumber,
      year: item.year,
      category: item.category,
      title: item.title,
      content: item.content,
      thumbnailData: item.thumbnailData || "",
      pdfData: item.pdfData || "",
      pdfFilename: item.pdfFilename || "",
    });
    setIsEditDialogOpen(true);
  };

  const alertStats = {
    total: alerts.length,
    active: alerts.filter((item) => item.isActive).length,
    inactive: alerts.filter((item) => !item.isActive).length,
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
        <Label htmlFor={`${prefix}-category`}>Category *</Label>
        <Input
          id={`${prefix}-category`}
          value={formData.category}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, category: e.target.value }))
          }
          placeholder="e.g., Fire Safety, PPE, Hazard Awareness"
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-title`}>Title *</Label>
        <Input
          id={`${prefix}-title`}
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter alert title"
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-content`}>Content *</Label>
        <Textarea
          id={`${prefix}-content`}
          rows={6}
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              content: e.target.value,
            }))
          }
          placeholder="Enter alert content..."
        />
      </div>

      {/* Thumbnail Upload */}
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-thumbnail`}>
          <Upload className="inline h-4 w-4 mr-1" />
          Thumbnail Image
        </Label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              id={`${prefix}-thumbnail`}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {formData.thumbnailData && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearImage}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {formData.thumbnailData && (
            <div className="relative w-32 h-24 rounded overflow-hidden bg-gray-100 border">
              <Image
                src={formData.thumbnailData}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {MAX_IMAGE_SIZE / 1024}KB. Supported: JPG, PNG, GIF, WebP
          </p>
        </div>
      </div>

      {/* PDF Upload */}
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-pdf`}>
          <FileText className="inline h-4 w-4 mr-1" />
          PDF Document
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
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border">
              <FileText className="h-4 w-4 text-red-500" />
              <span className="text-sm">{formData.pdfFilename}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max size: {MAX_PDF_SIZE / 1024 / 1024}MB. Only PDF files are accepted.
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
          <h2 className="text-2xl font-bold">Safety Alerts Management</h2>
          <p className="text-muted-foreground">
            Manage weekly safety alerts with thumbnails and PDF attachments
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAlerts} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4" />
                Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Safety Alert</DialogTitle>
                <DialogDescription>
                  Add a new weekly safety alert with category, content, thumbnail, and PDF.
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
                <Button onClick={handleCreateAlert}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.inactive}</div>
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
                  placeholder="Search alerts by title, category, or content..."
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

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Safety Alerts ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No safety alerts found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week/Year</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="font-medium">
                          Week {alert.weekNumber}, {alert.year}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {alert.content}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.thumbnailData ? (
                          <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 relative">
                            <Image
                              src={alert.thumbnailData}
                              alt={alert.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No image
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.pdfData ? (
                          <a
                            href={alert.pdfData}
                            download={alert.pdfFilename || "safety-alert.pdf"}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No PDF
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() =>
                              handleToggleStatus(alert.id, alert.isActive)
                            }
                          />
                          <Badge
                            className={
                              alert.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {alert.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(alert)}
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
                                <AlertDialogTitle>Delete Safety Alert</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {alert.title}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAlert(alert.id)}
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
            <DialogTitle>Edit Safety Alert</DialogTitle>
            <DialogDescription>
              Update the safety alert information.
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
            <Button onClick={handleEditAlert}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SafetyAlertsManagement;
